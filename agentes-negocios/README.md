# Equipo de 5 agentes de negocios digitales

| # | Agente | Especialidad | Carpeta | Definición |
|---|--------|--------------|---------|------------|
| 1 | Agente Creador | Productos digitales descargables | `01-creador-productos/` | `.claude/agents/agente-creador-productos.md` |
| 2 | Agente Builder | Micro-SaaS / herramientas web | `02-builder-saas/` | `.claude/agents/agente-builder-saas.md` |
| 3 | Agente Media | Canales de contenido (YouTube, TikTok, IG) | `03-media-contenido/` | `.claude/agents/agente-media-contenido.md` |
| 4 | Agente Servicios | Servicios productizados con IA | `04-servicios-ia/` | `.claude/agents/agente-servicios-ia.md` |
| 5 | Agente Nicho | Newsletter / web de nicho con afiliados | `05-nicho-afiliados/` | `.claude/agents/agente-nicho-afiliados.md` |

## Cómo funciona
1. **Fase 1 – Propuesta**: cada agente investiga, elige un negocio y escribe `propuesta.md` y deja
   preparado en `recursos/` todo lo que no requiere tocar el exterior.
2. **Tu decisión**: lees las propuestas y apruebas acciones concretas (por ID, p. ej. `03-A1`) en
   `AUTORIZACIONES.md`, con un límite de gasto. Puedes pedírselo a Claude: *"Autorizo 04-A1 y 04-A2, máximo 20 €"*.
3. **Fase 2 – Ejecución**: el agente ejecuta solo lo autorizado y lo registra en `registro.md`.

Las reglas comunes están en [`PROTOCOLO.md`](PROTOCOLO.md).

## Volver a lanzar un agente
En Claude Code dentro de este repo: *"Usa el agente agente-media-contenido para revisar su propuesta"*
o *"Ejecuta las acciones autorizadas del agente-servicios-ia"*.
