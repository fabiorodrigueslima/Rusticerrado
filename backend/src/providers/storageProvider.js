import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { IMAGE_MAX_BYTES, IMAGE_TYPES, detectImageMime, extensionFor } from "../utils/imageFormat.js";

const localRoot = resolve(process.cwd(), "uploads");
const disabled = {
  async put() {
    throw new AppError(
      503,
      "STORAGE_NOT_CONFIGURED",
      "Armazenamento de imagens não configurado.",
    );
  },
  async delete() {},
};
const local = {
  async put({ key, buffer }) {
    await mkdir(localRoot, { recursive: true });
    await writeFile(resolve(localRoot, key), buffer, { flag: "wx" });
    return { url: `/uploads/${key}` };
  },
  async delete(key) {
    await unlink(resolve(localRoot, key)).catch(() => {});
  },
};
export function createHttpStorageProvider({
  fetchImpl = fetch,
  config = env,
} = {}) {
  return {
    async put({ key, buffer, mime }) {
      const response = await fetchImpl(
        `${config.STORAGE_HTTP_URL}/${encodeURIComponent(key)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${config.STORAGE_HTTP_TOKEN}`,
            "Content-Type": mime,
          },
          body: buffer,
          signal: AbortSignal.timeout(config.EXTERNAL_REQUEST_TIMEOUT_MS),
        },
      );
      if (!response.ok)
        throw new AppError(
          502,
          "STORAGE_PROVIDER_ERROR",
          "Falha ao armazenar imagem.",
        );
      return {
        url: `${config.STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${encodeURIComponent(key)}`,
      };
    },
    async delete(key) {
      const response = await fetchImpl(
        `${config.STORAGE_HTTP_URL}/${encodeURIComponent(key)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${config.STORAGE_HTTP_TOKEN}` },
          signal: AbortSignal.timeout(config.EXTERNAL_REQUEST_TIMEOUT_MS),
        },
      );
      if (!response.ok && response.status !== 404)
        throw new AppError(
          502,
          "STORAGE_PROVIDER_ERROR",
          "Falha ao excluir imagem.",
        );
    },
  };
}

// Supabase Storage. Photos live in a public bucket (anyone can see a published photo), but
// only the server, with the secret key, can authorize an upload, inspect or delete a file.
// The secret key never goes to the browser.
const encodePath = (path) => String(path).split("/").map(encodeURIComponent).join("/");

export function createSupabaseStorageProvider({
  fetchImpl = fetch,
  config = env,
} = {}) {
  const requiredConfig = () => {
    if (!config.SUPABASE_URL || !config.SUPABASE_SECRET_KEY || !config.SUPABASE_STORAGE_BUCKET)
      throw new AppError(503, "STORAGE_NOT_CONFIGURED", "Supabase Storage não está configurado.");
  };
  const base = () => `${config.SUPABASE_URL.replace(/\/$/, "")}/storage/v1`;
  const bucket = () => encodeURIComponent(config.SUPABASE_STORAGE_BUCKET);
  const folder = () => (config.SUPABASE_STORAGE_FOLDER || "produtos").replace(/^\/+|\/+$/g, "");
  // New secret keys (sb_secret_...) go only in "apikey"; legacy service_role JWTs also as Bearer.
  const headers = (extra = {}) => {
    const key = config.SUPABASE_SECRET_KEY;
    return { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}), ...extra };
  };
  const call = (url, init = {}) =>
    fetchImpl(url, { ...init, headers: headers(init.headers), signal: AbortSignal.timeout(config.EXTERNAL_REQUEST_TIMEOUT_MS) });
  const objectUrl = (kind, path) => `${base()}/object/${kind ? `${kind}/` : ""}${bucket()}/${encodePath(path)}`;
  const publicUrl = (path) => objectUrl("public", path);

  return {
    publicUrl(path) {
      requiredConfig();
      return publicUrl(path);
    },
    // One-time authorization: the browser PUTs the file to uploadUrl with these headers.
    async signUpload(id, mime) {
      requiredConfig();
      const ext = extensionFor(mime);
      if (!ext) throw new AppError(400, "IMAGE_INVALID", "Formato de imagem não aceito.");
      const path = `${folder()}/${id}.${ext}`;
      const response = await call(objectUrl("upload/sign", path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.url !== "string" || !payload.url.includes("token="))
        throw new AppError(502, "STORAGE_PROVIDER_ERROR", "Não foi possível autorizar o envio da foto.");
      return {
        publicId: path,
        uploadUrl: `${base()}${payload.url.startsWith("/") ? "" : "/"}${payload.url}`,
        method: "PUT",
        headers: { "Content-Type": mime, "x-upsert": "false" },
      };
    },
    // Authoritative check of what really arrived: size and the first bytes of the file.
    async inspect(path) {
      requiredConfig();
      const response = await call(objectUrl("authenticated", path), { headers: { Range: "bytes=0-15" } });
      if (!response.ok) throw new AppError(502, "STORAGE_LOOKUP_FAILED", "Não foi possível verificar a imagem.");
      const head = Buffer.from(await response.arrayBuffer());
      const range = response.headers.get("content-range");
      const bytes = response.status === 206 && range ? Number(range.split("/")[1]) : head.length;
      const mime = detectImageMime(head.subarray(0, 16));
      return {
        public_id: path,
        resource_type: mime ? "image" : "unknown",
        format: mime ? extensionFor(mime) : null,
        bytes: Number.isFinite(bytes) ? bytes : -1,
        secure_url: publicUrl(path),
      };
    },
    // Server-side upload (photo sent through the API instead of straight from the browser).
    async put({ key, buffer, mime }) {
      requiredConfig();
      const path = `${folder()}/${key}`;
      const response = await call(objectUrl("", path), {
        method: "POST",
        headers: { "Content-Type": mime, "x-upsert": "false", "cache-control": "max-age=31536000" },
        body: buffer,
      });
      if (!response.ok)
        throw new AppError(502, "STORAGE_PROVIDER_ERROR", "Falha ao armazenar imagem no Supabase.");
      return { url: publicUrl(path), providerAssetId: path };
    },
    async delete(path) {
      requiredConfig();
      if (!path) return;
      const response = await call(objectUrl("", path), { method: "DELETE" });
      if (response.ok || response.status === 404) return;
      const payload = await response.text().catch(() => "");
      if (/not.?found/i.test(payload)) return;
      throw new AppError(502, "STORAGE_PROVIDER_ERROR", "Falha ao excluir imagem do Supabase.");
    },
    // Creates or updates the public photo bucket: only images, at most 5 MB each.
    async ensureBucket() {
      requiredConfig();
      const settings = {
        public: true,
        file_size_limit: IMAGE_MAX_BYTES,
        allowed_mime_types: Object.keys(IMAGE_TYPES),
      };
      const name = config.SUPABASE_STORAGE_BUCKET;
      const existing = await call(`${base()}/bucket/${bucket()}`);
      const response = existing.ok
        ? await call(`${base()}/bucket/${bucket()}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: name, ...settings }),
          })
        : await call(`${base()}/bucket`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: name, name, ...settings }),
          });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new AppError(502, "STORAGE_PROVIDER_ERROR", `Não foi possível preparar o bucket de fotos (${response.status}). ${detail.slice(0, 200)}`);
      }
      return { bucket: name, created: !existing.ok };
    },
  };
}

export const storageProvider =
  env.STORAGE_PROVIDER === "local"
    ? local
    : env.STORAGE_PROVIDER === "http"
      ? createHttpStorageProvider()
      : env.STORAGE_PROVIDER === "supabase"
        ? createSupabaseStorageProvider()
        : disabled;
