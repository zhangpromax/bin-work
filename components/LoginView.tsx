'use client';

import React, { useState } from 'react';
import { CapyLogo } from './Capy';
import {
  cloudConfigured,
  testCloudConn,
  loginEmail,
  signupEmail,
  signInWechat,
  SaSession,
} from '../lib/auth';
import { cloudSave } from '../lib/cloud';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, hasDefaultCloud } from '../lib/config';

export function LoginView({ onLogin }: { onLogin: (session?: SaSession) => void }) {
  // 部署时若已预置默认值，普通用户无需填云端配置，直接进入登录/注册
  const [configured, setConfigured] = useState(cloudConfigured() || hasDefaultCloud());

  // 配置表单（仅当无任何可用配置时出现，且预填默认值，几乎不用手改）
  const [url, setUrl] = useState(DEFAULT_SUPABASE_URL);
  const [key, setKey] = useState(DEFAULT_SUPABASE_ANON_KEY);
  const [cfgMsg, setCfgMsg] = useState('');
  const [savingCfg, setSavingCfg] = useState(false);

  // 登录/注册
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

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

  async function submit() {
    setErr('');
    if (!email.trim() || !password) {
      setErr('请输入邮箱和密码');
      return;
    }
    setLoading(true);
    if (mode === 'register') {
      if (password.length < 6) {
        setErr('密码至少 6 位');
        setLoading(false);
        return;
      }
      if (password !== confirm) {
        setErr('两次输入的密码不一致');
        setLoading(false);
        return;
      }
      const res = await signupEmail(email, password);
      setLoading(false);
      if (res.error) {
        setErr(res.error);
        return;
      }
      if (res.session) onLogin(res.session);
    } else {
      const res = await loginEmail(email, password);
      setLoading(false);
      if (res.error) {
        setErr(res.error);
        return;
      }
      if (res.session) onLogin(res.session);
    }
  }

  function wechatLogin() {
    const r = signInWechat();
    if (r.error) setErr(r.error);
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
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              type="password"
            />
            {cfgMsg && (
              <div className="login-err" style={{ color: cfgMsg.startsWith('✅') ? '#2E9B5B' : undefined }}>
                {cfgMsg}
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

  // 已配置：登录 / 注册
  return (
    <div className="login">
      <div className="login-hero">
        <CapyLogo size={92} />
        <h1 className="login-title">水豚噜噜</h1>
      </div>

      <div className="login-card">
        <div className="login-form">
          <label>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
          />
          {mode === 'register' && (
            <>
              <label>确认密码</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再输一次密码"
              />
            </>
          )}
          {err && <div className="login-err">{err}</div>}
          <button className="btn login-btn" onClick={submit} disabled={loading}>
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
          </button>

          <div className="login-links">
            <button
              type="button"
              className="login-link"
              onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErr(''); }}
            >
              {mode === 'register' ? '已有账号？返回登录' : '注册入口'}
            </button>
            {mode === 'login' && (
              <div className="login-forgot">
                <button type="button" className="login-link" onClick={() => setErr('忘记密码功能开发中，请通过邮箱验证重置')}>
                  忘记密码入口
                </button>
                <span className="login-link-hint">使用邮箱验证来设置新的密码</span>
              </div>
            )}
          </div>

          <button className="btn wx-btn" onClick={wechatLogin}>
            <span className="wx-ic">💬</span> 微信授权登录
          </button>
          <p className="login-tip center">
            首次使用请先注册创建账号。
          </p>
        </div>
      </div>
    </div>
  );
}
