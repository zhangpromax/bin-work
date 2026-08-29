'use client';

import React, { useRef, useState } from 'react';
import { useStore, uid, ymd } from '../lib/store';
import { typeName, babyName } from '../lib/helpers';
import { t, Lang } from '../lib/i18n';
import { FormType } from './HealthView';
import { Baby } from '../lib/types';

export type Modal =
  | { kind: 'quick' }
  | { kind: 'form'; form: FormType }
  | { kind: 'baby'; id?: string }
  | { kind: 'medEdit'; id: string }
  | { kind: 'mrecEdit'; id: string }
  | { kind: 'profile' }
  | null;

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">{children}</div>
    </div>
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return <span className="close" onClick={onClose}>×</span>;
}

function Seg({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? 'on' : ''} type="button" onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

function BabySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { db } = useStore();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">--</option>
      {db.babies.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
    </select>
  );
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ================= 快捷菜单 ================= */
export function QuickMenu({ onPick, onClose }: { onPick: (f: FormType) => void; onClose: () => void }) {
  const items: { f: FormType; icon: string; label: string }[] = [
    { f: 'feeding', icon: '🍼', label: t('feed') },
    { f: 'diaper', icon: '💧', label: t('diaper') },
    { f: 'sleep', icon: '😴', label: t('sleep') },
    { f: 'temp', icon: '🌡️', label: t('temp') },
    { f: 'med', icon: '💊', label: t('med') },
    { f: 'mrec', icon: '🩺', label: t('mrec') },
    { f: 'weight', icon: '⚖️', label: t('weight') },
    { f: 'cost', icon: '💰', label: t('cost') },
  ];
  return (
    <Overlay onClose={onClose}>
      <CloseBtn onClose={onClose} />
      <h3>{t('quick')}</h3>
      <div className="seg">
        {items.map((it) => (
          <button key={it.f} onClick={() => onPick(it.f)}>{it.icon} {it.label}</button>
        ))}
      </div>
    </Overlay>
  );
}

/* ================= 快捷记录表单 ================= */
export function FormModal({ form, onClose }: { form: FormType; onClose: () => void }) {
  const { db, upsertRow, toast } = useStore();
  const [babyId, setBabyId] = useState(db.babies[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(form === 'diaper' ? 'wet' : form === 'mrec' ? 'vaccine' : 'milk');
  const [cat, setCat] = useState('catfood');
  const [date, setDate] = useState(ymd());
  const [time, setTime] = useState(nowTime());
  const [start, setStart] = useState(nowTime());
  const [end, setEnd] = useState('');
  const [dur, setDur] = useState('');
  const [val, setVal] = useState('');
  const [name, setName] = useState('');
  const [days, setDays] = useState('5');
  const [freq, setFreq] = useState('2');
  const [next, setNext] = useState('');
  const [cost, setCost] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [note, setNote] = useState('');
  const [mileType, setMileType] = useState('smile');

  const title = ({ feeding: t('feed'), diaper: t('diaper'), sleep: t('sleep'), temp: t('temp'), med: t('med'), mrec: t('mrec'), weight: t('weight'), cost: t('cost'), milestone: t('milestone') } as Record<FormType, string>)[form];

  const submit = () => {
    if (!babyId) { toast('请选择宝宝'); return; }
    const ts = Date.now();
    if (form === 'feeding') {
      upsertRow('feedings', { id: uid(), babyId, date, time, amount, type, note });
    } else if (form === 'diaper') {
      upsertRow('diapers', { id: uid(), babyId, date, time, type, note });
    } else if (form === 'sleep') {
      let durCalc = Number(dur) || 0;
      if (start && end) {
        const hm = (x: string) => { const p = x.split(':').map(Number); return p[0] * 60 + p[1]; };
        let d = hm(end) - hm(start);
        if (d < 0) d += 1440;
        if (d > 0) durCalc = d;
      }
      upsertRow('sleeps', { id: uid(), babyId, date, start, end_time: end, duration: durCalc, note });
    } else if (form === 'temp') {
      upsertRow('temps', { id: uid(), babyId, date, time, value: val, note });
    } else if (form === 'med') {
      upsertRow('medicines', { id: uid(), babyId, name, startDate: date, totalDays: Number(days) || 1, freq: Number(freq) || 1, doses: {}, note });
    } else if (form === 'weight') {
      upsertRow('weights', { id: uid(), babyId, date, weight, height, head });
    } else if (form === 'cost') {
      upsertRow('consumptions', { id: uid(), babyId, category: cat, amount, date, note });
    } else if (form === 'milestone') {
      upsertRow('milestones', { id: uid(), babyId, date, type: mileType, note });
    }
    toast('已保存');
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <CloseBtn onClose={onClose} />
      <h3>{title}</h3>
      <label>{t('babies')}</label>
      <BabySelect value={babyId} onChange={setBabyId} />

      {form === 'feeding' && <>
        <label>{t('amount')}</label>
        <input type="number" inputMode="numeric" placeholder="120" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label>{t('foodtype')}</label>
        <Seg options={['milk', 'formula', 'solid', 'water'].map((v) => ({ v, label: typeName('food', v) }))} value={type} onChange={setType} />
      </>}

      {form === 'diaper' && <>
        <label>{t('diapertype')}</label>
        <Seg options={['wet', 'dirty', 'both'].map((v) => ({ v, label: typeName('dtype', v) }))} value={type} onChange={setType} />
      </>}

      {form === 'sleep' && <>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><label>{t('sleepstart')}</label><input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div style={{ flex: 1 }}><label>{t('sleepend')}</label><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <label>{t('sleepdur')}{t('tabhome') === '首页' ? '（自动）' : ' (auto)'}</label>
        <input type="number" inputMode="numeric" placeholder="90" value={dur} onChange={(e) => setDur(e.target.value)} />
      </>}

      {form === 'temp' && <>
        <label>{t('tempval')}</label>
        <input type="number" inputMode="decimal" step="0.1" placeholder="36.5" value={val} onChange={(e) => setVal(e.target.value)} />
      </>}

      {form === 'med' && <>
        <label>{t('coursename')}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：感冒药" />
        <label>{t('totaldays')}</label>
        <input type="number" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        <label>{t('freq')}</label>
        <input type="number" inputMode="numeric" value={freq} onChange={(e) => setFreq(e.target.value)} />
      </>}

      {form === 'mrec' && <>
        <label>{t('mtype')}</label>
        <Seg options={['vaccine', 'checkup', 'visit', 'other'].map((v) => ({ v, label: typeName('mtype', v) }))} value={type} onChange={setType} />
        <label>{t('nextdate')}</label>
        <input type="date" value={next} onChange={(e) => setNext(e.target.value)} />
        <label>{t('costlabel')}</label>
        <input type="number" inputMode="decimal" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
      </>}

      {form === 'weight' && <>
        <label>{t('weightlabel')}</label>
        <input type="number" inputMode="decimal" placeholder="7.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <div className="two-col">
          <div>
            <label>{t('height')}</label>
            <div className="unit-in">
              <input type="number" inputMode="decimal" placeholder="68" value={height} onChange={(e) => setHeight(e.target.value)} />
              <span className="u">cm</span>
            </div>
          </div>
          <div>
            <label>{t('headcirc')}</label>
            <div className="unit-in">
              <input type="number" inputMode="decimal" placeholder="43" value={head} onChange={(e) => setHead(e.target.value)} />
              <span className="u">cm</span>
            </div>
          </div>
        </div>
      </>}

      {form === 'cost' && <>
        <label>{t('category')}</label>
        <Seg options={['catfood', 'catmedical', 'cattoy', 'catcloth', 'catother'].map((v) => ({ v, label: typeName('cat', v) }))} value={cat} onChange={setCat} />
        <label>{t('costlabel')}</label>
        <input type="number" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </>}

      {form === 'milestone' && <>
        <label>{t('milelabel')}</label>
        <select value={mileType} onChange={(e) => setMileType(e.target.value)}>
          {['smile', 'rollover', 'sit', 'teeth', 'crawl', 'stand', 'walk', 'talk', 'callparents', 'recognize', 'other'].map((v) => <option key={v} value={v}>{typeName('mile', v)}</option>)}
        </select>
      </>}

      {form !== 'med' && form !== 'weight' && <>
        <label>{t('recorddate')}</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {(form === 'feeding' || form === 'diaper' || form === 'temp') && (
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ marginTop: 6 }} />
        )}
      </>}

      {form === 'med' && <>
        <label>{t('startdate')}</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </>}

      {(form === 'feeding' || form === 'diaper' || form === 'sleep' || form === 'temp' || form === 'med' || form === 'mrec' || form === 'cost' || form === 'milestone') && (
        <>
          <label>{t('note')}</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </>
      )}

      <button className="btn" style={{ marginTop: 16 }} onClick={submit}>{t('save')}</button>
      <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
    </Overlay>
  );
}

/* ================= 宝宝档案 ================= */
export function compressImage(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  });
}

export function BabyModal({ id, onClose }: { id?: string; onClose: () => void }) {
  const { db, upsertRow, deleteBabyCascade, toast, lang } = useStore();
  const existing: Baby | undefined = id ? db.babies.find((b) => b.id === id) : undefined;
  const [name, setName] = useState(existing?.name || '');
  const [birthday, setBirthday] = useState(existing?.birthday || '');
  const [gender, setGender] = useState<'male' | 'female'>(existing?.gender || 'male');
  const [height, setHeight] = useState(existing?.height || '');
  const [weight, setWeight] = useState(existing?.weight || '');
  const [bloodType, setBloodType] = useState(existing?.bloodType || '');
  const [note, setNote] = useState(existing?.note || '');
  const [avatar, setAvatar] = useState(existing?.avatar || '');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onFile = (f: File) => {
    compressImage(f, 256).then((d) => setAvatar(d)).catch(() => toast('图片处理失败'));
  };

  const save = () => {
    if (!name.trim()) { toast('请填写昵称'); return; }
    const base = { name: name.trim(), birthday, gender, height, weight, bloodType, note, avatar };
    if (existing) {
      upsertRow('babies', { ...base, id: existing.id });
    } else {
      upsertRow('babies', { ...base, id: uid() });
    }
    toast('已保存');
    onClose();
  };

  const del = async () => {
    if (!confirm(t('confirmclear'))) return;
    if (!existing) return;
    setDeleting(true);
    try {
      await deleteBabyCascade(existing.id);
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  const btOptions = [
    { v: '', label: '—' },
    { v: 'A', label: 'A' },
    { v: 'B', label: 'B' },
    { v: 'AB', label: 'AB' },
    { v: 'O', label: 'O' },
  ];

  return (
    <Overlay onClose={onClose}>
      <CloseBtn onClose={onClose} />
      <h3>{existing ? t('edit') + t('babyProfile') : t('addbaby')}</h3>

      <div className="avatar-pick" onClick={() => fileRef.current?.click()} title={lang === 'en' ? 'Tap to change photo' : '点击更换头像'}>
        {avatar ? (
          <img className="avatar" src={avatar} alt="" />
        ) : (
          <div className="avatar avatar-empty">👶</div>
        )}
        <span className="avatar-cam">📷</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
      <div className="avatar-hint">{lang === 'en' ? 'Tap avatar to change photo' : '点击头像更换照片'}</div>

      <label>{t('name')}</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name')} />

      <label>{t('gender')}</label>
      <Seg options={[{ v: 'male', label: t('male') }, { v: 'female', label: t('female') }]} value={gender} onChange={(v) => setGender(v as 'male' | 'female')} />

      <label>{t('birthday')}</label>
      <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />

      <div className="two-col">
        <div>
          <label>{t('height')}</label>
          <div className="unit-in">
            <input type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="60" />
            <span className="u">cm</span>
          </div>
        </div>
        <div>
          <label>{t('weight')}</label>
          <div className="unit-in">
            <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="7.5" />
            <span className="u">kg</span>
          </div>
        </div>
      </div>

      <label>{t('bloodType')}</label>
      <Seg options={btOptions} value={bloodType} onChange={setBloodType} />

      <label>{t('note')}</label>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />

      {existing && <button className="btn red" onClick={del} disabled={deleting}>{deleting ? '删除中…' : t('delete')}</button>}
      <button className="btn" style={{ marginTop: 14 }} onClick={save}>{t('save')}</button>
      <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
    </Overlay>
  );
}

/* ================= 喂药疗程编辑 ================= */
export function MedEditModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { db, upsertRow, deleteRow, toast } = useStore();
  const m = db.medicines.find((x) => x.id === id)!;
  const [babyId, setBabyId] = useState(m.babyId);
  const [name, setName] = useState(m.name);
  const [date, setDate] = useState(m.startDate);
  const [days, setDays] = useState(String(m.totalDays));
  const [freq, setFreq] = useState(String(m.freq));
  const [note, setNote] = useState(m.note || '');

  const save = () => {
    upsertRow('medicines', { id, babyId, name, startDate: date, totalDays: Number(days) || 1, freq: Number(freq) || 1, note });
    toast('已保存');
    onClose();
  };
  const del = () => {
    if (!confirm(t('confirmclear'))) return;
    deleteRow('medicines', id);
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <CloseBtn onClose={onClose} />
      <h3>{t('edit')}</h3>
      <label>{t('babies')}</label>
      <BabySelect value={babyId} onChange={setBabyId} />
      <label>{t('coursename')}</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <label>{t('startdate')}</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <label>{t('totaldays')}</label>
      <input type="number" value={days} onChange={(e) => setDays(e.target.value)} />
      <label>{t('freq')}</label>
      <input type="number" value={freq} onChange={(e) => setFreq(e.target.value)} />
      <label>{t('note')}</label>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn red" onClick={del}>{t('delete')}</button>
      <button className="btn" style={{ marginTop: 14 }} onClick={save}>{t('save')}</button>
      <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
    </Overlay>
  );
}

/* ================= 医疗记录编辑 ================= */
export function MrecEditModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { db, saveMedicalRow, deleteMedicalRow, toast } = useStore();
  const m = db.medicals.find((x) => x.id === id)!;
  const [babyId, setBabyId] = useState(m.babyId);
  const [type, setType] = useState(m.type);
  const [date, setDate] = useState(m.date);
  const [next, setNext] = useState(m.nextDate || '');
  const [cost, setCost] = useState(m.cost || '');
  const [note, setNote] = useState(m.note || '');

  const save = () => {
    saveMedicalRow({ id, babyId, type, date, nextDate: next, cost, note });
    toast('已保存');
    onClose();
  };
  const del = () => {
    if (!confirm(t('confirmclear'))) return;
    deleteMedicalRow(id);
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <CloseBtn onClose={onClose} />
      <h3>{t('edit')}</h3>
      <label>{t('babies')}</label>
      <BabySelect value={babyId} onChange={setBabyId} />
      <label>{t('mtype')}</label>
      <Seg options={['vaccine', 'checkup', 'visit', 'other'].map((v) => ({ v, label: typeName('mtype', v) }))} value={type} onChange={setType} />
      <label>{t('recorddate')}</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <label>{t('nextdate')}</label>
      <input type="date" value={next} onChange={(e) => setNext(e.target.value)} />
      <label>{t('costlabel')}</label>
      <input type="number" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
      <label>{t('note')}</label>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn red" onClick={del}>{t('delete')}</button>
      <button className="btn" style={{ marginTop: 14 }} onClick={save}>{t('save')}</button>
      <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
    </Overlay>
  );
}

/* ================= 个人资料 ================= */
export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { db, saveProfile, toast } = useStore();
  const p = db.profile;
  const [username, setUsername] = useState(p.username);
  const [gender, setGender] = useState<'male' | 'female' | ''>(p.gender);
  const [phone, setPhone] = useState(p.phone);
  const [signature, setSignature] = useState(p.signature);
  const [avatar, setAvatar] = useState(p.avatar);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFile = (f: File) => {
    compressImage(f, 256).then(setAvatar).catch(() => toast('图片处理失败'));
  };

  const save = () => {
    saveProfile({
      username: username.trim() || '家有宝宝',
      gender,
      phone: phone.trim(),
      signature: signature.trim(),
      avatar,
    });
    toast('已保存');
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <CloseBtn onClose={onClose} />
      <h3>{t('profile')}</h3>
      <center>
        <div onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }} title="点击更换头像">
          {avatar ? (
            <img className="avatar" style={{ width: 84, height: 84 }} src={avatar} alt="头像" />
          ) : (
            <div className="avatar" style={{ width: 84, height: 84, display: 'inline-block' }} />
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />
      </center>
      <label>{t('name')}</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <label>{t('gender')}</label>
      <Seg
        options={[{ v: '', label: '-' }, { v: 'male', label: t('male') }, { v: 'female', label: t('female') }]}
        value={gender}
        onChange={(v) => setGender(v as 'male' | 'female' | '')}
      />
      <label>{t('phone')}</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="" />
      <label>{t('signature')}</label>
      <textarea rows={2} value={signature} onChange={(e) => setSignature(e.target.value)} />
      <button className="btn" style={{ marginTop: 14 }} onClick={save}>{t('save')}</button>
      <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
    </Overlay>
  );
}
