import { getSession } from './auth';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, apiBaseUrl } from './config';

const LS_CLOUD = 'babycare_cloud';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cfg(): { url: string; key: string } {
  let rawUrl = '';
  let rawKey = '';
  try {
    const s = JSON.parse(localStorage.getItem(LS_CLOUD) || '{}');
    if (s.url && s.key) {
      rawUrl = s.url;
      rawKey = s.key;
    }
  } catch { /* ignore */ }
  if (!rawUrl || !rawKey) {
    rawUrl = DEFAULT_SUPABASE_URL;
    rawKey = DEFAULT_SUPABASE_ANON_KEY;
  }
  return { url: apiBaseUrl(), key: rawKey.trim() };
}

/** 记录前端操作日志到云端 operation_logs 表 */
export function logOperation(action: string, detail: string) {
  const { url, key } = cfg();
  if (!url || !key) return;
  const session = getSession();
  const id = uid();
  const createdAt = Date.now();
  const body = {
    id,
    userId: session?.user?.id || '',
    action,
    detail,
    ip: '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    createdAt,
  };
  fetch(`${url}/rest/v1/operation_logs`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${session?.access_token || key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}
