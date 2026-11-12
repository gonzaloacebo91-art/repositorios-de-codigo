// Baraja Rider-Waite-Smith (1909), 78 cartas.
// Cada carta: id (nombre del archivo de imagen), nombre, arcano, palabras clave al derecho e invertida.

const MAYORES = [
  ['m00', 'El Loco', 'comienzos, libertad, espontaneidad, salto de fe', 'imprudencia, dudas, miedo a empezar'],
  ['m01', 'El Mago', 'voluntad, habilidad, recursos, iniciativa', 'manipulación, talento desaprovechado, bloqueo'],
  ['m02', 'La Sacerdotisa', 'intuición, misterio, sabiduría interior, silencio', 'secretos, desconexión de la intuición, superficialidad'],
  ['m03', 'La Emperatriz', 'abundancia, fertilidad, creatividad, cuidado', 'dependencia, estancamiento creativo, descuido de uno mismo'],
  ['m04', 'El Emperador', 'estructura, autoridad, estabilidad, protección', 'rigidez, control excesivo, falta de disciplina'],
  ['m05', 'El Hierofante', 'tradición, enseñanza, valores, guía espiritual', 'rebeldía, dogmatismo, nuevos caminos'],
  ['m06', 'Los Enamorados', 'amor, unión, elección, armonía', 'desequilibrio, dudas en una elección, desarmonía'],
  ['m07', 'El Carro', 'determinación, victoria, avance, control', 'falta de dirección, obstáculos, agresividad'],
  ['m08', 'La Fuerza', 'valor, compasión, dominio interior, paciencia', 'inseguridad, debilidad, falta de autocontrol'],
  ['m09', 'El Ermitaño', 'introspección, búsqueda interior, soledad, guía', 'aislamiento, soledad no deseada, retraimiento'],
  ['m10', 'La Rueda de la Fortuna', 'ciclos, destino, cambio, oportunidad', 'mala racha, resistencia al cambio, ciclos repetidos'],
  ['m11', 'La Justicia', 'equilibrio, verdad, causa y efecto, decisiones justas', 'injusticia, deshonestidad, evitar responsabilidades'],
  ['m12', 'El Colgado', 'pausa, rendición, nueva perspectiva, sacrificio', 'estancamiento, resistencia, indecisión'],
  ['m13', 'La Muerte', 'final de etapa, transformación, renovación, cierre', 'resistencia al cambio, miedo a soltar, estancamiento'],
  ['m14', 'La Templanza', 'equilibrio, moderación, paciencia, sanación', 'exceso, desequilibrio, impaciencia'],
  ['m15', 'El Diablo', 'apegos, tentación, materialismo, sombra', 'liberación, romper cadenas, recuperar el poder'],
  ['m16', 'La Torre', 'cambio repentino, revelación, ruptura de estructuras', 'evitar el desastre, miedo al cambio, crisis postergada'],
  ['m17', 'La Estrella', 'esperanza, inspiración, renovación, serenidad', 'desánimo, falta de fe, desconexión'],
  ['m18', 'La Luna', 'ilusión, intuición, miedos, subconsciente', 'claridad que llega, liberación de miedos, confusión que se disipa'],
  ['m19', 'El Sol', 'alegría, éxito, vitalidad, claridad', 'optimismo apagado, retrasos, alegría interior por recuperar'],
  ['m20', 'El Juicio', 'despertar, renacimiento, llamada interior, balance', 'autocrítica, dudas, no escuchar la llamada'],
  ['m21', 'El Mundo', 'culminación, logro, plenitud, viaje', 'metas inconclusas, falta de cierre, retrasos'],
];

const PALOS = {
  w: { nombre: 'Bastos', elemento: 'fuego', ambito: 'acción, pasión, proyectos y energía' },
  c: { nombre: 'Copas', elemento: 'agua', ambito: 'emociones, amor y relaciones' },
  s: { nombre: 'Espadas', elemento: 'aire', ambito: 'mente, conflictos y decisiones' },
  p: { nombre: 'Oros', elemento: 'tierra', ambito: 'dinero, trabajo, cuerpo y bienes materiales' },
};

const RANGOS = ['As', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Sota', 'Caballero', 'Reina', 'Rey'];

// [derecho, invertido] para cada rango (1..14) de cada palo
const MENORES = {
  w: [
    ['inspiración, nuevo proyecto, chispa creativa', 'retrasos, falta de motivación'],
    ['planificación, decisión de futuro, visión', 'miedo a lo desconocido, mala planificación'],
    ['expansión, mirar lejos, primeros resultados', 'obstáculos, falta de previsión'],
    ['celebración, hogar, estabilidad alegre', 'tensión en casa, transición'],
    ['competencia, conflicto, rivalidad', 'evitar el conflicto, acuerdo'],
    ['victoria, reconocimiento, éxito público', 'ego, falta de reconocimiento'],
    ['defender la postura, perseverancia', 'agotamiento, rendirse'],
    ['rapidez, noticias, movimiento', 'retrasos, frustración'],
    ['resiliencia, última prueba, persistencia', 'cansancio, actitud defensiva'],
    ['carga, responsabilidad, exceso de trabajo', 'soltar cargas, delegar'],
    ['entusiasmo, exploración, mensaje', 'impaciencia, ideas sin rumbo'],
    ['aventura, impulso, acción decidida', 'precipitación, imprudencia'],
    ['confianza, calidez, determinación', 'celos, inseguridad'],
    ['liderazgo, visión, emprendimiento', 'autoritarismo, expectativas excesivas'],
  ],
  c: [
    ['amor nuevo, emociones que despiertan, compasión', 'emociones bloqueadas, vacío'],
    ['unión, conexión, atracción mutua', 'desequilibrio en la pareja, ruptura'],
    ['amistad, celebración, comunidad', 'excesos, chismes'],
    ['apatía, reevaluación, insatisfacción', 'nueva motivación, aceptar lo ofrecido'],
    ['pérdida, duelo, arrepentimiento', 'aceptación, seguir adelante'],
    ['nostalgia, recuerdos, inocencia', 'vivir en el pasado, madurar'],
    ['ilusiones, opciones, fantasía', 'claridad, elegir con realismo'],
    ['dejar atrás, búsqueda de algo más profundo', 'miedo a irse, indecisión'],
    ['deseo cumplido, satisfacción, gratitud', 'insatisfacción, materialismo'],
    ['armonía familiar, felicidad plena', 'tensiones familiares, desconexión'],
    ['mensaje emocional, sensibilidad, intuición', 'inmadurez emocional, bloqueo creativo'],
    ['romance, propuesta, encanto', 'decepción, celos, cambios de humor'],
    ['empatía, cuidado, intuición emocional', 'dependencia emocional, agotamiento'],
    ['equilibrio emocional, diplomacia, calma', 'manipulación emocional, frialdad'],
  ],
  s: [
    ['claridad mental, verdad, idea decisiva', 'confusión, malentendidos'],
    ['decisión difícil, bloqueo, tregua', 'indecisión, información oculta'],
    ['dolor emocional, desengaño, tristeza', 'recuperación, perdón'],
    ['descanso, recuperación, pausa', 'agotamiento, inquietud'],
    ['conflicto, victoria amarga, tensión', 'reconciliación, dejar el orgullo'],
    ['transición, dejar atrás, viaje', 'asuntos pendientes, resistencia'],
    ['estrategia, discreción, astucia', 'engaño descubierto, confesión'],
    ['sentirse atrapado, limitación autoimpuesta', 'liberación, nueva perspectiva'],
    ['ansiedad, preocupación, insomnio', 'esperanza, salir de la angustia'],
    ['final doloroso, tocar fondo', 'recuperación, renacer'],
    ['curiosidad, ideas nuevas, vigilancia', 'chismes, palabras sin acción'],
    ['ambición, rapidez, determinación', 'impulsividad, agresividad'],
    ['independencia, juicio claro, honestidad', 'frialdad, crueldad'],
    ['autoridad intelectual, verdad, ética', 'abuso de poder, manipulación'],
  ],
  p: [
    ['nueva oportunidad económica, prosperidad', 'oportunidad perdida, mala inversión'],
    ['equilibrar prioridades, adaptabilidad', 'desorganización, sobrecarga'],
    ['trabajo en equipo, aprendizaje, oficio', 'falta de colaboración, mediocridad'],
    ['seguridad, ahorro, control', 'avaricia, miedo a perder'],
    ['dificultades económicas, aislamiento', 'recuperación, ayuda que llega'],
    ['generosidad, dar y recibir, ayuda', 'deudas, desequilibrio al dar'],
    ['paciencia, inversión a largo plazo, evaluación', 'impaciencia, esfuerzo sin fruto'],
    ['dedicación, aprendizaje, perfeccionar habilidades', 'perfeccionismo, falta de enfoque'],
    ['independencia, abundancia, disfrute merecido', 'dependencia económica, gasto excesivo'],
    ['legado, riqueza, familia, estabilidad', 'problemas de herencia, inestabilidad'],
    ['estudio, nueva meta, oportunidad práctica', 'falta de progreso, procrastinación'],
    ['constancia, responsabilidad, trabajo metódico', 'estancamiento, rutina aburrida'],
    ['practicidad, cuidado del hogar, seguridad', 'descuido personal, desequilibrio trabajo-hogar'],
    ['éxito material, liderazgo, abundancia', 'obsesión por el dinero, terquedad'],
  ],
};

export const CARTAS = [
  ...MAYORES.map(([id, nombre, derecho, invertido]) => ({ id, nombre, arcano: 'mayor', palo: null, derecho, invertido })),
  ...Object.entries(MENORES).flatMap(([p, lista]) =>
    lista.map(([derecho, invertido], i) => ({
      id: `${p}${String(i + 1).padStart(2, '0')}`,
      nombre: `${RANGOS[i]} de ${PALOS[p].nombre}`,
      arcano: 'menor',
      palo: PALOS[p].nombre,
      ambito: PALOS[p].ambito,
      derecho,
      invertido,
    })),
  ),
];

export const POR_ID = Object.fromEntries(CARTAS.map((c) => [c.id, c]));
