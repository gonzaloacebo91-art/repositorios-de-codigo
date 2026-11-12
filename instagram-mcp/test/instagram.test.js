import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InstagramClient, InstagramError } from "../src/instagram.js";

// Simula la Graph API y registra cada llamada.
function fakeApi(handler) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const params = Object.fromEntries(init.body ? new URLSearchParams(init.body) : u.searchParams);
    const call = { method: init.method ?? "GET", path: u.pathname, host: u.host, params };
    calls.push(call);
    const { status = 200, body } = handler(call, calls);
    return { ok: status < 400, status, json: async () => body };
  };
  return { calls, fetchImpl };
}

const make = (fetchImpl, extra = {}) =>
  new InstagramClient({ accessToken: "TOKEN", userId: "123", fetchImpl, pollIntervalMs: 0, ...extra });

test("publica una imagen: crea contenedor, espera y publica", async () => {
  let n = 0;
  const { calls, fetchImpl } = fakeApi(({ method, path }) => {
    if (method === "POST" && path.endsWith("/123/media")) return { body: { id: "C1" } };
    if (path.endsWith("/C1")) return { body: { status_code: ++n < 2 ? "IN_PROGRESS" : "FINISHED" } };
    if (path.endsWith("/123/media_publish")) return { body: { id: "M1" } };
    if (path.endsWith("/M1")) return { body: { permalink: "https://instagram.com/p/abc" } };
    throw new Error("inesperado " + path);
  });
  const res = await make(fetchImpl).publishImage({ image: "https://x.com/a.jpg", caption: "Hola #test" });
  assert.deepEqual(res, { mediaId: "M1", permalink: "https://instagram.com/p/abc", imageUrl: "https://x.com/a.jpg" });
  assert.equal(calls[0].params.image_url, "https://x.com/a.jpg");
  assert.equal(calls[0].params.caption, "Hola #test");
  assert.equal(calls[0].params.access_token, "TOKEN");
  assert.equal(calls[0].path, "/v21.0/123/media");
  assert.equal(calls.find((c) => c.path.endsWith("media_publish")).params.creation_id, "C1");
});

test("publica un carrusel con hijos y contenedor CAROUSEL", async () => {
  let k = 0;
  const { calls, fetchImpl } = fakeApi(({ method, path, params }) => {
    if (method === "POST" && path.endsWith("/123/media"))
      return { body: { id: params.media_type === "CAROUSEL" ? "CAR" : `K${++k}` } };
    if (method === "GET" && params.fields === "status_code") return { body: { status_code: "FINISHED" } };
    if (path.endsWith("media_publish")) return { body: { id: "M2" } };
    return { body: {} };
  });
  const res = await make(fetchImpl).publishCarousel({ images: ["https://x/1.jpg", "https://x/2.jpg"], caption: "c" });
  assert.equal(res.mediaId, "M2");
  const carousel = calls.find((c) => c.params.media_type === "CAROUSEL");
  assert.equal(carousel.params.children, "K1,K2");
  assert.equal(calls.filter((c) => c.params.is_carousel_item === "true").length, 2);
});

test("rechaza carruseles de menos de 2 imágenes", async () => {
  await assert.rejects(make(async () => {}).publishCarousel({ images: ["https://x/1.jpg"] }), InstagramError);
});

test("propaga errores de la API", async () => {
  const { fetchImpl } = fakeApi(() => ({ status: 400, body: { error: { message: "Invalid token", code: 190 } } }));
  await assert.rejects(make(fetchImpl).publishImage({ image: "https://x/a.jpg" }), /Invalid token/);
});

test("falla si el contenedor termina en ERROR", async () => {
  const { fetchImpl } = fakeApi(({ method }) =>
    method === "POST" ? { body: { id: "C9" } } : { body: { status_code: "ERROR" } },
  );
  await assert.rejects(make(fetchImpl).publishImage({ image: "https://x/a.jpg" }), /ERROR/);
});

test("sube imágenes locales a imgbb antes de publicarlas", async () => {
  const dir = await mkdtemp(join(tmpdir(), "igmcp-"));
  const file = join(dir, "foto.jpg");
  await writeFile(file, Buffer.from([0xff, 0xd8, 0xff]));
  const { calls, fetchImpl } = fakeApi(({ host, method, path }) => {
    if (host === "api.imgbb.com") return { body: { data: { url: "https://i.ibb.co/foto.jpg" } } };
    if (method === "POST" && path.endsWith("/123/media")) return { body: { id: "C1" } };
    if (path.endsWith("/C1")) return { body: { status_code: "FINISHED" } };
    if (path.endsWith("media_publish")) return { body: { id: "M1" } };
    return { body: {} };
  });
  const res = await make(fetchImpl, { imgbbApiKey: "K" }).publishImage({ image: file });
  assert.equal(res.imageUrl, "https://i.ibb.co/foto.jpg");
  assert.equal(calls[0].params.image, Buffer.from([0xff, 0xd8, 0xff]).toString("base64"));
  assert.equal(calls[1].params.image_url, "https://i.ibb.co/foto.jpg");
});

test("imagen local sin IMGBB_API_KEY o no JPEG da un error claro", async () => {
  await assert.rejects(make(async () => {}).publishImage({ image: "/tmp/a.jpg" }), /IMGBB_API_KEY/);
  await assert.rejects(make(async () => {}, { imgbbApiKey: "K" }).publishImage({ image: "/tmp/a.png" }), /JPEG/);
});

test("usa graph.instagram.com si se configura", async () => {
  const { calls, fetchImpl } = fakeApi(() => ({ body: { id: "123", username: "yo" } }));
  await make(fetchImpl, { host: "graph.instagram.com" }).getAccountInfo();
  assert.equal(calls[0].host, "graph.instagram.com");
});
