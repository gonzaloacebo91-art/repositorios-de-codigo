# Obligaciones legales y RGPD de Recadoc (resumen y borradores — revisar con un profesional)

> No es asesoramiento legal. Es una lista de comprobación para que el dueño sepa qué hay que tener antes de
> cobrar, y unos borradores de partida. Recomendado: revisión por un abogado/gestor (100–200 €, opcional).

## Fiscal y laboral
- **Alta en Hacienda (modelo 036/037) y en el RETA** antes de facturar de forma habitual. Tarifa plana de
  autónomo ≈ 80 €/mes (≈ 88 € con MEI) los 12 primeros meses, según fuentes de 2026; confirmar en la Seguridad Social.
  Si el dueño ya es autónomo, solo añadir el epígrafe IAE (p. ej. 769.9 / servicios informáticos; confirmarlo con su gestor).
- **IVA 21 %** en ventas a despachos españoles. Ventas B2B a otros países UE: inversión del sujeto pasivo (con NIF-IVA, ROI).
- **Facturación**: Stripe emite recibos, pero hay que emitir factura completa. A partir del 1/7/2027 los autónomos
  deben usar software que cumpla Veri*factu (RDL 15/2025): facturar con un programa homologado, no a mano.
- Declaraciones trimestrales 303 y 130 (o las que indique la gestoría del dueño).

## RGPD — Recadoc es ENCARGADO del tratamiento
Los documentos que suben los clientes de la gestoría contienen datos personales (nombres, NIF, IBAN, importes).
La gestoría es responsable; Recadoc es encargado (art. 28 RGPD). Necesario antes del primer cliente real:
- [ ] **Contrato de encargado del tratamiento** (borrador abajo) aceptado por cada despacho al registrarse.
- [ ] **Registro de actividades de tratamiento** como encargado (art. 30.2).
- [ ] Servidores y subencargados **en la UE** (VPS en Alemania/Finlandia; Resend: revisar ubicación y DPA; si no
      garantiza UE, usar un proveedor de email con DPA y cláusulas tipo).
- [ ] Medidas de seguridad: HTTPS, tokens aleatorios, copias cifradas, acceso al servidor solo con clave SSH,
      política de borrado (p. ej. borrar archivos 6 meses después de archivar la campaña, configurable).
- [ ] Procedimiento de brechas: notificar al despacho sin dilación indebida (< 48 h) para que él notifique a la AEPD en 72 h.
- [ ] Política de privacidad (datos de los despachos como clientes de Recadoc, donde Recadoc es responsable).
- [ ] Aviso legal (LSSI art. 10: titular, NIF, contacto) y condiciones de uso.
- [ ] Sin cookies de terceros en la app → no hace falta banner. Si la landing usa analítica, usar una sin cookies.

## Comunicaciones comerciales
- LSSI art. 21: no enviar emails comerciales sin consentimiento previo, también a empresas. Captación por
  LinkedIn (uno a uno), visitas, llamadas y contenido. Los emails de recordatorio de la app son transaccionales
  (los envía el despacho a sus propios clientes).
- Llamadas comerciales: la Ley General de Telecomunicaciones 11/2022 restringe las llamadas no consentidas;
  limitarse a teléfonos publicados de empresas y respetar cualquier negativa. Confirmar con el asesor.

---

## Borrador: Contrato de encargado del tratamiento (resumen de cláusulas)
1. **Objeto**: Recadoc trata, por cuenta del Despacho, los datos contenidos en los documentos que suben los
   clientes del Despacho, con la única finalidad de almacenarlos, organizarlos y ponerlos a su disposición.
2. **Duración**: la de la suscripción. Al terminar, Recadoc permite descargar los datos durante 30 días y después los suprime.
3. **Instrucciones**: Recadoc solo trata los datos según instrucciones documentadas del Despacho.
4. **Confidencialidad** de las personas autorizadas.
5. **Seguridad**: cifrado en tránsito (TLS), enlaces con token aleatorio, copias de seguridad diarias en la UE,
   control de accesos, registro de actividad.
6. **Subencargados**: proveedor de servidores (UE) y proveedor de email transaccional; se informará de cambios con 30 días.
7. **Asistencia** al Despacho para atender derechos de los interesados y evaluaciones de impacto.
8. **Violaciones de seguridad**: notificación sin dilación indebida y en un máximo de 48 h.
9. **Transferencias internacionales**: no se realizan fuera del EEE sin garantías adecuadas.
10. **Auditoría**: Recadoc pondrá a disposición la información necesaria para demostrar el cumplimiento.

## Borrador: puntos clave de las condiciones de uso
- Servicio de recogida de documentos; no es software de contabilidad ni de facturación ni asesoramiento.
- Suscripción mensual o anual, sin permanencia; precios sin IVA; cancelación desde el panel o por email.
- Disponibilidad objetivo 99 % (sin compensación económica en la fase inicial); copias diarias.
- El Despacho es responsable de tener base legal para pedir y tratar la documentación de sus clientes.
- Límite de responsabilidad: importe pagado en los últimos 12 meses.
- Ley española; tribunales del domicilio del titular (salvo norma imperativa).
