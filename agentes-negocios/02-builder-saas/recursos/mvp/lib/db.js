'use strict';
// Capa de datos: SQLite integrado en Node (node:sqlite), sin dependencias externas.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ESQUEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS despachos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'prueba',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token TEXT PRIMARY KEY,
  despacho_id INTEGER NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  expira TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY,
  despacho_id INTEGER NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campanas (
  id INTEGER PRIMARY KEY,
  despacho_id INTEGER NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  fecha_limite TEXT NOT NULL,
  recordatorios INTEGER NOT NULL DEFAULT 1,
  archivada INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY,
  campana_id INTEGER NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id INTEGER PRIMARY KEY,
  campana_id INTEGER NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  terminada INTEGER NOT NULL DEFAULT 0,
  comentario TEXT,
  terminada_at TEXT,
  ultima_actividad TEXT,
  UNIQUE (campana_id, cliente_id)
);

CREATE TABLE IF NOT EXISTS no_aplica (
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (solicitud_id, item_id)
);

CREATE TABLE IF NOT EXISTS archivos (
  id INTEGER PRIMARY KEY,
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  ruta TEXT NOT NULL,
  tamano INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY,
  despacho_id INTEGER NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  solicitud_id INTEGER REFERENCES solicitudes(id) ON DELETE SET NULL,
  para TEXT NOT NULL,
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  estado TEXT NOT NULL,
  detalle TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_sol ON emails(solicitud_id, tipo);
CREATE INDEX IF NOT EXISTS idx_archivos_sol ON archivos(solicitud_id);
`;

function abrir(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'trimestra.sqlite'));
  db.exec(ESQUEMA);
  return db;
}

module.exports = { abrir };
