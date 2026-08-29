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

export function daysFrom(birthday: string, lang: Lang): number {
  if (!birthday) return 0;
  const bd = new Date(birthday);
  const n = new Date();
  const diff = n.getTime() - bd.getTime();
  const d = Math.max(0, Math.floor(diff / 86400000));
  return d;
}

export function money(v: string | number): string {
  return '¥' + (Number(v) || 0).toFixed(2);
}

const FOOD: Record<string, string> = { milk: 'milk', formula: 'formula', solid: 'solid', water: 'water' };
const MTYPE: Record<string, string> = { vaccine: 'vaccine', checkup: 'checkup', visit: 'visit', other: 'other' };
const CAT: Record<string, string> = { catfood: 'catfood', catmedical: 'catmedical', cattoy: 'cattoy', catcloth: 'catcloth', catother: 'catother' };
const DTYPE: Record<string, string> = { wet: 'wet', dirty: 'dirty', both: 'both' };
const MILE: Record<string, string> = { smile: 'smile', rollover: 'rollover', sit: 'sit', teeth: 'teeth', crawl: 'crawl', stand: 'stand', walk: 'walk', talk: 'talk', callparents: 'callparents', recognize: 'recognize', other: 'other' };

export function typeName(cat: 'food' | 'mtype' | 'cat' | 'dtype' | 'mile', v: string): string {
  const key = cat === 'food' ? FOOD[v] : cat === 'mtype' ? MTYPE[v] : cat === 'cat' ? CAT[v] : cat === 'mile' ? MILE[v] : DTYPE[v];
  return key ? t(key) : v;
}

export interface Activity {
  ts: number;
  kind: 'feeding' | 'diaper' | 'sleep' | 'temp' | 'med' | 'medical' | 'weight' | 'consumption' | 'milestone';
  icon: string;
  color: string;
  title: string;
  sub: string;
  timeText: string;
}

const KIND_META: Record<Activity['kind'], { color: string; zhTitle: string; enTitle: string }> = {
  feeding: { color: '#7ED957', zhTitle: '奶粉', enTitle: 'Formula' },
  diaper: { color: '#5B9BD5', zhTitle: '换尿布', enTitle: 'Diaper' },
  sleep: { color: '#F4C542', zhTitle: '小睡', enTitle: 'Nap' },
  temp: { color: '#FF6F69', zhTitle: '体温', enTitle: 'Temp' },
  med: { color: '#F28C4E', zhTitle: '喂药', enTitle: 'Medicine' },
  medical: { color: '#9B7ED9', zhTitle: '医疗', enTitle: 'Medical' },
  weight: { color: '#3ECF8E', zhTitle: '体重', enTitle: 'Weight' },
  consumption: { color: '#C9A66B', zhTitle: '消费', enTitle: 'Expense' },
  milestone: { color: '#FF8FAB', zhTitle: '里程碑', enTitle: 'Milestone' },
};

function iconFor(kind: Activity['kind'], subtype?: string): string {
  switch (kind) {
    case 'feeding':
      if (subtype === 'solid') return '🥣';
      if (subtype === 'water') return '💧';
      return '🍼';
    case 'diaper':
      if (subtype === 'dirty') return '💩';
      if (subtype === 'both') return '💧';
      return '💧';
    case 'sleep': return '😴';
    case 'temp': return '🌡️';
    case 'med': return '💊';
    case 'medical':
      if (subtype === 'vaccine') return '💉';
      if (subtype === 'visit') return '🏥';
      return '🩺';
    case 'weight': return '⚖️';
    case 'consumption':
      if (subtype === 'catfood') return '🍚';
      if (subtype === 'catmedical') return '💊';
      if (subtype === 'cattoy') return '🧸';
      if (subtype === 'catcloth') return '👕';
      return '🛒';
    case 'milestone':
      if (subtype === 'smile') return '😊';
      if (subtype === 'rollover') return '🔄';
      if (subtype === 'sit') return '🪑';
      if (subtype === 'teeth') return '🦷';
      if (subtype === 'crawl') return '🐢';
      if (subtype === 'stand') return '🧍';
      if (subtype === 'walk') return '🚶';
      if (subtype === 'talk') return '💬';
      if (subtype === 'callparents') return '👨‍👩‍👧';
      if (subtype === 'recognize') return '👀';
      return '🌟';
    default: return '📝';
  }
}

function formatActivityTime(ts: number, lang: Lang): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay(d, now)) return hm;
  if (sameDay(d, yesterday)) return lang === 'en' ? `Yesterday ${hm}` : `昨 ${hm}`;
  if (lang === 'en') return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function babyName(db: DB, id: string): string {
  const b = db.babies.find((x) => x.id === id);
  return b ? b.name : '';
}

export function recentActivities(db: DB, lang: Lang): Activity[] {
  const arr: Activity[] = [];
  const push = (k: Activity['kind'], ts: number, title: string, sub: string, subtype?: string) => {
    const m = KIND_META[k];
    arr.push({ ts, kind: k, icon: iconFor(k, subtype), color: m.color, title, sub, timeText: formatActivityTime(ts, lang) });
  };
  db.feedings.forEach((f) => {
    const food = typeName('food', f.type);
    push('feeding', f.createdAt, `${food} ${f.amount || '—'} ml`, `${babyName(db, f.babyId)} · ${f.time || ''}`, f.type);
  });
  db.diapers.forEach((d) => {
    const dt = typeName('dtype', d.type);
    push('diaper', d.createdAt, '换尿布', `${babyName(db, d.babyId)} · ${dt}${d.note ? ' · ' + d.note : ''}`, d.type);
  });
  db.sleeps.forEach((s) => {
    const h = (Number(s.duration) || 0) / 60;
    const dur = h >= 1 ? `${h.toFixed(1)} ${lang === 'en' ? 'h' : '小时'}` : `${s.duration || 0} ${lang === 'en' ? 'min' : '分钟'}`;
    push('sleep', s.createdAt, `${lang === 'en' ? 'Nap' : '小睡'} ${dur}`, `${babyName(db, s.babyId)} · ${s.start || ''}-${s.end_time || ''}`);
  });
  db.temps.forEach((p) => {
    push('temp', p.createdAt, `${lang === 'en' ? 'Temp' : '体温'} ${p.value}°C`, `${babyName(db, p.babyId)} · ${p.note || (lang === 'en' ? 'Normal' : '正常')}`);
  });
  db.medicines.forEach((m) => {
    Object.entries(m.doses).forEach(([date, count]) => {
      if (count > 0) push('med', Date.parse(date) || m.createdAt, `${lang === 'en' ? 'Med' : '喂药'} ${m.name}`, `${babyName(db, m.babyId)} · ${count} ${lang === 'en' ? 'dose' : '次'}`);
    });
  });
  db.medicals.forEach((m) => {
    push('medical', m.createdAt, `${typeName('mtype', m.type)}`, `${babyName(db, m.babyId)}${m.note ? ' · ' + m.note : ''}`, m.type);
  });
  db.weights.forEach((w) => {
    const parts = [w.weight ? `${w.weight}kg` : '', w.height ? `${w.height}cm` : '', w.head ? `${w.head}cm` : ''].filter(Boolean);
    push('weight', w.createdAt, `${lang === 'en' ? 'Weight' : '体重'} ${parts.join(' / ') || '—'}`, babyName(db, w.babyId));
  });
  db.consumptions.forEach((c) => {
    push('consumption', c.createdAt, `${typeName('cat', c.category)} ${money(c.amount)}`, `${babyName(db, c.babyId)}${c.note ? ' · ' + c.note : ''}`, c.category);
  });
  db.milestones.forEach((m) => {
    push('milestone', m.createdAt, typeName('mile', m.type), `${babyName(db, m.babyId)}${m.note ? ' · ' + m.note : ''}`, m.type);
  });
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
