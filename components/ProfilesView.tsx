'use client';

import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { BabyAvatar } from './BabyAvatar';
import { ageFrom, daysFrom, typeName } from '../lib/helpers';
import { t } from '../lib/i18n';
import { SvgMiniLine, type Pt } from './charts';
import type { FormType } from './HealthView';
import { GrowthMilestones } from './GrowthMilestones';

/**
 * 成长档案页（底部「成长」Tab）
 * 聚合：宝宝资料卡 + 发育里程碑 + 成长记录 + 体重/身高/头围趋势
 * 多宝宝时可切换查看对象
 */
export function ProfilesView({ onEditBaby, onForm }: { onEditBaby: (id?: string) => void; onForm: (f: FormType) => void }) {
  const { db, deleteRow, lang, toggleMilestoneDone } = useStore();
  const [selId, setSelId] = useState<string>(db.babies[0]?.id || '');
  const [viewAll, setViewAll] = useState(false);
  const baby = db.babies.find((b) => b.id === selId) || db.babies[0];

  if (!baby) {
    return (
      <main>
        <div className="card">
          <div className="empty">
            <span style={{ fontSize: 38 }}>👶</span>
            <div style={{ fontWeight: 600, color: '#5A4637', fontSize: 15 }}>{t('growthEmptyTitle')}</div>
            <span style={{ fontSize: 13 }}>{t('growthEmptySub')}</span>
          </div>
          <button className="btn" style={{ marginTop: 4 }} onClick={() => onEditBaby()}>＋ {t('addbaby')}</button>
        </div>
      </main>
    );
  }

  // 「查看全部里程碑」下钻页：独立一屏展示完整时间轴
  if (viewAll) {
    return (
      <main>
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => setViewAll(false)}>← {t('back')}</button>
        <GrowthMilestones baby={baby} lang={lang} doneIds={db.milestoneDone} onToggleDone={toggleMilestoneDone} showAll onViewAll={() => {}} />
      </main>
    );
  }

  // 当前宝宝的里程碑与体重
  const miles = db.milestones.filter((m) => m.babyId === baby.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const weights = db.weights.filter((w) => w.babyId === baby.id).sort((a, b) => (a.date > b.date ? 1 : -1));
  const wData: Pt[] = weights.map((w) => ({ l: w.date.slice(5), v: Number(w.weight) }));
  const hData: Pt[] = weights.filter((w) => Number(w.height) > 0).map((w) => ({ l: w.date.slice(5), v: Number(w.height) }));
  const hdData: Pt[] = weights.filter((w) => Number(w.head) > 0).map((w) => ({ l: w.date.slice(5), v: Number(w.head) }));
  const lastW = weights[weights.length - 1];

  return (
    <main>
      {/* 多宝宝切换条 */}
      {db.babies.length > 1 && (
        <div className="growth-switch">
          {db.babies.map((b) => (
            <button key={b.id} className={'gs-chip' + (b.id === baby.id ? ' on' : '')} onClick={() => setSelId(b.id)}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* 宝宝资料大卡 */}
      <div className="card growth-card">
        <div className="growth-head">
          <BabyAvatar baby={baby} size={92} />
          <div className="growth-info">
            <div className="bk-name" style={{ fontSize: 20 }}>{baby.name}</div>
            <div className="bk-tags">
              <span className="bk-tag">{baby.gender === 'male' ? t('male') : t('female')}</span>
              <span className="bk-tag">{t('age')} {ageFrom(baby.birthday, lang)}</span>
              {baby.bloodType ? <span className="bk-tag">{t('bloodType')} {baby.bloodType}</span> : null}
            </div>
            <div className="mini" style={{ marginTop: 6 }}>
              {t('birthday')}: {baby.birthday} · {daysFrom(baby.birthday, lang)}{t('daysOld')}
            </div>
          </div>
          <button className="btn sm ghost" onClick={() => onEditBaby(baby.id)}>{t('edit')}</button>
        </div>
      </div>

      {/* 0-6岁发育里程碑（自动生成，按生日算阶段；最近3条 + 查看全部跳转） */}
      <GrowthMilestones baby={baby} lang={lang} doneIds={db.milestoneDone} onToggleDone={toggleMilestoneDone} onViewAll={() => setViewAll(true)} />

      {/* 成长里程碑 */}
      <div className="block">
        <div className="block-title">{t('milestone')}</div>
        <button className="btn" onClick={() => onForm('milestone')}>＋ {t('mileadd')}</button>
        <div className="card" style={{ marginTop: 10 }}>
          {!miles.length && <div className="empty">{t('nodata')}</div>}
          <div className="mile-list">
            {miles.map((m) => (
              <div key={m.id} className="mile-item">
                <div className="mile-dot" />
                <div className="mile-body">
                  <div className="mile-top">
                    <span className="mile-type">{typeName('mile', m.type)}</span>
                    <span className="mile-date">{m.date}</span>
                  </div>
                  {m.note && <div className="mile-note">{m.note}</div>}
                </div>
                <button className="btn sm ghost" onClick={() => deleteRow('milestones', m.id)}>{t('delete')}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 成长曲线（体重/身高/头围三合一） */}
      <div className="block">
        <div className="block-title">{t('growthCurve')}</div>
        <button className="btn" onClick={() => onForm('weight')}>＋ {t('weight')}</button>
        <div className="card" style={{ marginTop: 10 }}>
          {!weights.length && <div className="empty">{t('nodata')}</div>}
          {weights.length > 0 && (
            <>
              <div className="growth-mini-charts">
                <SvgMiniLine label={t('weight')} unit="kg" color="#F28C5E" data={wData} />
                {hData.length > 0 && <SvgMiniLine label={t('height')} unit="cm" color="#3ECF8E" data={hData} />}
                {hdData.length > 0 && <SvgMiniLine label={t('headcirc')} unit="cm" color="#5B9BD5" data={hdData} />}
              </div>
              <div className="growth-stats">
                <div className="bk-stat"><span className="bk-num">{lastW?.weight || '—'}</span><span className="bk-unit">kg</span></div>
                <div className="bk-stat"><span className="bk-num">{lastW?.height || '—'}</span><span className="bk-unit">cm</span></div>
                <div className="bk-stat"><span className="bk-num">{lastW?.head || '—'}</span><span className="bk-unit">cm</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
