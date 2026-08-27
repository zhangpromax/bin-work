'use client';

import React from 'react';
import { Baby } from '../lib/types';
import { t, Lang } from '../lib/i18n';
import { MILESTONE_TEMPLATE, CAT_META } from '../lib/milestones';

function addMonths(birthday: string, m: number): Date {
  const d = new Date(birthday);
  d.setMonth(d.getMonth() + m);
  return d;
}
function fmtDate(d: Date, lang: Lang): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return lang === 'en' ? `${y}-${mo}-${da}` : `${y}年${Number(mo)}月${Number(da)}日`;
}
function curMonthOf(birthday: string): number {
  const bd = new Date(birthday);
  const n = new Date();
  let m = (n.getFullYear() - bd.getFullYear()) * 12 + (n.getMonth() - bd.getMonth()) + (n.getDate() >= bd.getDate() ? 0 : -1);
  return m < 0 ? 0 : m;
}

export function GrowthMilestones({ baby, lang, doneIds, onToggleDone }: {
  baby: Baby;
  lang: Lang;
  doneIds: string[];
  onToggleDone: (id: string) => void;
}) {
  const cur = curMonthOf(baby.birthday);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const items = MILESTONE_TEMPLATE.map((it) => {
    const target = addMonths(baby.birthday, it.month);
    const reached = target.getTime() <= today.getTime();
    const isDone = doneIds.includes(it.id);
    return { ...it, target, reached, isDone };
  });

  // 当前阶段：已到但未完成里月龄最大者
  const pendingReached = items.filter((i) => i.reached && !i.isDone).sort((a, b) => b.month - a.month);
  const curItem = pendingReached[0] || null;
  const allDone = items.filter((i) => i.month <= cur && !i.isDone).length === 0;

  return (
    <div className="block">
      <div className="block-title"><span className="ic">🌟</span>{t('growthGuide')}</div>
      <div className="mini" style={{ margin: '0 4px 10px', color: '#9aa0a6' }}>{t('growthGuideSub')}</div>

      {/* 当前阶段横幅 */}
      <div className="gm-current">
        <span className="gm-cur-label">{t('currentStage')}</span>
        <span className="gm-cur-text">
          {allDone
            ? t('msAllDone')
            : curItem
              ? (lang === 'en' ? `${cur} mo · ` : `${cur}个月 · `) + (lang === 'en' ? curItem.en.title : curItem.zh.title)
              : (lang === 'en' ? `${cur} mo` : `${cur}个月`)}
        </span>
      </div>

      <div className="gm-timeline">
        {items.map((it) => {
          const cat = CAT_META[it.cat];
          const title = lang === 'en' ? it.en.title : it.zh.title;
          const desc = lang === 'en' ? it.en.desc : it.zh.desc;
          const src = lang === 'en' ? it.en.src : it.zh.src;
          const cls = it.isDone ? 'done' : it.reached ? 'reached' : 'upcoming';
          const isCur = curItem && curItem.id === it.id;
          return (
            <div key={it.id} className={`gm-item ${cls}${isCur ? ' current' : ''}`}>
              <div className="gm-rail"><span className="gm-dot" style={{ background: cat.color }} /></div>
              <div className="gm-body">
                <div className="gm-row">
                  <span className="gm-cat" style={{ background: cat.color + '22', color: cat.color }}>
                    {lang === 'en' ? cat.en : cat.zh}
                  </span>
                  <span className="gm-month">{lang === 'en' ? `${it.month} mo` : `${it.month}月龄`}</span>
                  <span className={`gm-status ${cls}`}>
                    {it.isDone ? `✓ ${t('done')}` : it.reached ? t('msReached') : t('msUpcoming')}
                  </span>
                </div>
                <div className="gm-title">{title}</div>
                <div className="gm-desc">{desc}</div>
                {src && <div className="gm-src">📚 {t('msSource')}：{src}</div>}
                <div className="gm-foot">
                  <span className="gm-date">
                    {it.reached
                      ? fmtDate(it.target, lang)
                      : (lang === 'en' ? 'Due ' + fmtDate(it.target, lang) : '预计 ' + fmtDate(it.target, lang))}
                  </span>
                  <button className={`btn sm ${it.isDone ? 'ghost' : ''}`} onClick={() => onToggleDone(it.id)}>
                    {it.isDone ? t('msUndo') : t('msMarkDone')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
