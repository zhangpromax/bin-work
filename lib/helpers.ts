import { DB, Medical, Medicine } from './types';
import { t, Lang } from './i18n';
import { ymd } from './store';

export function ageFrom(birthday: string, lang: Lang): string {
  if (!birthday) return '';
  const bd = new Date(birthday);
  const n = new Date();
  let months = (n.getFullYear() - bd.getFullYear()) * 12 + (n.getMonth() - bd.getMonth()) + (n.getDate() >= bd.getDate() ? 0 : -1);
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (lang === 'en') return y > 0 ? `${y}y ${m}m` : `${m}m`;
  return y > 0 ? `${y}岁${m}个月` : `${m}个月`;
}

export function money(v: string | number): string {
  return '¥' + (Number(v) || 0).toFixed(2);
}

const FOOD: Record<string, string> = { milk: 'milk', formula: 'formula', solid: 'solid', water: 'water' };
const MTYPE: Record<string, string> = { vaccine: 'vaccine', checkup: 'checkup', visit: 'visit', other: 'other' };
const CAT: Record<string, string> = { catfood: 'catfood', catmedical: 'catmedical', cattoy: 'cattoy', catcloth: 'catcloth', catother: 'catother' };
const DTYPE: Record<string, string> = { wet: 'wet', dirty: 'dirty', both: 'both' };

export function typeName(cat: 'food' | 'mtype' | 'cat' | 'dtype', v: string): string {
  const key = cat === 'food' ? FOOD[v] : cat === 'mtype' ? MTYPE[v] : cat === 'cat' ? CAT[v] : DTYPE[v];
  return key ? t(key) : v;
}

export interface Activity {
  ts: number;
  icon: string;
  text: string;
}

export function babyName(db: DB, id: string): string {
  const b = db.babies.find((x) => x.id === id);
  return b ? b.name : '';
}

export function recentActivities(db: DB, lang: Lang): Activity[] {
  const arr: Activity[] = [];
  db.feedings.forEach((f) => arr.push({ ts: f.createdAt, icon: '🍼', text: `${babyName(db, f.babyId)} · ${t('feed')} ${f.amount}ml (${typeName('food', f.type)})` }));
  db.diapers.forEach((d) => arr.push({ ts: d.createdAt, icon: '💧', text: `${babyName(db, d.babyId)} · ${t('diaper')} (${typeName('dtype', d.type)})` }));
  db.sleeps.forEach((s) => arr.push({ ts: s.createdAt, icon: '😴', text: `${babyName(db, s.babyId)} · ${t('sleep')} ${s.duration}${lang === 'en' ? 'min' : '分钟'}` }));
  db.temps.forEach((p) => arr.push({ ts: p.createdAt, icon: '🌡️', text: `${babyName(db, p.babyId)} · ${t('temp')} ${p.value}°C` }));
  db.medicines.forEach((m) => { if (m.doses[ymd()]) arr.push({ ts: Date.now() - 1, icon: '💊', text: `${babyName(db, m.babyId)} · ${t('med')} ${m.name}` }); });
  db.medicals.forEach((m) => arr.push({ ts: m.createdAt, icon: '🩺', text: `${babyName(db, m.babyId)} · ${t('mrec')} ${typeName('mtype', m.type)}` }));
  db.weights.forEach((w) => arr.push({ ts: w.createdAt, icon: '⚖️', text: `${babyName(db, w.babyId)} · ${t('weight')} ${w.weight}kg` }));
  db.consumptions.forEach((c) => arr.push({ ts: c.createdAt, icon: '💰', text: `${babyName(db, c.babyId)} · ${t('cost')} ${money(c.amount)} (${typeName('cat', c.category)})` }));
  arr.sort((a, b) => b.ts - a.ts);
  return arr.slice(0, 12);
}

export interface MedicalAlert { m: Medical; diff: number }

export function medicalAlerts(db: DB): MedicalAlert[] {
  const today = ymd();
  const res: MedicalAlert[] = [];
  db.medicals.forEach((m) => {
    if (!m.nextDate) return;
    const diff = Math.round((new Date(m.nextDate).getTime() - new Date(today).getTime()) / 86400000);
    if (diff <= 30) res.push({ m, diff });
  });
  res.sort((a, b) => a.diff - b.diff);
  return res;
}

export function medToday(m: Medicine): { got: number; expected: number } {
  const got = m.doses[ymd()] || 0;
  return { got, expected: m.freq };
}

export function medDoneTotal(m: Medicine): number {
  let s = 0;
  for (const k in m.doses) s += m.doses[k];
  return s;
}

export function medMissed(m: Medicine): number {
  const today = new Date();
  let miss = 0;
  const start = new Date(m.startDate);
  const end = new Date(m.startDate);
  end.setDate(end.getDate() + m.totalDays - 1);
  for (let d = new Date(start); d <= end && d < today; d.setDate(d.getDate() + 1)) {
    if ((m.doses[ymd(d)] || 0) < m.freq) miss++;
  }
  return miss;
}
