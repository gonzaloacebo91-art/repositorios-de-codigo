'use strict';
const { esc } = require('./util');

function layout({ titulo, cuerpo, despacho = null, publico = false }) {
  const nav = despacho
    ? `<nav class="top">
        <a class="marca" href="/panel">Trimestra</a>
        <a href="/panel">Campañas</a>
        <a href="/clientes">Clientes</a>
        <a href="/envios">Emails</a>
        <span class="espacio"></span>
        <span class="muted">${esc(despacho.nombre)}</span>
        <form method="post" action="/salir" class="inline"><button class="link">Salir</button></form>
      </nav>`
    : publico
      ? ''
      : `<nav class="top"><a class="marca" href="/">Trimestra</a><span class="espacio"></span>
         <a href="/entrar">Entrar</a><a class="btn peq" href="/registro">Probar gratis</a></nav>`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(titulo)} · Trimestra</title>
<link rel="stylesheet" href="/static/styles.css">
</head>
<body>
${nav}
<main>${cuerpo}</main>
<script src="/static/app.js" defer></script>
</body>
</html>`;
}

function mensaje(texto, tipo = 'info') {
  return texto ? `<p class="aviso ${tipo}">${esc(texto)}</p>` : '';
}

module.exports = { layout, mensaje };
