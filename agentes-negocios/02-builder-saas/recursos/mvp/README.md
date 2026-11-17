# Recadoc — MVP

Recogida de documentación trimestral para gestorías y asesorías: cada cliente recibe un enlace personal
(sin usuario ni contraseña) donde sube sus facturas, extractos y tickets desde el móvil; Recadoc le recuerda
la fecha límite automáticamente y el despacho ve en una sola pantalla quién ha enviado qué.

**Sin dependencias externas**: solo Node.js ≥ 22.13 (usa `node:sqlite` integrado). No hace falta `npm install`.

## Arrancar en local

```bash
cd agentes-negocios/02-builder-saas/recursos/mvp
npm test          # prueba de extremo a extremo (registro → campaña → subida → recordatorios)
npm run demo      # opcional: crea datos de ejemplo (demo@recadoc.local / demo-recadoc)
npm start         # http://localhost:3000
```

Por defecto **no se envía ningún email**: se guardan en la pantalla «Emails» como `simulado`
(`MAIL_MODE=bandeja`). Los botones de WhatsApp solo abren `wa.me` en el navegador de quien pulsa;
la app no envía mensajes por su cuenta.

## Qué hace

| Pantalla | Para quién | Función |
|---|---|---|
| `/registro`, `/entrar` | despacho | Cuenta con email + contraseña (scrypt), sesión por cookie HttpOnly 30 días |
| `/clientes` | despacho | Alta uno a uno o pegando una lista desde Excel (`nombre; email; móvil`) |
| `/campanas/nueva` | despacho | Campaña por periodo (p. ej. «1T 2027») con fecha límite y lista de documentos |
| `/campanas/:id` | despacho | Estado por cliente (sin empezar / en curso / completa), copiar enlace, WhatsApp, recordar por email, exportar CSV |
| `/solicitudes/:id` | despacho | Archivos recibidos por apartado, descarga, comentario del cliente, reabrir |
| `/envios` | despacho | Historial de emails (simulados o enviados) |
| `/s/:token` | cliente final | Subida de archivos/fotos por apartado, «No tengo de este tipo», «He terminado» |

Recordatorios automáticos: 7, 3 y 1 día antes, el mismo día y 2 días después de la fecha límite, solo a
clientes con email que no hayan terminado, como máximo uno de cada tipo (se revisa cada hora).

## Seguridad incluida
- Enlaces de cliente con token aleatorio de 192 bits; aislamiento entre despachos comprobado en los tests.
- Lista blanca de extensiones, límite de tamaño (20 MB por defecto), nombres de archivo saneados, descargas
  siempre como `attachment` y solo con sesión del despacho propietario.
- Protección CSRF por comprobación de origen + cookies `SameSite=Lax`; cabeceras CSP, `X-Frame-Options`, `nosniff`.
- Límite de intentos de login (10 cada 15 min por IP).

## Pendiente antes de cobrar (Fase 2, requiere autorización)
- Desplegar en un servidor en la UE con HTTPS y copias de seguridad diarias de `data/` (ver `../despliegue.md`).
- Activar envío real de emails (`MAIL_MODE=resend`) con dominio verificado.
- Cobro: enlaces de pago de Stripe (Payment Links) por plan; el plan se marca a mano en la tabla `despachos`
  durante el piloto (columna `plan`). Integrar webhooks solo cuando haya > 10 clientes de pago.
- Recuperación de contraseña por email, borrado automático de archivos tras N meses (RGPD), ZIP de descarga.

## Variables de entorno
Ver `.env.ejemplo`. Node no lee `.env` solo: usa `node --env-file=.env server.js` o expórtalas.
