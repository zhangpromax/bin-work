import { DB, TableName, TABLES } from './types';

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

export function cloudInit(): void {
  try {
    const s = JSON.parse(localStorage.getItem('babycare_cloud') || '{}');
    if (s.url && s.key) {
      cfg = { url: s.url, key: s.key };
      enabled = true;
    }
  } catch { /* ignore */ }
}

export function cloudSave(url: string, key: string): void {
  cfg = { url: url.trim(), key: key.trim() };
  localStorage.setItem('babycare_cloud', JSON.stringify(cfg));
  enabled = !!(cfg.url && cfg.key);
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

function headers(): Record<string, string> {
  return {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
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

export async function cloudTest(url: string, key: string): Promise<string> {
  const r = await fetch(`${url.trim()}/rest/v1/babies?select=id&limit=1`, {
    headers: { apikey: key.trim(), Authorization: `Bearer ${key.trim()}` },
  });
  if (r.ok) return `✅ OK (HTTP ${r.status})`;
  const body = await r.text();
  return `❌ HTTP ${r.status}: ${body.slice(0, 120)}`;
}

export type { TableName };
