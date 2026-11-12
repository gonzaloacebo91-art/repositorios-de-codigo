'use strict';
// Punto de entrada. Configuración por variables de entorno (ver .env.ejemplo y README.md).
const path = require('node:path');
const { crearApp } = require('./lib/app');

const puerto = Number(process.env.PORT || 3000);
const cfg = {
  baseUrl: (process.env.BASE_URL || `http://localhost:${puerto}`).replace(/\/$/, ''),
  dataDir: path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data')),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024,
  mailMode: process.env.MAIL_MODE === 'resend' ? 'resend' : 'bandeja',
  resendKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || '',
};
if (cfg.mailMode === 'resend' && (!cfg.resendKey || !cfg.mailFrom)) {
  console.error('MAIL_MODE=resend requiere RESEND_API_KEY y MAIL_FROM. Saliendo.');
  process.exit(1);
}

const { server, ejecutarRecordatorios } = crearApp(cfg);
server.listen(puerto, () => {
  console.log(`Trimestra escuchando en ${cfg.baseUrl} (emails: ${cfg.mailMode === 'resend' ? 'ENVÍO REAL' : 'modo bandeja, no se envían'})`);
});

// Revisa recordatorios cada hora (y al arrancar). Cada recordatorio se envía como máximo una vez.
const revisar = () => ejecutarRecordatorios().then((n) => n && console.log(`Recordatorios generados: ${n}`)).catch(console.error);
setTimeout(revisar, 2000);
setInterval(revisar, 60 * 60 * 1000);
