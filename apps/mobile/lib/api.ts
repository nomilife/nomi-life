import { Platform } from 'react-native';
import { supabase } from './supabase';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '3002';
// EXPO_PUBLIC_API_URL set → web + mobile hepsi Railway/production kullanır
// Web local dev: localhost. Mobile: LAN IP veya tunnel
const rawUrl = process.env.EXPO_PUBLIC_API_URL;
const API_URL = rawUrl
  ? rawUrl.replace(/\/+$/, '')
  : Platform.OS === 'web'
    ? `http://localhost:${API_PORT}`
    : `http://192.168.1.2:${API_PORT}`;

export function getApiUrl(): string {
  return API_URL;
}

const isTunnelUrl = (url: string) =>
  url.includes('loca.lt') || url.includes('trycloudflare.com') || url.includes('cloudflare');

/** Test API connectivity (no auth required) */
export async function checkApiHealth(): Promise<{ ok: boolean; error?: string; hint?: string }> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 12000);
  try {
    const tunnelHeaders = isTunnelUrl(API_URL) ? { 'Bypass-Tunnel-Reminder': '1' } : {};
    const res = await fetch(`${API_URL}/health`, {
      headers: tunnelHeaders,
      signal: controller.signal,
    });
    clearTimeout(to);
    if (res.ok) return { ok: true };
    const is503 = res.status === 503;
    return {
      ok: false,
      error: `HTTP ${res.status}`,
      hint: is503
        ? 'API veya tunnel çalışmıyor. 1) pnpm dev:api açık mı? 2) pnpm tunnel:api (cloudflared) açık mı? 3) Yeni tunnel URL .env\'e yazıldı mı?'
        : undefined,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    const aborted = msg.includes('abort') || msg.includes('Abort');
    const errMsg = aborted ? 'Zaman aşımı' : msg;
    return {
      ok: false,
      error: errMsg,
      hint: isTunnelUrl(API_URL)
        ? '1) pnpm dev:api çalışıyor mu? 2) pnpm tunnel:api (cloudflared) çalışıyor mu? 3) .env\'deki URL tunnel çıktısındaki https://xxx.trycloudflare.com ile aynı mı?'
        : 'Tunnel kullan: pnpm tunnel:api → .env\'e https://xxx.trycloudflare.com yaz. Veya aynı WiFi + ipconfig ile IP.',
    };
  } finally {
    clearTimeout(to);
  }
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** AI parse gibi yavaş endpoint'ler için uzun timeout */
export const API_TIMEOUT_AI = 20000;
export const API_TIMEOUT_DEFAULT = 12000;

export async function api<T>(
  path: string,
  options: RequestInit & { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (isTunnelUrl(API_URL)) headers['Bypass-Tunnel-Reminder'] = '1';

  const url = `${API_URL}${path}`;
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? API_TIMEOUT_DEFAULT;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = options.signal;
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeout);
      throw new DOMException('Aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  let res: Response;
  try {
    const { signal: _omit, timeoutMs: _t, ...fetchOptions } = options;
    res = await fetch(url, {
      ...fetchOptions,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (e) {
    clearTimeout(timeout);
    const msg = e instanceof Error ? e.message : 'Network error';
    const isAborted = msg.includes('abort') || msg.includes('Abort') || (e instanceof DOMException && e.name === 'AbortError');
    if (isAborted) throw e;
    if (Platform.OS !== 'web') {
      throw new Error(`API'ye ulaşılamıyor. Aynı WiFi'de misin? ${msg}`);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    if (res.status === 304) {
      throw new Error('Önbellek hatası. Sayfayı yenileyip tekrar deneyin.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? res.statusText ?? 'Request failed');
  }
  return res.json();
}
