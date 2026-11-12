# Arcana — demo de app de tarot Rider-Waite

App web de tarot con:

- **Tirada gratuita de 3 cartas**, 5 al día por persona (se controla por cookie **y** por IP).
  Tres tiradas a elegir: *Pasado·Presente·Futuro*, *Situación·Obstáculo·Consejo*, *Tú·La otra persona·La relación*.
- **Tirada completa de 9 cartas por 1 €**, pagada con **tarjeta o Bizum**. Tres tiradas a elegir:
  *Panorama 3×3*, *Camino del amor*, *Trabajo y dinero*.
- **El usuario elige sus cartas** de la baraja completa (78 cartas boca abajo, barajadas en el servidor),
  con cartas invertidas (30 % de probabilidad), animación de volteo y ampliación al tocar.
- **Dos agentes de IA (Claude)**:
  - *Agente de consultas* (gratuito): lectura breve (150–230 palabras), esfuerzo bajo.
  - *Agente profundo* (de pago): lectura de 800–1.200 palabras con análisis de arcanos, palos, invertidas,
    relaciones entre cartas, tres consejos y una pregunta de reflexión; esfuerzo alto.
  - Ambos escriben en directo (streaming) y tienen normas: nada de predicciones de salud/muerte/juicios,
    sin meter miedo, y derivación al 024/112 si detectan una crisis.
  - Sin clave de Claude, la demo usa un lector local con significados de las 78 cartas.
- **Tarotista experta por WhatsApp**: enlace `wa.me` con el mensaje ya escrito (incluye las cartas de la última tirada).
- **Imágenes**: escaneos de la baraja Rider-Waite-Smith original de 1909 (Pamela Colman Smith), en `public/cartas/`.

## Arrancar la demo

```bash
cd tarot
npm install
npm start            # http://localhost:3000
npm test             # 7 pruebas de la API (cupo, pagos, firma Redsys…)
```

Sin configurar nada: lecturas locales y pasarela de pago **simulada** (no cobra).

## Configuración (archivo `.env`, ver `.env.ejemplo`)

### Pagos — cambiar de pasarela es cambiar 2 variables

| Variable | Valores | Notas |
|---|---|---|
| `PAGOS_PROVEEDOR_TARJETA` | `simulado` · `redsys` · `stripe` | |
| `PAGOS_PROVEEDOR_BIZUM` | `simulado` · `redsys` | Bizum online solo existe a través del TPV del banco (Redsys). Stripe no lo admite. |
| `PAGOS_METODOS` | `tarjeta,bizum` | Qué botones se muestran y en qué orden. |

**Redsys (recomendado en España: tarjeta + Bizum con un solo contrato).** Pide a tu banco un TPV virtual
con Bizum activado. Te darán *código de comercio*, *terminal* y *clave secreta SHA-256*. Pon
`REDSYS_ENTORNO=pruebas` primero (los valores por defecto son los públicos de pruebas de Redsys) y luego `real`.
La app firma los pagos (HMAC_SHA256_V1) y verifica la notificación del banco en
`POST /api/pagos/redsys/notificacion`; el crédito solo se suma si la firma y el importe son correctos.
La firma está contrastada con `openssl` en las pruebas.

**Stripe (alternativa solo tarjeta).** `PAGOS_PROVEEDOR_TARJETA=stripe` y `STRIPE_CLAVE_SECRETA=sk_...`.
Se usa Stripe Checkout; al volver se consulta la sesión en el servidor antes de dar el crédito.

> Ojo con las comisiones en pagos de 1 €: Stripe cobra ~1,5 % + 0,25 € (≈ 27 % del importe). Con Redsys
> la comisión depende de tu banco (pregúntala, sobre todo la de Bizum). Alternativa: vender packs (3 tiradas por 2,50 €).

### Agentes de IA

`ANTHROPIC_API_KEY=...` activa Claude. Los dos agentes usan `claude-opus-5-5` por defecto
(gratuito con esfuerzo `low`, profundo con esfuerzo `high`) y tienen activado el *fallback* del servidor:
si el modelo declina una petición, la API la reintenta con otro modelo automáticamente.

Coste aproximado por lectura (precios de lista de Opus 5.5: 4 $/20 $ por millón de tokens, estimación):
gratuita ≈ 0,02–0,03 $, completa ≈ 0,10–0,20 $. Con `IA_MODELO_GRATIS=claude-haiku-5-5` la gratuita
bajaría a ≈ 0,001 $ — decisión de negocio pendiente (ver abajo).

### WhatsApp

`WHATSAPP_NUMERO=34XXXXXXXXX`, nombre, horario y precios de la tarotista.

## Estructura

```
server.js              servidor HTTP y API
lib/cartas.js          78 cartas con significados (derecho/invertida)
lib/tiradas.js         las 6 tiradas
lib/agentes.js         los dos agentes de Claude + lector local
lib/pagos/             simulado, Redsys (tarjeta+Bizum), Stripe
lib/almacen.js         datos en data/estado.json (cambiar a SQLite/Postgres en producción)
public/                interfaz (HTML/CSS/JS sin frameworks) e imágenes
test/flujo.test.js     pruebas
```

## Antes de lanzar (pendiente)

- **Derechos de las imágenes**: los dibujos de 1909 son de dominio público en EE. UU. y, por la muerte de
  Pamela Colman Smith en 1951, también en la UE desde 2022; aun así conviene confirmarlo con un abogado
  y no usar ediciones modernas recoloreadas.
- **Legal en España**: aviso de "solo entretenimiento", +18, condiciones de venta, política de privacidad
  (RGPD: las preguntas pueden contener datos sensibles), alta fiscal.
- **Producción**: dominio con HTTPS, base de datos real, cuentas de usuario si se quieren historiales.
