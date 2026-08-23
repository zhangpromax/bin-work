'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { t } from '../lib/i18n';
import { CapyLogo } from './Capy';

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

export function Header() {
  const { cloudOn } = useStore();
  return (
    <header className="top">
      <div className="brand">
        <CapyLogo />
        <div className="brand-text">
          <h1>{t('title')}</h1>
          <div className="sub">
            <span>{t('subtitle')}</span>
            {cloudOn ? <span className="syncbar ok">● {t('cloudSync')}</span> : null}
          </div>
        </div>
      </div>
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
