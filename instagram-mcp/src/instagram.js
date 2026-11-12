// Cliente mínimo de la API de publicación de contenido de Instagram.
// Flujo oficial: 1) crear contenedor de medios, 2) esperar a que esté listo, 3) publicarlo.
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const DEFAULT_HOST = "graph.facebook.com";
const DEFAULT_VERSION = "v21.0";

export class InstagramError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "InstagramError";
    this.details = details;
  }
}

export class InstagramClient {
  constructor({
    accessToken,
    userId,
    host = DEFAULT_HOST,
    version = DEFAULT_VERSION,
    imgbbApiKey,
    fetchImpl = globalThis.fetch,
    pollIntervalMs = 2000,
    maxPollAttempts = 30,
  }) {
    if (!accessToken) throw new InstagramError("Falta IG_ACCESS_TOKEN");
    if (!userId) throw new InstagramError("Falta IG_USER_ID");
    this.accessToken = accessToken;
    this.userId = userId;
    this.baseUrl = `https://${host}/${version}`;
    this.imgbbApiKey = imgbbApiKey;
    this.fetch = fetchImpl;
    this.pollIntervalMs = pollIntervalMs;
    this.maxPollAttempts = maxPollAttempts;
  }

  async #request(method, path, params = {}) {
    const url = new URL(`${this.baseUrl}/${path}`);
    const body = new URLSearchParams();
    const target = method === "GET" ? url.searchParams : body;
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") target.set(k, String(v));
    }
    target.set("access_token", this.accessToken);

    const res = await this.fetch(url, method === "GET" ? { method } : { method, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      const err = data.error ?? {};
      throw new InstagramError(
        `Error de la API de Instagram (${res.status}): ${err.message ?? "respuesta inesperada"}`,
        err,
      );
    }
    return data;
  }

  /** Sube un archivo local a imgbb y devuelve una URL pública (la API de Instagram solo acepta URLs). */
  async uploadLocalImage(filePath) {
    if (!this.imgbbApiKey) {
      throw new InstagramError(
        "Para publicar imágenes locales configura IMGBB_API_KEY, o usa una URL pública (image_url).",
      );
    }
    const ext = extname(filePath).toLowerCase();
    if (![".jpg", ".jpeg"].includes(ext)) {
      throw new InstagramError(`Instagram solo admite imágenes JPEG; el archivo es '${ext || "sin extensión"}'.`);
    }
    const bytes = await readFile(filePath);
    const form = new URLSearchParams({ image: bytes.toString("base64"), name: basename(filePath, ext) });
    const res = await this.fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(this.imgbbApiKey)}`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.data?.url) {
      throw new InstagramError(`No se pudo subir la imagen a imgbb: ${data?.error?.message ?? res.status}`);
    }
    return data.data.url;
  }

  /** Acepta una URL pública o una ruta local y devuelve siempre una URL pública. */
  async resolveImage(source) {
    return /^https?:\/\//i.test(source) ? source : this.uploadLocalImage(source);
  }

  async #waitUntilReady(containerId) {
    for (let i = 0; i < this.maxPollAttempts; i++) {
      const { status_code: status } = await this.#request("GET", containerId, { fields: "status_code" });
      if (status === "FINISHED") return;
      if (status === "ERROR" || status === "EXPIRED") {
        throw new InstagramError(`El contenedor ${containerId} terminó con estado ${status}`);
      }
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
    throw new InstagramError(`El contenedor ${containerId} no estuvo listo a tiempo`);
  }

  async #publish(containerId) {
    await this.#waitUntilReady(containerId);
    const { id } = await this.#request("POST", `${this.userId}/media_publish`, { creation_id: containerId });
    const { permalink } = await this.#request("GET", id, { fields: "permalink" }).catch(() => ({}));
    return { mediaId: id, permalink };
  }

  /** Publica una sola imagen. */
  async publishImage({ image, caption, altText }) {
    const imageUrl = await this.resolveImage(image);
    const { id } = await this.#request("POST", `${this.userId}/media`, {
      image_url: imageUrl,
      caption,
      alt_text: altText,
    });
    return { ...(await this.#publish(id)), imageUrl };
  }

  /** Publica un carrusel de 2 a 10 imágenes. */
  async publishCarousel({ images, caption }) {
    if (images.length < 2 || images.length > 10) {
      throw new InstagramError("Un carrusel necesita entre 2 y 10 imágenes.");
    }
    const imageUrls = [];
    const children = [];
    for (const image of images) {
      const imageUrl = await this.resolveImage(image);
      const { id } = await this.#request("POST", `${this.userId}/media`, {
        image_url: imageUrl,
        is_carousel_item: true,
      });
      imageUrls.push(imageUrl);
      children.push(id);
    }
    for (const child of children) await this.#waitUntilReady(child);
    const { id } = await this.#request("POST", `${this.userId}/media`, {
      media_type: "CAROUSEL",
      children: children.join(","),
      caption,
    });
    return { ...(await this.#publish(id)), imageUrls };
  }

  /** Cuántas publicaciones quedan en las últimas 24 h (límite de la API: 100). */
  async getPublishingLimit() {
    const { data } = await this.#request("GET", `${this.userId}/content_publishing_limit`, {
      fields: "quota_usage,config",
    });
    return data?.[0] ?? {};
  }

  async getAccountInfo() {
    return this.#request("GET", this.userId, { fields: "id,username,name,media_count,followers_count" });
  }
}
