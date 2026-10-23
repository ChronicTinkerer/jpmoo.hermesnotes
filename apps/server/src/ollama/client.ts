import { HttpError } from "../lib/errors.js";

/**
 * Minimal Ollama HTTP client. The base URL and model names come from per-user
 * settings, never from server env. Uses the classic single-prompt
 * `/api/embeddings` endpoint for broad version compatibility.
 */

export interface OllamaModel {
  name: string;
  size?: number;
  parameterSize?: string;
  family?: string;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

async function ollamaFetch(url: string, path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(`${normalizeUrl(url)}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    throw new HttpError(
      502,
      `could not reach Ollama at ${url}: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** GET /api/tags — installed models. Ollama doesn't distinguish embed vs chat. */
export async function listModels(url: string): Promise<OllamaModel[]> {
  const res = await ollamaFetch(url, "/api/tags");
  if (!res.ok) throw new HttpError(502, `Ollama /api/tags returned ${res.status}`);
  const body = (await res.json()) as {
    models?: { name: string; size?: number; details?: { parameter_size?: string; family?: string } }[];
  };
  return (body.models ?? []).map((m) => ({
    name: m.name,
    size: m.size,
    parameterSize: m.details?.parameter_size,
    family: m.details?.family,
  }));
}

/**
 * The most text sent to be embedded at once. An embedding model takes its
 * whole input in one batch, and Ollama's is 2048 tokens: a longer note was
 * refused ("input is too large to process"), never stamped as embedded, and so
 * sent again on every tick of the embedding worker, all day. Six thousand
 * characters is about 1500 tokens of prose, inside the batch with room to
 * spare, and the opening of a long note is what its embedding is mostly about.
 */
export const EMBED_MAX_CHARS = 6000;

/** POST /api/embeddings — single prompt → vector. */
export async function embed(url: string, model: string, prompt: string): Promise<number[]> {
  const res = await ollamaFetch(url, "/api/embeddings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, prompt: prompt.slice(0, EMBED_MAX_CHARS) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(502, `Ollama embed failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as { embedding?: number[] };
  if (!body.embedding?.length) throw new HttpError(502, "Ollama returned an empty embedding");
  return body.embedding;
}

/** Probe a model's output dimension by embedding a short constant string. */
export async function probeDimension(url: string, model: string): Promise<number> {
  const vec = await embed(url, model, "dimension probe");
  return vec.length;
}
