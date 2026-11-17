'use strict';
// Crea datos de demostración en ./data (cuenta demo@recadoc.local / demo-recadoc) para enseñar
// el producto en una llamada con una gestoría. No envía nada al exterior.
const path = require('node:path');
const { abrir } = require('../lib/db');
const U = require('../lib/util');

const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
const db = abrir(dataDir);
const email = 'demo@recadoc.local';
if (db.prepare('SELECT 1 FROM despachos WHERE email = ?').get(email)) {
  console.log('La cuenta demo ya existe. Entra con demo@recadoc.local / demo-recadoc');
  process.exit(0);
}
const despachoId = Number(db.prepare('INSERT INTO despachos (nombre, email, pass_hash) VALUES (?, ?, ?)')
  .run('Asesoría Demo', email, U.hashPassword('demo-recadoc')).lastInsertRowid);
const clientes = [
  ['Bar La Esquina SL', 'esquina@ejemplo.com', '34600000001'],
  ['Fontanería Ruiz', 'ruiz@ejemplo.com', '34600000002'],
  ['Laura Gómez (diseñadora)', 'laura@ejemplo.com', '34600000003'],
  ['Peluquería Estilo', '', '34600000004'],
  ['Taller Hermanos Díaz SL', 'diaz@ejemplo.com', ''],
];
const ids = clientes.map(([n, e, t]) => Number(db.prepare('INSERT INTO clientes (despacho_id, nombre, email, telefono) VALUES (?, ?, ?, ?)').run(despachoId, n, e || null, t || null).lastInsertRowid));
const hoy = U.hoyISO();
const limite = new Date(Date.parse(hoy + 'T12:00:00Z') + 6 * 86400000).toISOString().slice(0, 10);
const campanaId = Number(db.prepare('INSERT INTO campanas (despacho_id, nombre, fecha_limite) VALUES (?, ?, ?)').run(despachoId, 'Trimestre en curso (demo)', limite).lastInsertRowid);
['Facturas emitidas (ventas)', 'Facturas recibidas (gastos y compras)', 'Extractos bancarios del trimestre', 'Tickets y otros justificantes']
  .forEach((t, i) => db.prepare('INSERT INTO items (campana_id, titulo, orden) VALUES (?, ?, ?)').run(campanaId, t, i));
const items = db.prepare('SELECT id FROM items WHERE campana_id = ? ORDER BY orden').all(campanaId).map((r) => r.id);
const sols = ids.map((id) => {
  const token = U.token();
  db.prepare('INSERT INTO solicitudes (campana_id, cliente_id, token) VALUES (?, ?, ?)').run(campanaId, id, token);
  return { id: Number(db.prepare('SELECT id FROM solicitudes WHERE token = ?').get(token).id), token };
});
// Cliente 1 completo, cliente 2 a medias, resto sin empezar.
const fs = require('node:fs');
for (const [i, s] of [[0, sols[0]], [1, sols[1]]]) {
  const dir = path.join(dataDir, 'uploads', String(despachoId), String(s.id));
  fs.mkdirSync(dir, { recursive: true });
  const n = i === 0 ? 4 : 2;
  for (let k = 0; k < n; k++) {
    const nombre = `ejemplo_${k + 1}.pdf`;
    const rel = path.join(String(despachoId), String(s.id), `${Date.now()}-${k}-${nombre}`);
    fs.writeFileSync(path.join(dataDir, 'uploads', rel), '%PDF-1.4 demo');
    db.prepare('INSERT INTO archivos (solicitud_id, item_id, nombre, ruta, tamano) VALUES (?, ?, ?, ?, ?)').run(s.id, items[k], nombre, rel, 13);
  }
  db.prepare("UPDATE solicitudes SET ultima_actividad = datetime('now') WHERE id = ?").run(s.id);
}
db.prepare("UPDATE solicitudes SET terminada = 1, terminada_at = datetime('now'), comentario = 'Todo enviado, ¡gracias!' WHERE id = ?").run(sols[0].id);
console.log('Datos demo creados. Entra en http://localhost:3000 con demo@recadoc.local / demo-recadoc');
console.log(`Enlace de cliente de ejemplo: http://localhost:3000/s/${sols[2].token}`);
