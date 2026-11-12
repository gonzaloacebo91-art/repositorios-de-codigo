# Conector de Instagram (MCP)

Servidor MCP que permite a Claude **publicar imágenes directamente en Instagram** usando la API oficial de Meta (Instagram Graph API).

## Herramientas

| Herramienta | Qué hace |
|---|---|
| `instagram_publish_image` | Publica una imagen con texto (caption) y texto alternativo opcional |
| `instagram_publish_carousel` | Publica un carrusel de 2 a 10 imágenes |
| `instagram_publishing_limit` | Muestra cuántas publicaciones llevas en las últimas 24 h (máx. 100) |
| `instagram_account_info` | Comprueba la conexión y muestra los datos de la cuenta |

Las imágenes pueden ser una **URL pública** (`https://...`) o un **archivo `.jpg` de tu ordenador**. La API de Instagram solo acepta URLs públicas, así que los archivos locales se suben primero a [imgbb](https://api.imgbb.com/) (necesitas una clave gratuita en `IMGBB_API_KEY`).

## Requisitos

1. Una cuenta de Instagram **profesional** (empresa o creador).
2. Una app en [Meta for Developers](https://developers.facebook.com/) con el producto de Instagram añadido.
3. Un **token de acceso de larga duración** con permiso para publicar:
   - Con *Instagram Login* (`IG_API_HOST=graph.instagram.com`): `instagram_business_basic` + `instagram_business_content_publish`. No hace falta página de Facebook.
   - Con *Facebook Login* (`IG_API_HOST=graph.facebook.com`): `instagram_basic` + `instagram_content_publish` + `pages_show_list`. La cuenta debe estar vinculada a una página de Facebook.
4. El **ID de la cuenta de Instagram** (`IG_USER_ID`). No es el @usuario. Se obtiene con `GET /me?fields=user_id` (Instagram Login) o `GET /me/accounts?fields=instagram_business_account` (Facebook Login).
5. Node.js 18 o superior.

## Instalación

```bash
cd instagram-mcp
npm install
cp .env.example .env   # rellena los valores (no subas este archivo a GitHub)
npm test               # pruebas con la API simulada
```

### Añadirlo a Claude Code

```bash
claude mcp add instagram \
  -e IG_ACCESS_TOKEN=tu_token \
  -e IG_USER_ID=tu_id \
  -e IG_API_HOST=graph.instagram.com \
  -e IMGBB_API_KEY=tu_clave_opcional \
  -- node /ruta/a/instagram-mcp/src/index.js
```

### Añadirlo a Claude Desktop

En `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "instagram": {
      "command": "node",
      "args": ["/ruta/a/instagram-mcp/src/index.js"],
      "env": {
        "IG_ACCESS_TOKEN": "tu_token",
        "IG_USER_ID": "tu_id",
        "IG_API_HOST": "graph.instagram.com",
        "IMGBB_API_KEY": "tu_clave_opcional"
      }
    }
  }
}
```

Luego basta con pedirle a Claude, por ejemplo: *"Publica /Users/yo/fotos/playa.jpg en Instagram con el texto 'Verano ☀️ #playa'"*.

## Limitaciones de la API de Instagram

- Solo imágenes **JPEG**, con una relación de aspecto entre 4:5 y 1.91:1 y como máximo 8 MB.
- Máximo **100 publicaciones por API cada 24 horas**.
- No se pueden publicar historias con imagen desde esta API en cuentas personales, ni usar filtros o música.
- Los tokens de larga duración caducan a los 60 días y hay que renovarlos.

## Cómo funciona

1. `POST /{ig-user-id}/media` crea un contenedor con la URL de la imagen.
2. Se consulta `status_code` del contenedor hasta que vale `FINISHED`.
3. `POST /{ig-user-id}/media_publish` lo publica y se devuelve el enlace (`permalink`).
