/**
 * Cloudflare Pages Functions 反向代理
 * 浏览器/手机 -> https://bin-work.pages.dev/api/xxx
 * Cloudflare 服务器 -> https://kltqzleqiqykvpilcckr.supabase.co/xxx
 *
 * 作用：绕过中国大陆对 supabase.co 子域名的 DNS 污染/阻断。
 * 终端用户只需能访问 bin-work.pages.dev，由 Cloudflare 代为请求 Supabase。
 */

const SUPABASE_URL = 'https://mbhvjtbtatphgnhoqlye.supabase.co';

// 本地类型声明，避免依赖 @cloudflare/workers-types（Next build 不会处理 functions 目录的类型）
type PagesFunction = (context: {
  request: Request;
  params: Record<string, string | string[]>;
  url?: URL;
}) => Promise<Response>;

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;
  const segments = params.path as string[];
  const path = segments.join('/');
  const url = new URL(request.url);

  // 组装目标 URL：/api/auth/v1/... -> https://<ref>.supabase.co/auth/v1/...
  const target = SUPABASE_URL + '/' + path + url.search;

  // 透传请求头，但去掉 host（避免 Supabase 校验 host 失败）
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('host', new URL(SUPABASE_URL).host);

  // 重构请求体（GET/HEAD 无 body）
  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers,
    redirect: 'follow',
  };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = request.body;
    // @ts-expect-error duplex 是 fetch 标准但 TS 类型未完全覆盖
    init.duplex = 'half';
  }

  try {
    const resp = await fetch(target, init);
    // 透传响应（含 CORS 头已由 Supabase 返回，这里原样转发）
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'proxy_failed', detail: String(e) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
