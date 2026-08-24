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

import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, apiBaseUrl } from './config';

function normalizeAuthUrl(url: string): string {
  let u = url.trim();
  u = u.replace(/\/rest\/v1\/?$/i, '');
  u = u.replace(/\/+$/, '');
  return u;
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
  // 回退到部署级默认值
  if (!rawUrl || !rawKey) {
    rawUrl = DEFAULT_SUPABASE_URL;
    rawKey = DEFAULT_SUPABASE_ANON_KEY;
  }
  if (!rawUrl.trim() || !rawKey.trim()) return { url: '', key: '' };
  // 实际请求基地址：线上走 /api 代理，本地直连
  return { url: apiBaseUrl(), key: rawKey.trim() };
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

export function setSession(s: SaSession) {
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

/** 是否已配置 Supabase（URL + anon key） */
export function cloudConfigured(): boolean {
  const { url, key } = cfg();
  return !!(url && key);
}

function toSession(j: Record<string, any>): SaSession {
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    token_type: j.token_type,
    expires_in: j.expires_in,
    user: {
      id: j.user?.id,
      phone: j.user?.phone,
      email: j.user?.email,
      app_metadata: j.user?.app_metadata,
      user_metadata: j.user?.user_metadata,
    },
  };
}

/** 连通性测试：Supabase Auth health 端点（无需业务表） */
export async function testCloudConn(): Promise<string> {
  const { url, key } = cfg();
  if (!url || !key) return '❌ 未配置 Supabase（URL 与 anon key）';
  try {
    const r = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      if (j.is_healthy === false) return '❌ Supabase 返回不健康状态';
      return `✅ Supabase 连接正常 (HTTP ${r.status})`;
    }
    const body = await r.text();
    return `❌ HTTP ${r.status}: ${body.slice(0, 120)}`;
  } catch (e) {
    return '❌ 网络错误：' + (e instanceof Error ? e.message : '未知');
  }
}

/** 邮箱注册（Supabase Auth signup） */
export async function signupEmail(emailRaw: string, password: string): Promise<AuthRes> {
  const { url, key } = cfg();
  if (!url || !key) return { error: '请先配置 Supabase（URL 与 anon key）' };
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: '请输入正确的邮箱地址' };
  if (password.length < 6) return { error: '密码至少 6 位' };
  try {
    const r = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.error_description || j.message || `注册失败 (HTTP ${r.status})` };
    if (j.access_token && j.user) {
      const session = toSession(j);
      setSession(session);
      return { session };
    }
    return { error: '注册已提交：请查收邮箱确认链接后登录。若收不到，可在 Supabase → Auth → Settings 关闭 Email confirmation' };
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

/** 邮箱密码登录（Supabase Auth token grant_type=password） */
export async function loginEmail(emailRaw: string, password: string): Promise<AuthRes> {
  const { url, key } = cfg();
  if (!url || !key) return { error: '请先配置 Supabase（URL 与 anon key）' };
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) return { error: '请输入邮箱和密码' };
  try {
    const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.error_description || j.message || `登录失败 (HTTP ${r.status})` };
    const session = toSession(j);
    setSession(session);
    return { session };
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

/** 手机号+密码登录（需先在「我的」页给邮箱账号绑定手机号） */
export async function loginPhone(phoneRaw: string, password: string): Promise<AuthRes> {
  const { url, key } = cfg();
  if (!url || !key) return { error: '请先配置 Supabase（URL 与 anon key）' };
  const phone = fullPhone(phoneRaw);
  if (!/^\+86\d{11}$/.test(phone)) return { error: '请输入 11 位手机号' };
  if (!password) return { error: '请输入密码' };
  try {
    const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ phone, password }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.error_description || j.message || `登录失败 (HTTP ${r.status})` };
    const session = toSession(j);
    setSession(session);
    return { session };
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

/** 发送邮箱验证码（忘记密码 / OTP） */
export async function sendEmailOtp(emailRaw: string): Promise<AuthRes> {
  const { url, key } = cfg();
  if (!url || !key) return { error: '请先配置 Supabase（URL 与 anon key）' };
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: '请输入正确的邮箱地址' };
  try {
    const r = await fetch(`${url}/auth/v1/otp`, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ email, options: { shouldCreateUser: false, email_otp_type: 'numeric' } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.message || `发送失败 (HTTP ${r.status})` };
    return {};
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

/** 校验邮箱验证码（OTP） */
export async function verifyEmailOtp(emailRaw: string, token: string): Promise<AuthRes> {
  const { url, key } = cfg();
  if (!url || !key) return { error: '请先配置 Supabase（URL 与 anon key）' };
  const email = emailRaw.trim().toLowerCase();
  if (!token.trim()) return { error: '请输入验证码' };
  try {
    const r = await fetch(`${url}/auth/v1/verify`, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ email, token: token.trim(), type: 'email' }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.message || `验证失败 (HTTP ${r.status})` };
    const session = toSession(j);
    setSession(session);
    return { session };
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

/** 修改当前登录用户的密码 */
export async function updatePassword(newPassword: string): Promise<AuthRes> {
  const { url, key } = cfg();
  const s = getSession();
  if (!url || !key || !s) return { error: '请先登录' };
  if (newPassword.length < 6) return { error: '密码至少 6 位' };
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      method: 'PUT',
      headers: { ...headers(key), Authorization: `Bearer ${s.access_token}` },
      body: JSON.stringify({ password: newPassword }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.message || `修改失败 (HTTP ${r.status})` };
    return {};
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
}

/** 给当前账号绑定手机号（绑定后可用手机号+密码登录） */
export async function bindPhone(phoneRaw: string): Promise<AuthRes> {
  const { url, key } = cfg();
  const s = getSession();
  if (!url || !key || !s) return { error: '请先登录' };
  const phone = fullPhone(phoneRaw);
  if (!/^\+86\d{11}$/.test(phone)) return { error: '请输入 11 位手机号' };
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      method: 'PUT',
      headers: { ...headers(key), Authorization: `Bearer ${s.access_token}` },
      body: JSON.stringify({ phone }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.msg || j.message || `绑定失败 (HTTP ${r.status})` };
    // 更新本地 session 中的 phone
    const s2 = getSession();
    if (s2) {
      setSession({ ...s2, user: { ...s2.user, phone } });
    }
    return {};
  } catch (e) {
    return { error: '网络错误：' + (e instanceof Error ? e.message : '未知') };
  }
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
