// Toda la configuración sale de variables de entorno (archivo .env). Ver .env.ejemplo.

const env = process.env;
const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
const lista = (v, d) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : d);

export const config = {
  puerto: num(env.PUERTO, 3000),
  urlPublica: (env.URL_PUBLICA || 'http://localhost:3000').replace(/\/$/, ''),
  dirDatos: env.DIR_DATOS || 'data',

  tiradasGratisPorDia: num(env.TIRADAS_GRATIS_POR_DIA, 5),
  precioCompletaCentimos: Math.round(num(env.PRECIO_TIRADA_COMPLETA_EUR, 1) * 100),
  zonaHoraria: env.ZONA_HORARIA || 'Europe/Madrid',

  // --- Agentes de IA ---
  ia: {
    // Sin ANTHROPIC_API_KEY (ni otra credencial) la app usa lecturas locales de demostración.
    activa: env.IA_ACTIVA ? env.IA_ACTIVA === 'si' : Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN),
    agenteGratis: {
      modelo: env.IA_MODELO_GRATIS || 'claude-opus-5-5',
      esfuerzo: env.IA_ESFUERZO_GRATIS || 'low',
      maxTokens: num(env.IA_MAX_TOKENS_GRATIS, 2500),
    },
    agenteProfundo: {
      modelo: env.IA_MODELO_PROFUNDO || 'claude-opus-5-5',
      esfuerzo: env.IA_ESFUERZO_PROFUNDO || 'high',
      maxTokens: num(env.IA_MAX_TOKENS_PROFUNDO, 32000),
    },
  },

  // --- Pagos ---
  pagos: {
    // Métodos que se ofrecen al usuario, en orden. Cada uno se asocia a un proveedor.
    //   tarjeta -> redsys | stripe | simulado
    //   bizum   -> redsys | simulado
    metodos: lista(env.PAGOS_METODOS, ['tarjeta', 'bizum']),
    proveedorTarjeta: env.PAGOS_PROVEEDOR_TARJETA || 'simulado',
    proveedorBizum: env.PAGOS_PROVEEDOR_BIZUM || 'simulado',
    redsys: {
      entorno: env.REDSYS_ENTORNO || 'pruebas', // pruebas | real
      codigoComercio: env.REDSYS_CODIGO_COMERCIO || '999008881', // comercio público de pruebas de Redsys
      terminal: env.REDSYS_TERMINAL || '1',
      claveSecreta: env.REDSYS_CLAVE_SECRETA || 'sq7HjrUOBfKmC576ILgskD5srU870gJ7', // clave pública de pruebas
      moneda: '978', // euro
    },
    stripe: {
      claveSecreta: env.STRIPE_CLAVE_SECRETA || '',
    },
  },

  // --- Tarotista por WhatsApp ---
  whatsapp: {
    numero: (env.WHATSAPP_NUMERO || '34600000000').replace(/\D/g, ''),
    nombreTarotista: env.TAROTISTA_NOMBRE || 'nuestra tarotista',
    precios: env.TAROTISTA_PRECIOS || 'Consulta 15 min: 15 € · Consulta 30 min: 25 € · Tirada escrita personalizada: 20 €',
    horario: env.TAROTISTA_HORARIO || 'Lunes a sábado, de 10:00 a 21:00',
  },
};
