# Demo y motor técnico de Atiende24

Estado: **preparado y probado en local. No desplegado, sin cuentas creadas, sin coste.**

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `asistente.py` | Motor del asistente. Modo consola (demo), modo simulado (sin IA ni coste) y modo webhook (WhatsApp Cloud API). |
| `prompt_sistema.md` | Instrucciones del asistente: límites sanitarios, no inventar, derivar a humano, aviso de IA. |
| `clinica_demo.json` | Ficha de una clínica **ficticia**. Por cada cliente real se crea una copia con su cuestionario (`../entrega/cuestionario-alta.md`). |

## Probarlo ya (sin gastar nada)
```bash
python3 asistente.py --consola --simulado
```
Prueba con: "qué horario tenéis", "cuánto cuesta", "quiero pedir cita", "quiero hablar con una persona".
El modo simulado usa reglas fijas y sirve para enseñar el flujo en una visita comercial sin conexión.

## Demo con IA real (requiere autorización A3: crear cuenta de la API de Claude y recargar saldo)
```bash
pip install anthropic
export ANTHROPIC_API_KEY=...        # nunca la escribas en el repo
python3 asistente.py --consola
```

## Producción (requiere autorizaciones A3, A4 y A5)
1. Cuenta de Meta Business + app de desarrollador + número de WhatsApp de la clínica conectado a la Cloud API
   (lo hace la clínica como titular, con nuestra ayuda; ver `../entrega/proceso-de-entrega.md`).
2. Servidor pequeño en la UE (VPS ~5–7 €/mes) con HTTPS (Caddy o similar) apuntando a `--webhook`.
3. Variables de entorno: ver cabecera de `asistente.py`.
4. En el panel de Meta: URL del webhook + `WA_VERIFY_TOKEN`, suscribir el campo `messages`.

Pruebas hechas en local (12/11/2026): modo consola simulado, verificación GET del webhook (devuelve el
`hub.challenge`), rechazo 401 de POST sin firma válida, y bucle de herramientas de Claude con un cliente
simulado (registra la solicitud, maneja `refusal` derivando a recepción). Falta prueba real con la API de
Claude y con Meta (necesita las cuentas).

## Modelo de IA y coste (decisión del dueño)
Por defecto se usa `claude-opus-5-5` (4 $ / 20 $ por millón de tokens de entrada/salida) con esfuerzo `low`.
Alternativa más barata: `claude-haiku-5-5` (0,10 $ / 0,50 $ por millón), cambiando `MODELO_CLAUDE`.
Precios de la tabla de modelos de Anthropic a 03/11/2026; comprobar antes de facturar.

Estimación propia (no verificada con tráfico real) por conversación de ~6 mensajes: ~18.000 tokens de entrada
y ~1.000 de salida.
| Modelo | Coste aprox. por conversación | 300 conversaciones/mes |
|---|---|---|
| claude-opus-5-5 | ~0,09 $ | ~27 $ |
| claude-haiku-5-5 | ~0,002 $ | ~0,7 $ |

El caché de prompt (ya activado en el código) reduce el coste de entrada repetida. Recomendación: probar
ambos con 30 conversaciones reales del piloto y elegir por calidad de respuesta, no solo por precio.

## Limitaciones conocidas (a resolver antes de escalar)
- El historial vive en memoria: si el servidor se reinicia, se pierde el contexto de las conversaciones abiertas.
- Las solicitudes se guardan en `solicitudes.jsonl`; para la clínica habría que enviarlas por email o a una hoja
  compartida (fase 2).
- Una instancia por clínica (un proceso y un puerto por cliente). Suficiente hasta ~10–15 clientes.
- Solo texto: notas de voz e imágenes se responden con un mensaje de derivación.
