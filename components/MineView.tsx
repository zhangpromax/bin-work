'use client';

import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { t } from '../lib/i18n';
import { isLocalOnly } from '../lib/cloud';
import { bindPhone } from '../lib/auth';
import { logOperation } from '../lib/logs';

export function MineView() {
  const { cloudOn, syncNow, setLocalMode, usingDefaultCloud, loadSamples, clearData, exportData, importData, toast, theme, setTheme, isLoggedIn, currentUser, login, loginWithSession, logout } = useStore();
  const [sub, setSub] = useState<'main' | 'sync'>('main');
  const [localMode, setLocalModeState] = useState(isLocalOnly());
  const [bindOpen, setBindOpen] = useState(false);
  const [bindPhoneNum, setBindPhoneNum] = useState('');
  const [bindLoading, setBindLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const accountLabel = currentUser?.phone
    ? (currentUser.phone.startsWith('+86') ? currentUser.phone.slice(3) : currentUser.phone)
    : currentUser?.email || '本地用户';

  async function doBindPhone() {
    if (!bindPhoneNum.trim()) { toast('请输入手机号'); return; }
    setBindLoading(true);
    const res = await bindPhone(bindPhoneNum);
    setBindLoading(false);
    if (res.error) {
      toast(res.error);
      logOperation('bind_phone_fail', res.error);
      return;
    }
    logOperation('bind_phone_ok', `phone=${bindPhoneNum}`);
    loginWithSession(); // 刷新当前账号显示
    setBindOpen(false);
    setBindPhoneNum('');
    toast('手机号绑定成功 ✓');
  }

  // 同步设置功能页（点击入口进入，不在 Mine 主页展开）
  if (sub === 'sync') {
    return (
      <main>
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => setSub('main')}>← {t('tabmine') === 'Mine' ? 'Back' : '返回'}</button>
        <div className="card">
          <h3><span className="ic">⚙️</span>{t('syncset')}</h3>
          <div className="row">
            <span className="muted">{t('tabmine') === 'Mine' ? 'Status' : '状态'}</span>
            <span className={cloudOn ? 'tag' : 'tag gray'}>{cloudOn ? t('syncon') : t('syncoff')}</span>
          </div>
          <div className="mini" style={{ margin: '10px 0' }}>
            {t('tabmine') === 'Mine' ? 'Tap to force a one-time sync with the cloud.' : '点击立即与云端同步一次。'}
          </div>
          <button className="btn" onClick={() => syncNow()}>🔄 {t('tabmine') === 'Mine' ? 'Sync Now' : '立即同步'}</button>
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => {
            const next = !localMode;
            setLocalModeState(next);
            setLocalMode(next);
          }}>{localMode ? '☁ ' + (t('tabmine') === 'Mine' ? 'Enable Cloud' : '启用云端') : '📱 ' + (t('tabmine') === 'Mine' ? 'Local Only' : '仅本地模式')}</button>
          {usingDefaultCloud && (
            <div className="mini" style={{ color: '#2E9B5B', marginTop: 12 }}>
              ✅ {t('tabmine') === 'Mine' ? 'Cloud config is prebuilt by the deployer; no manual entry needed.' : '已内置云端配置（部署者预置），无需手动填写。'}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="card">
        <h3><span className="ic">👤</span>{t('tabmine') === 'Mine' ? 'Account' : '账号'}</h3>
        {isLoggedIn ? (
          <>
            <div className="row">
              <span className="muted">{t('tabmine') === 'Mine' ? 'Current' : '当前账号'}</span>
              <span className="tag">{accountLabel}</span>
            </div>
            {!currentUser?.phone && (
              <div style={{ marginTop: 10 }}>
                {!bindOpen ? (
                  <button className="btn ghost" onClick={() => setBindOpen(true)}>
                    📱 {t('tabmine') === 'Mine' ? 'Bind Phone' : '绑定手机号'}
                  </button>
                ) : (
                  <div>
                    <input
                      type="tel"
                      value={bindPhoneNum}
                      onChange={(e) => setBindPhoneNum(e.target.value)}
                      placeholder="请输入 11 位手机号"
                      maxLength={11}
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                    <button className="btn" onClick={doBindPhone} disabled={bindLoading}>
                      {bindLoading ? '绑定中...' : '确认绑定'}
                    </button>
                    <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => setBindOpen(false)}>
                      取消
                    </button>
                  </div>
                )}
                <div className="mini" style={{ marginTop: 6 }}>
                  {t('tabmine') === 'Mine'
                    ? 'After binding, you can also sign in with phone + password.'
                    : '绑定后可用手机号+密码登录'}
                </div>
              </div>
            )}
            <button className="btn red" style={{ marginTop: 10 }} onClick={logout}>
              {t('tabmine') === 'Mine' ? 'Sign Out' : '退出登录'}
            </button>
          </>
        ) : (
          <button className="btn" style={{ marginTop: 4 }} onClick={() => login()}>
            {t('tabmine') === 'Mine' ? 'Sign In' : '登录'}
          </button>
        )}
      </div>

      <div className="card" style={{ cursor: 'pointer' }} onClick={() => setSub('sync')}>
        <h3><span className="ic">⚙️</span>{t('syncset')}</h3>
        <div className="row">
          <span className="muted">{t('tabmine') === 'Mine' ? 'Cloud Sync' : '云端同步'}</span>
          <span className={cloudOn ? 'tag' : 'tag gray'}>{cloudOn ? t('syncon') : t('syncoff')} →</span>
        </div>
      </div>

      <div className="card">
        <h3><span className="ic">🎨</span>{t('theme')}</h3>
        <div className="mini" style={{ marginBottom: 10 }}>{t('themeTip')}</div>
        <div className="seg">
          <button className={theme === 'static' ? 'on' : ''} onClick={() => setTheme('static')}>
            🖼 {t('themeStatic')}
          </button>
          <button className={theme === 'dynamic' ? 'on' : ''} onClick={() => setTheme('dynamic')}>
            ✨ {t('themeDynamic')}
          </button>
        </div>
      </div>

      <div className="card">
        <h3><span className="ic">💾</span>{t('tabmine') === 'Mine' ? 'Data' : '数据'}</h3>
        <button className="btn ghost" style={{ marginBottom: 10 }} onClick={exportData}>⬇ {t('export')}</button>
        <button className="btn ghost" style={{ marginBottom: 10 }} onClick={() => fileRef.current?.click()}>⬆ {t('import')}</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; }} />
        <button className="btn ghost" onClick={loadSamples}>✨ {t('samples')}</button>
        <button className="btn red" style={{ marginTop: 10 }} onClick={clearData}>🗑 {t('clearData')}</button>
      </div>

      <div className="card">
        <h3><span className="ic">ℹ️</span>{t('about')}</h3>
        <div className="mini">Next.js 版 · 数据默认存本地浏览器；配置云端后自动双向同步。</div>
      </div>
    </main>
  );
}
