'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { t } from '../lib/i18n';

export function Toast() {
  const { toastMsg, clearToast } = useStore();
  if (!toastMsg) return null;
  return (
    <div key={toastMsg.id} className="toast" role="alert">
      <span className="toast-msg">{toastMsg.msg}</span>
      <button type="button" className="toast-close" aria-label="关闭" onClick={clearToast}>×</button>
    </div>
  );
}

export function Header({ tab }: { tab: Tab }) {
  const { currentUser, setMineSub, mineSub } = useStore();
  const isMine = tab === 'mine';

  // 仅在「我的」主页显示顶部个人资料卡；进入下钻子页后隐藏
  if (!isMine || mineSub !== 'main') return null;

  const name = currentUser?.name || currentUser?.email || currentUser?.phone || '我的账号';
  const rawPhone = currentUser?.phone || '';
  const displayPhone = rawPhone.startsWith('+86') ? rawPhone.slice(3) : rawPhone;
  // 如果昵称/账号名本身就是手机号，sub 不要再重复显示手机号，避免同一号码带/不带 +86 出现两行
  const nameLooksLikePhone = /^\+?\d{7,}$/.test(name.trim());
  const account =
    currentUser?.email && currentUser.email !== name
      ? currentUser.email
      : displayPhone && !nameLooksLikePhone
        ? displayPhone
        : '点击编辑个人资料';

  return (
    <header className="top user-profile-entry" onClick={() => setMineSub('userprofile')}>
      <div className="brand">
        {currentUser?.avatar ? (
          <img className="user-avatar-lg img" src={currentUser.avatar} alt="avatar" />
        ) : (
          <div className="user-avatar-lg">🐹</div>
        )}
        <div className="brand-text">
          <h1>{name}</h1>
          <div className="sub"><span>{account}</span></div>
        </div>
      </div>
      <span className="profile-arrow">›</span>
    </header>
  );
}

export type Tab = 'home' | 'profiles' | 'health' | 'mine';

export function TabBar({ tab, onTab, theme }: { tab: Tab; onTab: (t: Tab) => void; theme: 'static' | 'dynamic' }) {
  const ext = theme === 'dynamic' ? 'gif' : 'png';
  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'home', icon: `/capy-icons/lulu1.${ext}`, label: t('tabhome') },
    { key: 'profiles', icon: `/capy-icons/lulu2.${ext}`, label: t('tabprofile') },
    { key: 'health', icon: `/capy-icons/lulu3.${ext}`, label: t('tabhealth') },
    { key: 'mine', icon: `/capy-icons/lulu4.${ext}`, label: t('tabmine') },
  ];
  return (
    <div className={`tabbar theme-${theme}`}>
      {tabs.map((tb) => (
        <div key={tb.key} className={'tab ' + (tab === tb.key ? 'active' : '')} onClick={() => onTab(tb.key)}>
          <span className="ti"><img src={tb.icon} alt={tb.label} /></span>{tb.label}
        </div>
      ))}
    </div>
  );
}
