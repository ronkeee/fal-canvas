import { fal } from './client';

export interface FalModelInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch model input/output schema from fal.ai
 */
export async function getModelSchema(modelId: string): Promise<Record<string, unknown> | null> {
  const cacheKey = `schema:${modelId}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    // fal.ai exposes schemas at /schema endpoint
    const response = await fetch(`https://fal.run/${modelId}/schema`, {
      headers: {
        'Authorization': `Key ${getApiKey()}`,
      },
    });
    if (!response.ok) return null;
    const schema = await response.json();
    setCache(cacheKey, schema);
    return schema;
  } catch {
    return null;
  }
}

/**
 * Upload a file to fal.ai CDN
 */
export async function uploadFile(file: File): Promise<string> {
  const url = await fal.storage.upload(file);
  return url;
}

/**
 * Submit an async job
 */
export async function submitJob(modelId: string, input: Record<string, unknown>): Promise<string> {
  const result = await fal.queue.submit(modelId, { input });
  return result.request_id;
}

/**
 * Check job status
 */
export async function checkJobStatus(modelId: string, requestId: string) {
  const status = await fal.queue.status(modelId, { requestId, logs: true });
  return status;
}

/**
 * Get job result
 */
export async function getJobResult(modelId: string, requestId: string) {
  const result = await fal.queue.result(modelId, { requestId });
  return result;
}

function getApiKey(): string {
  // Read from the zustand store via a dynamic import workaround
  try {
    const stored = localStorage.getItem('fal-canvas-app');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.falApiKey) return parsed.state.falApiKey;
    }
  } catch { /* ignore */ }
  return import.meta.env.VITE_FAL_KEY || '';
}
