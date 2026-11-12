'use strict';
// Prueba de extremo a extremo del flujo principal, sin dependencias: node --test test/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearApp } = require('../lib/app');
const U = require('../lib/util');

test('flujo completo: registro, clientes, campaña, subida, recordatorios', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trimestra-test-'));
  const cfg = { baseUrl: 'http://localhost', dataDir, maxUploadBytes: 1024 * 1024, mailMode: 'bandeja' };
  const { server, db, ejecutarRecordatorios } = crearApp(cfg);
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const form = (o) => new URLSearchParams(o).toString();
  let cookie = '';
  const pedir = (ruta, opts = {}) =>
    fetch(base + ruta, {
      redirect: 'manual',
      ...opts,
      headers: { ...(opts.body && typeof opts.body === 'string' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), cookie, ...(opts.headers || {}) },
    });

  try {
    // Sin sesión, el panel redirige a /entrar
    assert.strictEqual((await pedir('/panel')).headers.get('location'), '/entrar');

    // Registro
    let r = await pedir('/registro', { method: 'POST', body: form({ nombre: 'Gestoría Prueba', email: 'g@ejemplo.com', password: 'contrasena-larga', acepto: '1' }) });
    assert.strictEqual(r.status, 303);
    cookie = r.headers.get('set-cookie').split(';')[0];

    // Contraseña errónea
    r = await pedir('/entrar', { method: 'POST', body: form({ email: 'g@ejemplo.com', password: 'mala' }) });
    assert.strictEqual(r.status, 400);

    // Importar clientes
    r = await pedir('/clientes/importar', { method: 'POST', body: form({ lista: 'Bar Pepe SL; pepe@ejemplo.com; 34600111222\nTaller Ana; ana@ejemplo.com\nSin Email SL' }) });
    assert.match(await r.text(), /3 cliente\(s\) importado/);
    const ids = db.prepare('SELECT id FROM clientes ORDER BY id').all().map((x) => x.id);

    // Crear campaña con fecha límite dentro de 3 días
    const hoy = U.hoyISO();
    const limite = new Date(Date.parse(hoy + 'T12:00:00Z') + 3 * 86400000).toISOString().slice(0, 10);
    const cuerpo = new URLSearchParams({ nombre: '1T 2027', fecha_limite: limite, items: 'Facturas emitidas\nFacturas recibidas', recordatorios: '1', email_inicial: '1' });
    ids.forEach((id) => cuerpo.append('cliente', String(id)));
    r = await pedir('/campanas', { method: 'POST', body: cuerpo.toString() });
    assert.strictEqual(r.status, 303);
    const urlCampana = r.headers.get('location');
    assert.match(urlCampana, /^\/campanas\/\d+$/);

    // Emails iniciales simulados (solo los 2 con email)
    assert.strictEqual(db.prepare("SELECT COUNT(*) n FROM emails WHERE tipo='inicial' AND estado='simulado'").get().n, 2);

    // Página del cliente sin login
    const sol = db.prepare('SELECT s.*, cl.nombre FROM solicitudes s JOIN clientes cl ON cl.id=s.cliente_id ORDER BY s.id LIMIT 1').get();
    const items = db.prepare('SELECT * FROM items WHERE campana_id = ? ORDER BY orden').all(sol.campana_id);
    r = await fetch(`${base}/s/${sol.token}`);
    assert.strictEqual(r.status, 200);
    assert.match(await r.text(), /Hola, Bar Pepe SL/);

    // Token inválido
    assert.strictEqual((await fetch(`${base}/s/${'x'.repeat(32)}`)).status, 404);

    // Subida válida
    r = await fetch(`${base}/s/${sol.token}/subir?item=${items[0].id}`, { method: 'PUT', headers: { 'X-Filename': encodeURIComponent('factura enero ñ.pdf') }, body: Buffer.from('%PDF-1.4 prueba') });
    assert.strictEqual(r.status, 200, await r.clone().text());
    // Extensión no permitida
    r = await fetch(`${base}/s/${sol.token}/subir?item=${items[0].id}`, { method: 'PUT', headers: { 'X-Filename': 'virus.exe' }, body: Buffer.from('MZ') });
    assert.strictEqual(r.status, 415);
    // Demasiado grande
    r = await fetch(`${base}/s/${sol.token}/subir?item=${items[0].id}`, { method: 'PUT', headers: { 'X-Filename': 'grande.pdf' }, body: Buffer.alloc(2 * 1024 * 1024) });
    assert.strictEqual(r.status, 413);

    // Marcar "no tengo" el segundo apartado y terminar
    r = await fetch(`${base}/s/${sol.token}/no-aplica/${items[1].id}`, { method: 'POST', redirect: 'manual' });
    assert.strictEqual(r.status, 303);
    r = await fetch(`${base}/s/${sol.token}/terminar`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ comentario: 'Este trimestre no tuve gastos' }) });
    assert.strictEqual(r.status, 303);

    // El despacho ve el estado y puede descargar el archivo
    r = await pedir(urlCampana);
    const html = await r.text();
    assert.match(html, /<b>1<\/b> completas/);
    assert.match(html, /<b>2<\/b> sin empezar/);
    const archivo = db.prepare('SELECT * FROM archivos LIMIT 1').get();
    assert.strictEqual(archivo.nombre, 'factura_enero_n.pdf');
    r = await pedir(`/archivos/${archivo.id}`);
    assert.strictEqual(await r.text(), '%PDF-1.4 prueba');
    // Sin sesión no se puede descargar
    assert.strictEqual((await fetch(`${base}/archivos/${archivo.id}`, { redirect: 'manual' })).status, 303);

    // CSV
    r = await pedir(urlCampana + '/csv');
    assert.match(await r.text(), /Bar Pepe SL.*Completa/);

    // CSRF: POST desde otro origen rechazado
    r = await pedir('/clientes', { method: 'POST', headers: { Origin: 'https://malo.example' }, body: form({ nombre: 'X' }) });
    assert.strictEqual(r.status, 403);

    // Recordatorios: 3 días antes -> solo al cliente pendiente con email (Taller Ana), una sola vez
    assert.strictEqual(await ejecutarRecordatorios(hoy), 1);
    assert.strictEqual(await ejecutarRecordatorios(hoy), 0);
    const rec = db.prepare("SELECT * FROM emails WHERE tipo='recordatorio_3'").get();
    assert.strictEqual(rec.para, 'ana@ejemplo.com');
    assert.match(rec.cuerpo, /faltan 3 día/);

    // Aislamiento entre despachos: otra cuenta no ve la campaña ni el archivo
    r = await fetch(base + '/registro', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ nombre: 'Otra', email: 'o@ejemplo.com', password: 'contrasena-larga', acepto: '1' }) });
    const otra = r.headers.get('set-cookie').split(';')[0];
    assert.strictEqual((await fetch(base + urlCampana, { headers: { cookie: otra } })).status, 404);
    assert.strictEqual((await fetch(`${base}/archivos/${archivo.id}`, { headers: { cookie: otra } })).status, 404);
  } finally {
    server.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
