'use client';

import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { ageFrom, money, babyName, medicalAlerts, medToday, typeName, recentActivities, Activity } from '../lib/helpers';
import { t, type Lang } from '../lib/i18n';
import { ymd } from '../lib/store';
import { BabyAvatar } from './BabyAvatar';

/* 打招呼文案：基于宝宝真实数据动态生成，随机挑一条；随记录自动更新 */
function buildGreetCopies(b: any, db: any, today: string, lang: Lang): string[] {
  const out: string[] = [];
  if (b) {
    out.push(`${b.name} 今天 ${ageFrom(b.birthday, lang)} 啦，每一天都在悄悄长大 🌱`);
    if (b.birthday) {
      const bd = new Date(b.birthday);
      if (!isNaN(bd.getTime())) {
        const d = Math.floor((Date.now() - bd.getTime()) / 86400000);
        if (d >= 0 && d < 100) out.push(`距离 ${b.name} 的百天还有 ${100 - d} 天，幸福在倒计时 🎉`);
        else if (d >= 100 && d < 365) out.push(`${b.name} 已经来到这个世界 ${d} 天啦，时光温柔 ⏳`);
      }
    }
    const fd = db.feedings.filter((f: any) => f.babyId === b.id && f.date === today).length;
    out.push(fd > 0 ? `今天已经喂了 ${fd} 次奶，宝贝吃得香妈妈也安心 💕` : `今天还没记喂奶，记得按时喂养哦 👶`);
    const sl = db.sleeps.filter((x: any) => x.babyId === b.id && x.date === today).reduce((a: number, x: any) => a + (Number(x.duration) || 0), 0);
    if (sl > 0) out.push(`小家伙今天睡了 ${(sl / 60).toFixed(1)} 小时，长身体的黄金时间 😴`);
    const wRows = db.weights.filter((x: any) => x.babyId === b.id).sort((a: any, c: any) => c.date.localeCompare(a.date));
    if (wRows[0]) out.push(`最近体重 ${wRows[0].weight}kg，肉肉长得稳稳的 🐷`);
  }
  out.push('慢慢来，比较快，你做得已经很棒了 🐢');
  out.push('记录每一刻的小美好，都是给未来的礼物 📸');
  out.push('你是全家最温暖的小太阳 ☀️');
  out.push('用心陪伴的每一天，都算数 💛');
  return out;
}

function formatDate(now: Date): string {
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
}

function weekDay(now: Date): string {
  return '星期' + ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
}

function greetWord(now: Date): string {
  const h = now.getHours();
  return h < 6 ? '凌晨好' : h < 12 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : h < 22 ? '晚上好' : '夜深了';
}

function RecentItem({ a }: { a: Activity }) {
  return (
    <div className="recent-item">
      <div className="recent-icon" style={{ color: a.color }}>{a.icon}</div>
      <div className="recent-body">
        <div className="recent-title">{a.title}</div>
        <div className="recent-sub">{a.sub}</div>
      </div>
      <div className="recent-time">{a.timeText}</div>
    </div>
  );
}

export function HomeView({ onEditBaby, onOpenBaby }: { onEditBaby: (id: string) => void; onOpenBaby: () => void }) {
  const { db, lang } = useStore();
  const [recentSub, setRecentSub] = useState<'home' | 'all'>('home');
  const today = ymd();
  const now = new Date();
  const copies = buildGreetCopies(db.babies[0], db, today, lang);
  const copy = copies[Math.floor(Math.random() * copies.length)];
  const acts = recentActivities(db, lang);

  if (recentSub === 'all') {
    return (
      <main>
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => setRecentSub('home')}>← {t('back')}</button>
        <div className="card recent-card">
          <div className="recent-header">
            <h3>{t('recent')}</h3>
          </div>
          {acts.length === 0 ? (
            <div className="empty">{t('nodata')}</div>
          ) : (
            <div className="recent-list">
              {acts.map((a, i) => <RecentItem key={i} a={a} />)}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* 顶部打招呼 */}
      <div className="home-greet">
        <div className="greet-hi">{greetWord(now)}，家欣 👋</div>
        <div className="greet-sub">{formatDate(now)} · {weekDay(now)}</div>
        <div className="greet-copy">{copy}</div>
      </div>

      {/* 宝宝卡片 */}
      <div className="card baby-card">
        <h3>{t('babies')}</h3>
        {!db.babies.length && (
          <div className="empty">
            <span style={{ fontSize: 32 }}>👶</span>
            <span>{t('addBabyTip')}</span>
            <button className="btn sm" style={{ marginTop: 8 }} onClick={onOpenBaby}>＋ {t('addbaby')}</button>
          </div>
        )}
        {db.babies.map((b) => {
          const fd = db.feedings.filter((f) => f.babyId === b.id && f.date === today).length;
          return (
            <div
              key={b.id}
              className="baby-row"
              style={{ cursor: 'pointer' }}
              onClick={() => (b.id ? onEditBaby(b.id) : onOpenBaby())}
            >
              <div className="babycard">
                <BabyAvatar baby={b} size={88} />
                <div className="babyinfo">
                  <div className="bk-name">{b.name}</div>
                  <div className="bk-age">{ageFrom(b.birthday, lang)}</div>
                  <div className="bk-tags">
                    <span className="bk-tag">{b.gender === 'male' ? t('male') : t('female')}</span>
                    <span className="bk-tag">{b.birthday}</span>
                    {b.bloodType && <span className="bk-tag">🩸 {b.bloodType}</span>}
                  </div>
                  <div className="bk-stats">
                    <div className="bk-stat">
                      <span className="bk-num">{b.weight || '—'}</span>
                      <span className="bk-unit">kg</span>
                    </div>
                    <div className="bk-stat">
                      <span className="bk-num">{b.height || '—'}</span>
                      <span className="bk-unit">cm</span>
                    </div>
                    <div className="bk-stat">
                      <span className="bk-num">{fd}</span>
                      <span className="bk-unit">今日喂奶</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 今日待办 */}
      <div className="card"><h3>{t('todaytodo')}</h3>
        {(() => {
          let any = false;
          const rows: React.ReactNode[] = [];
          db.babies.forEach((b) => {
            const fd = db.feedings.filter((f) => f.babyId === b.id && f.date === today).length;
            rows.push(<div key={`f-${b.id}`} className="row"><span>{b.name} · {t('feed')}</span><span className="tag">{fd} {t('feed')}</span></div>);
            const dd = db.diapers.filter((x) => x.babyId === b.id && x.date === today).length;
            rows.push(<div key={`d-${b.id}`} className="row"><span>{b.name} · {t('diaper')}</span><span className="tag">{dd}</span></div>);
            const sl = db.sleeps.filter((x) => x.babyId === b.id && x.date === today).reduce((a, x) => a + (Number(x.duration) || 0), 0);
            if (sl > 0) rows.push(<div key={`s-${b.id}`} className="row"><span>{b.name} · {t('sleep')}</span><span className="tag">{(sl / 60).toFixed(1)}h</span></div>);
            any = true;
          });
          db.medicines.forEach((m) => {
            const st = medToday(m);
            rows.push(<div key={`m-${m.id}`} className="row"><span>{babyName(db, m.babyId)} · {m.name}</span><span className={st.got >= st.expected ? 'tag' : 'tag warn'}>{st.got}/{st.expected}</span></div>);
            any = true;
          });
          const hot = db.temps.filter((p) => p.date === today && Number(p.value) >= 37.5);
          if (hot.length) {
            const mx = Math.max.apply(null, hot.map((p) => Number(p.value)));
            rows.push(<div key="hot" className="row"><span>🌡️ {t('temp')}</span><span className="tag warn">{t('hightemp')} {mx}°C</span></div>);
            any = true;
          }
          medicalAlerts(db).forEach((a) => {
            const cls = a.diff < 0 ? 'tag warn' : 'tag gray';
            const txt = a.diff < 0 ? `${t('expired')}${-a.diff}d` : `${t('soon')}${a.diff}d`;
            rows.push(<div key={`a-${a.m.id}`} className="row"><span>{babyName(db, a.m.babyId)} · {typeName('mtype', a.m.type)}</span><span className={cls}>{txt}</span></div>);
            any = true;
          });
          if (!any) rows.push(<div key="empty" className="empty">{t('nodata')}</div>);
          return rows;
        })()}
      </div>

      {/* 最近动态 */}
      <div className="card recent-card">
        <div className="recent-header">
          <h3>{t('recent')}</h3>
          {acts.length > 5 && (
            <span className="recent-all" onClick={() => setRecentSub('all')}>{t('all')} ›</span>
          )}
        </div>
        {acts.length === 0 ? (
          <div className="empty">{t('nodata')}</div>
        ) : (
          <div className="recent-list">
            {acts.slice(0, 5).map((a, i) => <RecentItem key={i} a={a} />)}
          </div>
        )}
      </div>
    </main>
  );
}

export { money };
