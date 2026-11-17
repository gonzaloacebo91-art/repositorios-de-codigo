// Tiradas disponibles. "gratis" = 3 cartas, "completa" = 9 cartas de pago.

export const TIRADAS = {
  // --- Gratuitas (3 cartas) ---
  ppf: {
    tipo: 'gratis',
    nombre: 'Pasado · Presente · Futuro',
    descripcion: 'La tirada clásica para ver de dónde vienes y hacia dónde vas.',
    posiciones: ['Pasado', 'Presente', 'Futuro'],
  },
  consejo: {
    tipo: 'gratis',
    nombre: 'Situación · Obstáculo · Consejo',
    descripcion: 'Para un problema concreto: qué pasa, qué lo frena y qué hacer.',
    posiciones: ['Situación', 'Obstáculo', 'Consejo'],
  },
  amor3: {
    tipo: 'gratis',
    nombre: 'Tú · La otra persona · La relación',
    descripcion: 'Una mirada rápida a un vínculo amoroso o afectivo.',
    posiciones: ['Tú', 'La otra persona', 'La relación'],
  },

  // --- Completas (9 cartas, de pago) ---
  panorama9: {
    tipo: 'completa',
    nombre: 'Panorama 3×3',
    descripcion: 'Pasado, presente y futuro en tres planos: mente, corazón y vida material.',
    posiciones: [
      'Pasado · Mente', 'Presente · Mente', 'Futuro · Mente',
      'Pasado · Corazón', 'Presente · Corazón', 'Futuro · Corazón',
      'Pasado · Vida material', 'Presente · Vida material', 'Futuro · Vida material',
    ],
  },
  amor9: {
    tipo: 'completa',
    nombre: 'Camino del amor',
    descripcion: 'Lectura profunda de una relación o de tu vida sentimental.',
    posiciones: [
      'Cómo estás tú', 'Cómo está la otra persona', 'Lo que os une',
      'Lo que os separa', 'Pasado de la relación', 'Presente de la relación',
      'Lo que no ves', 'Consejo', 'Hacia dónde va',
    ],
  },
  trabajo9: {
    tipo: 'completa',
    nombre: 'Trabajo y dinero',
    descripcion: 'Carrera, proyectos y economía: situación, recursos y decisiones.',
    posiciones: [
      'Situación actual', 'Tus fortalezas', 'Tus bloqueos',
      'Entorno y personas', 'Dinero', 'Oportunidad oculta',
      'Lo que conviene evitar', 'Consejo', 'Resultado probable',
    ],
  },
};

export function tiradasPorTipo(tipo) {
  return Object.entries(TIRADAS)
    .filter(([, t]) => t.tipo === tipo)
    .map(([id, t]) => ({ id, ...t }));
}
