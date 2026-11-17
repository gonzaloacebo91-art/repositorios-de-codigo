// Lector local (sin IA): se usa en la demo o si la API de Claude falla.
// Sin dependencias, para poder usarlo también en el navegador.

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
