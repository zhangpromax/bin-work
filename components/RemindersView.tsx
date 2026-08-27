'use client';

import React, { useState, useMemo } from 'react';
import { Reminder } from '../lib/types';
import { t, getLang } from '../lib/i18n';

export type ReminderCycle =
  | { type: 'once'; date: string; time: string }
  | { type: 'daily'; time: string }
  | { type: 'hourly'; hours: number }
  | { type: 'weekly'; weekday: number; time: string };

export const DEFAULT_EMOJIS = ['💉', '🏥', '🍼', '💊', '👨‍👩‍👧', '🛁', '😴', '🥄', '💩', '🌡️', '📅', '⏰'];

export function parseCycle(cycle: string): ReminderCycle | null {
  try {
    const c = JSON.parse(cycle);
    if (!c || !c.type) return null;
    if (c.type === 'once') return { type: 'once', date: c.date || '', time: c.time || '' };
    if (c.type === 'daily') return { type: 'daily', time: c.time || '' };
    if (c.type === 'hourly') return { type: 'hourly', hours: Number(c.hours) || 1 };
    if (c.type === 'weekly') return { type: 'weekly', weekday: Number(c.weekday) || 1, time: c.time || '' };
    return null;
  } catch {
    return null;
  }
}

function fmtDate(date: string, lang: string): string {
  if (!date) return '';
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return date;
  if (lang === 'en') return `${m}/${d}`;
  return `${Number(m)}月${Number(d)}日`;
}

export function formatCycleText(cycle: string, subTitle: string): string {
  const lang = getLang();
  const c = parseCycle(cycle);
  if (!c) return subTitle || '';
  let prefix = '';
  if (c.type === 'once') {
    prefix = `${fmtDate(c.date, lang)} ${c.time || ''}`.trim();
  } else if (c.type === 'daily') {
    prefix = `${t('daily')}${c.time ? ' ' + c.time : ''}`;
  } else if (c.type === 'hourly') {
    if (lang === 'en') prefix = `Every ${c.hours} ${c.hours === 1 ? 'hour' : 'hours'}`;
    else prefix = `每 ${c.hours} ${t('hour')}提醒`;
  } else if (c.type === 'weekly') {
    const wd = t(`weekDay${c.weekday}`);
    prefix = `${t('weekly')} ${wd}${c.time ? ' ' + c.time : ''}`;
  }
  if (!subTitle) return prefix;
  if (!prefix) return subTitle;
  return `${prefix} · ${subTitle}`;
}

interface RemindersViewProps {
  reminders: Reminder[];
  babyId: string;
  onUpsert: (row: Reminder) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function RemindersView({ reminders, babyId, onUpsert, onDelete, onBack }: RemindersViewProps) {
  const [editing, setEditing] = useState<Reminder | null>(null);
  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [reminders]);

  function toggleEnabled(r: Reminder) {
    onUpsert({ ...r, enabled: !r.enabled, updatedAt: Date.now() });
  }

  function newReminder(): Reminder {
    return {
      id: '', babyId, title: '', subTitle: '', icon: '⏰',
      cycle: JSON.stringify({ type: 'daily', time: '09:00' }), enabled: true,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
  }

  return (
    <main>
      <button className="btn ghost" style={{ marginBottom: 12 }} onClick={onBack}>
        ← {t('tabmine') === 'Mine' ? 'Back' : '返回'}
      </button>

      <div className="card" style={{ padding: '12px 16px' }}>
        <div className="reminder-head">
          <h3><span className="ic">🔔</span>{t('smartReminders')}</h3>
        </div>

        {sorted.length === 0 ? (
          <div className="empty" style={{ padding: '26px 0' }} onClick={() => setEditing(newReminder())}>
            {t('reminderEmpty')}
          </div>
        ) : (
          <div className="reminder-list">
            {sorted.map((r) => (
              <div key={r.id} className={`reminder-card ${!r.enabled ? 'off' : ''}`} onClick={() => setEditing(r)}>
                <div className="reminder-main">
                  <span className="reminder-icon">{r.icon || '⏰'}</span>
                  <div className="reminder-info">
                    <div className="reminder-title">{r.title}</div>
                    <div className="reminder-sub">{formatCycleText(r.cycle, r.subTitle)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`toggle ${r.enabled ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleEnabled(r); }}
                  aria-label={r.enabled ? 'on' : 'off'}
                />
              </div>
            ))}
          </div>
        )}

        <button className="btn" style={{ marginTop: 14 }} onClick={() => setEditing(newReminder())}>
          ＋ {t('addReminder')}
        </button>

        <div className="reminder-hint">{t('tapSwitchHint')}</div>
      </div>

      {editing && (
        <ReminderEditModal
          reminder={editing}
          babyId={babyId}
          onClose={() => setEditing(null)}
          onSave={(r) => { onUpsert(r); setEditing(null); }}
          onDelete={(id) => { onDelete(id); setEditing(null); }}
        />
      )}
    </main>
  );
}

interface ReminderEditModalProps {
  reminder: Reminder;
  babyId: string;
  onClose: () => void;
  onSave: (r: Reminder) => void;
  onDelete: (id: string) => void;
}

function ReminderEditModal({ reminder, babyId, onClose, onSave, onDelete }: ReminderEditModalProps) {
  const isNew = !reminder.id;
  const [title, setTitle] = useState(reminder.title);
  const [subTitle, setSubTitle] = useState(reminder.subTitle);
  const [icon, setIcon] = useState(reminder.icon || '⏰');
  const [cycle, setCycle] = useState<ReminderCycle>(() => parseCycle(reminder.cycle) || { type: 'daily', time: '09:00' });
  const [enabled, setEnabled] = useState(reminder.enabled);

  function buildCycleString(): string {
    return JSON.stringify(cycle);
  }

  function handleSave() {
    const now = Date.now();
    const next: Reminder = {
      ...reminder,
      id: reminder.id || ('rem_' + now + Math.random().toString(36).slice(2, 8)),
      babyId,
      title: title.trim() || t('reminderContent'),
      subTitle: subTitle.trim(),
      icon: icon.trim() || '⏰',
      cycle: buildCycleString(),
      enabled,
      createdAt: reminder.createdAt || now,
      updatedAt: now,
    };
    onSave(next);
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{isNew ? t('addReminder') : t('editReminder')}</div>

        <label>{t('reminderIcon')}</label>
        <div className="emoji-picker">
          {DEFAULT_EMOJIS.map((e) => (
            <button key={e} type="button" className={`emoji-opt ${icon === e ? 'on' : ''}`} onClick={() => setIcon(e)}>{e}</button>
          ))}
          <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="emoji-input" maxLength={4} />
        </div>

        <label>{t('reminderContent')}</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('reminderContent')} />

        <label>{t('reminderSubTitle')}</label>
        <input type="text" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} placeholder={t('tabmine') === 'Mine' ? 'e.g. Hepatitis B 3rd shot' : '例如：乙肝疫苗第3针'} />

        <label>{t('reminderCycle')}</label>
        <div className="seg reminder-cycle-seg">
          {(['once', 'daily', 'hourly', 'weekly'] as const).map((k) => (
            <button key={k} className={cycle.type === k ? 'on' : ''} onClick={() => {
              if (k === 'once') setCycle({ type: 'once', date: ymd(), time: '09:00' });
              if (k === 'daily') setCycle({ type: 'daily', time: '09:00' });
              if (k === 'hourly') setCycle({ type: 'hourly', hours: 3 });
              if (k === 'weekly') setCycle({ type: 'weekly', weekday: 1, time: '19:00' });
            }}>{t(k)}</button>
          ))}
        </div>

        <div className="reminder-cycle-fields">
          {cycle.type === 'once' && (
            <>
              <label>{t('once')} {t('at')}</label>
              <div className="row-2">
                <input type="date" value={cycle.date} onChange={(e) => setCycle({ ...cycle, date: e.target.value })} />
                <input type="time" value={cycle.time} onChange={(e) => setCycle({ ...cycle, time: e.target.value })} />
              </div>
            </>
          )}
          {cycle.type === 'daily' && (
            <>
              <label>{t('daily')} {t('at')}</label>
              <input type="time" value={cycle.time} onChange={(e) => setCycle({ ...cycle, time: e.target.value })} />
            </>
          )}
          {cycle.type === 'hourly' && (
            <>
              <label>{t('hourly').replace('N', '')}</label>
              <div className="row-2">
                <input type="number" min={1} max={168} value={cycle.hours} onChange={(e) => setCycle({ ...cycle, hours: Math.max(1, Number(e.target.value)) })} />
                <span style={{ display: 'flex', alignItems: 'center', color: '#5A3E2B' }}>{t('hour')}</span>
              </div>
            </>
          )}
          {cycle.type === 'weekly' && (
            <>
              <label>{t('weekly')} {t('at')}</label>
              <div className="row-2">
                <select value={cycle.weekday} onChange={(e) => setCycle({ ...cycle, weekday: Number(e.target.value) })}>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{t(`weekDay${d}`)}</option>
                  ))}
                </select>
                <input type="time" value={cycle.time} onChange={(e) => setCycle({ ...cycle, time: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <label className="row">
          <span>{t('enabled') || '启用'}</span>
          <button type="button" className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled(!enabled)} />
        </label>

        <div className="modal-actions">
          {!isNew && (
            <button className="btn red" onClick={() => reminder.id && onDelete(reminder.id)}>{t('delete')}</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" onClick={handleSave}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}

function ymd(d?: Date): string {
  const x = d || new Date();
  const off = x.getTimezoneOffset() * 60000;
  return new Date(x.getTime() - off).toISOString().slice(0, 10);
}
