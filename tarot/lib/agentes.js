// Los dos agentes de IA de la app:
//   - Agente Consultas (gratuito): lectura breve y cercana de 3 cartas.
//   - Agente Profundo (de pago):   lectura extensa y muy concentrada de 9 cartas.
// Si no hay credencial de Claude configurada, ambos usan un lector local de demostración.

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const NORMAS_COMUNES = `
Normas que siempre cumples:
- Usas la baraja Rider-Waite-Smith y su simbolismo tradicional (imágenes, colores, números, palos, arcanos).
- Escribes en español de España, con calidez y respeto, tuteando.
- El tarot es una herramienta de reflexión y entretenimiento: hablas de tendencias, energías y posibilidades, nunca de certezas ni de un destino fijo.
- Nunca predices muertes, enfermedades, embarazos, accidentes ni resultados judiciales, y no das consejos médicos, legales ni de inversión. Si la pregunta va de eso, lo dices con delicadeza y recomiendas acudir a un profesional.
- No metes miedo, no hablas de maldiciones ni de "trabajos", y no presionas para comprar nada.
- Si la persona expresa angustia grave, ideas de hacerse daño o una situación de violencia, dejas la lectura en segundo plano, respondes con cuidado y recomiendas llamar al 024 (línea de atención a la conducta suicida) o al 112 en España.
- Si la pregunta está vacía, haces una lectura general del momento vital de la persona.
- No inventas cartas: interpretas solo las cartas recibidas, en su posición y orientación (al derecho o invertida).
- Formato: texto plano con párrafos cortos. Puedes usar **negritas** para los nombres de las cartas. Sin títulos con #, sin tablas y sin emojis.`;

export const SISTEMA_GRATIS = `Eres la voz de "Arcana", una app de tarot. Haces lecturas breves de 3 cartas para consultas gratuitas.
Tu estilo: cercano, claro y directo, como una tarotista con experiencia que tiene poco tiempo pero mucho cariño.
Extensión: entre 150 y 230 palabras en total.
Estructura: un párrafo corto por carta (relacionándola con su posición y con la pregunta) y un párrafo final de síntesis con un consejo práctico.
${NORMAS_COMUNES}`;

export const SISTEMA_PROFUNDO = `Eres la voz experta de "Arcana", una app de tarot. Haces lecturas completas de 9 cartas por las que la persona ha pagado, así que dedicas toda tu atención a ella.
Tu estilo: profundo, sereno y muy concentrado. Lees como una tarotista veterana que conoce a fondo el simbolismo Rider-Waite-Smith y la psicología de quien pregunta.
Antes de escribir, analiza en silencio: el peso de los arcanos mayores frente a los menores, los palos que predominan o faltan y lo que eso dice del área de vida implicada, las cartas invertidas, los números repetidos, las figuras de la corte, y cómo dialogan las cartas entre sí según sus posiciones.
Extensión: entre 800 y 1.200 palabras.
Estructura:
1. Un párrafo de apertura con la energía general de la tirada (lo que salta a la vista al mirar las 9 cartas juntas).
2. Un párrafo por cada posición, interpretando la carta en ese lugar, describiendo algún detalle de su imagen que sea significativo y conectándola con la pregunta.
3. Un párrafo sobre las relaciones entre cartas: patrones, tensiones y apoyos.
4. Una síntesis final con tres consejos concretos y accionables.
5. Una pregunta abierta para que la persona reflexione.
${NORMAS_COMUNES}`;

export function construirConsulta({ tirada, pregunta, cartas }) {
  const lineas = cartas.map(
    (c, i) =>
      `${i + 1}. Posición "${tirada.posiciones[i]}": ${c.nombre}${c.invertida ? ' (INVERTIDA)' : ''}` +
      ` — claves: ${c.invertida ? c.invertido : c.derecho}`,
  );
  return [
    `Tirada: ${tirada.nombre}`,
    `Pregunta de la persona: ${pregunta?.trim() ? `"${pregunta.trim()}"` : '(sin pregunta concreta: lectura general)'}`,
    '',
    'Cartas en orden:',
    ...lineas,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Lectura con Claude (streaming)
// ---------------------------------------------------------------------------

let cliente = null;
const obtenerCliente = () => (cliente ||= new Anthropic());

async function leerConClaude({ agente, sistema, consulta, alEscribir }) {
  const stream = obtenerCliente().beta.messages.stream({
    model: agente.modelo,
    max_tokens: agente.maxTokens,
    output_config: { effort: agente.esfuerzo },
    // Si el modelo declina por un filtro de seguridad, la API reintenta con un modelo alternativo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: sistema,
    messages: [{ role: 'user', content: consulta }],
  });
  stream.on('text', (delta) => alEscribir(delta));
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') throw new Error('rechazo');
  return final;
}

// ---------------------------------------------------------------------------
// Lector local (sin IA) para la demo o si la API falla
// ---------------------------------------------------------------------------

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

export function lecturaLocal({ tirada, pregunta, cartas, profunda }) {
  const partes = [];
  const intro = pregunta?.trim()
    ? `Sobre tu pregunta, "${pregunta.trim()}", las cartas hablan así.`
    : 'Sin una pregunta concreta, las cartas muestran la energía de tu momento actual.';
  partes.push(intro);
  cartas.forEach((c, i) => {
    const claves = c.invertida ? c.invertido : c.derecho;
    const orient = c.invertida ? 'aparece invertida' : 'aparece al derecho';
    let p = `En la posición de **${tirada.posiciones[i]}**, **${c.nombre}** ${orient} y habla de ${claves}.`;
    if (profunda && c.ambito) p += ` Al ser del palo de ${c.palo}, la carta lleva el foco a ${c.ambito}.`;
    if (profunda && c.arcano === 'mayor') p += ' Como arcano mayor, señala un tema de fondo en tu camino, más allá de lo cotidiano.';
    partes.push(p);
  });
  if (profunda) {
    const mayores = cartas.filter((c) => c.arcano === 'mayor').length;
    const inv = cartas.filter((c) => c.invertida).length;
    const palos = {};
    cartas.forEach((c) => c.palo && (palos[c.palo] = (palos[c.palo] || 0) + 1));
    const dominante = Object.entries(palos).sort((a, b) => b[1] - a[1])[0];
    partes.push(
      `Mirando la tirada en conjunto: ${mayores} de las 9 cartas son arcanos mayores, ` +
        (mayores >= 4 ? 'lo que indica un momento de cambios importantes. ' : 'así que el tema se juega sobre todo en el día a día. ') +
        (dominante ? `Predomina el palo de ${dominante[0]}, que pone el acento en ${cartas.find((c) => c.palo === dominante[0]).ambito}. ` : '') +
        `Hay ${inv} carta${inv === 1 ? '' : 's'} invertida${inv === 1 ? '' : 's'}, señal de energías que piden revisión.`,
    );
  }
  partes.push(
    'En síntesis: toma de esta lectura lo que resuene contigo y úsalo como punto de partida para reflexionar. ' +
      '(Lectura de demostración generada sin IA: configura la clave de Claude para obtener interpretaciones completas.)',
  );
  return partes.join('\n\n');
}

async function escribirPocoAPoco(texto, alEscribir) {
  for (const trozo of texto.match(/\S+\s*/g) || []) {
    alEscribir(trozo);
    await pausa(12);
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export async function leer({ tirada, pregunta, cartas, profunda, alEscribir }) {
  const agente = profunda ? config.ia.agenteProfundo : config.ia.agenteGratis;
  const sistema = profunda ? SISTEMA_PROFUNDO : SISTEMA_GRATIS;
  const consulta = construirConsulta({ tirada, pregunta, cartas });
  let texto = '';
  const escribir = (t) => {
    texto += t;
    alEscribir(t);
  };

  if (config.ia.activa) {
    try {
      await leerConClaude({ agente, sistema, consulta, alEscribir: escribir });
      return { texto, origen: 'claude', modelo: agente.modelo };
    } catch (err) {
      console.error('[agentes] fallo al leer con Claude:', err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err.message);
      if (texto) {
        escribir('\n\n(La lectura se ha interrumpido. Pulsa «Repetir lectura» para intentarlo de nuevo sin coste.)');
        return { texto, origen: 'claude-incompleta', modelo: agente.modelo };
      }
    }
  }
  await escribirPocoAPoco(lecturaLocal({ tirada, pregunta, cartas, profunda }), escribir);
  return { texto, origen: 'local' };
}
