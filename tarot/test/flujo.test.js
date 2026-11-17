// Prueba de extremo a extremo de la API (sin IA ni pagos reales).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.IA_ACTIVA = 'no';
process.env.CONFIAR_PROXY = 'si';
let ip = '10.0.0.1';
const { crearServidor } = await import('../server.js');
const { Almacen } = await import('../lib/almacen.js');
const redsys = await import('../lib/pagos/redsys.js');
const { config } = await import('../lib/config.js');

let base, servidor, cookie = '';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcana-'));

async function api(ruta, cuerpo, opciones = {}) {
  const res = await fetch(base + ruta, {
    method: cuerpo ? 'POST' : 'GET',
    headers: { 'Content-Type': opciones.tipo || 'application/json', cookie, 'x-forwarded-for': ip },
    body: cuerpo ? (opciones.tipo ? cuerpo : JSON.stringify(cuerpo)) : undefined,
  });
  const sc = res.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];
  return { status: res.status, datos: res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text() };
}

before(async () => {
  ({ servidor } = crearServidor({ almacen: new Almacen(dir) }));
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => servidor.close());

test('78 cartas Rider-Waite con imagen', async () => {
  const { datos } = await api('/api/cartas');
  assert.equal(datos.length, 78);
  for (const c of datos) assert.ok(fs.existsSync(new URL(`../public/cartas/${c.id}.jpg`, import.meta.url)), c.id);
});

test('5 tiradas gratuitas al día y luego bloqueo', async () => {
  for (let i = 0; i < 5; i++) {
    const b = await api('/api/barajar', { tirada: 'ppf' });
    assert.equal(b.status, 200);
    assert.equal(b.datos.aElegir, 3);
    const r = await api('/api/revelar', { baraja: b.datos.baraja, posiciones: [3, 40, 77], pregunta: '¿Qué me depara el trabajo?' });
    assert.equal(r.status, 200);
    assert.equal(r.datos.cartas.length, 3);
    assert.equal(r.datos.estado.gratisRestantes, 4 - i);
    if (i === 0) {
      const l = await api(`/api/lectura/${r.datos.lectura}`);
      assert.match(l.datos, /Pasado/);
    }
  }
  const sexta = await api('/api/barajar', { tirada: 'consejo' });
  assert.equal(sexta.status, 429);
});

test('el cupo se aplica también por IP aunque se borren las cookies', async () => {
  cookie = '';
  assert.equal((await api('/api/barajar', { tirada: 'ppf' })).status, 429);
});

test('no se puede reutilizar una baraja ni elegir cartas repetidas', async () => {
  cookie = '';
  ip = '10.0.0.2';
  const b = await api('/api/barajar', { tirada: 'amor3' });
  assert.equal((await api('/api/revelar', { baraja: b.datos.baraja, posiciones: [1, 1, 2] })).status, 400);
  assert.equal((await api('/api/revelar', { baraja: b.datos.baraja, posiciones: [1, 2, 3] })).status, 200);
  assert.equal((await api('/api/revelar', { baraja: b.datos.baraja, posiciones: [4, 5, 6] })).status, 409);
});

test('tirada completa: exige pago, el pago simulado da 1 crédito y se gasta', async () => {
  cookie = '';
  assert.equal((await api('/api/barajar', { tirada: 'panorama9' })).status, 402);
  const p = await api('/api/pedido', { metodo: 'bizum' });
  assert.equal(p.datos.accion, 'redirigir');
  await api('/api/pago-simulado/confirmar', { pedido: p.datos.pedido, resultado: 'ok' });
  await api('/api/pago-simulado/confirmar', { pedido: p.datos.pedido, resultado: 'ok' }); // no duplica
  const e = await api(`/api/pedido?id=${p.datos.pedido}`);
  assert.equal(e.datos.estado, 'pagado');
  assert.equal(e.datos.creditos, 1);
  const b = await api('/api/barajar', { tirada: 'trabajo9' });
  const r = await api('/api/revelar', { baraja: b.datos.baraja, posiciones: [0, 1, 2, 3, 4, 5, 6, 7, 8] });
  assert.equal(r.status, 200);
  assert.equal(r.datos.estado.creditos, 0);
  const l = await api(`/api/lectura/${r.datos.lectura}`);
  assert.match(l.datos, /arcanos mayores/);
});

test('Redsys: firma del formulario y notificación verificada', async () => {
  cookie = '';
  const { config } = await import('../lib/config.js');
  const p = await api('/api/pedido', { metodo: 'tarjeta' });
  // en la demo la tarjeta es "simulado"; probamos Redsys directamente
  const ref = redsys.numeroPedidoRedsys();
  const pago = redsys.crearPago(config.pagos.redsys, { pedido: ref, importeCentimos: 100, metodo: 'bizum', urlNotificacion: 'x', urlOk: 'x', urlKo: 'x', descripcion: 'x' });
  const params = JSON.parse(Buffer.from(pago.campos.Ds_MerchantParameters, 'base64').toString());
  assert.equal(params.DS_MERCHANT_PAYMETHODS, 'z');
  assert.equal(params.DS_MERCHANT_AMOUNT, '100');

  // Simulamos la notificación de Redsys para un pedido existente
  const pedido = Object.values(JSON.parse(JSON.stringify(p))).length && p.datos.pedido;
  const almacenRef = (await api(`/api/pedido?id=${pedido}`)).datos;
  assert.equal(almacenRef.estado, 'pendiente');
  const notifParams = Buffer.from(JSON.stringify({ Ds_Order: ref, Ds_Response: '0000', Ds_Amount: '100' })).toString('base64');
  const firma = redsys.firmar(notifParams, ref, config.pagos.redsys.claveSecreta);
  assert.equal(redsys.verificarNotificacion(config.pagos.redsys, { Ds_MerchantParameters: notifParams, Ds_Signature: firma }).pagado, true);
  assert.equal(redsys.verificarNotificacion(config.pagos.redsys, { Ds_MerchantParameters: notifParams, Ds_Signature: 'AAAA' }).valida, false);
  const mala = await api('/api/pagos/redsys/notificacion', `Ds_MerchantParameters=${encodeURIComponent(notifParams)}&Ds_Signature=AAAA`, { tipo: 'application/x-www-form-urlencoded' });
  assert.equal(mala.status, 400);
});

test('Redsys: firma igual a la calculada de forma independiente con openssl', () => {
  // Pedido 1446068581 y clave pública de pruebas de Redsys; valor esperado obtenido con
  // `openssl enc -des-ede3-cbc` + `openssl dgst -sha256 -mac HMAC` (ver README).
  const params = 'eyJEU19NRVJDSEFOVF9BTU9VTlQiOiIxNDUiLCJEU19NRVJDSEFOVF9PUkRFUiI6IjE0NDYwNjg1ODEiLCJEU19NRVJDSEFOVF9NRVJDSEFOVENPREUiOiI5OTkwMDg4ODEiLCJEU19NRVJDSEFOVF9DVVJSRU5DWSI6Ijk3OCIsIkRTX01FUkNIQU5UX1RSQU5TQUNUSU9OVFlQRSI6IjAiLCJEU19NRVJDSEFOVF9URVJNSU5BTCI6IjEiLCJEU19NRVJDSEFOVF9NRVJDSEFOVFVSTCI6Imh0dHA6XC9cL3d3dy5wcnVlYmEuY29tXC91cmxOb3RpZmljYWNpb24ucGhwIiwiRFNfTUVSQ0hBTlRfVVJMT0siOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsT0sucGhwIiwiRFNfTUVSQ0hBTlRfVVJMS08iOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsS08ucGhwIn0=';
  assert.equal(redsys.firmar(params, '1446068581', 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'), 'Ms78HYFwRTBqureki/eQsZ7Pt4Pl/XTWwgs43c//2To=');
});
