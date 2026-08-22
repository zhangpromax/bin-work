'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { t, toggleLang } from '../lib/i18n';
import { CapyLogo } from './Capy';

export function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return (
    <div key={toastMsg.id} className="toast">
      {toastMsg.msg}
    </div>
  );
}

export function Header() {
  const { cloudOn } = useStore();
  return (
    <header className="top">
      <div className="brand">
        <CapyLogo size={34} round />
        <div>
          <h1>{t('title')}</h1>
        <div className="sub">
          {t('sub')}{' '}
          <span className={cloudOn ? 'syncbar ok' : 'syncbar off'}>
            ● {cloudOn ? t('syncon') : t('syncoff')}
          </span>
        </div>
      </div>
      </div>
      <button className="langbtn" onClick={() => { toggleLang(); }}>
        {t('langbtn')}
      </button>
    </header>
  );
}

export type Tab = 'home' | 'profiles' | 'health' | 'mine';

export function TabBar({ tab, onTab, onQuick }: { tab: Tab; onTab: (t: Tab) => void; onQuick: () => void }) {
  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'home', icon: '🏠', label: t('tabhome') },
    { key: 'profiles', icon: '📋', label: t('tabprofile') },
  ];
  const tabs2: { key: Tab; icon: string; label: string }[] = [
    { key: 'health', icon: '💗', label: t('tabhealth') },
    { key: 'mine', icon: '👤', label: t('tabmine') },
  ];
  return (
    <div className="tabbar">
      {tabs.map((tb) => (
        <div key={tb.key} className={'tab ' + (tab === tb.key ? 'active' : '')} onClick={() => onTab(tb.key)}>
          <span className="ti">{tb.icon}</span>{tb.label}
        </div>
      ))}
      <div className="tab c" onClick={onQuick}>
        <span className="fab">+</span>
      </div>
      {tabs2.map((tb) => (
        <div key={tb.key} className={'tab ' + (tab === tb.key ? 'active' : '')} onClick={() => onTab(tb.key)}>
          <span className="ti">{tb.icon}</span>{tb.label}
        </div>
      ))}
    </div>
  );
}
