// Almacén muy simple en un archivo JSON. Suficiente para la demo y para un piloto pequeño.
// Para producción con mucho tráfico: cambiar por SQLite/Postgres manteniendo esta misma interfaz.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class Almacen {
  constructor(dir) {
    this.archivo = path.join(dir, 'estado.json');
    fs.mkdirSync(dir, { recursive: true });
    this.datos = { visitantes: {}, ips: {}, barajas: {}, lecturas: {}, pedidos: {} };
    if (fs.existsSync(this.archivo)) {
      try {
        this.datos = { ...this.datos, ...JSON.parse(fs.readFileSync(this.archivo, 'utf8')) };
      } catch {
        /* archivo dañado: se empieza de cero */
      }
    }
    this.pendiente = null;
  }

  guardar() {
    clearTimeout(this.pendiente);
    this.pendiente = setTimeout(() => {
      const tmp = this.archivo + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.datos));
      fs.renameSync(tmp, this.archivo);
    }, 50);
  }

  static id(bytes = 12) {
    return crypto.randomBytes(bytes).toString('base64url');
  }

  visitante(id) {
    const v = (this.datos.visitantes[id] ||= { creado: Date.now(), uso: {}, creditos: 0 });
    return v;
  }

  // --- Cupo de tiradas gratuitas (por visitante y por IP, se aplica el mayor) ---
  usoGratis(vid, ip, fecha) {
    const porVisitante = this.visitante(vid).uso[fecha] || 0;
    const porIp = this.datos.ips[ip]?.[fecha] || 0;
    return Math.max(porVisitante, porIp);
  }

  sumarUsoGratis(vid, ip, fecha) {
    const v = this.visitante(vid);
    v.uso = { [fecha]: (v.uso[fecha] || 0) + 1 }; // solo se guarda el día actual
    this.datos.ips[ip] = { [fecha]: (this.datos.ips[ip]?.[fecha] || 0) + 1 };
    this.guardar();
  }

  // --- Créditos de tiradas completas ---
  creditos(vid) {
    return this.visitante(vid).creditos;
  }

  sumarCredito(vid) {
    this.visitante(vid).creditos += 1;
    this.guardar();
  }

  gastarCredito(vid) {
    const v = this.visitante(vid);
    if (v.creditos < 1) return false;
    v.creditos -= 1;
    this.guardar();
    return true;
  }

  // --- Barajas, lecturas y pedidos ---
  crear(coleccion, obj, id = Almacen.id()) {
    this.datos[coleccion][id] = { ...obj, creado: Date.now() };
    this.guardar();
    return id;
  }

  obtener(coleccion, id) {
    return this.datos[coleccion][id] || null;
  }

  actualizar(coleccion, id, cambios) {
    Object.assign(this.datos[coleccion][id], cambios);
    this.guardar();
  }

  // Limpieza de barajas abandonadas (más de 1 día)
  limpiar() {
    const limite = Date.now() - 24 * 3600 * 1000;
    for (const [id, b] of Object.entries(this.datos.barajas)) if (b.creado < limite) delete this.datos.barajas[id];
    this.guardar();
  }
}
