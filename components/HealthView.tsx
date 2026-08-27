'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { SvgBar, SvgLine, SvgDonut, Pt, Seg } from './charts';
import { babyName, money, typeName, medToday, medDoneTotal, medMissed, medicalAlerts } from '../lib/helpers';
import { t } from '../lib/i18n';
import { ymd } from '../lib/store';

export type HealthSub = 'feeding' | 'diaper' | 'sleep' | 'temp' | 'med' | 'mrec' | 'weight' | 'cost' | 'milestone';
export type FormType = HealthSub;

/* 下钻映射：从首页数据类型按钮进入时，只渲染对应明细区块 */
const DRILL_MAP: Record<HealthSub, (p: any) => JSX.Element> = {
  feeding: FeedSection, diaper: DiaperSection, sleep: SleepSection, temp: TempSection,
  med: MedSection, mrec: MrecSection, weight: WeightSection, cost: CostSection, milestone: MilestoneSection,
};

function minusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymd(d);
}

function lastDays(n: number, calc: (key: string, date: Date) => number): Pt[] {
  const out: Pt[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ l: `${d.getMonth() + 1}/${d.getDate()}`, v: calc(ymd(d), d) });
  }
  return out;
}

export function HealthView({ sub, setSub, onForm, onEditMed, onEditMrec, drill, onDrillBack, onDrill }: {
  sub: HealthSub;
  setSub: (s: HealthSub) => void;
  onForm: (t: FormType) => void;
  onEditMed: (id: string) => void;
  onEditMrec: (id: string) => void;
  drill?: HealthSub | null;
  onDrillBack?: () => void;
  onDrill?: (s: HealthSub) => void;
}) {
  const { db } = useStore();
  const today = ymd();

  // 今日概览主数据
  const fdCount = db.feedings.filter((f) => f.date === today).length;
  const fdMl = db.feedings.filter((f) => f.date === today).reduce((a, f) => a + (Number(f.amount) || 0), 0);
  const ddCount = db.diapers.filter((x) => x.date === today).length;
  const slH = (db.sleeps.filter((x) => x.date === today).reduce((a, x) => a + (Number(x.duration) || 0), 0) / 60).toFixed(1);
  const lastTemp = [...db.temps].sort((a, b) => b.createdAt - a.createdAt)[0];
  const lastWeight = [...db.weights].sort((a, b) => b.date.localeCompare(a.date))[0];

  // 下钻模式：点击数据类型按钮进入，只显示该类型明细
  if (drill) {
    const Sec = DRILL_MAP[drill];
    if (Sec) {
      return (
        <main>
          <button className="btn ghost" style={{ marginBottom: 12 }} onClick={onDrillBack}>
            ← {t('back')}
          </button>
          <Sec onForm={onForm} onEditMed={onEditMed} onEditMrec={onEditMrec} />
        </main>
      );
    }
  }

  // 默认视图：今日概览 hero + 全部数据按钮网格（点按钮下钻明细）
  const DATA_BTNS: { type: HealthSub; ic: string; key: string; count: number }[] = [
    { type: 'feeding', ic: '🍼', key: 'feed', count: db.feedings.length },
    { type: 'diaper', ic: '💧', key: 'diaper', count: db.diapers.length },
    { type: 'sleep', ic: '😴', key: 'sleep', count: db.sleeps.length },
    { type: 'temp', ic: '🌡️', key: 'temp', count: db.temps.length },
    { type: 'med', ic: '💊', key: 'med', count: db.medicines.length },
    { type: 'mrec', ic: '🩺', key: 'mrec', count: db.medicals.length },
    { type: 'weight', ic: '⚖️', key: 'weight', count: db.weights.length },
    { type: 'cost', ic: '💰', key: 'cost', count: db.consumptions.length },
    { type: 'milestone', ic: '🌟', key: 'milestone', count: db.milestones.length },
  ];

  return (
    <main>
      {/* 今日概览 hero */}
      <div className="card hero-card">
        <div className="hero-title">📊 {t('todayoverview')}</div>
        <div className="hero-primary">
          <span className="hp-icon">🍼</span>
          <div className="hp-main">
            <span className="hp-num">{fdCount}</span>
            <span className="hp-unit">{t('feed')}</span>
          </div>
          <div className="hp-sub">
            <b>{fdMl}</b>
            <i>ml · {t('today')}</i>
          </div>
        </div>
        <div className="hero-grid">
          <div className="hg">
            <span className="hg-ic">💧</span>
            <b>{ddCount}</b>
            <i>{t('diaper')}</i>
          </div>
          <div className="hg">
            <span className="hg-ic">😴</span>
            <b>{slH}h</b>
            <i>{t('sleep')}</i>
          </div>
          <div className={`hg${lastTemp && Number(lastTemp.value) >= 37.5 ? ' warn' : ''}`}>
            <span className="hg-ic">🌡️</span>
            <b>{lastTemp ? lastTemp.value : '—'}</b>
            <i>{t('temp')}</i>
          </div>
          <div className="hg">
            <span className="hg-ic">⚖️</span>
            <b>{lastWeight ? lastWeight.weight : '—'}</b>
            <i>{t('weight')}</i>
          </div>
        </div>
      </div>

      {/* 全部数据按钮网格 */}
      <div className="card data-card">
        <div className="data-title">🗂️ {t('alldata')}</div>
        <div className="data-grid">
          {DATA_BTNS.map((d) => (
            <button key={d.type} className="data-btn" onClick={() => onDrill && onDrill(d.type)}>
              <span className="db-ic">{d.ic}</span>
              <span className="db-label">{t(d.key)}</span>
              {d.count > 0 && <span className="db-badge">{d.count}</span>}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function MilestoneSection({ onForm }: { onForm: (t: FormType) => void }) {
  const { db, deleteRow } = useStore();
  const list = [...db.milestones].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <>
      <button className="btn" onClick={() => onForm('milestone')}>＋ {t('mileadd')}</button>
      <div className="card"><h3><span className="ic">🌟</span>{t('milestone')}</h3>
        {!list.length && <div className="empty">{t('nodata')}</div>}
        <div className="mile-list">
          {list.map((m) => (
            <div key={m.id} className="mile-item">
              <div className="mile-dot" />
              <div className="mile-body">
                <div className="mile-top"><span className="mile-type">{typeName('mile', m.type)}</span><span className="mile-date">{m.date}</span></div>
                {m.note && <div className="mile-note">{m.note}</div>}
              </div>
              <button className="btn sm ghost" onClick={() => deleteRow('milestones', m.id)}>{t('delete')}</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function FeedSection({ onForm }: { onForm: (t: FormType) => void }) {
  const { db } = useStore();
  const days = lastDays(14, (key) => db.feedings.filter((f) => f.date === key).reduce((a, b) => a + (Number(b.amount) || 0), 0));
  const typeMap: Record<string, number> = {};
  db.feedings.forEach((f) => { if (f.date >= minusDays(30)) typeMap[f.type] = (typeMap[f.type] || 0) + (Number(f.amount) || 0); });
  const colors: Record<string, string> = { milk: '#FF8C5A', formula: '#FFB072', solid: '#F4C95D', water: '#E89B7D' };
  const segs: Seg[] = Object.keys(typeMap).map((k) => ({ label: typeName('food', k), v: typeMap[k], color: colors[k] || '#ccc' }));
  const list = [...db.feedings].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  return (
    <>
      <div className="card"><h3><span className="ic">🍼</span>{t('last14')}</h3><SvgBar data={days} /></div>
      <div className="card">
        <h3><span className="ic">🥄</span>{t('type30')}</h3>
        <div className="donut-wrap"><SvgDonut segs={segs} /><div className="legend">
          {segs.map((sg, i) => <div key={i}><i style={{ background: sg.color }} />{sg.label}: {sg.v}ml</div>)}
          {!segs.length && <div className="muted">{t('nodata')}</div>}
        </div></div>
      </div>
      <button className="btn" onClick={() => onForm('feeding')}>＋ {t('feed')}</button>
      <div className="card"><h3><span className="ic">📋</span>{t('feedlog')}</h3>
        {!list.length && <div className="empty">{t('nodata')}</div>}
        {list.map((f) => <div key={f.id} className="row"><span>{f.date} {f.time}</span><span>{typeName('food', f.type)} · {f.amount}ml</span></div>)}
      </div>
    </>
  );
}

function DiaperSection({ onForm }: { onForm: (t: FormType) => void }) {
  const { db } = useStore();
  const days = lastDays(14, (key) => db.diapers.filter((x) => x.date === key).length);
  const typeMap: Record<string, number> = {};
  db.diapers.forEach((x) => { if (x.date >= minusDays(30)) typeMap[x.type] = (typeMap[x.type] || 0) + 1; });
  const colors: Record<string, string> = { wet: '#FFB072', dirty: '#C9A66B', both: '#F2A1C7' };
  const segs: Seg[] = Object.keys(typeMap).map((k) => ({ label: typeName('dtype', k), v: typeMap[k], color: colors[k] || '#ccc' }));
  const list = [...db.diapers].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  return (
    <>
      <div className="card"><h3><span className="ic">💧</span>{t('last14diaper')}</h3><SvgBar data={days} /></div>
      <div className="card">
        <h3><span className="ic">🧷</span>{t('diaper30')}</h3>
        <div className="donut-wrap"><SvgDonut segs={segs} /><div className="legend">
          {segs.map((sg, i) => <div key={i}><i style={{ background: sg.color }} />{sg.label}: {sg.v}</div>)}
          {!segs.length && <div className="muted">{t('nodata')}</div>}
        </div></div>
      </div>
      <button className="btn" onClick={() => onForm('diaper')}>＋ {t('diaper')}</button>
      <div className="card"><h3><span className="ic">📋</span>{t('diapers')}</h3>
        {!list.length && <div className="empty">{t('nodata')}</div>}
        {list.map((x) => <div key={x.id} className="row"><span>{x.date} {x.time}</span><span>{typeName('dtype', x.type)}</span></div>)}
      </div>
    </>
  );
}

function SleepSection({ onForm }: { onForm: (t: FormType) => void }) {
  const { db } = useStore();
  const days = lastDays(14, (key) => {
    const h = db.sleeps.filter((x) => x.date === key).reduce((a, x) => a + (Number(x.duration) || 0), 0) / 60;
    return Math.round(h * 10) / 10;
  });
  const todayH = db.sleeps.filter((x) => x.date === ymd()).reduce((a, x) => a + (Number(x.duration) || 0), 0);
  const list = [...db.sleeps].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  return (
    <>
      <div className="card"><h3><span className="ic">😴</span>{t('last14sleep')}</h3><SvgBar data={days} /></div>
      <div className="card"><h3><span className="ic">⏰</span>{t('todaytodo')}</h3>
        <div className="row"><span>{t('sleep')}</span><span className="tag">{(todayH / 60).toFixed(1)}h</span></div></div>
      <button className="btn" onClick={() => onForm('sleep')}>＋ {t('sleep')}</button>
      <div className="card"><h3><span className="ic">📋</span>{t('sleeplog')}</h3>
        {!list.length && <div className="empty">{t('nodata')}</div>}
        {list.map((x) => <div key={x.id} className="row"><span>{x.date} {x.start}-{x.end_time}</span><span>{(Number(x.duration) / 60).toFixed(1)}h</span></div>)}
      </div>
    </>
  );
}

function TempSection({ onForm }: { onForm: (t: FormType) => void }) {
  const { db } = useStore();
  const list = [...db.temps].sort((a, b) => a.createdAt - b.createdAt);
  const data: Pt[] = list.map((x) => ({ l: x.date.slice(5) + (x.time ? ' ' + x.time : ''), v: Number(x.value) }));
  const last = list[list.length - 1];
  return (
    <>
      <div className="card"><h3><span className="ic">🌡️</span>{t('sleeptrend')}</h3>
        {data.length ? <SvgLine data={data} /> : <div className="empty">{t('nodata')}</div>}
        {last && <div className="mini" style={{ marginTop: 6 }}>{t('temp')} {last.value}°C {Number(last.value) >= 37.5 && <span className="tag warn">{t('hightemp')}</span>}</div>}
      </div>
      <button className="btn" onClick={() => onForm('temp')}>＋ {t('temp')}</button>
      <div className="card"><h3><span className="ic">📋</span>{t('temphd')}</h3>
        {!list.length && <div className="empty">{t('nodata')}</div>}
        {[...list].reverse().slice(0, 20).map((x) => (
          <div key={x.id} className="row"><span>{x.date} {x.time}</span><span className={Number(x.value) >= 37.5 ? 'danger' : ''}>{x.value}°C</span></div>
        ))}
      </div>
    </>
  );
}

function MedSection({ onForm, onEditMed }: { onForm: (t: FormType) => void; onEditMed: (id: string) => void }) {
  const { db, doseMed } = useStore();
  return (
    <>
      <div className="card"><h3><span className="ic">💊</span>{t('medlog')}</h3>
        {!db.medicines.length && <div className="empty">{t('nodata')}</div>}
        {db.medicines.map((m) => {
          const total = m.totalDays * m.freq;
          const done = medDoneTotal(m);
          const pct = Math.min(100, total ? (done / total) * 100 : 0);
          const miss = medMissed(m);
          const st = medToday(m);
          return (
            <div key={m.id} className="card" style={{ margin: '0 0 10px', padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{m.name} <span className="tag gray">{babyName(db, m.babyId)}</span></div>
              <div className="mini">{t('startdate')}: {m.startDate} · {t('totaldays')} {m.totalDays} · {t('freq')} {m.freq}{t('freq') === 'Per Day' ? '/day' : ''}</div>
              <div className="progress"><i style={{ width: `${pct}%` }} /></div>
              <div className="row" style={{ border: 'none', paddingBottom: 0 }}>
                <span className="mini">{done}/{total} {miss ? ` · ` : ''}{miss ? <span className="danger">{t('missed')} {miss}</span> : null}</span>
                <span>
                  <button className={'btn sm ' + (st.got >= st.expected ? 'ghost' : '')} onClick={() => doseMed(m.id)}>
                    {st.got >= st.expected ? t('done') : t('dose')} {st.got}/{st.expected}
                  </button>
                  {' '}
                  <button className="btn sm ghost" onClick={() => onEditMed(m.id)}>{t('edit')}</button>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn" onClick={() => onForm('med')}>＋ {t('med')}</button>
    </>
  );
}

function MrecSection({ onForm, onEditMrec }: { onForm: (t: FormType) => void; onEditMrec: (id: string) => void }) {
  const { db } = useStore();
  const list = [...db.medicals].sort((a, b) => (a.date > b.date ? -1 : 1));
  return (
    <>
      <div className="card"><h3><span className="ic">🩺</span>{t('medreclog')}</h3>
        {!list.length && <div className="empty">{t('nodata')}</div>}
        {list.map((m) => {
          const diff = m.nextDate ? Math.round((new Date(m.nextDate).getTime() - new Date(ymd()).getTime()) / 86400000) : null;
          const cls = diff == null ? 'tag gray' : diff < 0 ? 'tag warn' : diff <= 30 ? 'tag' : 'tag gray';
          const txt = diff == null ? '-' : diff < 0 ? `${t('expired')}${-diff}d` : `${t('soon')}${diff}d`;
          return (
            <div key={m.id} className="row">
              <div>
                <div style={{ fontWeight: 600 }}>{typeName('mtype', m.type)} <span className="tag gray">{babyName(db, m.babyId)}</span></div>
                <div className="mini">{m.date} · {Number(m.cost) ? money(m.cost) : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={cls}>{txt}</div>
                <button className="btn sm ghost" onClick={() => onEditMrec(m.id)}>{t('edit')}</button>
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn" onClick={() => onForm('mrec')}>＋ {t('mrec')}</button>
    </>
  );
}

function WeightSection({ onForm }: { onForm: (t: FormType) => void }) {
  const { db, lang } = useStore();
  const list = [...db.weights].sort((a, b) => (a.date > b.date ? 1 : -1));
  const data: Pt[] = list.map((w) => ({ l: w.date.slice(5), v: Number(w.weight) }));
  return (
    <>
      <div className="card"><h3><span className="ic">⚖️</span>{t('weighttrend')}</h3>
        {data.length ? <SvgLine data={data} /> : <div className="empty">{t('nodata')}</div>}
        {data.length >= 2 && (
          <div className="mini" style={{ marginTop: 6 }}>
            {lang === 'en' ? 'vs last' : '较上次'} {((data[data.length - 1].v - data[data.length - 2].v)).toFixed(2)}kg
          </div>
        )}
      </div>
      <div className="card"><h3><span className="ic">📋</span>{t('weightlog')}</h3>
        {!list.length && <div className="empty">{t('nodata')}</div>}
        {[...list].reverse().map((w) => <div key={w.id} className="row"><span>{w.date}</span><span>{w.weight}kg · {babyName(db, w.babyId)}</span></div>)}
      </div>
      <button className="btn" onClick={() => onForm('weight')}>＋ {t('weight')}</button>
    </>
  );
}

function CostSection({ onForm }: { onForm: (t: FormType) => void }) {
  const { db, lang } = useStore();
  const month = ymd().slice(0, 7);
  const rows = db.consumptions.filter((c) => c.date.slice(0, 7) === month);
  const byCat: Record<string, number> = {};
  rows.forEach((c) => { byCat[c.category] = (byCat[c.category] || 0) + (Number(c.amount) || 0); });
  const colors: Record<string, string> = { catfood: '#FF8C5A', catmedical: '#FF6F69', cattoy: '#F4C95D', catcloth: '#F2A1C7', catother: '#C9A66B' };
  const segs: Seg[] = Object.keys(byCat).map((k) => ({ label: typeName('cat', k), v: byCat[k], color: colors[k] || '#ccc' }));
  const filtered = [...db.consumptions].sort((a, b) => (a.date > b.date ? -1 : 1));
  return (
    <>
      <div className="card"><h3><span className="ic">💰</span>{t('monthledger')} {month}</h3>
        <div className="donut-wrap"><SvgDonut segs={segs} /><div className="legend">
          {segs.map((sg, i) => <div key={i}><i style={{ background: sg.color }} />{sg.label}: {money(sg.v)}</div>)}
          {!segs.length && <div className="muted">{t('nodata')}</div>}
        </div></div>
      </div>
      <div className="card"><h3><span className="ic">📋</span>{t('costlog')}</h3>
        {!filtered.length && <div className="empty">{t('nodata')}</div>}
        {filtered.map((c) => <div key={c.id} className="row"><div><div>{typeName('cat', c.category)}</div><div className="mini">{c.date} · {babyName(db, c.babyId)}</div></div><span>{money(c.amount)}</span></div>)}
      </div>
      <button className="btn" onClick={() => onForm('cost')}>＋ {t('cost')}</button>
      <div className="mini" style={{ marginTop: 8 }}>{lang === 'en' ? 'Tip: expense "Medical" is auto-created when a medical record has a cost.' : '提示：医疗记录填写费用后会自动生成一条「医疗」分类消费。'}</div>
    </>
  );
}
