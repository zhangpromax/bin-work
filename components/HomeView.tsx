'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { ageFrom, money, babyName, medicalAlerts, medToday, typeName, recentActivities } from '../lib/helpers';
import { t } from '../lib/i18n';
import { ymd } from '../lib/store';

export function HomeView({ onEditBaby, onOpenBaby }: { onEditBaby: (id: string) => void; onOpenBaby: () => void }) {
  const { db, lang } = useStore();
  const today = ymd();
  let s = '';

  /* 宝宝卡片墙 */
  s += `<div class="card"><h3><span class="ic">👶</span>${t('babies')}</h3>`;
  if (!db.babies.length) s += `<div class="empty">${t('addbaby')} ➜ ${t('tabprofile')}</div>`;
  db.babies.forEach((b) => {
    const fd = db.feedings.filter((f) => f.babyId === b.id && f.date === today).length;
    s += `<div class="row" style="cursor:pointer" data-act="baby" data-id="${b.id}">
      <div class="babycard">${b.avatar ? `<img class="avatar" src="${b.avatar}" alt="">` : '<div class="avatar"></div>'}
        <div><div style="font-weight:600">${b.name} <span class="tag gray">${ageFrom(b.birthday, lang)}</span></div>
        <div class="mini">${b.gender === 'male' ? t('male') : t('female')} · ${t('todaytodo')}: ${t('feed')} ${fd}</div></div></div>
      <span class="muted">›</span></div>`;
  });
  s += `</div>`;

  /* 今日待办 */
  s += `<div class="card"><h3><span class="ic">✅</span>${t('todaytodo')}</h3>`;
  let any = false;
  db.babies.forEach((b) => {
    const fd = db.feedings.filter((f) => f.babyId === b.id && f.date === today).length;
    s += `<div class="row"><span>${b.name} · ${t('feed')}</span><span class="tag">${fd} ${t('feed')}</span></div>`;
    const dd = db.diapers.filter((x) => x.babyId === b.id && x.date === today).length;
    s += `<div class="row"><span>${b.name} · ${t('diaper')}</span><span class="tag">${dd}</span></div>`;
    const sl = db.sleeps.filter((x) => x.babyId === b.id && x.date === today).reduce((a, x) => a + (Number(x.duration) || 0), 0);
    if (sl > 0) s += `<div class="row"><span>${b.name} · ${t('sleep')}</span><span class="tag">${(sl / 60).toFixed(1)}h</span></div>`;
    any = true;
  });
  db.medicines.forEach((m) => {
    const st = medToday(m);
    s += `<div class="row"><span>${babyName(db, m.babyId)} · ${m.name}</span><span class="${st.got >= st.expected ? 'tag' : 'tag warn'}">${st.got}/${st.expected}</span></div>`;
    any = true;
  });
  const hot = db.temps.filter((p) => p.date === today && Number(p.value) >= 37.5);
  if (hot.length) {
    const mx = Math.max.apply(null, hot.map((p) => Number(p.value)));
    s += `<div class="row"><span>🌡️ ${t('temp')}</span><span class="tag warn">${t('hightemp')} ${mx}°C</span></div>`;
    any = true;
  }
  medicalAlerts(db).forEach((a) => {
    const cls = a.diff < 0 ? 'tag warn' : 'tag gray';
    const txt = a.diff < 0 ? `${t('expired')}${-a.diff}d` : `${t('soon')}${a.diff}d`;
    s += `<div class="row"><span>${babyName(db, a.m.babyId)} · ${typeName('mtype', a.m.type)}</span><span class="${cls}">${txt}</span></div>`;
    any = true;
  });
  if (!any) s += `<div class="empty">${t('nodata')}</div>`;
  s += `</div>`;

  /* 最近动态 */
  s += `<div class="card"><h3><span class="ic">📌</span>${t('recent')}</h3>`;
  const acts = recentActivities(db, lang);
  if (!acts.length) s += `<div class="empty">${t('nodata')}</div>`;
  acts.forEach((a) => { s += `<div class="row"><span>${a.icon} ${a.text}</span></div>`; });
  s += `</div>`;

  return (
    <main dangerouslySetInnerHTML={{ __html: s }}
      onClick={(e) => {
        const el = (e.target as HTMLElement).closest('[data-act="baby"]') as HTMLElement | null;
        if (el) { if (el.dataset.id) onEditBaby(el.dataset.id); else onOpenBaby(); }
      }} />
  );
}

export { money };
