// Servidor de Arcana (demo). Node >= 22, sin frameworks.
//   npm install && npm start  ->  http://localhost:3000

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { config } from './lib/config.js';
import { CARTAS, POR_ID } from './lib/cartas.js';
import { TIRADAS, tiradasPorTipo } from './lib/tiradas.js';
import { Almacen } from './lib/almacen.js';
import { leer } from './lib/agentes.js';
import { iniciarPago, metodosDisponibles, proveedorDe, redsys, stripe } from './lib/pagos/index.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DIR_PUBLICO = path.join(aqui, 'public');
const PROB_INVERTIDA = 0.3;

export function crearServidor({ almacen = new Almacen(path.resolve(aqui, config.dirDatos)) } = {}) {
  // ------------------------------------------------------------------ utilidades
  const hoy = () => new Intl.DateTimeFormat('sv-SE', { timeZone: config.zonaHoraria }).format(new Date());

  const json = (res, estado, cuerpo) => {
    res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(cuerpo));
  };

  const leerCuerpo = (req) =>
    new Promise((resolve, reject) => {
      let datos = '';
      req.on('data', (t) => {
        datos += t;
        if (datos.length > 100_000) reject(new Error('cuerpo demasiado grande'));
      });
      req.on('end', () => {
        const tipo = req.headers['content-type'] || '';
        try {
          if (tipo.includes('application/json')) return resolve(datos ? JSON.parse(datos) : {});
          if (tipo.includes('application/x-www-form-urlencoded')) return resolve(Object.fromEntries(new URLSearchParams(datos)));
          resolve({});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });

  const cookies = (req) =>
    Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter(([k]) => k));

  const visitanteDe = (req, res) => {
    let vid = cookies(req).vid;
    if (!vid || !/^[\w-]{10,40}$/.test(vid)) {
      vid = Almacen.id();
      res.setHeader('Set-Cookie', `vid=${vid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
    }
    almacen.visitante(vid);
    return vid;
  };

  const ipDe = (req) =>
    (process.env.CONFIAR_PROXY === 'si' && req.headers['x-forwarded-for']?.split(',')[0].trim()) || req.socket.remoteAddress || 'desconocida';

  const whatsappUrl = (texto) => `https://wa.me/${config.whatsapp.numero}?text=${encodeURIComponent(texto)}`;

  const estadoPublico = (vid, ip) => ({
    gratisPorDia: config.tiradasGratisPorDia,
    gratisRestantes: Math.max(0, config.tiradasGratisPorDia - almacen.usoGratis(vid, ip, hoy())),
    creditos: almacen.creditos(vid),
    precioCompleta: config.precioCompletaCentimos / 100,
    metodosPago: metodosDisponibles(config.pagos),
    tiradas: { gratis: tiradasPorTipo('gratis'), completa: tiradasPorTipo('completa') },
    whatsapp: {
      url: whatsappUrl('Hola, quiero hacer una consulta de tarot personalizada.'),
      numero: config.whatsapp.numero,
      nombre: config.whatsapp.nombreTarotista,
      precios: config.whatsapp.precios,
      horario: config.whatsapp.horario,
    },
    iaActiva: config.ia.activa,
  });

  const acreditarPedido = (pedidoId) => {
    const pedido = almacen.obtener('pedidos', pedidoId);
    if (!pedido || pedido.estado === 'pagado') return pedido;
    almacen.actualizar('pedidos', pedidoId, { estado: 'pagado', pagadoEn: Date.now() });
    almacen.sumarCredito(pedido.visitante);
    return pedido;
  };

  // ------------------------------------------------------------------ rutas API
  const rutas = {
    'GET /api/estado': async ({ vid, ip }) => [200, estadoPublico(vid, ip)],

    'GET /api/cartas': async () => [200, CARTAS],

    'POST /api/barajar': async ({ vid, ip, cuerpo }) => {
      const tirada = TIRADAS[cuerpo.tirada];
      if (!tirada) return [400, { error: 'Tirada desconocida' }];
      if (tirada.tipo === 'gratis' && almacen.usoGratis(vid, ip, hoy()) >= config.tiradasGratisPorDia)
        return [429, { error: `Has usado tus ${config.tiradasGratisPorDia} tiradas gratuitas de hoy. Vuelve mañana o haz una tirada completa.` }];
      if (tirada.tipo === 'completa' && almacen.creditos(vid) < 1) return [402, { error: 'Necesitas una tirada completa pagada.' }];

      const orden = CARTAS.map((c) => c.id);
      for (let i = orden.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [orden[i], orden[j]] = [orden[j], orden[i]];
      }
      const invertidas = orden.map(() => crypto.randomInt(1000) < PROB_INVERTIDA * 1000);
      const baraja = almacen.crear('barajas', { visitante: vid, tirada: cuerpo.tirada, orden, invertidas, usada: false });
      return [200, { baraja, total: orden.length, aElegir: tirada.posiciones.length }];
    },

    'POST /api/revelar': async ({ vid, ip, cuerpo }) => {
      const b = almacen.obtener('barajas', cuerpo.baraja);
      if (!b || b.visitante !== vid) return [404, { error: 'Baraja no encontrada. Vuelve a barajar.' }];
      if (b.usada) return [409, { error: 'Esta baraja ya se ha usado.' }];
      const tirada = TIRADAS[b.tirada];
      const pos = cuerpo.posiciones;
      const valido =
        Array.isArray(pos) &&
        pos.length === tirada.posiciones.length &&
        new Set(pos).size === pos.length &&
        pos.every((p) => Number.isInteger(p) && p >= 0 && p < b.orden.length);
      if (!valido) return [400, { error: `Elige exactamente ${tirada.posiciones.length} cartas distintas.` }];

      if (tirada.tipo === 'gratis') {
        if (almacen.usoGratis(vid, ip, hoy()) >= config.tiradasGratisPorDia) return [429, { error: 'Sin tiradas gratuitas hoy.' }];
        almacen.sumarUsoGratis(vid, ip, hoy());
      } else if (!almacen.gastarCredito(vid)) {
        return [402, { error: 'Necesitas una tirada completa pagada.' }];
      }
      almacen.actualizar('barajas', cuerpo.baraja, { usada: true });

      const cartas = pos.map((p) => ({ ...POR_ID[b.orden[p]], invertida: b.invertidas[p] }));
      const pregunta = String(cuerpo.pregunta || '').slice(0, 500);
      const lectura = almacen.crear('lecturas', { visitante: vid, tirada: b.tirada, pregunta, cartas, estado: 'pendiente', texto: '' });
      return [
        200,
        {
          lectura,
          tirada: { id: b.tirada, ...tirada },
          cartas: cartas.map((c, i) => ({ id: c.id, nombre: c.nombre, invertida: c.invertida, posicion: tirada.posiciones[i] })),
          estado: estadoPublico(vid, ip),
        },
      ];
    },

    'POST /api/pedido': async ({ vid, cuerpo }) => {
      const metodo = cuerpo.metodo;
      if (!config.pagos.metodos.includes(metodo)) return [400, { error: 'Método de pago no disponible' }];
      const referencia = redsys.numeroPedidoRedsys();
      const id = almacen.crear('pedidos', {
        visitante: vid,
        metodo,
        proveedor: proveedorDe(config.pagos, metodo),
        importeCentimos: config.precioCompletaCentimos,
        referencia,
        estado: 'pendiente',
      });
      const pedido = almacen.obtener('pedidos', id);
      const pago = await iniciarPago(config, {
        pedido: { id, referencia },
        metodo,
        importeCentimos: config.precioCompletaCentimos,
        descripcion: 'Tirada completa de tarot (9 cartas)',
      });
      if (pago.referencia) almacen.actualizar('pedidos', id, { referenciaProveedor: pago.referencia });
      return [200, { pedido: id, ...pago, importe: pedido.importeCentimos / 100 }];
    },

    'GET /api/pedido': async ({ vid, ip, url }) => {
      const id = url.searchParams.get('id');
      const pedido = almacen.obtener('pedidos', id);
      if (!pedido || pedido.visitante !== vid) return [404, { error: 'Pedido no encontrado' }];
      const sesion = url.searchParams.get('stripe_sesion');
      if (pedido.estado !== 'pagado' && pedido.proveedor === 'stripe' && sesion && sesion === pedido.referenciaProveedor) {
        const r = await stripe.comprobarPago(config.pagos.stripe, sesion);
        if (r.pagado && r.pedido === id) acreditarPedido(id);
      }
      return [200, { estado: almacen.obtener('pedidos', id).estado, ...estadoPublico(vid, ip) }];
    },

    // Solo en la demo: la página de pago simulado confirma el pago.
    'POST /api/pago-simulado/confirmar': async ({ vid, cuerpo }) => {
      const pedido = almacen.obtener('pedidos', cuerpo.pedido);
      if (!pedido || pedido.visitante !== vid || pedido.proveedor !== 'simulado') return [404, { error: 'Pedido no encontrado' }];
      if (cuerpo.resultado === 'ok') acreditarPedido(cuerpo.pedido);
      else almacen.actualizar('pedidos', cuerpo.pedido, { estado: 'cancelado' });
      return [200, { estado: almacen.obtener('pedidos', cuerpo.pedido).estado }];
    },

    // Notificación servidor-a-servidor de Redsys (tarjeta y Bizum).
    'POST /api/pagos/redsys/notificacion': async ({ cuerpo }) => {
      const r = redsys.verificarNotificacion(config.pagos.redsys, cuerpo);
      if (!r.valida) return [400, { error: 'firma no válida' }];
      const [id, pedido] = Object.entries(almacen.datos.pedidos).find(([, p]) => p.referencia === r.pedido) || [];
      if (!pedido) return [404, { error: 'pedido desconocido' }];
      if (r.pagado && r.importe === pedido.importeCentimos) acreditarPedido(id);
      else if (!r.pagado) almacen.actualizar('pedidos', id, { estado: 'rechazado' });
      return [200, { ok: true }];
    },
  };

  // Lectura en streaming (texto plano por trozos)
  const servirLectura = async (req, res, vid, id) => {
    const l = almacen.obtener('lecturas', id);
    if (!l || l.visitante !== vid) return json(res, 404, { error: 'Lectura no encontrada' });
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
    if (l.estado === 'completa') return res.end(l.texto);
    if (l.estado === 'generando' && Date.now() - (l.inicio || 0) < 120_000) return res.end(l.texto || 'La lectura se está generando. Espera unos segundos y pulsa «Repetir lectura».');
    almacen.actualizar('lecturas', id, { estado: 'generando', inicio: Date.now(), texto: '' });
    const r = await leer({
      tirada: TIRADAS[l.tirada],
      pregunta: l.pregunta,
      cartas: l.cartas,
      profunda: TIRADAS[l.tirada].tipo === 'completa',
      alEscribir: (t) => res.write(t),
    });
    almacen.actualizar('lecturas', id, {
      estado: r.origen === 'claude-incompleta' ? 'pendiente' : 'completa',
      texto: r.texto,
      origen: r.origen,
    });
    res.end();
  };

  // ------------------------------------------------------------------ estáticos
  const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
  const servirEstatico = (res, ruta) => {
    const archivo = path.normalize(path.join(DIR_PUBLICO, ruta === '/' ? 'index.html' : ruta));
    if (!archivo.startsWith(DIR_PUBLICO) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    const ext = path.extname(archivo);
    res.writeHead(200, { 'Content-Type': TIPOS[ext] || 'application/octet-stream', 'Cache-Control': ext === '.jpg' ? 'public, max-age=604800' : 'no-cache' });
    fs.createReadStream(archivo).pipe(res);
  };

  // ------------------------------------------------------------------ servidor
  const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    try {
      if (url.pathname.startsWith('/api/')) {
        const vid = visitanteDe(req, res);
        const ip = ipDe(req);
        const m = url.pathname.match(/^\/api\/lectura\/([\w-]+)$/);
        if (req.method === 'GET' && m) return await servirLectura(req, res, vid, m[1]);
        const ruta = rutas[`${req.method} ${url.pathname}`];
        if (!ruta) return json(res, 404, { error: 'Ruta no encontrada' });
        const cuerpo = req.method === 'POST' ? await leerCuerpo(req) : {};
        const [estado, salida] = await ruta({ req, vid, ip, url, cuerpo });
        return json(res, estado, salida);
      }
      if (req.method !== 'GET') return json(res, 405, { error: 'Método no permitido' });
      servirEstatico(res, decodeURIComponent(url.pathname));
    } catch (err) {
      console.error('[servidor]', err);
      if (!res.headersSent) json(res, 500, { error: 'Error interno. Inténtalo de nuevo.' });
      else res.end();
    }
  });

  setInterval(() => almacen.limpiar(), 3600_000).unref();
  return { servidor, almacen };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { servidor } = crearServidor();
  servidor.listen(config.puerto, () => {
    console.log(`Arcana en http://localhost:${config.puerto}`);
    console.log(`IA: ${config.ia.activa ? 'Claude activado' : 'modo demostración (sin clave de Claude)'}`);
    console.log(`Pagos: tarjeta=${config.pagos.proveedorTarjeta}, bizum=${config.pagos.proveedorBizum}`);
  });
}
