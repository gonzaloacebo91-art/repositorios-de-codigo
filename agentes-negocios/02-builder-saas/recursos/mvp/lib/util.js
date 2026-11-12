'use strict';
const crypto = require('node:crypto');

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function token(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function hashPassword(pass) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pass, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verificarPassword(pass, guardado) {
  const [alg, saltHex, hashHex] = String(guardado).split('$');
  if (alg !== 'scrypt' || !saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(pass, Buffer.from(saltHex, 'hex'), 64);
  const esperado = Buffer.from(hashHex, 'hex');
  return esperado.length === hash.length && crypto.timingSafeEqual(esperado, hash);
}

// Fecha de hoy (AAAA-MM-DD) en la zona horaria de Madrid.
function hoyISO(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d);
}

function diasEntre(desdeISO, hastaISO) {
  const a = Date.parse(desdeISO + 'T00:00:00Z');
  const b = Date.parse(hastaISO + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

function fechaES(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function nombreSeguro(nombre) {
  const base = String(nombre || 'archivo')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return base || 'archivo';
}

function tamanoLegible(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

module.exports = { esc, token, hashPassword, verificarPassword, hoyISO, diasEntre, fechaES, nombreSeguro, tamanoLegible };
