'use client';

import React, { useState } from 'react';
import { CapyLogo } from './Capy';
import { mockLogin } from '../lib/auth';

/** 测试用登录页：手机号+验证码 / 微信授权，本地模拟登录，不依赖后端 */
export function LoginView({ onLogin }: { onLogin: () => void }) {
  const [tab, setTab] = useState<'phone' | 'wechat'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState('');

  function getCode() {
    if (!/^1\d{10}$/.test(phone)) {
      setErr('请输入正确的 11 位手机号');
      return;
    }
    setErr('');
    setSent(true);
    setCount(60);
    const timer = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function loginByPhone() {
    if (!/^1\d{10}$/.test(phone)) {
      setErr('请输入正确的 11 位手机号');
      return;
    }
    if (code.trim() !== '1234') {
      setErr('测试验证码为 1234');
      return;
    }
    mockLogin(phone);
    onLogin();
  }

  function loginByWechat() {
    mockLogin('wechat');
    onLogin();
  }

  return (
    <div className="login">
      <div className="login-hero">
        <CapyLogo size={92} />
        <h1 className="login-title">水豚噜噜</h1>
        <p className="login-sub">宝宝成长记录 · 欢迎回家</p>
      </div>

      <div className="login-card">
        <div className="login-seg">
          <button
            className={'ls ' + (tab === 'phone' ? 'on' : '')}
            onClick={() => {
              setTab('phone');
              setErr('');
            }}
          >
            手机号登录
          </button>
          <button
            className={'ls ' + (tab === 'wechat' ? 'on' : '')}
            onClick={() => {
              setTab('wechat');
              setErr('');
            }}
          >
            微信授权
          </button>
        </div>

        {tab === 'phone' && (
          <div className="login-form">
            <label>手机号</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="请输入 11 位手机号"
              inputMode="numeric"
              maxLength={11}
            />
            <label>验证码</label>
            <div className="code-row">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="测试验证码 1234"
                inputMode="numeric"
                maxLength={6}
              />
              <button className="btn sm code-btn" disabled={count > 0} onClick={getCode}>
                {count > 0 ? `${count}s` : sent ? '重新发送' : '获取验证码'}
              </button>
            </div>
            {err && <div className="login-err">{err}</div>}
            <button className="btn login-btn" onClick={loginByPhone}>
              登录
            </button>
            <p className="login-tip">测试模式：验证码固定为 1234，无需真实短信</p>
          </div>
        )}

        {tab === 'wechat' && (
          <div className="login-form">
            <p className="login-tip center">点击下方按钮模拟微信授权登录</p>
            <button className="btn wx-btn" onClick={loginByWechat}>
              <span className="wx-ic">💬</span> 微信授权登录
            </button>
            <p className="login-tip">测试模式：点击即登录，不跳转微信</p>
          </div>
        )}
      </div>
    </div>
  );
}
