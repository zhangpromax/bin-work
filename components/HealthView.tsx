'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { SvgBar, SvgLine, SvgDonut, Pt, Seg } from './charts';
import { babyName, money, typeName, medToday, medDoneTotal, medMissed, medicalAlerts } from '../lib/helpers';
import { t } from '../lib/i18n';
import { ymd } from '../lib/store';

export type HealthSub = 'feeding' | 'diaper' | 'sleep' | 'temp' | 'med' | 'mrec' | 'weight' | 'cost';
export type FormType = HealthSub;

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

export function HealthView({ sub, setSub, onForm, onEditMed, onEditMrec }: {
  sub: HealthSub;
  setSub: (s: HealthSub) => void;
  onForm: (t: FormType) => void;
  onEditMed: (id: string) => void;
  onEditMrec: (id: string) => void;
}) {
  const subs: { key: HealthSub; label: string }[] = [
    { key: 'feeding', label: t('feedlog') }, { key: 'diaper', label: t('diapers') },
    { key: 'sleep', label: t('sleeplog') }, { key: 'temp', label: t('temphd') },
    { key: 'med', label: t('medlog') }, { key: 'mrec', label: t('medreclog') },
    { key: 'weight', label: t('weightlog') }, { key: 'cost', label: t('costlog') },
  ];
  return (
    <main>
      <div className="seg">
        {subs.map((su) => (
          <button key={su.key} className={sub === su.key ? 'on' : ''} onClick={() => setSub(su.key)}>{su.label}</button>
        ))}
      </div>
      {sub === 'feeding' && <FeedSection onForm={onForm} />}
      {sub === 'diaper' && <DiaperSection onForm={onForm} />}
      {sub === 'sleep' && <SleepSection onForm={onForm} />}
      {sub === 'temp' && <TempSection onForm={onForm} />}
      {sub === 'med' && <MedSection onForm={onForm} onEditMed={onEditMed} />}
      {sub === 'mrec' && <MrecSection onForm={onForm} onEditMrec={onEditMrec} />}
      {sub === 'weight' && <WeightSection onForm={onForm} />}
      {sub === 'cost' && <CostSection onForm={onForm} />}
    </main>
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
