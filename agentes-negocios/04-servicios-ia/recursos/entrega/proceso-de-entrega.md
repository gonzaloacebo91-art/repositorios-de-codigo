# Proceso de entrega (alta de un cliente en 7–10 días)

Tiempo estimado del dueño por cliente nuevo: **6–8 h** de alta + **1 h/mes** de mantenimiento.

## Día 0 — Cierre
- [ ] Enviar propuesta comercial (`propuesta-comercial-plantilla.md`) y factura del alta (50 % al firmar,
      50 % al activar; o 100 % en la oferta de lanzamiento).
- [ ] Firmar: condiciones del servicio + contrato de encargado del tratamiento (`../legal/contrato-encargado-tratamiento-borrador.md`).
- [ ] Enviar cuestionario de alta (`cuestionario-alta.md`).

## Días 1–3 — Configuración
- [ ] Decidir número: número actual de la clínica (deja de funcionar en la app del móvil) o número nuevo
      solo para el asistente. Recomendado para empezar: número nuevo + enlace en la web/Google Business.
- [ ] La clínica crea (o ya tiene) su cuenta de Meta Business y verifica la empresa; nosotros la guiamos en
      una videollamada de 30 min. **La clínica es titular de su cuenta y de su número**.
- [ ] Crear la ficha `clinica_<nombre>.json` a partir del cuestionario (copiar `../demo/clinica_demo.json`).
- [ ] Ajustar `prompt_sistema.md` si hay particularidades (p. ej. psicología: más cuidado con temas sensibles).

## Días 4–6 — Pruebas
- [ ] Batería de 40 preguntas de prueba (`bateria-pruebas.md`) en modo consola. Objetivo: ≥ 36 correctas,
      0 respuestas inventadas, 0 consejos clínicos.
- [ ] La clínica prueba desde 2–3 móviles durante un día y marca fallos.
- [ ] Corregir ficha y volver a pasar la batería.

## Día 7–10 — Activación
- [ ] Conectar webhook en producción (servidor UE con HTTPS).
- [ ] Añadir el enlace wa.me a la web, Google Business Profile e Instagram de la clínica (lo hace la clínica
      o nosotros con su acceso y permiso).
- [ ] Formación de 20 min a recepción: dónde llegan las solicitudes y derivaciones, cómo pedir cambios.

## Mantenimiento mensual (1 h)
- [ ] Revisar preguntas sin respuesta y derivaciones (solo metadatos y motivos, no conversaciones completas).
- [ ] Actualizar la ficha (vacaciones, precios).
- [ ] Enviar informe mensual (`informe-mensual-plantilla.md`).
- [ ] Revisar facturas de IA y de Meta del cliente; avisar si se acerca al límite de 400 conversaciones.

## Indicadores por cliente
- Tiempo medio de primera respuesta (objetivo < 1 min).
- % de conversaciones resueltas sin humano (objetivo > 60 %).
- Solicitudes de cita fuera de horario (el dato que más vende la renovación).
- Respuestas erróneas detectadas (objetivo 0 graves).
