'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { abrir } = require('./db');
const { crearMailer, textoSolicitud } = require('./mail');
const { layout, mensaje } = require('./views');
const U = require('./util');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TIPOS_ESTATICOS = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const EXT_PERMITIDAS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.webp', '.xls', '.xlsx', '.csv', '.doc', '.docx', '.zip', '.txt', '.xml']);
const ITEMS_POR_DEFECTO = [
  'Facturas emitidas (ventas)',
  'Facturas recibidas (gastos y compras)',
  'Extractos bancarios del trimestre',
  'Tickets y otros justificantes',
];
const DIAS_RECORDATORIO = [7, 3, 1, 0, -2]; // días antes (+) o después (-) de la fecha límite

function crearApp(cfg) {
  const db = abrir(cfg.dataDir);
  const uploadsDir = path.join(cfg.dataDir, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const mailer = crearMailer(db, cfg);
  const intentosLogin = new Map();

  // ---------- consultas ----------
  const q = {
    despachoPorEmail: db.prepare('SELECT * FROM despachos WHERE email = ?'),
    despachoPorId: db.prepare('SELECT * FROM despachos WHERE id = ?'),
    crearDespacho: db.prepare('INSERT INTO despachos (nombre, email, pass_hash) VALUES (?, ?, ?)'),
    crearSesion: db.prepare("INSERT INTO sesiones (token, despacho_id, expira) VALUES (?, ?, datetime('now', '+30 days'))"),
    sesion: db.prepare("SELECT d.* FROM sesiones s JOIN despachos d ON d.id = s.despacho_id WHERE s.token = ? AND s.expira > datetime('now')"),
    borrarSesion: db.prepare('DELETE FROM sesiones WHERE token = ?'),
    clientes: db.prepare('SELECT * FROM clientes WHERE despacho_id = ? AND activo = 1 ORDER BY nombre COLLATE NOCASE'),
    cliente: db.prepare('SELECT * FROM clientes WHERE id = ? AND despacho_id = ?'),
    crearCliente: db.prepare('INSERT INTO clientes (despacho_id, nombre, email, telefono) VALUES (?, ?, ?, ?)'),
    desactivarCliente: db.prepare('UPDATE clientes SET activo = 0 WHERE id = ? AND despacho_id = ?'),
    campanas: db.prepare(`SELECT c.*,
        (SELECT COUNT(*) FROM solicitudes s WHERE s.campana_id = c.id) AS total,
        (SELECT COUNT(*) FROM solicitudes s WHERE s.campana_id = c.id AND s.terminada = 1) AS completas
      FROM campanas c WHERE c.despacho_id = ? AND c.archivada = 0 ORDER BY c.fecha_limite DESC, c.id DESC`),
    campana: db.prepare('SELECT * FROM campanas WHERE id = ? AND despacho_id = ?'),
    crearCampana: db.prepare('INSERT INTO campanas (despacho_id, nombre, fecha_limite, recordatorios) VALUES (?, ?, ?, ?)'),
    archivarCampana: db.prepare('UPDATE campanas SET archivada = 1 WHERE id = ? AND despacho_id = ?'),
    crearItem: db.prepare('INSERT INTO items (campana_id, titulo, orden) VALUES (?, ?, ?)'),
    items: db.prepare('SELECT * FROM items WHERE campana_id = ? ORDER BY orden'),
    crearSolicitud: db.prepare('INSERT OR IGNORE INTO solicitudes (campana_id, cliente_id, token) VALUES (?, ?, ?)'),
    solicitudesCampana: db.prepare(`SELECT s.*, cl.nombre AS cliente_nombre, cl.email AS cliente_email, cl.telefono AS cliente_telefono,
        (SELECT COUNT(*) FROM archivos a WHERE a.solicitud_id = s.id) AS n_archivos,
        (SELECT COUNT(DISTINCT a.item_id) FROM archivos a WHERE a.solicitud_id = s.id) AS items_con_archivo,
        (SELECT COUNT(*) FROM no_aplica n WHERE n.solicitud_id = s.id) AS items_no_aplica,
        (SELECT MAX(e.created_at) FROM emails e WHERE e.solicitud_id = s.id) AS ultimo_email
      FROM solicitudes s JOIN clientes cl ON cl.id = s.cliente_id
      WHERE s.campana_id = ? ORDER BY s.terminada, cl.nombre COLLATE NOCASE`),
    solicitudPorToken: db.prepare(`SELECT s.*, c.nombre AS campana_nombre, c.fecha_limite, c.despacho_id, c.archivada,
        cl.nombre AS cliente_nombre, d.nombre AS despacho_nombre
      FROM solicitudes s JOIN campanas c ON c.id = s.campana_id JOIN clientes cl ON cl.id = s.cliente_id
      JOIN despachos d ON d.id = c.despacho_id WHERE s.token = ?`),
    solicitudDeDespacho: db.prepare(`SELECT s.*, c.nombre AS campana_nombre, c.fecha_limite, c.id AS campana_id, cl.nombre AS cliente_nombre,
        cl.email AS cliente_email FROM solicitudes s JOIN campanas c ON c.id = s.campana_id JOIN clientes cl ON cl.id = s.cliente_id
      WHERE s.id = ? AND c.despacho_id = ?`),
    archivosSolicitud: db.prepare('SELECT * FROM archivos WHERE solicitud_id = ? ORDER BY created_at'),
    archivoDeDespacho: db.prepare(`SELECT a.* FROM archivos a JOIN solicitudes s ON s.id = a.solicitud_id
      JOIN campanas c ON c.id = s.campana_id WHERE a.id = ? AND c.despacho_id = ?`),
    archivoDeSolicitud: db.prepare('SELECT * FROM archivos WHERE id = ? AND solicitud_id = ?'),
    borrarArchivo: db.prepare('DELETE FROM archivos WHERE id = ?'),
    crearArchivo: db.prepare('INSERT INTO archivos (solicitud_id, item_id, nombre, ruta, tamano) VALUES (?, ?, ?, ?, ?)'),
    noAplica: db.prepare('SELECT item_id FROM no_aplica WHERE solicitud_id = ?'),
    marcarNoAplica: db.prepare('INSERT OR IGNORE INTO no_aplica (solicitud_id, item_id) VALUES (?, ?)'),
    desmarcarNoAplica: db.prepare('DELETE FROM no_aplica WHERE solicitud_id = ? AND item_id = ?'),
    actividad: db.prepare("UPDATE solicitudes SET ultima_actividad = datetime('now') WHERE id = ?"),
    terminar: db.prepare("UPDATE solicitudes SET terminada = 1, comentario = ?, terminada_at = datetime('now'), ultima_actividad = datetime('now') WHERE id = ?"),
    reabrir: db.prepare('UPDATE solicitudes SET terminada = 0 WHERE id = ?'),
    emails: db.prepare(`SELECT e.*, cl.nombre AS cliente_nombre FROM emails e LEFT JOIN solicitudes s ON s.id = e.solicitud_id
      LEFT JOIN clientes cl ON cl.id = s.cliente_id WHERE e.despacho_id = ? ORDER BY e.id DESC LIMIT 200`),
    emailTipoEnviado: db.prepare('SELECT 1 FROM emails WHERE solicitud_id = ? AND tipo = ? LIMIT 1'),
    campanasActivas: db.prepare('SELECT * FROM campanas WHERE archivada = 0 AND recordatorios = 1'),
    solicitudesPendientes: db.prepare(`SELECT s.*, cl.nombre AS cliente_nombre, cl.email AS cliente_email
      FROM solicitudes s JOIN clientes cl ON cl.id = s.cliente_id WHERE s.campana_id = ? AND s.terminada = 0`),
  };

  const enlaceSolicitud = (t) => `${cfg.baseUrl}/s/${t}`;

  // ---------- utilidades HTTP ----------
  function enviarHtml(res, html, status = 200, extraHeaders = {}) {
    res.writeHead(status, {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; form-action 'self'",
      ...extraHeaders,
    });
    res.end(html);
  }
  function redirigir(res, url, extraHeaders = {}) {
    res.writeHead(303, { Location: url, ...extraHeaders });
    res.end();
  }
  function json(res, obj, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  }
  function noEncontrado(res, despacho = null) {
    enviarHtml(res, layout({ titulo: 'No encontrado', despacho, cuerpo: '<h1>No encontrado</h1><p>La página no existe o el enlace ya no es válido.</p>' }), 404);
  }
  function leerCuerpo(req, max = 1_000_000) {
    return new Promise((resolve, reject) => {
      let tam = 0;
      const partes = [];
      req.on('data', (c) => {
        tam += c.length;
        if (tam > max) {
          reject(new Error('cuerpo demasiado grande'));
          req.destroy();
        } else partes.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
      req.on('error', reject);
    });
  }
  async function leerFormulario(req) {
    return Object.fromEntries(new URLSearchParams(await leerCuerpo(req)));
  }
  function cookies(req) {
    const out = {};
    for (const p of (req.headers.cookie || '').split(';')) {
      const i = p.indexOf('=');
      if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    }
    return out;
  }
  function cookieSesion(valor, maxAge) {
    const seguro = cfg.baseUrl.startsWith('https://') ? '; Secure' : '';
    return `trs=${valor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${seguro}`;
  }
  function despachoActual(req) {
    const t = cookies(req).trs;
    return t ? q.sesion.get(t) || null : null;
  }
  // Protección CSRF básica: las peticiones que modifican datos deben venir del mismo origen.
  function origenValido(req) {
    const origen = req.headers.origin || req.headers.referer;
    if (!origen) return true; // clientes sin cabecera (curl, tests); la cookie SameSite=Lax ya protege
    try {
      return new URL(origen).host === req.headers.host;
    } catch {
      return false;
    }
  }

  // ---------- estado de una solicitud ----------
  function estadoSolicitud(s, totalItems) {
    const cubiertos = Math.min(totalItems, (s.items_con_archivo || 0) + (s.items_no_aplica || 0));
    if (s.terminada) return { clave: 'completa', texto: 'Completa', cubiertos };
    if (cubiertos > 0 || s.n_archivos > 0) return { clave: 'en_curso', texto: 'En curso', cubiertos };
    return { clave: 'pendiente', texto: 'Sin empezar', cubiertos };
  }

  // ---------- páginas del despacho ----------
  function paginaInicio(res) {
    enviarHtml(res, layout({
      titulo: 'Inicio',
      cuerpo: `<section class="hero"><h1>Deja de perseguir a tus clientes por las facturas</h1>
        <p>Recadoc pide la documentación del trimestre a cada cliente con un enlace personal, le recuerda la fecha límite automáticamente y te enseña en una sola pantalla quién ha enviado qué.</p>
        <p><a class="btn" href="/registro">Crear cuenta de prueba</a> <a class="btn sec" href="/entrar">Entrar</a></p></section>`,
    }));
  }

  function paginaRegistro(res, error = '', datos = {}) {
    enviarHtml(res, layout({
      titulo: 'Crear cuenta',
      cuerpo: `<section class="caja estrecha"><h1>Crear cuenta</h1>${mensaje(error, 'error')}
      <form method="post" action="/registro" class="form">
        <label>Nombre del despacho<input name="nombre" required maxlength="120" value="${U.esc(datos.nombre)}"></label>
        <label>Email<input name="email" type="email" required maxlength="160" value="${U.esc(datos.email)}"></label>
        <label>Contraseña (mín. 10 caracteres)<input name="password" type="password" required minlength="10"></label>
        <label class="check"><input type="checkbox" name="acepto" value="1" required> Acepto las condiciones y la política de privacidad</label>
        <button class="btn">Crear cuenta</button>
      </form></section>`,
    }), error ? 400 : 200);
  }

  function paginaEntrar(res, error = '') {
    enviarHtml(res, layout({
      titulo: 'Entrar',
      cuerpo: `<section class="caja estrecha"><h1>Entrar</h1>${mensaje(error, 'error')}
      <form method="post" action="/entrar" class="form">
        <label>Email<input name="email" type="email" required></label>
        <label>Contraseña<input name="password" type="password" required></label>
        <button class="btn">Entrar</button>
      </form><p class="muted">¿No tienes cuenta? <a href="/registro">Crea una</a>.</p></section>`,
    }), error ? 400 : 200);
  }

  function paginaPanel(res, d, aviso = '') {
    const filas = q.campanas.all(d.id).map((c) => {
      const dias = U.diasEntre(U.hoyISO(), c.fecha_limite);
      const pct = c.total ? Math.round((c.completas / c.total) * 100) : 0;
      const plazo = dias > 0 ? `faltan ${dias} días` : dias === 0 ? 'vence hoy' : `vencida hace ${-dias} días`;
      return `<tr><td><a href="/campanas/${c.id}">${U.esc(c.nombre)}</a></td><td>${U.fechaES(c.fecha_limite)} <span class="muted">(${plazo})</span></td>
        <td><div class="barra" title="${pct}%"><span style="width:${pct}%"></span></div> ${c.completas}/${c.total}</td></tr>`;
    }).join('');
    const nClientes = q.clientes.all(d.id).length;
    enviarHtml(res, layout({
      titulo: 'Campañas', despacho: d,
      cuerpo: `<div class="cabecera"><h1>Campañas</h1><a class="btn" href="/campanas/nueva">Nueva campaña</a></div>${mensaje(aviso)}
      ${nClientes === 0 ? '<p class="aviso">Primero <a href="/clientes">añade tus clientes</a> (uno a uno o pegando una lista).</p>' : ''}
      ${filas ? `<table class="tabla"><thead><tr><th>Campaña</th><th>Fecha límite</th><th>Completas</th></tr></thead><tbody>${filas}</tbody></table>`
        : '<p class="muted">Aún no hay campañas. Crea una para el trimestre en curso (por ejemplo, «1T 2027»).</p>'}`,
    }));
  }

  function paginaClientes(res, d, aviso = '', tipo = 'info') {
    const filas = q.clientes.all(d.id).map((c) => `<tr><td>${U.esc(c.nombre)}</td><td>${U.esc(c.email || '')}</td><td>${U.esc(c.telefono || '')}</td>
      <td><form method="post" action="/clientes/${c.id}/borrar" class="inline" data-confirmar="¿Quitar a ${U.esc(c.nombre)}?"><button class="link peligro">Quitar</button></form></td></tr>`).join('');
    enviarHtml(res, layout({
      titulo: 'Clientes', despacho: d,
      cuerpo: `<h1>Clientes</h1>${mensaje(aviso, tipo)}
      <div class="dos-col">
        <form method="post" action="/clientes" class="form caja">
          <h2>Añadir uno</h2>
          <label>Nombre o razón social<input name="nombre" required maxlength="160"></label>
          <label>Email<input name="email" type="email" maxlength="160"></label>
          <label>Móvil (para WhatsApp, con prefijo: 34600111222)<input name="telefono" maxlength="20" pattern="[0-9+ ]*"></label>
          <button class="btn">Añadir</button>
        </form>
        <form method="post" action="/clientes/importar" class="form caja">
          <h2>Pegar una lista</h2>
          <p class="muted">Una línea por cliente: <code>nombre; email; móvil</code>. Vale copiar tres columnas desde Excel.</p>
          <textarea name="lista" rows="7" placeholder="Bar Pepe SL; pepe@ejemplo.com; 34600111222"></textarea>
          <button class="btn">Importar</button>
        </form>
      </div>
      <table class="tabla"><thead><tr><th>Nombre</th><th>Email</th><th>Móvil</th><th></th></tr></thead><tbody>${filas || '<tr><td colspan="4" class="muted">Sin clientes todavía.</td></tr>'}</tbody></table>`,
    }));
  }

  function paginaNuevaCampana(res, d, error = '') {
    const clientes = q.clientes.all(d.id);
    const opciones = clientes.map((c) => `<label class="check"><input type="checkbox" name="cliente" value="${c.id}" checked> ${U.esc(c.nombre)}${c.email ? '' : ' <span class="muted">(sin email: compártele el enlace por WhatsApp)</span>'}</label>`).join('');
    enviarHtml(res, layout({
      titulo: 'Nueva campaña', despacho: d,
      cuerpo: `<h1>Nueva campaña</h1>${mensaje(error, 'error')}
      <form method="post" action="/campanas" class="form caja">
        <label>Nombre<input name="nombre" required maxlength="80" placeholder="1T 2027"></label>
        <label>Fecha límite para tus clientes<input name="fecha_limite" type="date" required></label>
        <label>Qué documentos pides (uno por línea)<textarea name="items" rows="6">${ITEMS_POR_DEFECTO.join('\n')}</textarea></label>
        <label class="check"><input type="checkbox" name="recordatorios" value="1" checked> Enviar recordatorios automáticos a quien no haya terminado (7, 3 y 1 día antes, el mismo día y 2 días después)</label>
        <label class="check"><input type="checkbox" name="email_inicial" value="1" checked> Enviar ahora el email inicial con el enlace a los clientes que tengan email</label>
        <fieldset><legend>Clientes incluidos</legend>${opciones || '<p class="muted">No tienes clientes. <a href="/clientes">Añádelos primero</a>.</p>'}</fieldset>
        <button class="btn">Crear campaña</button>
      </form>`,
    }), error ? 400 : 200);
  }

  function paginaCampana(res, d, c, aviso = '') {
    const items = q.items.all(c.id);
    const sols = q.solicitudesCampana.all(c.id);
    const cuenta = { completa: 0, en_curso: 0, pendiente: 0 };
    const filas = sols.map((s) => {
      const e = estadoSolicitud(s, items.length);
      cuenta[e.clave]++;
      const enlace = enlaceSolicitud(s.token);
      const textoWa = encodeURIComponent(`Hola ${s.cliente_nombre}, puedes subir la documentación de ${c.nombre} aquí (fecha límite ${U.fechaES(c.fecha_limite)}): ${enlace}`);
      const tel = (s.cliente_telefono || '').replace(/[^0-9]/g, '');
      const wa = `https://wa.me/${tel}?text=${textoWa}`;
      return `<tr class="estado-${e.clave}">
        <td><a href="/solicitudes/${s.id}">${U.esc(s.cliente_nombre)}</a></td>
        <td><span class="chip ${e.clave}">${e.texto}</span></td>
        <td>${e.cubiertos}/${items.length} tipos · ${s.n_archivos} archivo(s)</td>
        <td class="muted">${s.ultima_actividad ? U.fechaES(s.ultima_actividad) : '—'}</td>
        <td class="acciones">
          <button type="button" class="link" data-copiar="${U.esc(enlace)}">Copiar enlace</button>
          <a class="link" href="${U.esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>
          ${!s.terminada && s.cliente_email ? `<form method="post" action="/solicitudes/${s.id}/recordar" class="inline"><button class="link">Recordar por email</button></form>` : ''}
        </td></tr>`;
    }).join('');
    const dias = U.diasEntre(U.hoyISO(), c.fecha_limite);
    enviarHtml(res, layout({
      titulo: c.nombre, despacho: d,
      cuerpo: `<div class="cabecera"><h1>${U.esc(c.nombre)}</h1>
        <div><a class="btn sec" href="/campanas/${c.id}/csv">Exportar CSV</a>
        <form method="post" action="/campanas/${c.id}/archivar" class="inline" data-confirmar="¿Archivar la campaña? Dejará de enviar recordatorios."><button class="btn sec">Archivar</button></form></div></div>
        ${mensaje(aviso)}
        <p>Fecha límite: <strong>${U.fechaES(c.fecha_limite)}</strong> (${dias >= 0 ? `faltan ${dias} días` : `vencida hace ${-dias} días`}) ·
        Recordatorios automáticos: <strong>${c.recordatorios ? 'activados' : 'desactivados'}</strong></p>
        <div class="resumen"><div><b>${cuenta.completa}</b> completas</div><div><b>${cuenta.en_curso}</b> en curso</div><div><b>${cuenta.pendiente}</b> sin empezar</div></div>
        <p class="muted">Se pide: ${items.map((i) => U.esc(i.titulo)).join(' · ')}</p>
        <table class="tabla"><thead><tr><th>Cliente</th><th>Estado</th><th>Progreso</th><th>Última actividad</th><th></th></tr></thead><tbody>${filas}</tbody></table>`,
    }));
  }

  function paginaSolicitudDespacho(res, d, s) {
    const items = q.items.all(s.campana_id);
    const archivos = q.archivosSolicitud.all(s.id);
    const na = new Set(q.noAplica.all(s.id).map((r) => r.item_id));
    const bloques = items.map((it) => {
      const lista = archivos.filter((a) => a.item_id === it.id)
        .map((a) => `<li><a href="/archivos/${a.id}">${U.esc(a.nombre)}</a> <span class="muted">${U.tamanoLegible(a.tamano)} · ${U.fechaES(a.created_at)}</span></li>`).join('');
      return `<div class="item"><h3>${U.esc(it.titulo)}</h3>${na.has(it.id) ? '<p class="chip pendiente">El cliente indica que no tiene</p>' : ''}
        ${lista ? `<ul>${lista}</ul>` : na.has(it.id) ? '' : '<p class="muted">Nada todavía.</p>'}</div>`;
    }).join('');
    enviarHtml(res, layout({
      titulo: s.cliente_nombre, despacho: d,
      cuerpo: `<p><a href="/campanas/${s.campana_id}">← ${U.esc(s.campana_nombre)}</a></p>
      <h1>${U.esc(s.cliente_nombre)}</h1>
      <p>Estado: <strong>${s.terminada ? 'Completa' : 'Pendiente'}</strong>${s.terminada_at ? ` (marcada el ${U.fechaES(s.terminada_at)})` : ''}</p>
      ${s.comentario ? `<blockquote>${U.esc(s.comentario)}</blockquote>` : ''}
      ${s.terminada ? `<form method="post" action="/solicitudes/${s.id}/reabrir" class="inline"><button class="btn sec">Reabrir (falta algo)</button></form>` : ''}
      ${bloques}`,
    }));
  }

  function paginaEnvios(res, d) {
    const filas = q.emails.all(d.id).map((e) => `<tr><td>${U.fechaES(e.created_at)} ${e.created_at.slice(11, 16)}</td><td>${U.esc(e.cliente_nombre || '')}<br><span class="muted">${U.esc(e.para)}</span></td>
      <td>${U.esc(e.tipo)}</td><td><span class="chip ${e.estado === 'enviado' ? 'completa' : e.estado === 'error' ? 'error' : 'pendiente'}">${U.esc(e.estado)}</span></td>
      <td><details><summary>${U.esc(e.asunto)}</summary><pre>${U.esc(e.cuerpo)}</pre></details></td></tr>`).join('');
    enviarHtml(res, layout({
      titulo: 'Emails', despacho: d,
      cuerpo: `<h1>Emails</h1>
      ${cfg.mailMode !== 'resend' ? '<p class="aviso">Modo local: los emails NO se envían, solo se guardan aquí como «simulado» para que veas qué recibiría cada cliente.</p>' : ''}
      <table class="tabla"><thead><tr><th>Fecha</th><th>Para</th><th>Tipo</th><th>Estado</th><th>Contenido</th></tr></thead><tbody>${filas || '<tr><td colspan="5" class="muted">Ningún email todavía.</td></tr>'}</tbody></table>`,
    }));
  }

  // ---------- página pública del cliente ----------
  function paginaCliente(res, s, aviso = '') {
    const items = q.items.all(s.campana_id);
    const archivos = q.archivosSolicitud.all(s.id);
    const na = new Set(q.noAplica.all(s.id).map((r) => r.item_id));
    const dias = U.diasEntre(U.hoyISO(), s.fecha_limite);
    const bloques = items.map((it) => {
      const lista = archivos.filter((a) => a.item_id === it.id).map((a) => `<li>${U.esc(a.nombre)} <span class="muted">${U.tamanoLegible(a.tamano)}</span>
        ${s.terminada ? '' : `<form method="post" action="/s/${s.token}/archivo/${a.id}/borrar" class="inline"><button class="link peligro">Quitar</button></form>`}</li>`).join('');
      const hecho = lista || na.has(it.id);
      return `<section class="item ${hecho ? 'hecho' : ''}">
        <h2>${hecho ? '✓ ' : ''}${U.esc(it.titulo)}</h2>
        ${lista ? `<ul>${lista}</ul>` : ''}
        ${na.has(it.id) ? '<p class="muted">Has indicado que no tienes de este tipo.</p>' : ''}
        ${s.terminada ? '' : `
        <div class="subida" data-subir="/s/${s.token}/subir?item=${it.id}">
          <label class="btn">Añadir archivos o fotos<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.xls,.xlsx,.csv,.doc,.docx,.zip,.txt,.xml,image/*" hidden></label>
          <span class="progreso muted"></span>
        </div>
        <form method="post" action="/s/${s.token}/no-aplica/${it.id}" class="inline">
          <button class="link">${na.has(it.id) ? 'Sí tengo de este tipo' : 'No tengo de este tipo este periodo'}</button></form>`}
      </section>`;
    }).join('');
    const total = items.length;
    const hechos = items.filter((it) => na.has(it.id) || archivos.some((a) => a.item_id === it.id)).length;
    enviarHtml(res, layout({
      titulo: `Documentación ${s.campana_nombre}`, publico: true,
      cuerpo: `<header class="cliente-cab"><p class="muted">${U.esc(s.despacho_nombre)}</p>
        <h1>Hola, ${U.esc(s.cliente_nombre)}</h1>
        <p>Documentación de <strong>${U.esc(s.campana_nombre)}</strong>. Fecha límite: <strong>${U.fechaES(s.fecha_limite)}</strong>
        ${dias >= 0 ? `(faltan ${dias} días)` : '(<span class="rojo">plazo vencido</span>)'}.</p>
        <div class="barra grande"><span style="width:${total ? Math.round((hechos / total) * 100) : 0}%"></span></div>
        <p class="muted">${hechos} de ${total} apartados listos</p></header>
        ${mensaje(aviso)}
        ${s.terminada ? '<p class="aviso ok">¡Gracias! Has marcado la documentación como enviada. Si te falta algo, contacta con tu gestoría.</p>' : ''}
        ${bloques}
        ${s.terminada ? '' : `<form method="post" action="/s/${s.token}/terminar" class="form caja">
          <label>¿Algo que debamos saber? (opcional)<textarea name="comentario" rows="3" maxlength="2000"></textarea></label>
          <button class="btn">He terminado de enviar</button></form>`}
        <p class="muted pie">Archivos admitidos: PDF, fotos, Excel, Word, ZIP, XML. Máx. ${Math.round(cfg.maxUploadBytes / 1024 / 1024)} MB por archivo. Tus documentos solo los ve tu gestoría.</p>`,
    }));
  }

  async function subirArchivo(req, res, s, itemId) {
    const item = q.items.all(s.campana_id).find((i) => i.id === itemId);
    if (!item) return json(res, { error: 'Apartado no válido' }, 400);
    if (s.terminada) return json(res, { error: 'La solicitud ya está cerrada' }, 409);
    let nombre;
    try {
      nombre = decodeURIComponent(req.headers['x-filename'] || '');
    } catch {
      nombre = '';
    }
    nombre = U.nombreSeguro(nombre);
    const ext = path.extname(nombre).toLowerCase();
    if (!EXT_PERMITIDAS.has(ext)) return json(res, { error: `Tipo de archivo no admitido (${ext || 'sin extensión'})` }, 415);
    const declarado = Number(req.headers['content-length'] || 0);
    if (declarado > cfg.maxUploadBytes) return json(res, { error: 'Archivo demasiado grande' }, 413);

    const dir = path.join(uploadsDir, String(s.despacho_id), String(s.id));
    fs.mkdirSync(dir, { recursive: true });
    const rel = path.join(String(s.despacho_id), String(s.id), `${Date.now()}-${U.token(6)}-${nombre}`);
    const destino = path.join(uploadsDir, rel);
    const out = fs.createWriteStream(destino, { flags: 'wx' });
    let tam = 0;
    let abortado = false;
    await new Promise((resolve) => {
      req.on('data', (c) => {
        tam += c.length;
        if (tam > cfg.maxUploadBytes && !abortado) {
          abortado = true;
          req.unpipe(out);
          out.destroy();
          resolve();
        }
      });
      req.pipe(out);
      out.on('finish', resolve);
      out.on('error', () => { abortado = true; resolve(); });
      req.on('error', () => { abortado = true; resolve(); });
    });
    if (abortado || tam === 0) {
      fs.rm(destino, { force: true }, () => {});
      return json(res, { error: tam === 0 ? 'Archivo vacío' : 'Archivo demasiado grande o subida interrumpida' }, 413);
    }
    q.crearArchivo.run(s.id, item.id, nombre, rel, tam);
    q.desmarcarNoAplica.run(s.id, item.id);
    q.actividad.run(s.id);
    return json(res, { ok: true, nombre, tamano: tam });
  }

  // ---------- recordatorios automáticos ----------
  async function ejecutarRecordatorios(hoy = U.hoyISO()) {
    let enviados = 0;
    for (const c of q.campanasActivas.all()) {
      const dias = U.diasEntre(hoy, c.fecha_limite);
      if (!DIAS_RECORDATORIO.includes(dias)) continue;
      const despacho = q.despachoPorId.get(c.despacho_id);
      const tipo = `recordatorio_${dias}`;
      for (const s of q.solicitudesPendientes.all(c.id)) {
        if (!s.cliente_email || q.emailTipoEnviado.get(s.id, tipo)) continue;
        const { asunto, cuerpo } = textoSolicitud({
          despacho, cliente: { nombre: s.cliente_nombre }, campana: c, enlace: enlaceSolicitud(s.token), diasRestantes: dias, tipo,
        });
        await mailer.enviar({ despachoId: despacho.id, solicitudId: s.id, para: s.cliente_email, asunto, cuerpo, tipo });
        enviados++;
      }
    }
    return enviados;
  }

  // ---------- enrutado ----------
  async function manejar(req, res) {
    const url = new URL(req.url, 'http://local');
    const ruta = url.pathname;
    const metodo = req.method;
    let m;

    if (metodo === 'GET' && ruta.startsWith('/static/')) {
      const nombre = path.basename(ruta);
      const fichero = path.join(PUBLIC_DIR, nombre);
      const tipo = TIPOS_ESTATICOS[path.extname(nombre)];
      if (!tipo || !fs.existsSync(fichero)) return noEncontrado(res);
      res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'public, max-age=3600' });
      return fs.createReadStream(fichero).pipe(res);
    }
    if (metodo === 'GET' && ruta === '/salud') return json(res, { ok: true });

    if (metodo !== 'GET' && metodo !== 'HEAD' && !origenValido(req)) {
      res.writeHead(403); return res.end('Origen no permitido');
    }

    // --- zona pública del cliente final ---
    if ((m = ruta.match(/^\/s\/([A-Za-z0-9_-]{20,})(\/.*)?$/))) {
      const s = q.solicitudPorToken.get(m[1]);
      if (!s || s.archivada) return noEncontrado(res);
      const sub = m[2] || '';
      if (metodo === 'GET' && sub === '') return paginaCliente(res, s, url.searchParams.get('ok') ? 'Guardado.' : '');
      if (metodo === 'PUT' && sub === '/subir') return subirArchivo(req, res, s, Number(url.searchParams.get('item')));
      let mm;
      if (metodo === 'POST' && (mm = sub.match(/^\/no-aplica\/(\d+)$/))) {
        const itemId = Number(mm[1]);
        if (!q.items.all(s.campana_id).some((i) => i.id === itemId) || s.terminada) return noEncontrado(res);
        if (q.noAplica.all(s.id).some((r) => r.item_id === itemId)) q.desmarcarNoAplica.run(s.id, itemId);
        else q.marcarNoAplica.run(s.id, itemId);
        q.actividad.run(s.id);
        return redirigir(res, `/s/${s.token}?ok=1`);
      }
      if (metodo === 'POST' && (mm = sub.match(/^\/archivo\/(\d+)\/borrar$/))) {
        const a = q.archivoDeSolicitud.get(Number(mm[1]), s.id);
        if (!a || s.terminada) return noEncontrado(res);
        q.borrarArchivo.run(a.id);
        fs.rm(path.join(uploadsDir, a.ruta), { force: true }, () => {});
        return redirigir(res, `/s/${s.token}?ok=1`);
      }
      if (metodo === 'POST' && sub === '/terminar') {
        const f = await leerFormulario(req);
        q.terminar.run(String(f.comentario || '').slice(0, 2000), s.id);
        return redirigir(res, `/s/${s.token}`);
      }
      return noEncontrado(res);
    }

    // --- autenticación ---
    if (ruta === '/') {
      return despachoActual(req) ? redirigir(res, '/panel') : paginaInicio(res);
    }
    if (ruta === '/registro') {
      if (metodo === 'GET') return paginaRegistro(res);
      const f = await leerFormulario(req);
      const email = String(f.email || '').trim().toLowerCase();
      const nombre = String(f.nombre || '').trim();
      if (!nombre || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return paginaRegistro(res, 'Revisa el nombre y el email.', f);
      if (String(f.password || '').length < 10) return paginaRegistro(res, 'La contraseña debe tener al menos 10 caracteres.', f);
      if (!f.acepto) return paginaRegistro(res, 'Debes aceptar las condiciones.', f);
      if (q.despachoPorEmail.get(email)) return paginaRegistro(res, 'Ya existe una cuenta con ese email.', f);
      const r = q.crearDespacho.run(nombre, email, U.hashPassword(f.password));
      const t = U.token();
      q.crearSesion.run(t, Number(r.lastInsertRowid));
      return redirigir(res, '/clientes', { 'Set-Cookie': cookieSesion(t, 2592000) });
    }
    if (ruta === '/entrar') {
      if (metodo === 'GET') return paginaEntrar(res);
      const ip = req.socket.remoteAddress || '';
      const reg = intentosLogin.get(ip) || { n: 0, desde: Date.now() };
      if (Date.now() - reg.desde > 15 * 60_000) { reg.n = 0; reg.desde = Date.now(); }
      if (reg.n >= 10) return paginaEntrar(res, 'Demasiados intentos. Espera 15 minutos.');
      const f = await leerFormulario(req);
      const d = q.despachoPorEmail.get(String(f.email || '').trim().toLowerCase());
      if (!d || !U.verificarPassword(String(f.password || ''), d.pass_hash)) {
        reg.n++; intentosLogin.set(ip, reg);
        return paginaEntrar(res, 'Email o contraseña incorrectos.');
      }
      intentosLogin.delete(ip);
      const t = U.token();
      q.crearSesion.run(t, d.id);
      return redirigir(res, '/panel', { 'Set-Cookie': cookieSesion(t, 2592000) });
    }
    if (ruta === '/salir' && metodo === 'POST') {
      const t = cookies(req).trs;
      if (t) q.borrarSesion.run(t);
      return redirigir(res, '/', { 'Set-Cookie': cookieSesion('', 0) });
    }

    // --- zona privada del despacho ---
    const d = despachoActual(req);
    if (!d) return metodo === 'GET' ? redirigir(res, '/entrar') : (res.writeHead(401), res.end('No autenticado'));

    if (ruta === '/panel' && metodo === 'GET') return paginaPanel(res, d, url.searchParams.get('aviso') || '');

    if (ruta === '/clientes') {
      if (metodo === 'GET') return paginaClientes(res, d);
      const f = await leerFormulario(req);
      const nombre = String(f.nombre || '').trim().slice(0, 160);
      if (!nombre) return paginaClientes(res, d, 'El nombre es obligatorio.', 'error');
      q.crearCliente.run(d.id, nombre, String(f.email || '').trim().toLowerCase() || null, String(f.telefono || '').replace(/[^0-9+]/g, '') || null);
      return paginaClientes(res, d, `Cliente «${nombre}» añadido.`);
    }
    if (ruta === '/clientes/importar' && metodo === 'POST') {
      const f = await leerFormulario(req);
      let n = 0;
      for (const linea of String(f.lista || '').split(/\r?\n/)) {
        const [nombre, email, tel] = linea.split(/[;\t]/).map((x) => (x || '').trim());
        if (!nombre) continue;
        q.crearCliente.run(d.id, nombre.slice(0, 160), /@/.test(email || '') ? email.toLowerCase() : null, (tel || '').replace(/[^0-9+]/g, '') || null);
        n++;
      }
      return paginaClientes(res, d, `${n} cliente(s) importado(s).`);
    }
    if ((m = ruta.match(/^\/clientes\/(\d+)\/borrar$/)) && metodo === 'POST') {
      q.desactivarCliente.run(Number(m[1]), d.id);
      return redirigir(res, '/clientes');
    }

    if (ruta === '/campanas/nueva' && metodo === 'GET') return paginaNuevaCampana(res, d);
    if (ruta === '/campanas' && metodo === 'POST') {
      const cuerpo = await leerCuerpo(req);
      const p = new URLSearchParams(cuerpo);
      const nombre = String(p.get('nombre') || '').trim().slice(0, 80);
      const fecha = String(p.get('fecha_limite') || '');
      const items = String(p.get('items') || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 20);
      const idsClientes = p.getAll('cliente').map(Number);
      if (!nombre || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return paginaNuevaCampana(res, d, 'Pon un nombre y una fecha límite.');
      if (!items.length) return paginaNuevaCampana(res, d, 'Indica al menos un tipo de documento.');
      const clientes = idsClientes.map((id) => q.cliente.get(id, d.id)).filter((c) => c && c.activo);
      if (!clientes.length) return paginaNuevaCampana(res, d, 'Selecciona al menos un cliente.');
      let campanaId;
      db.exec('BEGIN');
      try {
        campanaId = Number(q.crearCampana.run(d.id, nombre, fecha, p.get('recordatorios') ? 1 : 0).lastInsertRowid);
        items.forEach((t, i) => q.crearItem.run(campanaId, t.slice(0, 120), i));
        for (const c of clientes) q.crearSolicitud.run(campanaId, c.id, U.token());
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      if (p.get('email_inicial')) {
        const campana = q.campana.get(campanaId, d.id);
        for (const s of q.solicitudesCampana.all(campanaId)) {
          if (!s.cliente_email) continue;
          const { asunto, cuerpo: texto } = textoSolicitud({ despacho: d, cliente: { nombre: s.cliente_nombre }, campana, enlace: enlaceSolicitud(s.token), tipo: 'inicial' });
          await mailer.enviar({ despachoId: d.id, solicitudId: s.id, para: s.cliente_email, asunto, cuerpo: texto, tipo: 'inicial' });
        }
      }
      return redirigir(res, `/campanas/${campanaId}`);
    }
    if ((m = ruta.match(/^\/campanas\/(\d+)(\/csv|\/archivar)?$/))) {
      const c = q.campana.get(Number(m[1]), d.id);
      if (!c) return noEncontrado(res, d);
      if (!m[2] && metodo === 'GET') return paginaCampana(res, d, c, url.searchParams.get('aviso') || '');
      if (m[2] === '/archivar' && metodo === 'POST') {
        q.archivarCampana.run(c.id, d.id);
        return redirigir(res, '/panel?aviso=' + encodeURIComponent('Campaña archivada.'));
      }
      if (m[2] === '/csv' && metodo === 'GET') {
        const items = q.items.all(c.id);
        const csvCampo = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lineas = [['Cliente', 'Email', 'Estado', 'Apartados listos', 'Total apartados', 'Archivos', 'Última actividad', 'Comentario'].map(csvCampo).join(';')];
        for (const s of q.solicitudesCampana.all(c.id)) {
          const e = estadoSolicitud(s, items.length);
          lineas.push([s.cliente_nombre, s.cliente_email, e.texto, e.cubiertos, items.length, s.n_archivos, s.ultima_actividad, s.comentario].map(csvCampo).join(';'));
        }
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${U.nombreSeguro(c.nombre)}.csv"`,
        });
        return res.end('﻿' + lineas.join('\r\n'));
      }
    }
    if ((m = ruta.match(/^\/solicitudes\/(\d+)(\/recordar|\/reabrir)?$/))) {
      const s = q.solicitudDeDespacho.get(Number(m[1]), d.id);
      if (!s) return noEncontrado(res, d);
      if (!m[2] && metodo === 'GET') return paginaSolicitudDespacho(res, d, s);
      if (m[2] === '/reabrir' && metodo === 'POST') {
        q.reabrir.run(s.id);
        return redirigir(res, `/solicitudes/${s.id}`);
      }
      if (m[2] === '/recordar' && metodo === 'POST') {
        if (!s.cliente_email) return redirigir(res, `/campanas/${s.campana_id}?aviso=` + encodeURIComponent('Ese cliente no tiene email.'));
        const campana = q.campana.get(s.campana_id, d.id);
        const dias = U.diasEntre(U.hoyISO(), campana.fecha_limite);
        const { asunto, cuerpo } = textoSolicitud({ despacho: d, cliente: { nombre: s.cliente_nombre }, campana, enlace: enlaceSolicitud(s.token), diasRestantes: dias, tipo: 'manual' });
        const estado = await mailer.enviar({ despachoId: d.id, solicitudId: s.id, para: s.cliente_email, asunto, cuerpo, tipo: 'manual' });
        return redirigir(res, `/campanas/${s.campana_id}?aviso=` + encodeURIComponent(`Recordatorio a ${s.cliente_nombre}: ${estado}.`));
      }
    }
    if ((m = ruta.match(/^\/archivos\/(\d+)$/)) && metodo === 'GET') {
      const a = q.archivoDeDespacho.get(Number(m[1]), d.id);
      if (!a) return noEncontrado(res, d);
      const fichero = path.join(uploadsDir, a.ruta);
      if (!fichero.startsWith(uploadsDir) || !fs.existsSync(fichero)) return noEncontrado(res, d);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${a.nombre}"`,
        'X-Content-Type-Options': 'nosniff',
      });
      return fs.createReadStream(fichero).pipe(res);
    }
    if (ruta === '/envios' && metodo === 'GET') return paginaEnvios(res, d);

    return noEncontrado(res, d);
  }

  const server = http.createServer((req, res) => {
    manejar(req, res).catch((e) => {
      console.error(e);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error interno');
      }
    });
  });

  return { server, db, ejecutarRecordatorios };
}

module.exports = { crearApp };
