// Capa única de pagos. Cambiar de pasarela = cambiar variables de entorno (ver .env.ejemplo).
//   simulado -> página de pago falsa para la demo (no cobra nada)
//   redsys   -> tarjeta y Bizum a través del TPV virtual del banco
//   stripe   -> tarjeta a través de Stripe Checkout

import * as redsys from './redsys.js';
import * as stripe from './stripe.js';

export const NOMBRES_METODO = { tarjeta: 'Tarjeta', bizum: 'Bizum' };

export function proveedorDe(cfgPagos, metodo) {
  const p = metodo === 'bizum' ? cfgPagos.proveedorBizum : cfgPagos.proveedorTarjeta;
  if (metodo === 'bizum' && p === 'stripe') throw new Error('Stripe no admite Bizum: usa redsys o simulado');
  return p;
}

export function metodosDisponibles(cfgPagos) {
  return cfgPagos.metodos.map((m) => ({ id: m, nombre: NOMBRES_METODO[m] || m, proveedor: proveedorDe(cfgPagos, m) }));
}

/**
 * Inicia un pago. Devuelve lo que el navegador debe hacer:
 *   { accion: 'redirigir', url }                 -> ir a la URL
 *   { accion: 'formulario', url, campos }         -> enviar un formulario POST (Redsys)
 */
export async function iniciarPago(cfg, { pedido, metodo, importeCentimos, descripcion }) {
  const proveedor = proveedorDe(cfg.pagos, metodo);
  const base = cfg.urlPublica;
  const urlOk = `${base}/?pago=ok&pedido=${pedido.id}`;
  const urlKo = `${base}/?pago=ko&pedido=${pedido.id}`;

  if (proveedor === 'simulado') {
    return { proveedor, accion: 'redirigir', url: `/pago-simulado.html?pedido=${pedido.id}&metodo=${metodo}` };
  }
  if (proveedor === 'redsys') {
    return {
      proveedor,
      ...redsys.crearPago(cfg.pagos.redsys, {
        pedido: pedido.referencia,
        importeCentimos,
        metodo,
        descripcion,
        urlNotificacion: `${base}/api/pagos/redsys/notificacion`,
        urlOk,
        urlKo,
      }),
    };
  }
  if (proveedor === 'stripe') {
    return { proveedor, ...(await stripe.crearPago(cfg.pagos.stripe, { pedido: pedido.id, importeCentimos, descripcion, urlOk, urlKo })) };
  }
  throw new Error(`Proveedor de pago desconocido: ${proveedor}`);
}

export { redsys, stripe };
