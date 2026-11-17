'use strict';
// Envío de emails. Por defecto (MAIL_MODE=bandeja) NO se envía nada: el email se guarda en la
// tabla `emails` como "simulado" y se puede ver en /envios. Solo si el dueño autoriza la acción
// correspondiente se configura MAIL_MODE=resend con RESEND_API_KEY y MAIL_FROM.
const { fechaES } = require('./util');

function crearMailer(db, cfg) {
  const insertar = db.prepare(
    `INSERT INTO emails (despacho_id, solicitud_id, para, asunto, cuerpo, tipo, estado, detalle)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  async function enviar({ despachoId, solicitudId = null, para, asunto, cuerpo, tipo }) {
    let estado = 'simulado';
    let detalle = 'MAIL_MODE=bandeja: no se ha enviado (modo local)';
    if (cfg.mailMode === 'resend') {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: cfg.mailFrom, to: [para], subject: asunto, text: cuerpo }),
        });
        estado = r.ok ? 'enviado' : 'error';
        detalle = r.ok ? 'ok' : `HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`;
      } catch (e) {
        estado = 'error';
        detalle = String(e.message || e);
      }
    }
    insertar.run(despachoId, solicitudId, para, asunto, cuerpo, tipo, estado, detalle);
    return estado;
  }

  return { enviar };
}

function textoSolicitud({ despacho, cliente, campana, enlace, diasRestantes, tipo }) {
  const limite = fechaES(campana.fecha_limite);
  let intro;
  if (tipo === 'inicial') {
    intro = `Ya puedes enviarnos la documentación de "${campana.nombre}". La necesitamos antes del ${limite}.`;
  } else if (diasRestantes > 0) {
    intro = `Te recordamos que faltan ${diasRestantes} día(s) para la fecha límite (${limite}) de "${campana.nombre}" y aún nos falta documentación.`;
  } else if (diasRestantes === 0) {
    intro = `Hoy (${limite}) es el último día para enviarnos la documentación de "${campana.nombre}".`;
  } else {
    intro = `La fecha límite de "${campana.nombre}" (${limite}) ya ha pasado y todavía nos falta documentación. Envíala cuanto antes para evitar recargos.`;
  }
  const asunto =
    tipo === 'inicial'
      ? `${despacho.nombre}: documentación ${campana.nombre}`
      : `Recordatorio: documentación ${campana.nombre} (${despacho.nombre})`;
  const cuerpo = `Hola ${cliente.nombre}:

${intro}

Sube los archivos desde este enlace (no necesitas usuario ni contraseña, funciona desde el móvil):
${enlace}

Si de algún tipo de documento no tienes nada este periodo, márcalo como "No tengo" en la misma página.

Gracias,
${despacho.nombre}`;
  return { asunto, cuerpo };
}

module.exports = { crearMailer, textoSolicitud };
