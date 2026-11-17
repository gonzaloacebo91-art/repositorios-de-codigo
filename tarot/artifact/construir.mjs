// Construye la versión de demostración sin servidor (para publicarla como página privada).
//   node artifact/construir.mjs   ->  dist-artifact/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(raiz, 'dist-artifact');
const pub = (f) => path.join(raiz, 'public', f);

fs.rmSync(salida, { recursive: true, force: true });
fs.mkdirSync(path.join(salida, 'lib'), { recursive: true });
fs.cpSync(pub('cartas'), path.join(salida, 'cartas'), { recursive: true });
fs.copyFileSync(pub('reverso.svg'), path.join(salida, 'reverso.svg'));
for (const f of ['cartas.js', 'tiradas.js', 'lectura-local.js']) fs.copyFileSync(path.join(raiz, 'lib', f), path.join(salida, 'lib', f));
fs.copyFileSync(path.join(raiz, 'artifact', 'demo-local.js'), path.join(salida, 'demo-local.js'));

const relativas = (s) => s.replaceAll('/cartas/', 'cartas/').replaceAll('/reverso.svg', 'reverso.svg');
fs.writeFileSync(path.join(salida, 'estilos.css'), relativas(fs.readFileSync(pub('estilos.css'), 'utf8')));
fs.writeFileSync(path.join(salida, 'app.js'), relativas(fs.readFileSync(pub('app.js'), 'utf8')));

const html = fs.readFileSync(pub('index.html'), 'utf8');
const fuentes = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
let cuerpo = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
cuerpo = relativas(cuerpo)
  .replace('<script type="module" src="/app.js"></script>', '<script type="module" src="demo-local.js"></script>\n  <script type="module" src="app.js"></script>')
  .replace('· Demo', '· Demo sin IA y con pago simulado');

fs.writeFileSync(
  path.join(salida, 'index.html'),
  `<title>Arcana Tarot</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fuentes}
<link rel="stylesheet" href="estilos.css">
${cuerpo.trim()}
`,
);
console.log('Generado en', salida);
