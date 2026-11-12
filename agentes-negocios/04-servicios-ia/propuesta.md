# Atiende24 — Recepción por WhatsApp con IA para clínicas pequeñas
Agente: Agente Servicios (agente-servicios-ia) · Estado: PROPUESTA · Fecha: 2026-11-12

## Resumen en 3 líneas
Servicio productizado a precio cerrado: configuramos y mantenemos un asistente de IA en el WhatsApp de
clínicas pequeñas (fisio, dental, podología, psicología, estética) que contesta al momento precios,
horarios y dudas, y deja las solicitudes de cita listas para que recepción confirme. Alta 390 € + 89 €/mes
(plan Completo 690 € + 149 €/mes). Inversión inicial < 100 €, primer ingreso realista en 3–6 semanas.

## Problema y cliente objetivo
- **Cliente:** clínica privada de 1–6 profesionales en España, sin recepcionista a jornada completa o con
  recepción saturada, que ya recibe consultas por WhatsApp (botón en Google/Instagram/web).
- **Decisor:** el titular de la clínica (suele ser el propio profesional sanitario) o la gerente.
- **Problema:** los mensajes llegan mientras atienden pacientes, a mediodía, de noche o en fin de semana;
  se contestan horas después y las mismas preguntas (precio, horario, mutuas, aparcamiento) consumen tiempo
  de recepción. Un paciente nuevo puede escribir a varias clínicas a la vez.
- **Por qué clínicas y no "cualquier negocio":** ticket por cliente alto en relación con el coste del servicio
  (una primera visita ronda 40–60 €), consultas muy repetitivas, horario limitado y muchas unidades en cada
  ciudad (más de 23.000 clínicas dentales y 62.000–70.000 fisioterapeutas colegiados en España, ver fuentes).
- **Mercado:** España primero (precios en euros, visitas presenciales, conocimiento del marco legal).
  Latinoamérica (México, Colombia) como segunda fase con precios adaptados una vez haya casos de éxito.

## Evidencia de demanda (con fuentes enlazadas)
Datos verificados en fuente oficial o independiente:
- INE: el 21,1 % de las empresas de 10 o más empleados usaba IA en el 1T de 2025, frente al 13,4 % de las de
  menos de 10 empleados ([INE, nota 22/10/2025](https://www.ine.es/dyngs/Prensa/ETICCE20241T2025.htm)). La
  cifra sube al 33,6 % en las de 10+ en la edición 2025–1T2026 ([INE](https://ine.es/dyngs/Prensa/ETICCE20251T2026.pdf)).
  Lectura: la adopción crece rápido pero las microempresas van muy por detrás; necesitan que se lo den hecho.
- El 35 % de autónomos y emprendedores ya usa herramientas de IA ([Holded, Informe Emprende 2025](https://www.holded.com/es/blog/ia-autonomos)).
- Tamaño del nicho: más de 23.000 clínicas dentales registradas y ~40.000 dentistas colegiados, 97 % en el
  sector privado ([Universidad de Granada](https://odontologia.ugr.es/sites/centros/odontologia/public/ficheros/analisis-dentistas-espa%C3%B1a.pdf));
  62.000–70.000 fisioterapeutas colegiados según fuentes del sector ([L'Express Franchise](https://lexpress-franchise.com/es/articulos/montar-clinica-fisioterapia/)).
- Un estudio de 2013 con 21,5 millones de citas dentales halló ~23 % menos ausencias con recordatorios
  automáticos (citado por [Whapi](https://whapi.cloud/blog/es/how-clinics-cut-no-shows-with-whatsapp-appointment-reminders); no evaluó WhatsApp).
- Hay demanda de profesionales que monten estos sistemas: agencias españolas publican proyectos para
  "n8n + WhatsApp API + IA" en Workana ([oferta 1](https://www.workana.com/es/job/busco-experto-en-n8n-whatsapp-api-openai-para-montar-agentes-ia-automatizados),
  [oferta 2](https://www.workana.com/job/tecnico-freelance-para-implementacion-de-automatizaciones-y-agentes-ia)).

Datos de proveedores (orientativos, no independientes):
- Casi un 10 % de pacientes falta a sus citas cada mes ([Medesk](https://www.medesk.net/es/blog/recordatorios-automaticos-de-citas/)).
- Caso de una clínica (México): 40 % de llamadas para citas sin responder, 8 % tras un agente de IA en
  WhatsApp ([EZContact](https://ezcontact.ai/es/blog/caso-exito-clinica-automatizo-citas-agente-ia/)).
- La proliferación de proveedores que publican guías de precios para clínicas españolas en 2026
  ([CloudTalk](https://www.cloudtalk.io/es/blog/guia-servicio-atencion-telefonica-ia-sector-sanitario/),
  [Ainora](https://ainora.lt/es/recepcionista-ia-clinicas-dentales), [Javadex](https://www.javadex.es/blog/asistente-voz-ia-clinicas-dentales-centros-medicos-2026))
  es en sí una señal de demanda (y de competencia).
- El Kit Digital ya no admite solicitudes ([Tecnocim Innova](https://tecnociminnova.com/es/buscador-ayudas/estatales/est-kit-digital)):
  menos competencia "gratis" subvencionada, pero también menos dinero público para el cliente.

Lo que NO he podido verificar (y hay que medir en el piloto): el % de mensajes de WhatsApp que las clínicas
españolas dejan sin contestar fuera de horario. Nota: el acceso directo a varias webs (WebFetch) estaba
bloqueado en este entorno; los datos proceden de los resúmenes de búsqueda y de las páginas enlazadas.

## Competencia y cómo nos diferenciamos
| Alternativa | Precio publicado | Fuente |
|---|---|---|
| Agente IA a medida (agencia/consultora) | 5.000–12.000 € implantación + 50–300 €/mes | [Javadex](https://www.javadex.es/blog/agentes-ia-atencion-cliente-pymes-espana-precios-2026), [Upliora](https://www.upliora.es/blog/precio-chatbot-ia-web-whatsapp-empresa-2026) |
| Flujo puntual con freelance n8n/Make | 300–1.500 € | [Javadex](https://www.javadex.es/blog/implementar-n8n-empresa-espana-cuando-basta-y-cuando-no-2026) |
| SaaS autoservicio (Tidio Lyro, Aurora Inbox) | desde 39 $/mes y 99 $/mes; 130–830 $/mes una pyme típica | [Hackceleration](https://hackceleration.com/es/labs/mejor/chatbot-whatsapp), [Aurora Inbox](https://www.aurorainbox.com/2026/01/25/mejores-chatbots-ia-whatsapp/) |
| Recepcionista de voz IA para clínicas | 120–350 €/mes; Retell desde 0,07 $/min | [Javadex](https://www.javadex.es/blog/asistente-voz-ia-clinicas-dentales-centros-medicos-2026), [Retell](https://www.retellai.com/es/recepcionista-automatica) |
| Software de agenda con recordatorios (Doctoralia, Clinic Cloud…) | variable | ya instalado en muchas clínicas |

Diferenciación:
1. **Precio intermedio y cerrado**: 10–20 veces más barato que un proyecto a medida, y "hecho para ti" frente
   al SaaS que la clínica tendría que configurar y vigilar.
2. **Especialización en clínicas**: límites sanitarios en el prompt (no consejo clínico, 112 en urgencias,
   no guardar datos de salud), contrato RGPD de encargado listo, aviso de IA (AI Act) incluido.
3. **Cercanía**: venta presencial en la zona del dueño, alguien con nombre y teléfono que mantiene el sistema.
4. **Complementa, no sustituye** su software de agenda: si ya tienen recordatorios, se vende solo el Esencial.

## Modelo de ingresos y precios
Precios sin IVA, sin permanencia. Detalle en `recursos/oferta-y-precios.md`.
| Plan | Alta | Cuota | Incluye |
|---|---|---|---|
| Esencial | 390 € | 89 €/mes | Respuestas 24/7, solicitudes de cita, derivación, aviso IA, informe mensual, 2 cambios/mes |
| Completo | 690 € | 149 €/mes | Esencial + recordatorios, petición de reseña, reactivación trimestral (mensajes de marketing a coste) |
| Lanzamiento (3 clínicas) | 195 € | 89 €/mes | Esencial con –50 % de alta, garantía 30 días, a cambio de caso de estudio |

Coste variable estimado por cliente: 10–35 €/mes (IA según modelo elegido + mensajes de Meta por encima del
tramo gratuito + parte del servidor). Margen bruto estimado sobre la cuota: 60–85 %.
Costes de terceros de referencia: mensajes de marketing de Meta en España 0,049–0,059 €, utilidad
0,017–0,028 € ([Meetergo](https://meetergo.com/es/blog/whatsapp-business-precio), [Go4whatsup](https://www.go4whatsup.com/es/precios-whatsapp-business/));
mensajes de servicio: hay fuentes contradictorias sobre si desde octubre de 2026 hay 1.000 gratis por número o
se cobran ([respond.io](https://respond.io/es/blog/whatsapp-pricing-change-2026), [Chakra](https://chakrahq.com/es/article/whatsapp-api-pricing-update-service-messages-october-2026)) → verificar en la tarifa oficial de Meta antes del primer cliente.
IA: `claude-opus-5-5` 4 $/20 $ por millón de tokens (≈0,09 $/conversación, estimación) o `claude-haiku-5-5`
0,10 $/0,50 $ (≈0,002 $/conversación); se decide en el piloto (ver `recursos/demo/README.md`).

## Números: inversión inicial, costes mensuales, escenarios (pesimista / realista / optimista) a 3, 6 y 12 meses
**Inversión inicial (estimada): 50–100 €**
| Concepto | Coste |
|---|---|
| Dominio .es/.com (1 año) | ~10–15 € |
| Crédito API de IA para demos y piloto | 10–20 € |
| Servidor VPS UE (primer mes) | ~5–7 € |
| Impresión de hojas de oferta / tarjetas (opcional) | ~20 € |
| Consulta gestoría (opcional; muchas ofrecen la primera gratis) | 0–50 € |

**Costes fijos mensuales:** ~10 € (VPS + dominio prorrateado) + **cuota de autónomo ~88,64 €/mes** (tarifa
plana 2026) desde la primera factura. Variable: ~25 €/mes por cliente (supuesto conservador).

**Supuestos del modelo** (`recursos/finanzas/escenarios.csv`): las 3 primeras altas a 195 €, el resto a 450 €
de media (mezcla de planes); cuota media 105 €/mes a partir del mes siguiente al alta; bajas puntuales
incluidas. Beneficio antes de IRPF y sin contar la inversión inicial. Estimaciones, no datos.

| Escenario | Mes 3: clientes · ingreso mes · ingreso acumulado | Mes 6: clientes · ingreso mes · acumulado · beneficio acum. | Mes 12: clientes · ingreso mes · acumulado · beneficio acum. |
|---|---|---|---|
| Pesimista | 1 · 195 € · 195 € | 2 · 210 € · 810 € · 245 € | 4 · 420 € · 3.795 € · 2.139 € |
| **Realista** | 2 · 300 € · 495 € | **5 · 870 € · 2.535 € · 1.657 €** | 9 · 1.290 € · 9.330 € · 6.785 € |
| Optimista | 4 · 855 € · 1.245 € | 8 · 1.290 € · 5.385 € · 4.182 € | 18 · 2.685 € · 18.660 € · 14.740 € |

Lectura honesta: en el escenario realista el negocio cubre la cuota de autónomo desde el mes 3 y deja
~650 €/mes de beneficio en el mes 6 y ~950 €/mes en el mes 12, con 10 h/semana. No es un sueldo completo en
el primer año; es un ingreso recurrente creciente con capital mínimo. Con 10 h/semana el techo práctico son
~15 clientes (≈1.600 €/mes de cuotas); por encima habría que dedicar más horas o automatizar las altas.

## Tiempo requerido del dueño (horas/semana)
- Semanas 1–2: 10 h (2 h aprender la demo y el proceso, 6 h prospección, 2 h trámites).
- Desde el primer cliente: 4 h prospección + 4 h entregas/mantenimiento + 2 h administración.
- Por cliente: 6–8 h el alta, ~1 h/mes de mantenimiento.
- Habilidad necesaria: cómoda con ordenador y dispuesta a seguir guías técnicas (Python básico, panel de
  Meta, un servidor). El código y las guías ya están hechos; la curva estimada es de 10–15 h.

## Riesgos y cómo mitigarlos
| Riesgo | Prob. | Mitigación |
|---|---|---|
| Ventas más lentas de lo previsto (clínicas conservadoras) | Alta | Oferta de lanzamiento con garantía; visita presencial; empezar por la red de contactos; medir 8 contactos/semana |
| El asistente inventa o da consejo clínico | Media | Prompt con límites, solo responde con la ficha, batería de 40 pruebas con criterio de bloqueo, revisión mensual |
| Datos de salud (RGPD categoría especial) | Media | No se piden ni guardan, contrato de encargado, servidor UE, revisión profesional del contrato (A7) |
| Cambios de precios/políticas de Meta (IA general prohibida desde 15/01/2026, tarifas por mensaje) | Media | Bot acotado a la clínica (permitido); costes de Meta repercutidos o con tope en contrato |
| Verificación de Meta Business lenta o fallida | Media | La clínica es titular; empezar con número nuevo; prever 1–2 semanas |
| El dueño no tiene base técnica | Media | Guías paso a paso, modo simulado para vender antes de dominar el despliegue; plan B: usar un proveedor de WhatsApp (BSP) con panel visual aunque baje el margen |
| El software de agenda de la clínica añade su propio asistente IA | Media | Posicionarse en atención por WhatsApp y servicio cercano; contratos sin permanencia obligan a dar valor mensual |
| Bajas (churn) | Media | Informe mensual con "solicitudes fuera de horario" como prueba de valor |
| Prospección ilegal por email (LSSI) | Baja si se sigue el plan | Emails solo con permiso; visitas, llamadas y LinkedIn 1 a 1 |

## Plan de lanzamiento (semana a semana, primeras 4–6 semanas)
- **Semana 1** — Autorizaciones A1, A3, A4, A7. Probar la demo en modo simulado y con IA real. Grabar un vídeo
  de 60 s de la demo. Listar 40 clínicas de la zona en `plantilla-seguimiento.csv` (solo datos públicos).
  Contactar 5 conocidos que trabajen en clínicas para pedir opinión (no vender).
- **Semana 2** — A2 (landing) y A6 (prospección). 10 visitas/llamadas, 3 demos. Ajustar el discurso según
  objeciones. Consulta con gestoría.
- **Semana 3** — 10 visitas/llamadas más, seguimiento de demos. Objetivo: 1ª clínica de lanzamiento firmada
  (primer ingreso: alta 195 €). A5: servidor en producción.
- **Semana 4** — Alta del primer cliente (proceso de 7–10 días). Seguir prospectando 4 h. Objetivo: 2ª firma.
- **Semana 5** — Activación del cliente 1. Medir la primera semana real (respuestas, derivaciones, errores).
- **Semana 6** — Primer mini caso de estudio con datos reales; cerrar la 3ª plaza de lanzamiento; a partir de
  aquí, precio completo (390 €). Revisión de métricas y decisión de seguir/ajustar.

## Qué puedo hacer yo solo (ya preparado en recursos/)
- `recursos/oferta-y-precios.md`: oferta, planes, garantía, FAQ, comparativa.
- `recursos/demo/`: asistente en Python **probado en local** (modo consola simulado sin coste, modo IA con
  Claude, modo webhook para WhatsApp Cloud API con validación de firma), prompt con límites sanitarios y
  ficha de una clínica ficticia.
- `recursos/landing/index.html`: landing estática responsive (modo claro/oscuro), formulario sin conectar.
- `recursos/prospeccion/`: guion de visita y llamada con objeciones, 3 emails + 3 mensajes de LinkedIn +
  WhatsApp a conocidos (todo en borrador), CSV de seguimiento.
- `recursos/entrega/`: proceso de alta en 7–10 días, cuestionario, batería de 40 pruebas, plantilla de
  propuesta comercial, informe mensual, plantillas de mensajes para Meta.
- `recursos/legal/`: resumen fiscal (autónomo, IVA, IRPF), RGPD, AI Act art. 50, política de WhatsApp, LSSI;
  borrador de contrato de encargado del tratamiento.
- `recursos/finanzas/escenarios.csv`: 12 meses × 3 escenarios.

## Acciones que necesitan tu autorización
- [ ] A1 — Comprobar la marca "Atiende24" en OEPM y registrar un dominio · coste: ~10–15 €/año · para tener email y web profesionales
- [ ] A2 — Publicar la landing en un hosting estático gratuito (p. ej. Cloudflare Pages / GitHub Pages) con aviso legal y privacidad · coste: 0 € · para que las clínicas puedan verificar quién somos
- [ ] A3 — Crear cuenta en la API de Claude (Anthropic) y recargar crédito · coste: 10–20 € · para la demo con IA real y el piloto
- [ ] A4 — Crear cuenta de Meta for Developers / Meta Business del dueño para la demo en WhatsApp con número de prueba · coste: 0 € · para enseñar la demo en el móvil
- [ ] A5 — Contratar un VPS en la UE y desplegar el webhook (demo primero, luego clientes) · coste: ~5–7 €/mes · necesario para que funcione en WhatsApp
- [ ] A6 — Iniciar la prospección: visitas presenciales, llamadas al teléfono público de clínicas, LinkedIn 1 a 1 y emails solo a quien lo pida (usando los borradores) · coste: 0 € (+~20 € impresión opcional) · implica contactar con personas
- [ ] A7 — Alta como autónomo antes de la primera factura + consulta con gestoría + revisión del contrato RGPD · coste: ~88,64 €/mes de cuota (tarifa plana) + 0–50 € consulta · obligación legal para facturar
- [ ] A8 — Crear/actualizar perfil profesional de LinkedIn y email del negocio con nombre y teléfono del dueño · coste: 0 € · implica compartir datos personales del dueño
- [ ] A9 — Firmar con la primera clínica (condiciones + contrato de encargado) y emitir factura · coste: 0 € · compromiso contractual en nombre del dueño

## Métrica de éxito y criterio para abandonar
- **Éxito a 6 semanas:** ≥ 15 clínicas contactadas, ≥ 5 demos, ≥ 1 cliente de pago activado con 0 errores
  graves en su primer mes.
- **Éxito a 3 meses:** ≥ 2 clientes de pago y ≥ 150 €/mes de cuotas recurrentes; tasa de demo→cliente ≥ 20 %.
- **Éxito a 6 meses:** ≥ 5 clientes, ≥ 500 €/mes recurrentes, bajas ≤ 1 por trimestre.
- **Abandonar o pivotar si:** a las 8 semanas no hay ningún cliente tras ≥ 30 contactos y ≥ 8 demos (pivotar a
  otro nicho, p. ej. academias o talleres, con el mismo motor); o si a los 4 meses hay < 2 clientes; o si
  aparece un error grave del asistente que no se puede corregir con el diseño actual.

---

### Ideas evaluadas y descartadas
Puntuación 1–5 (5 = mejor; en inversión y competencia, 5 = menor). Encaje = con alguien que empieza con < 300 € y 10 h/semana.
| Idea | Demanda | Inversión | Tiempo al 1er € | Competencia | Encaje | Total | Motivo |
|---|---|---|---|---|---|---|---|
| **Recepción WhatsApp IA para clínicas (elegida)** | 4 | 5 | 4 | 3 | 4 | **20** | Dolor claro, ticket recurrente, código ya preparado |
| Gestión de reseñas Google con IA para negocios locales | 3 | 5 | 4 | 2 | 4 | 18 | SaaS desde 19 €/mes ([theStacc](https://thestacc.com/es/mejor/software-de-gestion-de-resenas/)) aplasta el precio; se integra como extra del plan Completo |
| Webs rápidas con IA para negocios locales | 3 | 5 | 4 | 1 | 4 | 17 | Competencia altísima (agentes del Kit Digital, plantillas), ticket bajo y poco recurrente |
| Automatizaciones n8n/Make a medida para pymes | 4 | 5 | 3 | 3 | 2 | 17 | Difícil de productizar, exige experiencia técnica para presupuestar; 300–1.500 € por flujo |
| Recepcionista de voz IA (llamadas) | 4 | 3 | 3 | 3 | 2 | 15 | Coste por minuto, más complejidad técnica y más riesgo de error en voz; posible ampliación futura |
