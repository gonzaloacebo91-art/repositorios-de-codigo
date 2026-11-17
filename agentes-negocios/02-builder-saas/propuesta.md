# Recadoc — recogida de documentación trimestral para gestorías
Agente: Agente Builder (micro-SaaS) · Estado: PROPUESTA · Fecha: 2026-11-12

## Resumen en 3 líneas
Micro-SaaS para gestorías y asesorías pequeñas: cada cliente recibe un enlace personal (sin contraseña) para subir
facturas, extractos y tickets desde el móvil, la herramienta le recuerda la fecha límite y el despacho ve quién ha
enviado qué. Cuota fija de 19–69 €/mes por despacho, el MVP ya funciona en local (`recursos/mvp/`, probado), con
una inversión inicial de unos 25 € (máx. ~200 € con revisión legal). Primer ingreso realista: febrero de 2027.

## Problema y cliente objetivo
- **Problema**: cada trimestre (IVA 303, IRPF 130) las gestorías pasan días reclamando papeles a sus clientes por
  email, WhatsApp y teléfono, sin saber de un vistazo quién ha enviado todo y quién no. Los proveedores del sector
  lo describen como el principal cuello de botella del cierre trimestral (fuentes abajo).
- **Cliente objetivo (quien paga)**: gestoría/asesoría de 1–5 personas con 40–300 clientes autónomos y pymes, que
  no quiere cambiar su programa de contabilidad ni pagar una suite completa.
- **Usuario final**: el cliente de la gestoría (autónomo, bar, taller…) que sube documentos desde el móvil.
- **Mercado**: España primero (ciclo trimestral común y fechas fijas). Ampliación natural: contadores de México
  (declaraciones mensuales, día 17) y otros países de Latinoamérica, con el mismo producto.

## Evidencia de demanda (con fuentes enlazadas)
Datos verificados (con fuente):
- Tamaño: en España hay **≈ 54.000 empresas en el CNAE 6920** (contabilidad, auditoría y asesoría fiscal) según
  [einforma](https://www.einforma.com/informes-sectoriales/cnae-6920-empresas-actividades-de-contabilidad-teneduria-de-libros-auditoria-y-asesoria-fiscal),
  y 65.444 empresas en la rama NACE 69.2 con 13.813 M€ de facturación en 2024 según datos de Eurostat recogidos por
  [Tailride](https://tailride.so/es/blog/estadisticas-sector-contable-espana).
- El dolor existe y lo explotan los proveedores: artículos como «Clientes que no envían facturas a tiempo: protocolo
  para gestorías» y «Cerrar el trimestre de 50 clientes en una semana» ([Copilot Gestoría](https://copilotgestoria.com/blog/clientes-no-envian-facturas-a-tiempo-protocolo-gestoria-2026),
  [2](https://copilotgestoria.com/blog/cerrar-trimestre-50-clientes-una-semana-cuellos-botella-automatizar)), comparativas
  de software de gestión documental para asesorías ([Hackceleration](https://hackceleration.com/es/labs/mejor/gestion-documental-asesorias),
  [Quipu](https://getquipu.com/blog/mejores-softwares-para-asesorias/)) y, en México, guías sobre portales para que el
  cliente entregue a tiempo ([SAT Fácil](https://www.satfacil.com.mx/blog/portal-clientes-despacho-contable),
  [Taxo](https://go.taxo.co/p/mejorar-comunicacion-contadores-cliente-mexico)).
- Hay disposición a pagar por este tipo de herramientas: TaxDome cobra **800 €/año por usuario** en España
  ([precios oficiales](https://taxdome.com/es-es/pricing)); Content Snare, centrado solo en pedir documentos a clientes,
  parte de **29 $/mes** ([Capterra](https://www.capterra.com/p/167019/Content-Snare/pricing/)).
- Presión de digitalización en el sector: Veri*factu obligatorio para sociedades el 1/1/2027 y para autónomos el
  1/7/2027 (RDL 15/2025) ([Infoautónomos](https://www.infoautonomos.com/blog/verifactu-cuando-es-obligatorio-a-quien-afecta/),
  [Maldita](https://maldita.es/malditobulo/20251203/hacienda-retrasa-a-2027-la-entrada-en-vigor-de-verifactu-el-sistema-de-verificacion-de-facturas-para-pymes-y-autonomos)).

Lo que NO está verificado (hipótesis a validar en las semanas 2–4): cuántas horas pierde de verdad un despacho
pequeño reclamando papeles, y si pagará 19–39 €/mes por una herramienta suelta cuando algunas suites ya incluyen portal.
Casi todas las fuentes sobre el dolor son de proveedores (sesgo comercial).

## Competencia y cómo nos diferenciamos
| Competidor | Qué es | Precio | Hueco que dejamos cubierto |
|---|---|---|---|
| [TaxDome](https://taxdome.com/es-es/pricing) | Suite completa para despachos (CRM, portal, facturación) | 800 €/año por usuario | Demasiado grande y cara para un despacho de 1–3 personas |
| [Content Snare](https://www.capterra.com/p/167019/Content-Snare/pricing/) | Petición de documentos a clientes | desde 29 $/mes | En inglés, no pensado para el ciclo trimestral español ni WhatsApp |
| Copilot Gestoría, Bilky, Sage, a3doc, Quipu ([comparativa](https://hackceleration.com/es/labs/mejor/gestion-documental-asesorias)) | Programas de gestión/contabilidad con portal de cliente | Variable / bajo presupuesto | Obligan a migrar o a que el cliente tenga usuario y contraseña |
| Email + WhatsApp + carpeta compartida | Lo que hace la mayoría hoy | 0 € | Sin estados, sin recordatorios automáticos, caos en la semana de cierre |

**Diferenciación**: (1) hace una sola cosa y se usa en 10 minutos sin migrar nada; (2) el cliente final no crea
cuenta: enlace personal + subida desde el móvil + «No tengo de este tipo»; (3) recordatorios automáticos atados a la
fecha límite y solo a quien le falta algo; (4) botón de WhatsApp con el mensaje ya escrito; (5) precio fijo por
despacho, no por usuario; (6) datos en la UE y contrato de encargado del tratamiento desde el día 1.
**Riesgo honesto**: las suites pueden incluir esta función gratis. Nuestro cliente es el despacho que no quiere cambiar de suite.

## Modelo de ingresos y precios
Suscripción mensual por despacho (sin IVA), sin permanencia; anual = 2 meses gratis.
| Plan | Precio | Límite |
|---|---|---|
| Básico | 19 €/mes | hasta 40 clientes |
| Despacho | 39 €/mes | hasta 150 clientes, 3 usuarios |
| Pro | 69 €/mes | hasta 400 clientes, marca del despacho |

Oferta de lanzamiento «despacho fundador» (máx. 15): cierre del 4T 2026 gratis y −40 % el primer año a cambio de
feedback mensual. Cobro con Stripe Payment Links (tarjetas UE estándar 1,5 % + 0,25 €; tarjetas de empresa ≈ 2,8 %, según
[Getquipu](https://getquipu.com/blog/comisiones-stripe/) y [Sellfy](https://sellfy.com/es/herramientas/calculadora-de-comisiones-de-stripe/); verificar en Stripe).
Ingreso medio estimado por despacho: ≈ 18 €/mes en el año 1 (mezcla de fundadores con descuento) y ≈ 30 €/mes después.

## Números: inversión inicial, costes mensuales, escenarios (pesimista / realista / optimista) a 3, 6 y 12 meses
**Inversión inicial** (verificado donde hay fuente; el resto, estimación):
| Concepto | Coste |
|---|---|
| Dominio .es/.com | ≈ 12–15 €/año (estimación) |
| Primer mes de VPS UE (Hetzner CX23 o similar) | ≈ 6 € + IVA ([Better Stack](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/), [VPSBenchmarks](https://www.vpsbenchmarks.com/hosters/hetzner/plans/cx23)) |
| Desarrollo del MVP | 0 € (ya hecho en `recursos/mvp/`) |
| Revisión legal de contratos (opcional) | 100–200 € (estimación) |
| **Total** | **≈ 25 € (sin revisión legal) · máx. ≈ 225 €** |

**Costes mensuales**: VPS + backups ≈ 7,2 €; dominio ≈ 1,2 €; email transaccional 0 € con el plan gratis de Resend
(3.000/mes, 100/día, [Resend](https://resend.com/pricing.md)) y ≈ 19 € (20 $) cuando haya > 5 despachos activos;
Stripe ≈ 2–3 % de lo cobrado. **Total: ≈ 10 €/mes al principio, ≈ 30 €/mes a partir del mes 5–6.**
⚠️ No incluido: cuota de autónomo si el dueño aún no lo es (tarifa plana ≈ 80–88 €/mes el primer año según
[Taxdown](https://taxdown.es/informacion-autonomos/calculadora-cuota-autonomos) y [OIE](https://www.oie.es/cuotas-de-autonomos/); confirmar).

**Escenarios** (estimaciones; mes 0 = diciembre 2026; MRR = ingreso mensual recurrente sin IVA):
| Escenario | Mes 3 (feb 2027) | Mes 6 (may 2027) | Mes 12 (nov 2027) | Facturado acumulado 12 m |
|---|---|---|---|---|
| Pesimista | 1 despacho · 15 € | 4 · 70 € | 8 · 180 € | ≈ 1.000 € |
| **Realista** | **4 · 70 €** | **12 · 250 €** | **30 · 750 €** | **≈ 3.700 €** |
| Optimista | 8 · 150 € | 25 · 550 € | 60 · 1.700 € | ≈ 8.800 € |

Supuestos del realista: 40 despachos contactados al mes en los meses 1–2 y 25/mes después; 25 % acepta demo;
50 % de las demos hace piloto; 50 % de los pilotos paga; abandono 3 %/mes. A 6 meses el realista deja ≈ 600 €
facturados y ≈ 500 € de margen antes de impuestos y sin cuota de autónomo (con tarifa plana, ≈ 0 €). El negocio
se vuelve interesante en el año 2 (≈ 60–100 despachos ≈ 1.800–3.000 €/mes) si la retención es buena.

## Tiempo requerido del dueño (horas/semana)
≈ 10 h/semana: 4 h de ventas (LinkedIn, llamadas, demos), 3 h de soporte/producto, 2 h de contenido, 1 h de
administración. Picos de ≈ 12–14 h en las semanas de cierre (primeros de enero, abril, julio y octubre). El código
lo mantengo yo; el dueño solo despliega con la guía (`recursos/despliegue.md`) o me autoriza a hacerlo.

## Riesgos y cómo mitigarlos
| Riesgo | Mitigación |
|---|---|
| Las gestorías no pagan por una herramienta suelta | Validar antes de invertir: 40 conversaciones y pilotos gratis en el 4T; criterio de abandono claro (abajo) |
| Las suites incluyen portal gratis | Dirigirse a despachos que no quieren migrar; integración por CSV; precio fijo bajo |
| Ciclo trimestral = feedback lento | Empezar justo antes del cierre del 4T (enero); ofrecer también campañas mensuales (México, IVA mensual, nóminas) |
| Datos sensibles (RGPD) y brecha de seguridad | Servidor UE, HTTPS, tokens de 192 bits, copias diarias, contrato art. 28, borrado programado; tests de aislamiento entre despachos ya incluidos |
| Emails en spam o límite de 100/día | Dominio con SPF/DKIM/DMARC; plan de pago de email al pasar de 5 despachos; WhatsApp como canal alternativo |
| Captación ilegal (LSSI) | Nada de email en frío; LinkedIn uno a uno, visitas, contenido y referidos |
| Caída del servidor en semana de cierre | Monitorización gratuita (UptimeRobot), reinicio automático systemd, restauración de copia probada antes de enero |
| Nombre parecido a otra marca | No se halló «Recadoc» en búsquedas; existe «Trimestral App» (por eso se descartó «Trimestra»). Consultar OEPM antes de A1 |

## Plan de lanzamiento (semana a semana, primeras 4–6 semanas)
- **Semana 1 (16–22 nov)**: autorizaciones A1–A5; despliegue con HTTPS y copias; aviso legal, privacidad y contrato
  de encargado publicados; prueba completa desde el móvil del dueño. Lista de 40 despachos (manual).
- **Semana 2 (23–29 nov)**: A7 — 10 solicitudes de LinkedIn al día + 5 llamadas/visitas; vídeo demo de 2 min.
  Objetivo: 5 demos agendadas.
- **Semana 3 (30 nov–6 dic)**: demos con el guion de `recursos/ventas.md`; objetivo 5 pilotos. Ajustes rápidos
  según lo que pidan (p. ej. logo, ZIP de descarga, recuperar contraseña).
- **Semana 4 (7–13 dic)**: objetivo 8–10 pilotos; A6 (Stripe + Payment Links); A8 — primeras publicaciones en LinkedIn.
- **Semanas 5–6 (14 dic–3 ene)**: cada piloto crea su campaña «4T 2026»; soporte diario de 30 min; medir uso
  (% de clientes que suben por enlace).
- **Semanas 7–10 (enero)**: cierre del 4T con soporte intensivo; a finales de enero, email de conversión con los
  datos de uso de cada piloto → **primeros cobros en febrero 2027**.

## Qué puedo hacer yo solo (ya preparado en recursos/)
- `recursos/mvp/` — **aplicación completa y funcionando en local** (Node.js ≥ 22.13, sin dependencias):
  registro/login, alta e importación de clientes, campañas con lista de documentos, página de subida del cliente
  sin contraseña (móvil), «No tengo de este tipo», «He terminado», panel de estados, descarga de archivos, exportación
  CSV, botón de WhatsApp, recordatorios automáticos (7/3/1/0/−2 días) en modo «bandeja» (no envía nada hasta A4),
  seguridad básica (CSRF, CSP, límite de logins, aislamiento entre despachos). `npm test` pasa una prueba de extremo a
  extremo; `npm run demo` crea una cuenta de demostración para las llamadas de venta.
- `recursos/landing/index.html` — landing de una página con propuesta de valor, cómo funciona, precios y FAQ.
- `recursos/despliegue.md` — guía paso a paso (VPS UE + Caddy HTTPS + systemd + copias de seguridad + email).
- `recursos/ventas.md` — mensajes de LinkedIn, guion de descubrimiento y demo, emails de onboarding y conversión, ideas de contenido.
- `recursos/legal-rgpd.md` — obligaciones fiscales y RGPD, borrador de contrato de encargado y de condiciones.

## Acciones que necesitan tu autorización
- [ ] A1 — Registrar el dominio (p. ej. recadoc.es o .com) tras comprobar disponibilidad y la marca en la OEPM · coste: ≈ 12–15 €/año · necesario para web, emails y confianza.
- [ ] A2 — Crear cuenta en un proveedor de VPS en la UE (Hetzner o similar) y contratar el servidor con copias · coste: ≈ 7,2 €/mes · alojar la app y los documentos en la UE.
- [ ] A3 — Desplegar la app y la landing en un sitio público (HTTPS) · coste: 0 € · sin esto no hay pilotos.
- [ ] A4 — Crear cuenta de email transaccional (Resend), verificar el dominio y activar el envío real de emails desde la app (`MAIL_MODE=resend`) · coste: 0 € hasta 100/día; ≈ 19 €/mes después · los recordatorios automáticos son el núcleo del producto.
- [ ] A5 — Crear el buzón de contacto hola@dominio (reenvío gratuito del registrador o similar) · coste: 0 € · para que las gestorías puedan escribir.
- [ ] A6 — Crear cuenta de Stripe con los datos fiscales y bancarios del dueño y crear los Payment Links de los 3 planes · coste: 0 € fijo; 1,5 % + 0,25 € (≈ 2,8 % tarjetas de empresa) por cobro · para cobrar desde febrero.
- [ ] A7 — Contactar con gestorías en nombre del dueño: solicitudes y mensajes de LinkedIn uno a uno (máx. 10/día, sin automatizar), llamadas/visitas y emails solo a quien lo pida · coste: 0 € · captación de pilotos.
- [ ] A8 — Publicar 1–2 posts/semana en el LinkedIn del dueño (borradores en `recursos/ventas.md`) · coste: 0 € · confianza y captación orgánica.
- [ ] A9 — (Opcional) Encargar la revisión legal del contrato de encargado y las condiciones · coste: 100–200 € · reducir riesgo RGPD.
- [ ] A10 — Decisión del dueño (no la ejecuto yo): alta en Hacienda/RETA o añadir epígrafe si ya es autónomo, antes del primer cobro · coste: tarifa plana ≈ 80–88 €/mes · obligación legal para facturar de forma habitual.

## Métrica de éxito y criterio para abandonar
- **Éxito a 31/03/2027**: ≥ 5 despachos pagando y, en los pilotos, ≥ 60 % de sus clientes enviando por el enlace.
- **Señal de escalar**: ≥ 15 despachos pagando a 31/05/2027 con abandono < 5 %/mes → invertir en contenido SEO y en la versión para contadores de México.
- **Abandonar o pivotar** si: tras 40 conversaciones con gestorías hay < 3 pilotos; o a 31/05/2027 (tras dos cierres
  trimestrales) hay < 5 despachos pagando. Pivotes posibles: vender el código/licencia a una gestoría grande, o
  reorientarlo a contadores de Latinoamérica (ciclo mensual = validación más rápida).

---

### Ideas descartadas
Puntuación 1–5 (5 = mejor) en demanda, inversión, tiempo hasta el primer euro, competencia y encaje con poco capital.
| Idea | Dem. | Inv. | Tiempo | Comp. | Encaje | Total | Motivo del descarte |
|---|---|---|---|---|---|---|---|
| **Recadoc (elegida)** | 4 | 5 | 3 | 3 | 4 | **19** | — |
| Fichaje/registro horario para microempresas | 4 | 5 | 3 | 1 | 3 | 16 | El decreto de registro digital aún no está en el BOE ([Holded](https://www.holded.com/es/blog/registro-horario-digital)) y Woffu Lite ya cobra desde 1,50 €/usuario ([Turnozo](https://turnozo.com/es/blog/alternativas-a-woffu.md)); mucho soporte y riesgo legal |
| Carta digital QR con alérgenos para bares | 3 | 5 | 4 | 1 | 3 | 16 | Mercado saturado con opciones gratis ([Qamarero](https://qamarero.com/blog/mejores-cartas-digitales-qr-restaurantes/), [QR Carta](https://qrcarta.com/llms.txt)) |
| Check-in online y envío a SES.Hospedajes para pequeños anfitriones | 4 | 4 | 3 | 2 | 2 | 15 | Competencia fuerte (Chekin y PMS) y datos de documentos de identidad con la AEPD vigilando ([Chekin](https://chekin.com/blog/registro-de-viajeros-ses-hospedajes-2025/)) |
