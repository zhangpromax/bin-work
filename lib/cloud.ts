import { DB, TableName, TABLES } from './types';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, apiBaseUrl } from './config';

/**
 * 私有云同步适配器（Supabase，无官方 SDK，直接用 fetch 调 PostgREST）
 * - pull: 按 updatedAt 合并（云端新则覆盖本地）
 * - push: upsert by id（resolution=merge-duplicates）
 * - 未配置 -> enabled=false，应用走 localStorage
 */
export interface CloudConfig {
  url: string;
  key: string;
}

let cfg: CloudConfig = { url: '', key: '' };
let enabled = false;
let localOnly = false;
let authToken: string | null = null; // 登录后注入的用户 JWT，用于过 RLS；为空则回退 anon key
const LS_LOCAL_ONLY = 'babycare_cloud_local';

function normalizeCloudUrl(url: string): string {
  let u = url.trim();
  // 小白常从 Supabase Data API 复制出带 /rest/v1/ 后缀的完整地址，自动修正为项目根 URL
  u = u.replace(/\/rest\/v1\/?$/i, '');
  u = u.replace(/\/+$/, '');
  return u;
}

/**
 * 解析当前生效的配置：优先用户本机覆盖（localStorage），回退到部署级默认值。
 * 只有用户显式清空（closeCloud）或用空串保存时，才视为未配置。
 * 实际请求基地址由 apiBaseUrl() 决定（线上走 /api 代理，本地直连）。
 */
function resolveConfig(): { url: string; key: string; userOverridden: boolean } {
  try {
    const s = JSON.parse(localStorage.getItem('babycare_cloud') || '{}');
    if (typeof s.url === 'string' && typeof s.key === 'string' && s.url.trim() && s.key.trim()) {
      return { url: normalizeCloudUrl(s.url), key: s.key.trim(), userOverridden: true };
    }
  } catch { /* ignore */ }
  // 回退到部署默认值
  if (DEFAULT_SUPABASE_URL.trim() && DEFAULT_SUPABASE_ANON_KEY.trim()) {
    return { url: normalizeCloudUrl(DEFAULT_SUPABASE_URL), key: DEFAULT_SUPABASE_ANON_KEY.trim(), userOverridden: false };
  }
  return { url: '', key: '', userOverridden: false };
}

export function cloudInit(): void {
  try {
    localOnly = localStorage.getItem(LS_LOCAL_ONLY) === '1';
  } catch { /* ignore */ }
  if (localOnly) {
    enabled = false;
    return;
  }
  const c = resolveConfig();
  if (c.url && c.key) {
    cfg = { url: apiBaseUrl(), key: c.key };
    enabled = true;
  }
}

export function cloudSave(url: string, key: string): void {
  const u = normalizeCloudUrl(url);
  const k = key.trim();
  if (!u || !k) {
    // 清空：删除本地覆盖，回退到部署默认值（若默认值缺失则进入未配置态）
    localStorage.removeItem('babycare_cloud');
  } else {
    localStorage.setItem('babycare_cloud', JSON.stringify({ url: u, key: k }));
  }
  cfg = { url: apiBaseUrl(), key: k };
  enabled = !!(u && k);
}

/** 用户主动切换到纯本地模式（忽略部署默认值） */
export function setLocalOnly(on: boolean): void {
  localOnly = on;
  if (on) {
    localStorage.setItem(LS_LOCAL_ONLY, '1');
    enabled = false;
  } else {
    localStorage.removeItem(LS_LOCAL_ONLY);
    const c = resolveConfig();
    enabled = !!(c.url && c.key);
    if (enabled) cfg = { url: apiBaseUrl(), key: c.key };
  }
}

export function isLocalOnly(): boolean {
  return localOnly;
}

/** 当前是否为用户手动覆盖（用于「我的」页判断显示预置值还是用户值） */
export function cloudUserOverridden(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem('babycare_cloud') || '{}');
    return !!(s.url && s.key);
  } catch {
    return false;
  }
}

export function cloudEnabled(): boolean {
  return enabled;
}

export function cloudUrl(): string {
  return cfg.url;
}

export function cloudKey(): string {
  return cfg.key;
}

/** 登录成功后注入用户 JWT，使云端请求以 authenticated 身份过 RLS（挡外人） */
export function setAuthToken(t: string | null): void {
  authToken = t;
}

/** 取当前鉴权令牌（auth.ts / store 之外的场景用，如清空云端数据） */
export function getAuthToken(): string | null {
  return authToken;
}

function headers(): Record<string, string> {
  const token = authToken || cfg.key;
  return {
    apikey: cfg.key,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };
}

export async function cloudPull(db: DB): Promise<DB> {
  if (!enabled) return db;
  const next: DB = { ...db };
  for (const tb of TABLES) {
    try {
      const r = await fetch(`${cfg.url}/rest/v1/${tb}?select=*`, { headers: headers() });
      if (!r.ok) continue;
      const rows = (await r.json()) as any[];
      const map = new Map<string, any>();
      (next[tb] as any[]).forEach((x) => map.set(x.id, x));
      rows.forEach((x) => {
        const ex = map.get(x.id);
        if (!ex || (x.updatedAt || 0) > (ex.updatedAt || 0)) map.set(x.id, x);
      });
      (next as any)[tb] = Array.from(map.values());
    } catch { /* per-table best effort */ }
  }
  return next;
}

export async function cloudPush(db: DB): Promise<void> {
  if (!enabled) return;
  let failed = 0;
  for (const tb of TABLES) {
    const rows = (db[tb] as any[]);
    if (!rows.length) continue;
    try {
      const r = await fetch(`${cfg.url}/rest/v1/${tb}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(rows),
      });
      if (!r.ok) failed++;
    } catch { failed++; }
  }
  if (failed) throw new Error(`push_failed:${failed}`);
}

/** 删除云端某个宝宝及其全部关联数据；本地已删，push 不会自动删云端，必须显式调 DELETE */
export async function cloudDeleteBaby(babyId: string): Promise<void> {
  if (!enabled) return;
  const h = { apikey: cfg.key, Authorization: `Bearer ${authToken || cfg.key}` };
  const tables = ['feedings', 'diapers', 'sleeps', 'temps', 'medicines', 'medicals', 'weights', 'consumptions', 'babies'];
  for (const tb of tables) {
    try {
      const col = tb === 'babies' ? 'id' : 'babyId';
      const r = await fetch(`${cfg.url}/rest/v1/${tb}?${col}=eq.${encodeURIComponent(babyId)}`, {
        method: 'DELETE',
        headers: h,
      });
      if (!r.ok && r.status !== 404) {
        // 允许不存在；其他错误继续处理下一张表
      }
    } catch { /* best effort */ }
  }
}

export async function cloudTest(url: string, key: string): Promise<string> {
  const u = apiBaseUrl();
  const r = await fetch(`${u}/rest/v1/babies?select=id&limit=1`, {
    headers: { apikey: key.trim(), Authorization: `Bearer ${key.trim()}` },
  });
  if (r.ok) return `✅ OK (HTTP ${r.status})`;
  const body = await r.text();
  return `❌ HTTP ${r.status}: ${body.slice(0, 120)}`;
}

export type { TableName };
