// Pasarela Redsys (TPV virtual de los bancos españoles): tarjeta y Bizum.
// Documentación: https://pagosonline.redsys.es  (firma HMAC_SHA256_V1)
// Para Bizum el banco debe tener Bizum activado en el TPV del comercio.

import crypto from 'node:crypto';

const URLS = {
  pruebas: 'https://sis-t.redsys.es:25443/sis/realizarPago',
  real: 'https://sis.redsys.es/sis/realizarPago',
};

// Redsys exige un número de pedido de 4-12 caracteres cuyos 4 primeros sean dígitos.
export function numeroPedidoRedsys() {
  const digitos = String(Date.now()).slice(-8);
  const extra = crypto.randomBytes(2).toString('hex');
  return digitos + extra; // 12 caracteres
}

function claveDerivada(claveSecretaB64, pedido) {
  const clave = Buffer.from(claveSecretaB64, 'base64');
  const datos = Buffer.from(pedido, 'utf8');
  const relleno = Buffer.alloc(Math.ceil(datos.length / 8) * 8);
  datos.copy(relleno);
  const cifrador = crypto.createCipheriv('des-ede3-cbc', clave, Buffer.alloc(8));
  cifrador.setAutoPadding(false);
  return Buffer.concat([cifrador.update(relleno), cifrador.final()]);
}

export function firmar(parametrosB64, pedido, claveSecretaB64) {
  return crypto.createHmac('sha256', claveDerivada(claveSecretaB64, pedido)).update(parametrosB64).digest('base64');
}

const normalizar = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function crearPago(cfg, { pedido, importeCentimos, metodo, urlNotificacion, urlOk, urlKo, descripcion }) {
  const parametros = {
    DS_MERCHANT_AMOUNT: String(importeCentimos),
    DS_MERCHANT_ORDER: pedido,
    DS_MERCHANT_MERCHANTCODE: cfg.codigoComercio,
    DS_MERCHANT_CURRENCY: cfg.moneda,
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: cfg.terminal,
    DS_MERCHANT_MERCHANTURL: urlNotificacion,
    DS_MERCHANT_URLOK: urlOk,
    DS_MERCHANT_URLKO: urlKo,
    DS_MERCHANT_PRODUCTDESCRIPTION: descripcion,
    DS_MERCHANT_PAYMETHODS: metodo === 'bizum' ? 'z' : 'C',
  };
  const parametrosB64 = Buffer.from(JSON.stringify(parametros)).toString('base64');
  return {
    accion: 'formulario',
    url: URLS[cfg.entorno] || URLS.pruebas,
    campos: {
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: parametrosB64,
      Ds_Signature: firmar(parametrosB64, pedido, cfg.claveSecreta),
    },
  };
}

// Verifica la notificación servidor-a-servidor que Redsys envía a DS_MERCHANT_MERCHANTURL.
// Devuelve { valida, pagado, pedido }.
export function verificarNotificacion(cfg, { Ds_MerchantParameters, Ds_Signature }) {
  if (!Ds_MerchantParameters || !Ds_Signature) return { valida: false };
  const json = JSON.parse(Buffer.from(Ds_MerchantParameters.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  const pedido = json.Ds_Order || json.DS_ORDER;
  const esperada = firmar(Ds_MerchantParameters, pedido, cfg.claveSecreta);
  const valida =
    normalizar(esperada).length === normalizar(Ds_Signature).length &&
    crypto.timingSafeEqual(Buffer.from(normalizar(esperada)), Buffer.from(normalizar(Ds_Signature)));
  const codigo = Number(json.Ds_Response ?? json.DS_RESPONSE ?? 9999);
  return { valida, pagado: valida && codigo >= 0 && codigo <= 99, pedido, importe: Number(json.Ds_Amount) };
}
