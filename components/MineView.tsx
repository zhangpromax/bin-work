'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { t } from '../lib/i18n';
import { isLocalOnly } from '../lib/cloud';
import { bindPhone } from '../lib/auth';
import { logOperation } from '../lib/logs';
import { ageFrom, daysFrom } from '../lib/helpers';
import { BabyModal } from './Modals';
import { RemindersView } from './RemindersView';

// 水豚噜噜预选头像：读取 public/capy-avatars 下的图片（往该目录丢图即自动出现）
import { avatarList } from '../lib/avatars';
const AVATARS: string[] = avatarList;

export function MineView() {
  const {
    db, lang, cloudOn, syncNow, setLocalMode, usingDefaultCloud, loadSamples, clearData,
    exportData, importData, toast, theme, setTheme, toggleLang, isLoggedIn,
    currentUser, login, loginWithSession, logout, updateProfile, mineSub, setMineSub,
    upsertRow, deleteRow,
  } = useStore();
  const [localMode, setLocalModeState] = useState(isLocalOnly());
  const [babyModal, setBabyModal] = useState<{ id?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const dataFileRef = useRef<HTMLInputElement | null>(null);

  // —— 个人资料编辑态（昵称/头像/手机号，置于顶部个人资料卡点击进入）——
  const [nickname, setNickname] = useState(currentUser?.name || '');
  const [pickedAvatar, setPickedAvatar] = useState(currentUser?.avatar || AVATARS[0]);
  const [bindOpen, setBindOpen] = useState(false);
  const [bindPhoneNum, setBindPhoneNum] = useState('');
  const [bindLoading, setBindLoading] = useState(false);
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
    loginWithSession();
    setBindOpen(false);
    setBindPhoneNum('');
    toast('手机号绑定成功 ✓');
  }

  async function saveProfile() {
    await updateProfile({ name: nickname.trim(), avatar: pickedAvatar });
    toast('已保存');
  }

  const back = (
    <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => setMineSub('main')}>← {t('tabmine') === 'Mine' ? 'Back' : '返回'}</button>
  );

  function MenuCard({ items }: { items: { icon: string; label: string; sub?: string; onClick: () => void }[] }) {
    return (
      <div className="card menu-card">
        {items.map((it, i) => (
          <div key={i} className="menu-item" onClick={it.onClick}>
            <span className="mi-ic">{it.icon}</span>
            <span className="mi-label">{it.label}</span>
            {it.sub ? <span className="tag gray">{it.sub}</span> : null}
            <span className="mi-arrow">›</span>
          </div>
        ))}
      </div>
    );
  }

  // —— 宝宝资料子页 ——
  if (mineSub === 'babyProfile') {
    const baby = db.babies[0];
    return (
      <main>
        {back}
        {baby ? (
          <div className="card">
            <div className="babycard" style={{ marginBottom: 12 }}>
              {baby.avatar ? <img className="avatar" src={baby.avatar} alt="" /> : <div className="avatar" />}
              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{baby.name}</div>
                <div className="mini">{baby.gender === 'male' ? t('male') : t('female')} · {daysFrom(baby.birthday, lang)}{t('daysOld')} · {ageFrom(baby.birthday, lang)}</div>
              </div>
            </div>
            <button className="btn" onClick={() => setBabyModal({ id: baby.id })}>✏️ {t('edit')}{t('babyProfile')}</button>
          </div>
        ) : (
          <div className="card">
            <div className="empty">{t('addBabyTip')}</div>
            <button className="btn" style={{ marginTop: 10 }} onClick={() => setBabyModal({})}>＋ {t('addbaby')}</button>
          </div>
        )}
        {babyModal && <BabyModal id={babyModal.id} onClose={() => setBabyModal(null)} />}
      </main>
    );
  }

  // —— 个人资料子页（顶部橙卡点击进入：本人昵称/头像/手机号）——
  if (mineSub === 'userprofile') {
    return (
      <main>
        {back}
        <div className="card">
          <h3><span className="ic">👤</span>{t('profile')}</h3>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            <img className="profile-avatar-lg img" src={pickedAvatar} alt="avatar" />
          </div>
          <label style={{ display: 'block', margin: '10px 0 6px', color: '#5A3E2B' }}>{t('name')}</label>
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
            placeholder={t('tabmine') === 'Mine' ? 'Your name' : '给自己起个昵称'} style={{ width: '100%' }} />
          <label style={{ display: 'block', margin: '14px 0 6px', color: '#5A3E2B' }}>{t('avatar')}</label>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button type="button" key={a} className={'avatar-opt ' + (a === pickedAvatar ? 'on' : '')} onClick={() => setPickedAvatar(a)}>
                <img src={a} alt="avatar" />
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn ghost" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>
              📷 {t('tabmine') === 'Mine' ? 'Upload from device' : '从本地上传头像'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  if (dataUrl.length > 1_500_00) { toast('图片太大，请选 1MB 以内的图'); return; }
                  setPickedAvatar(dataUrl);
                };
                reader.readAsDataURL(f);
                e.target.value = '';
              }} />
          </div>
          <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={saveProfile}>{t('save')}</button>
          <div className="row" style={{ marginTop: 18 }}>
            <span className="muted">{t('phone')}</span>
            <span className="tag">{currentUser?.phone ? (currentUser.phone.startsWith('+86') ? currentUser.phone.slice(3) : currentUser.phone) : (t('tabmine') === 'Mine' ? 'Not bound' : '未绑定')}</span>
          </div>
          {!currentUser?.phone && (
            <div style={{ marginTop: 10 }}>
              {!bindOpen ? (
                <button className="btn ghost" onClick={() => setBindOpen(true)}>📱 {t('tabmine') === 'Mine' ? 'Bind Phone' : '绑定手机号'}</button>
              ) : (
                <div>
                  <input type="tel" value={bindPhoneNum} onChange={(e) => setBindPhoneNum(e.target.value)}
                    placeholder="请输入 11 位手机号" maxLength={11} style={{ width: '100%', marginBottom: 8 }} />
                  <button className="btn" onClick={doBindPhone} disabled={bindLoading}>
                    {bindLoading ? (t('tabmine') === 'Mine' ? 'Binding...' : '绑定中...') : (t('tabmine') === 'Mine' ? 'Confirm' : '确认绑定')}
                  </button>
                  <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => setBindOpen(false)}>{t('cancel')}</button>
                </div>
              )}
              <div className="mini" style={{ marginTop: 6 }}>
                {t('tabmine') === 'Mine' ? 'After binding, you can also sign in with phone + password.' : '绑定后可用手机号+密码登录'}
              </div>
            </div>
          )}
          {currentUser?.phone && <div className="mini" style={{ marginTop: 6 }}>{t('tabmine') === 'Mine' ? 'Bound. Phone sign-in enabled.' : '已绑定，手机号登录已可用'}</div>}
        </div>
      </main>
    );
  }

  // —— 提醒设置 ——
  if (mineSub === 'reminders') {
    const babyId = db.babies[0]?.id || '';
    return (
      <RemindersView
        reminders={db.reminders}
        babyId={babyId}
        onUpsert={(r) => upsertRow('reminders', r as unknown as Record<string, unknown>)}
        onDelete={(id) => deleteRow('reminders', id)}
        onBack={() => setMineSub('main')}
      />
    );
  }

  // —— 成长相册 / 喂养设置 占位 ——
  if (mineSub === 'album' || mineSub === 'feeding') {
    const titles: Record<string, string> = {
      album: t('album'), feeding: t('feedingSet'),
    };
    return (
      <main>
        {back}
        <div className="card">
          <h3><span className="ic">📷</span>{titles[mineSub]}</h3>
          <div className="empty">{t('tabmine') === 'Mine' ? 'Coming soon' : '功能开发中，敬请期待'}</div>
        </div>
      </main>
    );
  }

  // —— 设置子页（喂养设置入口 + 同步 + 主题 + 语言）——
  if (mineSub === 'settings') {
    return (
      <main>
        {back}
        {/* 喂养设置：聚合进设置 */}
        <div className="card">
          <div className="menu-item" onClick={() => setMineSub('feeding')}>
            <span className="mi-ic">🍼</span>
            <span className="mi-label">{t('feedingSet')}</span>
            <span className="mi-arrow">›</span>
          </div>
        </div>
        {/* 同步设置 */}
        <div className="card">
          <h3><span className="ic">⚙️</span>{t('syncset')}</h3>
          <div className="row">
            <span className="muted">{t('tabmine') === 'Mine' ? 'Status' : '状态'}</span>
            <span className={cloudOn ? 'tag' : 'tag gray'}>{cloudOn ? t('syncon') : t('syncoff')}</span>
          </div>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => syncNow()}>🔄 {t('tabmine') === 'Mine' ? 'Sync Now' : '立即同步'}</button>
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
        {/* 主题风格 */}
        <div className="card">
          <h3><span className="ic">🎨</span>{t('theme')}</h3>
          <div className="mini" style={{ marginBottom: 10 }}>{t('themeTip')}</div>
          <div className="seg">
            <button className={theme === 'static' ? 'on' : ''} onClick={() => setTheme('static')}>🖼 {t('themeStatic')}</button>
            <button className={theme === 'dynamic' ? 'on' : ''} onClick={() => setTheme('dynamic')}>✨ {t('themeDynamic')}</button>
          </div>
        </div>
        {/* 语言 */}
        <div className="card">
          <h3><span className="ic">🌐</span>{t('tabmine') === 'Mine' ? 'Language' : '语言'}</h3>
          <div className="seg">
            <button className={lang === 'zh' ? 'on' : ''} onClick={() => toggleLang()}>中文</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => toggleLang()}>EN</button>
          </div>
        </div>
      </main>
    );
  }

  // —— 数据子页（数据导出 + 导入/示例/清空）——
  if (mineSub === 'data') {
    return (
      <main>
        {back}
        <div className="card">
          <h3><span className="ic">💾</span>{t('data')}</h3>
          <button className="btn ghost" style={{ marginBottom: 10 }} onClick={exportData}>⬇ {t('exportData')}</button>
          <button className="btn ghost" style={{ marginBottom: 10 }} onClick={() => dataFileRef.current?.click()}>{t('tabmine') === 'Mine' ? 'Import' : '导入备份'}</button>
          <input ref={dataFileRef} type="file" accept="application/json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { importData(f); e.target.value = ''; } }} />
          <button className="btn ghost" style={{ marginBottom: 6 }} onClick={loadSamples}>✨ {t('samples')}</button>
          <div className="mini" style={{ color: '#2E9B5B', marginBottom: 10 }}>{t('tabmine') === 'Mine' ? 'Demo data is local only — never synced to cloud/production.' : '示例数据仅本地，不会同步到云端 / 正式环境。'}</div>
          <button className="btn red" onClick={clearData}>🗑 {t('clearData')}</button>
        </div>
      </main>
    );
  }

  // —— 关于子页 ——
  if (mineSub === 'about') {
    return (
      <main>
        {back}
        <div className="card">
          <h3><span className="ic">ℹ️</span>{t('about')}</h3>
          <div className="mini">Next.js 版 · 数据默认存本地浏览器；配置云端后自动双向同步。家庭共享同一份数据，所有账号看到的内容完全一致。</div>
        </div>
      </main>
    );
  }

  // —— 主视图 ——
  return (
    <main>
      {!isLoggedIn && (
        <div className="card">
          <button className="btn" style={{ marginTop: 4 }} onClick={() => login()}>{t('tabmine') === 'Mine' ? 'Sign In' : '登录'}</button>
        </div>
      )}

      <MenuCard items={[
        { icon: '📋', label: t('babyProfile'), onClick: () => setMineSub('babyProfile') },
        { icon: '📷', label: t('album'), onClick: () => setMineSub('album') },
        { icon: '🔔', label: t('reminders'), onClick: () => setMineSub('reminders') },
      ]} />

      <MenuCard items={[
        { icon: '⚙️', label: t('settings'), onClick: () => setMineSub('settings') },
        { icon: '💾', label: t('data'), onClick: () => setMineSub('data') },
        { icon: 'ℹ️', label: t('about'), onClick: () => setMineSub('about') },
      ]} />

      {isLoggedIn && (
        <button className="btn red logout-btn" onClick={logout}>
          {t('signout')}
        </button>
      )}
    </main>
  );
}
