'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { t } from '../lib/i18n';
import { isLocalOnly } from '../lib/cloud';
import { bindPhone } from '../lib/auth';
import { logOperation } from '../lib/logs';

// 水豚噜噜预选头像：读取 public/capy-avatars 下的图片（往该目录丢图即自动出现）
import { avatarList } from '../lib/avatars';
const AVATARS: string[] = avatarList;

export function MineView() {
  const { cloudOn, syncNow, setLocalMode, usingDefaultCloud, loadSamples, clearData, exportData, importData, toast, theme, setTheme, isLoggedIn, currentUser, login, loginWithSession, logout, updateProfile, mineSub, setMineSub } = useStore();
  const [localMode, setLocalModeState] = useState(isLocalOnly());
  const [bindOpen, setBindOpen] = useState(false);
  const [bindPhoneNum, setBindPhoneNum] = useState('');
  const [bindLoading, setBindLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const accountLabel = currentUser?.phone
    ? (currentUser.phone.startsWith('+86') ? currentUser.phone.slice(3) : currentUser.phone)
    : currentUser?.email || '本地用户';

  // —— 个人资料页编辑态 ——
  const [nickname, setNickname] = useState(currentUser?.name || '');
  const [pickedAvatar, setPickedAvatar] = useState(currentUser?.avatar || AVATARS[0]);
  useEffect(() => {
    setNickname(currentUser?.name || '');
    setPickedAvatar(currentUser?.avatar || AVATARS[0]);
  }, [mineSub, currentUser?.name, currentUser?.avatar]);

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

  async function saveProfile() {
    await updateProfile({ name: nickname.trim(), avatar: pickedAvatar });
  }

  // 同步设置功能页
  if (mineSub === 'sync') {
    return (
      <main>
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => setMineSub('main')}>← {t('tabmine') === 'Mine' ? 'Back' : '返回'}</button>
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

  // 个人资料编辑页
  if (mineSub === 'userprofile') {
    return (
      <main>
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => setMineSub('main')}>← {t('tabmine') === 'Mine' ? 'Back' : '返回'}</button>
        <div className="card">
          <h3><span className="ic">👤</span>{t('tabmine') === 'Mine' ? 'My Profile' : '我的资料'}</h3>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            {pickedAvatar?.startsWith('data:') ? (
              <img className="profile-avatar-lg img" src={pickedAvatar} alt="avatar" />
            ) : (
              <img className="profile-avatar-lg img" src={pickedAvatar} alt="avatar" />
            )}
          </div>

          <label style={{ display: 'block', margin: '10px 0 6px', color: '#5A3E2B' }}>{t('tabmine') === 'Mine' ? 'Nickname' : '昵称'}</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('tabmine') === 'Mine' ? 'Your name' : '给自己起个昵称'}
            style={{ width: '100%' }}
          />

          <label style={{ display: 'block', margin: '14px 0 6px', color: '#5A3E2B' }}>{t('tabmine') === 'Mine' ? 'Avatar' : '头像（水豚噜噜）'}</label>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                className={'avatar-opt ' + (a === pickedAvatar ? 'on' : '')}
                onClick={() => setPickedAvatar(a)}
              ><img src={a} alt="avatar" /></button>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn ghost" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>
              📷 {t('tabmine') === 'Mine' ? 'Upload from device' : '从本地上传头像'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  if (dataUrl.length > 1_500_00) {
                    toast('图片太大，请选 1MB 以内的图');
                    return;
                  }
                  setPickedAvatar(dataUrl);
                };
                reader.readAsDataURL(f);
                e.target.value = '';
              }}
            />
          </div>

          <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={saveProfile}>
            {t('tabmine') === 'Mine' ? 'Save' : '保存'}
          </button>

          <div className="row" style={{ marginTop: 18 }}>
            <span className="muted">{t('tabmine') === 'Mine' ? 'Phone' : '手机号'}</span>
            <span className="tag">{currentUser?.phone ? (currentUser.phone.startsWith('+86') ? currentUser.phone.slice(3) : currentUser.phone) : (t('tabmine') === 'Mine' ? 'Not bound' : '未绑定')}</span>
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
                    {bindLoading ? (t('tabmine') === 'Mine' ? 'Binding...' : '绑定中...') : (t('tabmine') === 'Mine' ? 'Confirm' : '确认绑定')}
                  </button>
                  <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => setBindOpen(false)}>
                    {t('tabmine') === 'Mine' ? 'Cancel' : '取消'}
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
          {currentUser?.phone && (
            <div className="mini" style={{ marginTop: 6 }}>
              {t('tabmine') === 'Mine' ? 'Bound. Phone sign-in enabled.' : '已绑定，手机号登录已可用'}
            </div>
          )}
        </div>
      </main>
    );
  }

  // 主视图
  return (
    <main>
      {!isLoggedIn && (
        <div className="card">
          <button className="btn" style={{ marginTop: 4 }} onClick={() => login()}>
            {t('tabmine') === 'Mine' ? 'Sign In' : '登录'}
          </button>
        </div>
      )}

      <div className="card" style={{ cursor: 'pointer' }} onClick={() => setMineSub('sync')}>
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

      {isLoggedIn && (
        <div className="card">
          <button className="btn red" style={{ marginTop: 4 }} onClick={logout}>
            {t('tabmine') === 'Mine' ? 'Sign Out' : '退出登录'}
          </button>
        </div>
      )}

      <div className="card">
        <h3><span className="ic">ℹ️</span>{t('about')}</h3>
        <div className="mini">Next.js 版 · 数据默认存本地浏览器；配置云端后自动双向同步。</div>
      </div>
    </main>
  );
}
