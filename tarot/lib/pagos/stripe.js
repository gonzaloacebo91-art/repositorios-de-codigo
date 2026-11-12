// Stripe Checkout (solo tarjeta; Stripe no ofrece Bizum). Sin dependencias: API REST.
// Verificación: al volver de Stripe se consulta la sesión en el servidor (payment_status === 'paid').

const API = 'https://api.stripe.com/v1';

async function llamar(cfg, ruta, { metodo = 'GET', cuerpo } = {}) {
  const res = await fetch(API + ruta, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${cfg.claveSecreta}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: cuerpo ? new URLSearchParams(cuerpo) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${json.error?.message}`);
  return json;
}

export async function crearPago(cfg, { pedido, importeCentimos, urlOk, urlKo, descripcion }) {
  if (!cfg.claveSecreta) throw new Error('Falta STRIPE_CLAVE_SECRETA');
  const sesion = await llamar(cfg, '/checkout/sessions', {
    metodo: 'POST',
    cuerpo: {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(importeCentimos),
      'line_items[0][price_data][product_data][name]': descripcion,
      client_reference_id: pedido,
      success_url: `${urlOk}&stripe_sesion={CHECKOUT_SESSION_ID}`,
      cancel_url: urlKo,
    },
  });
  return { accion: 'redirigir', url: sesion.url, referencia: sesion.id };
}

export async function comprobarPago(cfg, referencia) {
  const sesion = await llamar(cfg, `/checkout/sessions/${encodeURIComponent(referencia)}`);
  return { pagado: sesion.payment_status === 'paid', pedido: sesion.client_reference_id };
}
