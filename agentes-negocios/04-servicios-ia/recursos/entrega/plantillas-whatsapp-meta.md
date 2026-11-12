# Plantillas de mensajes para aprobar en Meta (Plan Completo)

Los mensajes que la clínica envía fuera de la ventana de 24 h deben ser plantillas aprobadas por Meta.
Categoría y coste aproximado en España (fuentes en `../../propuesta.md`; comprobar tarifa oficial de Meta):
utilidad ~0,017–0,028 €/mensaje, marketing ~0,049–0,059 €/mensaje.

## 1. recordatorio_cita (categoría: UTILIDAD)
> Hola {{1}}, te recordamos tu cita en {{2}} el {{3}} a las {{4}}. ¿Nos confirmas que vienes?
Botones: [Confirmo] [Necesito cambiarla]

## 2. solicitud_recibida (UTILIDAD)
> Hola {{1}}, hemos recibido tu solicitud de cita para {{2}}. Te escribimos en cuanto recepción la confirme
> (horario de atención: {{3}}).

## 3. resena_post_visita (MARKETING, enviar solo a quien ha consentido comunicaciones)
> Gracias por venir a {{1}}, {{2}}. Si te apetece, nos ayudaría mucho tu opinión en Google: {{3}}
> Para no recibir más mensajes como este, responde BAJA.
Reglas: enviar a TODOS los pacientes atendidos (no filtrar solo a los contentos), sin regalos ni descuentos
a cambio de la reseña (políticas de Google y normativa de consumo).

## 4. reactivacion_trimestral (MARKETING, solo con consentimiento)
> Hola {{1}}, hace tiempo que no te vemos por {{2}}. Este mes tenemos {{3}}. Si quieres cita, responde a este
> mensaje. Para darte de baja, responde BAJA.
