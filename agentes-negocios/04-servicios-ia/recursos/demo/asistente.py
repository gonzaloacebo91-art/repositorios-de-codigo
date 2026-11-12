#!/usr/bin/env python3
"""
Atiende24 - asistente de recepción por WhatsApp para clínicas pequeñas.

Tres modos:
  python3 asistente.py --consola --simulado    -> demo sin API ni coste (respuestas por reglas)
  python3 asistente.py --consola               -> demo en terminal con Claude (requiere ANTHROPIC_API_KEY)
  python3 asistente.py --webhook --puerto 8080 -> servidor webhook para la WhatsApp Cloud API de Meta

Configuración de cada clínica: un JSON como clinica_demo.json (ver --config).

Variables de entorno (modo webhook):
  ANTHROPIC_API_KEY        clave de la API de Claude
  WA_TOKEN                 token de acceso de la WhatsApp Cloud API
  WA_PHONE_NUMBER_ID       id del número de WhatsApp de la clínica
  WA_VERIFY_TOKEN          texto libre que también se pone en el panel de Meta
  WA_APP_SECRET            secreto de la app de Meta (para validar la firma)
  GRAPH_API_VERSION        p. ej. v23.0 (comprobar la versión vigente en la doc de Meta)
  MODELO_CLAUDE            por defecto claude-opus-5-5 (ver README: coste vs. claude-haiku-5-5)

Privacidad: no se guarda el texto de las conversaciones en disco. Solo se guardan las
solicitudes de cita que el paciente pide expresamente (solicitudes.jsonl) para que la
clínica le llame. Ver ../legal/rgpd-y-ia.md.

NADA de este archivo se ha desplegado. Desplegarlo requiere autorización (A4/A5 en la propuesta).
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

DIR = Path(__file__).resolve().parent
MODELO = os.environ.get("MODELO_CLAUDE", "claude-opus-5-5")
MAX_TURNOS_HISTORIAL = 20          # mensajes que se conservan por conversación
CADUCIDAD_CONVERSACION_S = 6 * 3600
AVISO_IA = ("Hola, soy el asistente virtual (inteligencia artificial) de {nombre}. "
            "Puedo darte información y tomar nota de tu cita; si prefieres hablar con una persona, "
            "escribe PERSONA.")

# --------------------------------------------------------------------------- configuración

def cargar_config(ruta: Path) -> dict:
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def construir_prompt_sistema(cfg: dict) -> str:
    plantilla = (DIR / "prompt_sistema.md").read_text(encoding="utf-8")
    ficha = json.dumps(cfg, ensure_ascii=False, indent=2)
    return plantilla.replace("{{NOMBRE_CLINICA}}", cfg["nombre"]).replace("{{FICHA_CLINICA}}", ficha)


# --------------------------------------------------------------------------- herramientas

HERRAMIENTAS = [
    {
        "name": "registrar_solicitud_cita",
        "description": ("Registra una solicitud de cita para que recepción la confirme. Úsala solo cuando el "
                        "paciente haya dado su nombre, el servicio que quiere y una preferencia de día/franja. "
                        "No incluyas síntomas ni datos de salud."),
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string", "description": "Nombre del paciente"},
                "servicio": {"type": "string", "description": "Servicio solicitado, de la lista de la clínica"},
                "preferencia": {"type": "string", "description": "Día y franja preferidos, en texto libre"},
                "primera_visita": {"type": "boolean"},
            },
            "required": ["nombre", "servicio", "preferencia", "primera_visita"],
            "additionalProperties": False,
        },
    },
    {
        "name": "derivar_a_humano",
        "description": ("Avisa a recepción para que una persona conteste. Úsala si el paciente lo pide, si hay "
                        "una queja, una urgencia, una pregunta clínica o algo que no esté en la ficha."),
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "motivo": {"type": "string", "description": "Motivo breve, sin datos de salud"},
                "urgente": {"type": "boolean"},
            },
            "required": ["motivo", "urgente"],
            "additionalProperties": False,
        },
    },
]


def guardar_evento(cfg: dict, tipo: str, telefono: str, datos: dict) -> None:
    """Guarda solicitudes/derivaciones en un JSONL local. En producción: email o panel de la clínica."""
    registro = {
        "fecha": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "clinica": cfg["nombre"],
        "tipo": tipo,
        "telefono": telefono,
        **datos,
    }
    with open(DIR / "solicitudes.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(registro, ensure_ascii=False) + "\n")


def ejecutar_herramienta(cfg: dict, telefono: str, nombre: str, entrada: dict) -> str:
    if nombre == "registrar_solicitud_cita":
        guardar_evento(cfg, "solicitud_cita", telefono, entrada)
        return "Solicitud registrada. Recepción confirmará por este chat o por teléfono en horario de apertura."
    if nombre == "derivar_a_humano":
        guardar_evento(cfg, "derivacion", telefono, entrada)
        return "Aviso enviado a recepción."
    return f"Herramienta desconocida: {nombre}"


# --------------------------------------------------------------------------- motor con Claude

class MotorClaude:
    def __init__(self, cfg: dict):
        import anthropic  # pip install anthropic

        self.anthropic = anthropic
        self.cliente = anthropic.Anthropic()
        self.cfg = cfg
        self.sistema = [{"type": "text", "text": construir_prompt_sistema(cfg),
                         "cache_control": {"type": "ephemeral"}}]
        self.conversaciones: dict[str, dict] = {}

    def _historial(self, telefono: str) -> list:
        conv = self.conversaciones.get(telefono)
        if not conv or time.time() - conv["ts"] > CADUCIDAD_CONVERSACION_S:
            conv = {"ts": time.time(), "mensajes": []}
            self.conversaciones[telefono] = conv
        conv["ts"] = time.time()
        return conv["mensajes"]

    def _llamar(self, mensajes: list):
        # Fallback del servidor ante rechazos (beta server-side-fallback-2026-07-01).
        return self.cliente.beta.messages.create(
            model=MODELO,
            max_tokens=2048,
            system=self.sistema,
            tools=HERRAMIENTAS,
            messages=mensajes,
            output_config={"effort": "low"},   # chat sencillo: baja latencia y coste
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )

    def responder(self, telefono: str, texto: str) -> str:
        mensajes = self._historial(telefono)
        mensajes.append({"role": "user", "content": texto})
        respuesta_texto = ""
        try:
            for _ in range(4):  # como máximo 4 rondas de herramientas por mensaje
                resp = self._llamar(mensajes)
                if resp.stop_reason == "refusal":
                    mensajes.pop()  # no conservar el turno rechazado
                    return self.cfg["mensaje_derivacion"]
                mensajes.append({"role": "assistant", "content": resp.content})
                respuesta_texto = "".join(b.text for b in resp.content if b.type == "text").strip()
                if resp.stop_reason != "tool_use":
                    break
                resultados = []
                for b in resp.content:
                    if b.type == "tool_use":
                        resultados.append({"type": "tool_result", "tool_use_id": b.id,
                                           "content": ejecutar_herramienta(self.cfg, telefono, b.name, b.input)})
                mensajes.append({"role": "user", "content": resultados})
        except self.anthropic.RateLimitError:
            return "Ahora mismo tengo mucha demanda. " + self.cfg["mensaje_derivacion"]
        except self.anthropic.APIStatusError:
            return self.cfg["mensaje_derivacion"]
        except self.anthropic.APIConnectionError:
            return self.cfg["mensaje_derivacion"]
        if len(mensajes) > MAX_TURNOS_HISTORIAL:
            del mensajes[:-MAX_TURNOS_HISTORIAL]
        # el historial debe empezar por un mensaje de usuario con texto
        while mensajes and not (mensajes[0]["role"] == "user" and isinstance(mensajes[0]["content"], str)):
            mensajes.pop(0)
        return respuesta_texto or self.cfg["mensaje_derivacion"]


# --------------------------------------------------------------------------- motor simulado (sin API)

def _normalizar(t: str) -> str:
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


class MotorSimulado:
    """Reglas simples para enseñar la demo sin coste ni conexión. No usa IA."""

    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.estado: dict[str, dict] = {}

    def responder(self, telefono: str, texto: str) -> str:
        c, t = self.cfg, _normalizar(texto)
        st = self.estado.setdefault(telefono, {})
        if st.get("pidiendo_cita"):
            st.pop("pidiendo_cita")
            guardar_evento(c, "solicitud_cita", telefono, {"nombre": "(demo)", "servicio": "(demo)",
                                                           "preferencia": texto, "primera_visita": True})
            return ("Anotado. Recepción te confirmará la cita en horario de apertura. "
                    "¿Te puedo ayudar con algo más?")
        if "persona" in t or "humano" in t or "queja" in t or "urgen" in t or "dolor" in t:
            guardar_evento(c, "derivacion", telefono, {"motivo": "pide persona / posible urgencia", "urgente": "urgen" in t})
            return c["mensaje_derivacion"]
        if re.search(r"horari|abr|cierr", t):
            return "Nuestro horario: " + c["horario"]
        if re.search(r"preci|cuest|vale|tarifa", t):
            lineas = [f"- {s['nombre']}: {s['precio']}" for s in c["servicios"]]
            return "Estos son nuestros precios orientativos:\n" + "\n".join(lineas)
        if re.search(r"donde|direcc|aparc|llegar", t):
            return f"Estamos en {c['direccion']}. {c.get('como_llegar', '')}".strip()
        if re.search(r"segur|mutua|aseguradora", t):
            return "Trabajamos con: " + ", ".join(c.get("aseguradoras", [])) + "."
        if re.search(r"cita|reserv|hueco|turno", t):
            st["pidiendo_cita"] = True
            return ("¡Claro! Dime tu nombre, qué servicio necesitas y qué día y franja te vienen mejor "
                    "(mañana o tarde).")
        return ("Puedo ayudarte con horarios, precios, ubicación, seguros o pedir cita. "
                "Si prefieres hablar con una persona, escribe PERSONA.")


# --------------------------------------------------------------------------- WhatsApp Cloud API

def enviar_whatsapp(destino: str, texto: str) -> None:
    version = os.environ.get("GRAPH_API_VERSION", "v23.0")
    url = f"https://graph.facebook.com/{version}/{os.environ['WA_PHONE_NUMBER_ID']}/messages"
    cuerpo = json.dumps({"messaging_product": "whatsapp", "to": destino, "type": "text",
                         "text": {"body": texto[:4000]}}).encode()
    req = urllib.request.Request(url, data=cuerpo, method="POST", headers={
        "Authorization": f"Bearer {os.environ['WA_TOKEN']}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        r.read()


def firma_valida(cuerpo: bytes, cabecera: str | None) -> bool:
    secreto = os.environ.get("WA_APP_SECRET", "")
    if not secreto or not cabecera or not cabecera.startswith("sha256="):
        return False
    esperado = hmac.new(secreto.encode(), cuerpo, hashlib.sha256).hexdigest()
    return hmac.compare_digest(esperado, cabecera.split("=", 1)[1])


def crear_handler(motor, cfg):
    saludados: set[str] = set()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):  # verificación del webhook por Meta
            from urllib.parse import parse_qs, urlparse
            q = parse_qs(urlparse(self.path).query)
            if q.get("hub.mode") == ["subscribe"] and q.get("hub.verify_token") == [os.environ.get("WA_VERIFY_TOKEN")]:
                self.send_response(200); self.end_headers()
                self.wfile.write(q.get("hub.challenge", [""])[0].encode())
            else:
                self.send_response(403); self.end_headers()

        def do_POST(self):
            cuerpo = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            if not firma_valida(cuerpo, self.headers.get("X-Hub-Signature-256")):
                self.send_response(401); self.end_headers(); return
            self.send_response(200); self.end_headers()  # responder rápido a Meta
            try:
                datos = json.loads(cuerpo)
                for entrada in datos.get("entry", []):
                    for cambio in entrada.get("changes", []):
                        for m in cambio.get("value", {}).get("messages", []):
                            tel = m.get("from")
                            if m.get("type") != "text":
                                enviar_whatsapp(tel, "De momento solo puedo leer mensajes de texto. "
                                                     + cfg["mensaje_derivacion"])
                                continue
                            texto = m["text"]["body"]
                            respuesta = motor.responder(tel, texto)
                            if tel not in saludados:  # aviso de IA (AI Act art. 50) en el primer mensaje
                                saludados.add(tel)
                                respuesta = AVISO_IA.format(nombre=cfg["nombre"]) + "\n\n" + respuesta
                            enviar_whatsapp(tel, respuesta)
            except Exception as e:  # no registrar el contenido del mensaje
                print(f"[error] {type(e).__name__}", file=sys.stderr)

        def log_message(self, *a):  # no volcar peticiones (contienen teléfonos) al log
            pass

    return Handler


# --------------------------------------------------------------------------- main

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    modo = p.add_mutually_exclusive_group(required=True)
    modo.add_argument("--consola", action="store_true", help="chat en la terminal")
    modo.add_argument("--webhook", action="store_true", help="servidor para la WhatsApp Cloud API")
    p.add_argument("--simulado", action="store_true", help="sin IA ni coste (reglas fijas)")
    p.add_argument("--config", default=str(DIR / "clinica_demo.json"))
    p.add_argument("--puerto", type=int, default=8080)
    a = p.parse_args()

    cfg = cargar_config(Path(a.config))
    motor = MotorSimulado(cfg) if a.simulado else MotorClaude(cfg)

    if a.consola:
        print(AVISO_IA.format(nombre=cfg["nombre"]))
        print("(escribe 'salir' para terminar)\n")
        while True:
            try:
                texto = input("Paciente> ").strip()
            except (EOFError, KeyboardInterrupt):
                break
            if texto.lower() in {"salir", "exit"}:
                break
            if texto:
                print("Asistente>", motor.responder("consola", texto), "\n")
    else:
        print(f"Webhook escuchando en :{a.puerto} (modo {'simulado' if a.simulado else MODELO})")
        HTTPServer(("0.0.0.0", a.puerto), crear_handler(motor, cfg)).serve_forever()


if __name__ == "__main__":
    main()
