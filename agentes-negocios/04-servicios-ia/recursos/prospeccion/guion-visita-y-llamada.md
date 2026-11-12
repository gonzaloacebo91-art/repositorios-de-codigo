# Guion de prospección: visita presencial y llamada

> BORRADOR. No se ha contactado a nadie. Usar solo tras la autorización A6.
> Canal prioritario: visita presencial a clínicas de tu zona (más eficaz para un servicio local y sin
> problemas de LSSI). Segundo canal: llamada al teléfono público de la clínica.

## Preparación (15 min por clínica, sin escribirles)
1. Mirar su ficha de Google: horario, nº de reseñas, si alguna reseña menciona "no cogen el teléfono" o
   "no contestan".
2. Mirar si su web/Instagram tiene botón de WhatsApp.
3. **Prueba honesta**: escribir a su WhatsApp público una pregunta real de paciente un día laborable a las
   20:30 (p. ej. "¿cuánto cuesta la primera visita?") y anotar cuánto tardan en contestar. No inventar
   identidades ni pedir citas falsas: solo una pregunta informativa, y si responden, agradecer.
   (Opcional; si no te sientes cómodo, sáltalo.)
4. Apuntarlo en `plantilla-seguimiento.csv`.

## Visita (2–3 minutos, a media mañana, nunca con sala de espera llena)
> "Hola, soy [nombre], vivo/trabajo aquí al lado. Ayudo a clínicas pequeñas a contestar el WhatsApp al
> momento, también por la noche y en fin de semana, con un asistente que responde precios, horarios y toma
> nota de las citas para que recepción solo tenga que confirmarlas. ¿Quién lleva aquí el tema del WhatsApp?"

Si hay interés:
> "¿Os pasa que entran mensajes cuando estáis con pacientes o fuera de horario y se quedan sin contestar
> hasta el día siguiente?" → escuchar. → "Tengo una demo de 5 minutos en el móvil, ¿os la enseño ahora o
> preferís que pase otro día?"

Enseñar la demo: `python3 ../demo/asistente.py --consola --simulado` en el portátil, o vídeo grabado de la
demo (preparar antes).

Cierre:
> "Estamos lanzando con 3 clínicas de la zona a mitad de precio de alta (195 € en lugar de 390 €) y
> garantía de 30 días: si no contesta bien, os devolvemos el dinero. ¿Os dejo la información y os llamo
> el jueves para ver si os encaja?"

Dejar: hoja de una página (`../oferta-y-precios.md` en PDF) con tu teléfono. Pedir permiso: "¿Te lo
mando también por email? ¿A qué dirección?" → solo entonces usar el email 1 de `mensajes-borrador.md`.

## Llamada (para clínicas fuera de tu zona)
> "Hola, buenos días, ¿hablo con [clínica]? Soy [nombre], te robo 30 segundos: ayudo a clínicas a contestar
> el WhatsApp fuera de horario con un asistente que toma nota de las citas. ¿Es buen momento o te llamo a
> otra hora? ... ¿Con quién debería hablar de esto?"

## Objeciones frecuentes
| Objeción | Respuesta |
|---|---|
| "Ya contestamos nosotros" | "Genial. ¿Y de 20:00 a 9:00 y el fin de semana? Ese es el hueco que cubre." |
| "Los pacientes quieren hablar con una persona" | "Por eso cualquier paciente escribe PERSONA y pasa a recepción. El asistente quita las preguntas repetidas." |
| "Me da miedo que diga algo mal" | "Solo responde con lo que vosotros aprobáis, no da consejo clínico, y probamos 40 preguntas antes de activar. Y hay garantía de 30 días." |
| "Es caro" | "89 €/mes son ~3 €/día. Si recupera una primera visita al mes, ya se paga." (No prometer cifras de pacientes.) |
| "¿Y la protección de datos?" | "Firmamos contrato de encargado, no guardamos conversaciones ni datos de salud, servidor en la UE." |
| "Ya tenemos programa de agenda con recordatorios" | "Perfecto, entonces el Plan Esencial: solo atención de WhatsApp. No duplicamos lo que ya tenéis." |

## Objetivo semanal (con 4 h de prospección)
- 15 clínicas investigadas · 8 visitas o llamadas · 2 demos · 1 propuesta enviada.
