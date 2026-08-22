/**
 * 登录适配层（Supabase Auth / GoTrue REST，无需官方 SDK）
 * - 复用云端同步已保存的 Supabase URL 与 anon key（localStorage: babycare_cloud）
 * - 手机号：signInWithOtp(短信验证码) -> verifyOtp
 * - 微信：signInWithOAuth(wechat)，走浏览器跳转 + 回调 hash 解析
 *
 * 前置：需在 Supabase 后台开启对应 provider
 *   - Auth > Providers > Phone（并配置短信服务商，如 Twilio / 国内网关）
 *   - Auth > Providers > 微信（填入微信开放平台 appid / secret，并配置回调域名）
 */

export interface SaUser {
  id: string;
  phone?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}
export interface SaSession {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  user: SaUser;
}

const LS_SESSION = 'babycare_session';
const LS_CLOUD = 'babycare_cloud';

function cfg(): { url: string; key: string } {
  try {
    const s = JSON.parse(localStorage.getItem(LS_CLOUD) || '{}');
    if (s.url && s.key) return { url: s.url.trim(), key: s.key.trim() };
  } catch { /* ignore */ }
  return { url: '', key: '' };
}

export function fullPhone(phone: string): string {
  const p = phone.trim();
  if (!p) return '';
  if (p.startsWith('+')) return p;
  return '+86' + p.replace(/[^0-9]/g, '');
}

export function getSession(): SaSession | null {
  try {
    const s = localStorage.getItem(LS_SESSION);
    if (s) return JSON.parse(s) as SaSession;
  } catch { /* ignore */ }
  return null;
}

function setSession(s: SaSession) {
  localStorage.setItem(LS_SESSION, JSON.stringify(s));
}
export function clearSession() {
  localStorage.removeItem(LS_SESSION);
}

function headers(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export interface AuthRes {
  session?: SaSession;
  error?: string;
}

export async function sendOtp(phoneRaw: string): Promise<AuthRes> {
  const { url, key } = cfg();
  if (!url || !key) {
    return { error: '请先在「我的」页配置 Supabase 云端同步（URL 与 anon key）后再登录' };
  }
  const phone = fullPhone(phoneRaw);
  if (!/^\+86\d{11}$/.test(phone)) {
    return { error: '请输入 11 位手机号' };
  }
  try {
    const r = await fetch(`${url}/auth/v1/otp`, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ phone, channel: 'sms' }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.message || `发送失败 (HTTP ${r.status})` };
    return {};
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

export async function verifyOtp(phoneRaw: string, token: string): Promise<AuthRes> {
  const { url, key } = cfg();
  if (!url || !key) return { error: 'Supabase 云端未配置' };
  const phone = fullPhone(phoneRaw);
  try {
    const r = await fetch(`${url}/auth/v1/verify`, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ phone, token: token.trim(), type: 'sms' }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.message || `验证失败 (HTTP ${r.status})` };
    const session: SaSession = {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      token_type: j.token_type,
      expires_in: j.expires_in,
      user: j.user,
    };
    setSession(session);
    return { session };
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

/** 微信授权：直接跳转 Supabase 授权页（浏览器接管） */
export function signInWechat(): { error?: string } {
  const { url, key } = cfg();
  if (!url || !key) {
    return { error: '请先在「我的」页配置 Supabase 云端同步（URL 与 anon key）后再登录' };
  }
  const redirect = window.location.origin + window.location.pathname;
  window.location.href = `${url}/auth/v1/authorize?provider=wechat&redirect_to=${encodeURIComponent(redirect)}`;
  return {};
}

/** 解析微信/第三方回调带回的 URL hash（implicit flow） */
export function parseHashSession(): SaSession | null {
  if (typeof window === 'undefined') return null;
  const h = window.location.hash;
  if (!h || !h.includes('access_token')) return null;
  const params = new URLSearchParams(h.replace(/^#/, ''));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  try {
    const user = JSON.parse(params.get('user') || '{}');
    const session: SaSession = {
      access_token,
      refresh_token,
      token_type: params.get('token_type') || undefined,
      expires_in: Number(params.get('expires_in')) || undefined,
      user: { id: user.id, phone: user.phone, email: user.email, app_metadata: user.app_metadata, user_metadata: user.user_metadata },
    };
    setSession(session);
    // 清理 hash
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return session;
  } catch {
    return null;
  }
}

export function signOut(): void {
  const { url, key } = cfg();
  const s = getSession();
  if (url && key && s) {
    fetch(`${url}/auth/v1/signout`, {
      method: 'POST',
      headers: { ...headers(key), Authorization: `Bearer ${s.access_token}` },
    }).catch(() => undefined);
  }
  clearSession();
}

/**
 * 本地测试登录：不依赖 Supabase 后台配置，仅用于本地预览确认画面。
 * 真实上线时改用 sendOtp / verifyOtp / signInWechat。
 */
export function mockLogin(phone?: string): SaSession {
  const session: SaSession = {
    access_token: 'local-mock',
    refresh_token: 'local-mock',
    user: { id: 'local-' + (phone || 'wechat'), phone: phone || undefined },
  };
  setSession(session);
  return session;
}
