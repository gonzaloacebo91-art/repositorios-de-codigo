#!/usr/bin/env node
// Servidor MCP (stdio) para publicar imágenes en Instagram.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { InstagramClient } from "./instagram.js";

const client = new InstagramClient({
  accessToken: process.env.IG_ACCESS_TOKEN,
  userId: process.env.IG_USER_ID,
  host: process.env.IG_API_HOST || undefined,
  version: process.env.IG_API_VERSION || undefined,
  imgbbApiKey: process.env.IMGBB_API_KEY || undefined,
});

const server = new McpServer({ name: "instagram", version: "1.0.0" });

const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const run = (fn) => async (args) => {
  try {
    return ok(await fn(args));
  } catch (e) {
    return { isError: true, content: [{ type: "text", text: e.message + (e.details ? `\n${JSON.stringify(e.details)}` : "") }] };
  }
};

const imageSource = z
  .string()
  .describe("URL pública de una imagen JPEG (https://...) o ruta a un .jpg local (requiere IMGBB_API_KEY)");

server.registerTool(
  "instagram_publish_image",
  {
    title: "Publicar imagen en Instagram",
    description: "Publica directamente una imagen en el feed de Instagram con su texto (caption).",
    inputSchema: {
      image: imageSource,
      caption: z.string().max(2200).optional().describe("Texto de la publicación, con hashtags y menciones"),
      alt_text: z.string().optional().describe("Texto alternativo para accesibilidad"),
    },
  },
  run(({ image, caption, alt_text }) => client.publishImage({ image, caption, altText: alt_text })),
);

server.registerTool(
  "instagram_publish_carousel",
  {
    title: "Publicar carrusel en Instagram",
    description: "Publica directamente un carrusel de 2 a 10 imágenes en Instagram.",
    inputSchema: {
      images: z.array(imageSource).min(2).max(10),
      caption: z.string().max(2200).optional(),
    },
  },
  run(({ images, caption }) => client.publishCarousel({ images, caption })),
);

server.registerTool(
  "instagram_publishing_limit",
  {
    title: "Límite de publicación",
    description: "Muestra cuántas publicaciones se han hecho por API en las últimas 24 horas (máximo 100).",
    inputSchema: {},
  },
  run(() => client.getPublishingLimit()),
);

server.registerTool(
  "instagram_account_info",
  {
    title: "Información de la cuenta",
    description: "Comprueba la conexión y muestra los datos básicos de la cuenta de Instagram configurada.",
    inputSchema: {},
  },
  run(() => client.getAccountInfo()),
);

await server.connect(new StdioServerTransport());
