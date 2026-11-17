// Versión de demostración SIN servidor: imita la API de server.js dentro del navegador.
// Se usa para publicar la demo como página privada (sin IA real y con pago simulado).
// Los contadores se guardan en este navegador (localStorage); si no está disponible, en memoria.

import { CARTAS, POR_ID } from './lib/cartas.js';
import { TIRADAS, tiradasPorTipo } from './lib/tiradas.js';
import { lecturaLocal } from './lib/lectura-local.js';

const CONFIG = {
  gratisPorDia: 5,
  precio: 1,
  whatsapp: {
    numero: '34600000000',
    nombre: 'nuestra tarotista',
    horario: 'Lunes a sábado, de 10:00 a 21:00',
    precios: 'Consulta 15 min: 15 € · Consulta 30 min: 25 €',
  },
};

const CLAVE = 'arcana-demo-v1';
let memoria = null;
function cargar() {
  if (memoria) return memoria;
  try {
    memoria = JSON.parse(localStorage.getItem(CLAVE)) || null;
  } catch {}
  memoria ||= { uso: {}, creditos: 0, barajas: {}, lecturas: {}, pedidos: {} };
  return memoria;
}
function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(memoria));
  } catch {}
}

const id = () => Math.random().toString(36).slice(2, 12);
const hoy = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
const usados = () => cargar().uso[hoy()] || 0;

function estadoPublico() {
  const d = cargar();
  return {
    gratisPorDia: CONFIG.gratisPorDia,
    gratisRestantes: Math.max(0, CONFIG.gratisPorDia - usados()),
    creditos: d.creditos,
    precioCompleta: CONFIG.precio,
    metodosPago: [
      { id: 'tarjeta', nombre: 'Tarjeta', proveedor: 'simulado' },
      { id: 'bizum', nombre: 'Bizum', proveedor: 'simulado' },
    ],
    tiradas: { gratis: tiradasPorTipo('gratis'), completa: tiradasPorTipo('completa') },
    whatsapp: {
      ...CONFIG.whatsapp,
      url: `https://wa.me/${CONFIG.whatsapp.numero}?text=${encodeURIComponent('Hola, quiero hacer una consulta de tarot personalizada.')}`,
    },
    iaActiva: false,
  };
}

const rutas = {
  'GET /api/estado': () => [200, estadoPublico()],

  'POST /api/barajar': (c) => {
    const d = cargar();
    const tirada = TIRADAS[c.tirada];
    if (!tirada) return [400, { error: 'Tirada desconocida' }];
    if (tirada.tipo === 'gratis' && usados() >= CONFIG.gratisPorDia)
      return [429, { error: `Has usado tus ${CONFIG.gratisPorDia} tiradas gratuitas de hoy. Vuelve mañana o haz una tirada completa.` }];
    if (tirada.tipo === 'completa' && d.creditos < 1) return [402, { error: 'Necesitas una tirada completa pagada.' }];
    const orden = CARTAS.map((x) => x.id);
    const azar = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    for (let i = orden.length - 1; i > 0; i--) {
      const j = azar(i + 1);
      [orden[i], orden[j]] = [orden[j], orden[i]];
    }
    const b = id();
    d.barajas = { [b]: { tirada: c.tirada, orden, invertidas: orden.map(() => azar(1000) < 300) } };
    guardar();
    return [200, { baraja: b, total: orden.length, aElegir: tirada.posiciones.length }];
  },

  'POST /api/revelar': (c) => {
    const d = cargar();
    const b = d.barajas[c.baraja];
    if (!b) return [404, { error: 'Baraja no encontrada. Vuelve a barajar.' }];
    const tirada = TIRADAS[b.tirada];
    const pos = c.posiciones;
    if (!Array.isArray(pos) || pos.length !== tirada.posiciones.length || new Set(pos).size !== pos.length)
      return [400, { error: `Elige exactamente ${tirada.posiciones.length} cartas distintas.` }];
    if (tirada.tipo === 'gratis') {
      if (usados() >= CONFIG.gratisPorDia) return [429, { error: 'Sin tiradas gratuitas hoy.' }];
      d.uso = { [hoy()]: usados() + 1 };
    } else {
      if (d.creditos < 1) return [402, { error: 'Necesitas una tirada completa pagada.' }];
      d.creditos -= 1;
    }
    delete d.barajas[c.baraja];
    const cartas = pos.map((p) => ({ ...POR_ID[b.orden[p]], invertida: b.invertidas[p] }));
    const l = id();
    d.lecturas = { [l]: { tirada: b.tirada, pregunta: String(c.pregunta || '').slice(0, 500), cartas } };
    guardar();
    return [
      200,
      {
        lectura: l,
        tirada: { id: b.tirada, ...tirada },
        cartas: cartas.map((x, i) => ({ id: x.id, nombre: x.nombre, invertida: x.invertida, posicion: tirada.posiciones[i] })),
        estado: estadoPublico(),
      },
    ];
  },

  'POST /api/pedido': (c) => {
    const d = cargar();
    const p = id();
    d.pedidos[p] = { metodo: c.metodo, estado: 'pendiente' };
    guardar();
    return [200, { pedido: p, accion: 'simulado', importe: CONFIG.precio }];
  },

  'GET /api/pedido': (_c, url) => {
    const p = cargar().pedidos[url.searchParams.get('id')];
    if (!p) return [404, { error: 'Pedido no encontrado' }];
    return [200, { estado: p.estado, ...estadoPublico() }];
  },

  'POST /api/pago-simulado/confirmar': (c) => {
    const d = cargar();
    const p = d.pedidos[c.pedido];
    if (!p) return [404, { error: 'Pedido no encontrado' }];
    if (c.resultado === 'ok' && p.estado !== 'pagado') {
      p.estado = 'pagado';
      d.creditos += 1;
    } else if (c.resultado !== 'ok') p.estado = 'cancelado';
    guardar();
    return [200, { estado: p.estado }];
  },
};

function lecturaEnDirecto(lid) {
  const l = cargar().lecturas[lid];
  if (!l) return new Response('Lectura no encontrada', { status: 404 });
  const texto = lecturaLocal({ tirada: TIRADAS[l.tirada], pregunta: l.pregunta, cartas: l.cartas, profunda: TIRADAS[l.tirada].tipo === 'completa' });
  const trozos = texto.match(/\S+\s*/g) || [];
  const cod = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream({
    async pull(ctrl) {
      if (i >= trozos.length) return ctrl.close();
      await new Promise((r) => setTimeout(r, 14));
      ctrl.enqueue(cod.encode(trozos[i++]));
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

const fetchOriginal = window.fetch.bind(window);
window.fetch = async (entrada, opciones = {}) => {
  const ruta = typeof entrada === 'string' ? entrada : entrada.url;
  if (!ruta.startsWith('/api/')) return fetchOriginal(entrada, opciones);
  const url = new URL(ruta, 'https://demo.local');
  const m = url.pathname.match(/^\/api\/lectura\/(\w+)$/);
  if (m) return lecturaEnDirecto(m[1]);
  const metodo = (opciones.method || 'GET').toUpperCase();
  const fn = rutas[`${metodo} ${url.pathname}`];
  if (!fn) return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), { status: 404 });
  const cuerpo = opciones.body ? JSON.parse(opciones.body) : {};
  const [estado, salida] = fn(cuerpo, url);
  return new Response(JSON.stringify(salida), { status: estado, headers: { 'Content-Type': 'application/json' } });
};
