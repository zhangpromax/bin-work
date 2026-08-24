'use client';

import React, { useState, useEffect } from 'react';
import { CapyLogo } from './Capy';
import {
  cloudConfigured,
  testCloudConn,
  loginEmail,
  loginPhone,
  signupEmail,
  signInWechat,
  sendEmailOtp,
  verifyEmailOtp,
  updatePassword,
  SaSession,
} from '../lib/auth';
import { cloudSave } from '../lib/cloud';
import { logOperation } from '../lib/logs';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, hasDefaultCloud } from '../lib/config';

type Mode = 'login' | 'register' | 'forgot';

const LS_ACCOUNT = 'babycare_remember_account';

function readRemembered(): { email?: string; phone?: string } {
  try {
    return JSON.parse(localStorage.getItem(LS_ACCOUNT) || '{}');
  } catch {
    return {};
  }
}

function isDevHost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.');
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-input-wrap">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={show ? '' : 'pwd-hidden'}
        autoComplete="new-password"
      />
      <button
        type="button"
        className="pwd-toggle"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
      >
        {show ? '隐藏' : '显示'}
      </button>
    </div>
  );
}

export function LoginView({ onLogin }: { onLogin: (session?: SaSession) => void }) {
  // 部署时若已预置默认值，普通用户无需填云端配置，直接进入登录/注册
  const [configured, setConfigured] = useState(cloudConfigured() || hasDefaultCloud());

  // 配置表单（仅当无任何可用配置时出现，且预填默认值，几乎不用手改）
  const [url, setUrl] = useState(DEFAULT_SUPABASE_URL);
  const [key, setKey] = useState(DEFAULT_SUPABASE_ANON_KEY);
  const [cfgMsg, setCfgMsg] = useState('');
  const [savingCfg, setSavingCfg] = useState(false);

  // 视图模式
  const [mode, setMode] = useState<Mode>('login');
  // 登录方式：邮箱密码 / 手机验证码
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phonePwd, setPhonePwd] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 该设备登录过的账号自动填充，免手输
  useEffect(() => {
    const r = readRemembered();
    if (r.email) setEmail(r.email);
    if (r.phone) setPhone(r.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rememberAccount() {
    try {
      const r = readRemembered();
      localStorage.setItem(LS_ACCOUNT, JSON.stringify({ ...r, email: email.trim(), phone: phone.trim() }));
    } catch { /* ignore */ }
  }

  // 倒计时清理
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // 所有提示/弹窗内容 1 秒后自动关闭
  useEffect(() => {
    if (!err && !success && !cfgMsg) return;
    const t = setTimeout(() => {
      setErr('');
      setSuccess('');
      setCfgMsg('');
    }, 1000);
    return () => clearTimeout(t);
  }, [err, success, cfgMsg]);

  function showError(msg: string) {
    setErr(msg);
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErr('');
    setSuccess('');
    setCountdown(0);
  }

  function saveCfg() {
    setCfgMsg('');
    if (!url.trim() || !key.trim()) {
      setCfgMsg('❌ 请填写 URL 和 anon key');
      return;
    }
    cloudSave(url, key);
    setSavingCfg(true);
    testCloudConn()
      .then((msg) => {
        if (msg.startsWith('✅')) {
          setCfgMsg('✅ 配置已保存，Supabase 连接正常');
          setConfigured(true);
        } else {
          setCfgMsg(msg);
        }
      })
      .catch((e) => setCfgMsg('❌ 网络/CORS 错误：' + (e.message || 'Failed to fetch')))
      .finally(() => setSavingCfg(false));
  }

  async function submitLogin() {
    setErr('');
    setSuccess('');
    if (isDevHost()) {
      onLogin();
      return;
    }
    if (!email.trim() || !password) {
      showError('请输入邮箱和密码');
      return;
    }
    setLoading(true);
    const res = await loginEmail(email, password);
    setLoading(false);
    if (res.error) {
      showError(res.error);
      logOperation('login_fail', res.error);
      return;
    }
    if (res.session) {
      rememberAccount();
      logOperation('login_ok', `email=${email}`);
      onLogin(res.session);
    }
  }

  async function submitRegister() {
    setErr('');
    setSuccess('');
    if (isDevHost()) {
      onLogin();
      return;
    }
    if (!email.trim() || !password) {
      showError('请输入邮箱和密码');
      return;
    }
    if (password.length < 6) {
      showError('密码至少 6 位');
      return;
    }
    if (password !== confirm) {
      showError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    const res = await signupEmail(email, password);
    setLoading(false);
    if (res.error) {
      showError(res.error);
      logOperation('register_fail', res.error);
      return;
    }
    logOperation('register_ok', `email=${email}`);
    if (res.session) {
      rememberAccount();
      showSuccess('注册成功');
      setTimeout(() => onLogin(res.session), 1000);
    } else {
      showSuccess('注册已提交，请查收邮件');
      setTimeout(() => switchMode('login'), 1000);
    }
  }

  // 手机号+密码登录
  async function submitPhoneLogin() {
    setErr('');
    setSuccess('');
    if (isDevHost()) {
      onLogin();
      return;
    }
    if (!phone.trim() || !phonePwd) {
      showError('请输入手机号和密码');
      return;
    }
    setLoading(true);
    const res = await loginPhone(phone, phonePwd);
    setLoading(false);
    if (res.error) {
      showError(res.error);
      logOperation('phone_login_fail', res.error);
      return;
    }
    if (res.session) {
      rememberAccount();
      logOperation('phone_login_ok', `phone=${phone}`);
      onLogin(res.session);
    }
  }

  async function sendForgotCode() {
    setErr('');
    setSuccess('');
    if (!email.trim()) {
      showError('请输入邮箱');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('请输入正确的邮箱地址');
      return;
    }
    setLoading(true);
    const res = await sendEmailOtp(email);
    setLoading(false);
    if (res.error) {
      showError(res.error);
      logOperation('forgot_send_fail', res.error);
      return;
    }
    logOperation('forgot_send_ok', `email=${email}`);
    showSuccess('验证码已发送，请查收邮件');
    setOtp('');
    setCountdown(60);
  }

  async function submitForgotReset() {
    setErr('');
    setSuccess('');
    if (!email.trim() || !otp.trim() || !password || !confirm) {
      showError('请填写完整信息');
      return;
    }
    if (password.length < 6) {
      showError('密码至少 6 位');
      return;
    }
    if (password !== confirm) {
      showError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    const verifyRes = await verifyEmailOtp(email, otp);
    if (verifyRes.error) {
      setLoading(false);
      showError(verifyRes.error);
      logOperation('forgot_verify_fail', verifyRes.error);
      return;
    }
    logOperation('forgot_verify_ok', `email=${email}`);
    const updateRes = await updatePassword(password);
    setLoading(false);
    if (updateRes.error) {
      showError(updateRes.error);
      logOperation('reset_password_fail', updateRes.error);
      return;
    }
    logOperation('reset_password_ok', `email=${email}`);
    showSuccess('密码修改成功');
    setTimeout(() => switchMode('login'), 1000);
  }

  function wechatLogin() {
    if (isDevHost()) {
      onLogin();
      return;
    }
    const r = signInWechat();
    if (r.error) showError(r.error);
  }

  // 未配置 Supabase：先引导配置
  if (!configured) {
    return (
      <div className="login">
        <div className="login-hero">
          <CapyLogo size={92} />
          <h1 className="login-title">水豚噜噜</h1>
        </div>

        <div className="login-card">
          <h3 style={{ margin: '0 0 14px', color: '#5A3E2B' }}>🌩 连接云端</h3>
          <p className="login-tip" style={{ marginBottom: 12 }}>
            本应用已内置云端配置，正常情况下无需填写。若打开仍是此页，说明部署时未预置 Supabase 信息，需由部署者配置（已为你预填，直接点保存即可）。
          </p>

          <div className="login-form">
            <label>Supabase URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxx.supabase.co"
            />
            <label>anon key</label>
            <PasswordInput
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
            {(cfgMsg || err || success) && (
              <div
                className="login-msg"
                style={{
                  color: err ? 'var(--red)' : success ? '#2E9B5B' : cfgMsg?.startsWith('✅') ? '#2E9B5B' : 'var(--red)',
                }}
              >
                {err || success || cfgMsg}
              </div>
            )}
            <button className="btn login-btn" onClick={saveCfg} disabled={savingCfg}>
              {savingCfg ? '测试中...' : '保存并测试连接'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 登录视图
  if (mode === 'login') {
    return (
      <div className="login">
        <div className="login-hero">
          <CapyLogo size={92} />
          <h1 className="login-title">水豚噜噜</h1>
        </div>

        <div className="login-card">
          <div className="login-form">
            <div className="method-tabs">
              <button
                type="button"
                className={'mt ' + (authMethod === 'email' ? 'on' : '')}
                onClick={() => { setAuthMethod('email'); setErr(''); setSuccess(''); }}
              >
                邮箱登录
              </button>
              <button
                type="button"
                className={'mt ' + (authMethod === 'phone' ? 'on' : '')}
                onClick={() => { setAuthMethod('phone'); setErr(''); setSuccess(''); }}
              >
                手机号登录
              </button>
            </div>

            {authMethod === 'email' ? (
              <>
                <label>邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <label>密码</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                />
                {(err || success) && <div className={`login-msg ${err ? 'err' : 'ok'}`}>{err || success}</div>}
                <button className="btn login-btn" onClick={submitLogin} disabled={loading}>
                  {loading ? '处理中...' : '登录'}
                </button>

                <div className="login-links">
                  <button type="button" className="login-link" onClick={() => switchMode('register')}>
                    注册
                  </button>
                  <div className="login-forgot">
                    <button type="button" className="login-link" onClick={() => switchMode('forgot')}>
                      忘记密码
                    </button>
                    <span className="login-link-hint">使用邮箱验证来设置新的密码</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <label>手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入 11 位手机号"
                  maxLength={11}
                />
                <label>密码</label>
                <PasswordInput
                  value={phonePwd}
                  onChange={(e) => setPhonePwd(e.target.value)}
                  placeholder="请输入密码"
                />
                {(err || success) && <div className={`login-msg ${err ? 'err' : 'ok'}`}>{err || success}</div>}
                <button className="btn login-btn" onClick={submitPhoneLogin} disabled={loading}>
                  {loading ? '处理中...' : '登录'}
                </button>
                <p className="login-tip center">手机号需先在「我的」页绑定到邮箱账号</p>
              </>
            )}

            <button className="btn wx-btn" onClick={wechatLogin}>
              <span className="wx-ic">💬</span> 微信授权登录
            </button>
            {authMethod === 'email' && <p className="login-tip center">首次使用请先注册创建账号。</p>}
          </div>
        </div>
      </div>
    );
  }

  // 注册视图
  if (mode === 'register') {
    return (
      <div className="login">
        <div className="login-hero">
          <CapyLogo size={92} />
          <h1 className="login-title">水豚噜噜</h1>
        </div>

        <div className="login-card">
          <div className="login-form">
            <h3 style={{ margin: '0 0 12px', color: '#5A3E2B', textAlign: 'center' }}>注册账号</h3>
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <label>密码</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
            />
            <label>确认密码</label>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再输一次密码"
            />
            {(err || success) && <div className={`login-msg ${err ? 'err' : 'ok'}`}>{err || success}</div>}
            <button className="btn login-btn" onClick={submitRegister} disabled={loading}>
              {loading ? '处理中...' : '注册'}
            </button>

            <div className="login-links" style={{ justifyContent: 'center', marginTop: 14 }}>
              <button type="button" className="login-link" onClick={() => switchMode('login')}>
                已有账号？返回登录
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 忘记密码：一页式表单
  if (mode === 'forgot') {
    return (
      <div className="login">
        <div className="login-hero">
          <CapyLogo size={92} />
          <h1 className="login-title">水豚噜噜</h1>
        </div>

        <div className="login-card">
          <div className="login-form">
            <div className="login-card-header">
              <h3>找回密码</h3>
              <button type="button" className="login-link" onClick={() => switchMode('login')}>
                去登录
              </button>
            </div>

            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
            />

            <label>验证码</label>
            <div className="code-row">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="请输入邮箱验证码"
                maxLength={8}
              />
              <button
                type="button"
                className="btn code-btn"
                onClick={sendForgotCode}
                disabled={loading || countdown > 0}
              >
                {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
              </button>
            </div>

            <label>新密码</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入新的登录密码"
            />

            <label>确认密码</label>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次确认密码"
            />

            {(err || success) && <div className={`login-msg ${err ? 'err' : 'ok'}`}>{err || success}</div>}

            <button className="btn login-btn" onClick={submitForgotReset} disabled={loading}>
              {loading ? '保存中...' : '确定'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
