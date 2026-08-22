'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { ageFrom } from '../lib/helpers';
import { t } from '../lib/i18n';

export function ProfilesView({ onEditBaby }: { onEditBaby: (id?: string) => void }) {
  const { db, lang } = useStore();
  return (
    <main>
      <div className="card">
        <h3><span className="ic">📋</span>{t('profiles')}</h3>
        {!db.babies.length && <div className="empty">{t('nodata')}</div>}
        {db.babies.map((b) => (
          <div key={b.id} className="row" style={{ cursor: 'pointer' }} onClick={() => onEditBaby(b.id)}>
            <div className="babycard">
              {b.avatar ? <img className="avatar" src={b.avatar} alt="" /> : <div className="avatar" />}
              <div>
                <div style={{ fontWeight: 600 }}>{b.name}</div>
                <div className="mini">{ageFrom(b.birthday, lang)} · {b.gender === 'male' ? t('male') : t('female')}</div>
              </div>
            </div>
            <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); onEditBaby(b.id); }}>{t('edit')}</button>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => onEditBaby()}>＋ {t('addbaby')}</button>
    </main>
  );
}
