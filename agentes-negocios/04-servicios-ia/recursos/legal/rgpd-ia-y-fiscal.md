# Obligaciones legales y fiscales (resumen para el dueño)

> No es asesoramiento jurídico. Recomendado: 1 consulta con gestoría (alta y fiscalidad) y revisar el
> contrato de encargado con un abogado o consultor RGPD antes del primer cliente (acción A7).

## Fiscal (España)
- **Alta de autónomo (RETA) y censal (modelo 036/037)** antes de emitir la primera factura. Epígrafe IAE
  orientativo: servicios de programación/consultoría informática (confirmar con gestoría).
- **Tarifa plana 2026**: 80 €/mes nominales, ~88,64 €/mes reales por el MEI, 12 meses, prorrogable 12 más si
  los rendimientos no superan el SMI. Algunas comunidades bonifican la cuota al 100 %.
  Fuentes: [Vidacaixa](https://www.vidacaixa.es/articulos/finanzas-y-ahorro/tarifa-plana-autonomos),
  [Billin](https://www.billin.net/blog/requisitos-cumplir-tarifa-plana).
- **IVA 21 %** en las facturas a clínicas españolas (declaración trimestral, modelo 303). Ojo: muchas
  clínicas sanitarias están exentas de IVA en su actividad y no pueden deducirlo, así que para ellas el
  precio real es precio + IVA: comunicar siempre "IVA no incluido".
- **IRPF**: pagos fraccionados trimestrales (modelo 130) salvo que se facture a empresas con retención.
- Facturación con software que cumpla el reglamento de sistemas de facturación (VeriFactu) según el
  calendario vigente: confirmar fecha de obligatoriedad con la gestoría.
- Gastos deducibles: VPS, dominio, API de IA, cuota de autónomo, móvil (parte proporcional).

## RGPD / LOPDGDD
- La clínica es **responsable del tratamiento**; Atiende24 es **encargado** (art. 28 RGPD): contrato
  obligatorio (borrador en `contrato-encargado-tratamiento-borrador.md`).
- Subencargados a declarar a la clínica: proveedor de IA (Anthropic), Meta (WhatsApp Cloud API), proveedor
  del servidor. Revisar las condiciones de transferencias internacionales (EE. UU.) de cada uno.
- **Datos de salud = categoría especial** (art. 9 RGPD). Diseño elegido para minimizar riesgo: el asistente
  no pide ni guarda síntomas ni diagnósticos; solo nombre, teléfono, servicio y franja. No se guardan las
  conversaciones en disco. Aun así un paciente puede escribir datos de salud: se procesan en tránsito para
  responder y no se almacenan por nuestra parte (Meta y el proveedor de IA tienen sus propias retenciones:
  documentarlas en el contrato).
- Psicología y salud mental: evaluar con la clínica si conviene limitar aún más el alcance.
- Recomendado: registro de actividades de tratamiento propio, política de seguridad (accesos, contraseñas,
  servidor en la UE, copias), y procedimiento de brechas (aviso a la clínica en < 24 h).

## Reglamento Europeo de IA (AI Act), art. 50
- Desde el 2 de agosto de 2026 hay que informar a las personas de que interactúan con una IA, salvo que sea
  obvio. Implementado: el primer mensaje de cada conversación lo dice, y el asistente responde con la verdad
  si se le pregunta. Fuentes: [Aunoa](https://aunoa.ai/blog/ley-de-ia-ychatbots-como-cumplir-el-articulo-50-en-2026/),
  [SecurePrivacy](https://secureprivacy.ai/blog/eu-ai-act-article-50-transparency-obligations-for-chatbots-and-deepfakes-2026).

## Política de WhatsApp Business
- Desde el 15/01/2026 Meta no permite en la API **chatbots de IA de propósito general**; sí los de atención al
  cliente de una empresa donde la IA es accesoria. Nuestro asistente está acotado a la clínica y rechaza
  temas ajenos. Fuentes: [respond.io](https://respond.io/es/blog/whatsapp-general-purpose-chatbots-ban),
  [Tecnobits](https://tecnobits.com/whatsapp-prohibe-chatbots-generalistas-business-api).
- Marketing solo a quien ha dado su consentimiento, con opción de baja.

## Prospección comercial (LSSI)
- El art. 21 de la LSSI prohíbe comunicaciones comerciales por email/medios electrónicos no solicitadas, y la
  AEPD lo aplica también cuando el destinatario es una empresa. Fuentes: [AEPD (resolución)](https://www.aepd.es/documento/a-00008-2019.pdf),
  [LegalToday](https://www.legaltoday.com/gestion-del-despacho/estrategia/e-mail-marketing-10-claves-legales-para-evitar-ser-un-spammer-2013-02-15/).
- Por eso el plan prioriza **visita presencial, llamada al teléfono público de la clínica, red de contactos,
  eventos y LinkedIn (mensajes 1 a 1, personalizados)**. Los emails en `../prospeccion/` son para enviar solo
  a quien lo ha pedido en una llamada/visita ("mándamelo por email") o a quien ya es contacto.
- Nada de compra de bases de datos ni scraping de directorios.
