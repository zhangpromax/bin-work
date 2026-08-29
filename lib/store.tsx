'use client';

import React, {
  createContext, useContext, useEffect, useRef, useState,
} from 'react';
import {
  DB, EMPTY_DB, TableName, TABLES, Baby, Feeding, Diaper, Sleep, Temp,
  Medicine, Medical, Weight, Reminder, Consumption, Profile,
} from './types';
import {
  cloudInit, cloudPull, cloudPush, cloudDeleteBaby, cloudEnabled, cloudSave,
  cloudUrl, cloudKey, cloudTest, setLocalOnly, isLocalOnly, cloudUserOverridden,
  setAuthToken, getAuthToken,
} from './cloud';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, hasDefaultCloud } from './config';
import { getLang, setLang as i18nSetLang, Lang, toggleLang as i18nToggle } from './i18n';
import { signOut, getSession, mockLogin, setSession, SaSession, updateProfile as authUpdateProfile } from './auth';
import { logOperation } from './logs';

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'id' + Date.now() + Math.random().toString(36).slice(2);
}

function ymd(d?: Date): string {
  const x = d || new Date();
  const off = x.getTimezoneOffset() * 60000;
  return new Date(x.getTime() - off).toISOString().slice(0, 10);
}

export type Theme = 'static' | 'dynamic';
export type MineSub = 'main' | 'userprofile' | 'settings' | 'data' | 'babyProfile' | 'reminders' | 'feeding' | 'about' | 'sync' | 'theme' | 'lang' | 'storage';

interface StoreCtx {
  db: DB;
  lang: Lang;
  cloudOn: boolean;
  theme: Theme;
  toastMsg: { msg: string; id: number } | null;
  toast: (msg: string) => void;
  clearToast: () => void;
  // 用户资料
  saveProfile: (patch: Partial<Profile>) => void;
  updateProfile: (patch: { name?: string; avatar?: string }) => Promise<void>;
  toggleLang: () => void;
  setTheme: (t: Theme) => void;
  // 登录/登出
  isLoggedIn: boolean;
  currentUser: { phone?: string; email?: string; name?: string; avatar?: string } | null;
  login: (session?: SaSession) => void;
  loginWithSession: () => void;
  logout: () => void;
  // 我的页子视图
  mineSub: MineSub;
  setMineSub: (sub: MineSub) => void;
  // 通用增删改
  upsertRow: (table: TableName, row: Record<string, unknown>) => void;
  deleteRow: (table: TableName, id: string) => void;
  toggleMilestoneDone: (id: string) => void;
  deleteBabyCascade: (babyId: string) => void;
  // 医疗-消费联动
  saveMedicalRow: (row: Partial<Medical> & { id?: string }) => void;
  deleteMedicalRow: (id: string) => void;
  doseMed: (id: string) => void;
  // 同步
  saveCloudCfg: (url: string, key: string) => Promise<void>;
  syncNow: () => Promise<void>;
  lastSyncAt: number | null;
  testConn: (url: string, key: string) => Promise<string>;
  closeCloud: () => void;
  setLocalMode: (on: boolean) => void;
  usingDefaultCloud: boolean;
  // 数据工具
  loadSamples: () => void;
  clearData: () => void;
  exportData: () => void;
  importData: (file: File) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function useStore(): StoreCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}

function syncConsumption(db: DB, m: Medical, lang: Lang): { db: DB; m: Medical } {
  const cost = Number(m.cost) || 0;
  let consumptions = db.consumptions;
  let medical = { ...m };
  if (cost > 0) {
    if (medical.syncedId) {
      let found = false;
      consumptions = consumptions.map((c) => {
        if (c.id === medical.syncedId) {
          found = true;
          return { ...c, amount: String(cost), date: medical.date, babyId: medical.babyId, note: (lang === 'en' ? 'Medical: ' : '医疗: ') + (medical.type || ''), updatedAt: Date.now() };
        }
        return c;
      });
      if (!found) {
        const c2: Consumption = { id: uid(), babyId: medical.babyId, date: medical.date, category: 'catmedical', amount: String(cost), note: (lang === 'en' ? 'Medical: ' : '医疗: ') + (medical.type || ''), source: 'medical', createdAt: Date.now(), updatedAt: Date.now() };
        consumptions = [...consumptions, c2];
        medical = { ...medical, syncedId: c2.id };
      }
    } else {
      const c2: Consumption = { id: uid(), babyId: medical.babyId, date: medical.date, category: 'catmedical', amount: String(cost), note: (lang === 'en' ? 'Medical: ' : '医疗: ') + (medical.type || ''), source: 'medical', createdAt: Date.now(), updatedAt: Date.now() };
      consumptions = [...consumptions, c2];
      medical = { ...medical, syncedId: c2.id };
    }
  } else if (medical.syncedId) {
    consumptions = consumptions.filter((c) => c.id !== medical.syncedId);
    medical = { ...medical, syncedId: null };
  }
  return { db: { ...db, consumptions }, m: medical };
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'static';
  const v = localStorage.getItem('babycare_theme');
  return v === 'dynamic' ? 'dynamic' : 'static';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY_DB);
  // 以下 UI/登录态初始一律用常量默认值；真实值延迟到 useEffect（客户端挂载后）读取，
  // 避免 SSR（无 localStorage）与客户端首帧不一致 → hydration mismatch → 整根失活（表现为「点不动」）。
  const [lang, setLangState] = useState<Lang>('zh');
  const [cloudOn, setCloudOn] = useState<boolean>(false);
  const [theme, setThemeState] = useState<Theme>('static');
  const [toastMsg, setToastMsg] = useState<{ msg: string; id: number } | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbRef = useRef<DB>(db);
  dbRef.current = db;
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ phone?: string; email?: string; name?: string; avatar?: string } | null>(null);

const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const toast = (msg: string) => {
  if (toastTimer.current) clearTimeout(toastTimer.current);
  setToastMsg({ msg, id: Date.now() });
  toastTimer.current = setTimeout(() => setToastMsg(null), 1000);
};
const clearToast = () => {
  if (toastTimer.current) clearTimeout(toastTimer.current);
  setToastMsg(null);
};
const saveProfile = (patch: Partial<Profile>) => {
  const next: DB = { ...db, profile: { ...db.profile, ...patch } };
  setDb(next);
  schedulePush(next);
};

  // 正式环境：业务数据不落本地，只走云端；保留 theme/auth/cloud 配置等 UI 偏好
  const schedulePush = (nextDb: DB) => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      cloudPush(dbRef.current).catch(() => undefined);
    }, 400);
  };

  // 启动：客户端挂载后恢复真实 UI/登录态，再拉取云端业务数据
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 恢复云端配置与登录态（这些值在 SSR 时不可得，必须等客户端挂载后设置，避免 hydration mismatch）
    cloudInit();
    setCloudOn(cloudEnabled());
    setLangState(getLang());
    setThemeState(getStoredTheme());
    const sess = getSession();
    setIsLoggedIn(!!sess);
    setCurrentUser(sess ? {
      phone: sess.user?.phone,
      email: sess.user?.email,
      name: sess.user?.user_metadata?.display_name as string | undefined,
      avatar: sess.user?.user_metadata?.avatar_url as string | undefined,
    } : null);
    // 业务数据完全来自云端，本地不再缓存 babycare_db（清除旧缓存避免回源）
    try { localStorage.removeItem('babycare_db'); } catch { /* ignore */ }
    if (cloudEnabled()) {
      cloudPull(EMPTY_DB).then((merged) => {
        try { const m = JSON.parse(localStorage.getItem('babycare_msdone') || '[]'); if (Array.isArray(m)) (merged as DB).milestoneDone = m; } catch { /* ignore */ }
        setDb(merged);
      });
    } else {
      // 本地模式：从 localStorage 恢复「完成」标记
      try { const m = JSON.parse(localStorage.getItem('babycare_msdone') || '[]'); if (Array.isArray(m)) setDb((p) => ({ ...p, milestoneDone: m })); } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsertRow = (table: TableName, row: Record<string, unknown>) => {
    setDb((prev) => {
      const arr = prev[table] as unknown as any[];
      const idx = arr.findIndex((x) => x.id === row.id);
      const nextArr = idx >= 0
        ? arr.map((x) => (x.id === row.id ? { ...x, ...row, updatedAt: Date.now() } : x))
        : [...arr, { ...row, createdAt: Date.now(), updatedAt: Date.now() }];
      const nextDb = { ...prev, [table]: nextArr } as unknown as DB;
      schedulePush(nextDb);
      return nextDb;
    });
  };

  const deleteRow = (table: TableName, id: string) => {
    setDb((prev) => {
      const arr = prev[table] as unknown as any[];
      const nextDb = { ...prev, [table]: arr.filter((x) => x.id !== id) } as unknown as DB;
      schedulePush(nextDb);
      return nextDb;
    });
  };

  const toggleMilestoneDone = (id: string) => {
    setDb((prev) => {
      const has = prev.milestoneDone.includes(id);
      const nextDone = has ? prev.milestoneDone.filter((x) => x !== id) : [...prev.milestoneDone, id];
      // 单独落地 localStorage，因其不在云端同步表内（属 UI 偏好，单机保留即可）
      try { if (typeof window !== 'undefined') localStorage.setItem('babycare_msdone', JSON.stringify(nextDone)); } catch { /* ignore */ }
      const nextDb = { ...prev, milestoneDone: nextDone } as DB;
      schedulePush(nextDb);
      return nextDb;
    });
  };

  const deleteBabyCascade = async (babyId: string) => {
    // 取消待执行的自动 push，避免与删除流程的 push 冲突
    if (pushTimer.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }
    setDb((prev) => {
      const nextDb = { ...prev, babies: prev.babies.filter((b) => b.id !== babyId) } as DB;
      ['feedings', 'diapers', 'sleeps', 'temps', 'medicines', 'medicals', 'weights', 'consumptions', 'milestones'].forEach((tb) => {
        (nextDb as any)[tb] = ((prev as any)[tb]).filter((x: any) => x.babyId !== babyId);
      });
      dbRef.current = nextDb;
      return nextDb;
    });
    if (cloudOn) {
      try {
        await cloudDeleteBaby(babyId);
        await cloudPush(dbRef.current);
        logOperation('delete_baby', `babyId=${babyId}`);
        toast('已同步删除 ✓');
      } catch (e) {
        logOperation('delete_baby_fail', `babyId=${babyId};error=${e instanceof Error ? e.message : 'unknown'}`);
        toast('云端删除失败：' + (e instanceof Error ? e.message : '请检查网络'));
      }
    } else {
      logOperation('delete_baby_local', `babyId=${babyId}`);
    }
  };

  const saveMedicalRow = (row: Partial<Medical> & { id?: string }) => {
    setDb((prev) => {
      const ts = Date.now();
      const arr = prev.medicals;
      let medical: Medical;
      let medicals: Medical[];
      if (row.id) {
        const ex = arr.find((m) => m.id === row.id);
        medical = ex ? { ...ex, ...row, updatedAt: ts } as Medical : { id: row.id, ...row, createdAt: ts, updatedAt: ts } as Medical;
        medicals = arr.map((m) => (m.id === row.id ? medical : m));
      } else {
        medical = { id: uid(), ...row, createdAt: ts, updatedAt: ts } as Medical;
        medicals = [...arr, medical];
      }
      const { db: d2, m: m2 } = syncConsumption({ ...prev, medicals }, medical, lang);
      const nextDb = { ...d2, medicals: d2.medicals.map((m) => (m.id === m2.id ? m2 : m)) };
      schedulePush(nextDb);
      return nextDb;
    });
  };

  const deleteMedicalRow = (id: string) => {
    setDb((prev) => {
      const m = prev.medicals.find((x) => x.id === id);
      let consumptions = prev.consumptions;
      if (m && m.syncedId) consumptions = consumptions.filter((c) => c.id !== m.syncedId);
      const nextDb = { ...prev, medicals: prev.medicals.filter((x) => x.id !== id), consumptions } as DB;
      schedulePush(nextDb);
      return nextDb;
    });
  };

  const doseMed = (id: string) => {
    setDb((prev) => {
      const today = ymd();
      const medicines = prev.medicines.map((m) => {
        if (m.id !== id) return m;
        const got = m.doses[today] || 0;
        if (got >= m.freq) return m;
        return { ...m, doses: { ...m.doses, [today]: got + 1 }, updatedAt: Date.now() };
      });
      const nextDb = { ...prev, medicines } as DB;
      schedulePush(nextDb);
      return nextDb;
    });
  };

  const saveCloudCfg = async (url: string, key: string) => {
    cloudSave(url, key);
    const on = cloudEnabled();
    setCloudOn(on);
    if (on) {
      toast('正在同步云端…');
      try {
        let merged = dbRef.current;
        merged = await cloudPull(merged);
        await cloudPush(merged);
        setDb(merged);
        toast('云端已同步 ✓');
      } catch {
        toast('同步失败：请检查 URL / anon key / 网络');
      }
    } else {
      toast('已保存（本地模式）');
    }
  };

  const syncNow = async () => {
    if (!cloudEnabled()) { toast('请先填写并保存同步设置'); return; }
    toast('正在同步…');
    try {
      let merged = await cloudPull(dbRef.current);
      await cloudPush(merged);
      setDb(merged);
      setLastSyncAt(Date.now());
      toast('已同步 ✓');
    } catch (e) {
      toast('同步失败：' + (e instanceof Error ? e.message : '网络问题'));
    }
  };

  const testConn = (url: string, key: string) => cloudTest(url, key);

  const closeCloud = () => {
    cloudSave('', '');
    setLocalOnly(true);
    setCloudOn(false);
    toast('已切换到本地模式');
  };

  const setLocalMode = (on: boolean) => {
    setLocalOnly(on);
    setCloudOn(!on && cloudEnabled());
    toast(on ? '已切换到本地模式' : '已启用云端同步');
  };

  // 是否正在使用部署预置的默认值（用于「我的」页提示，避免用户误改）
  const usingDefaultCloud = !cloudUserOverridden() && hasDefaultCloud();

  const loadSamples = () => {
    const ZH = lang === 'zh';
    const demoName = ZH ? '小星星' : 'Little Star';
    setDb((prev) => {
      // 防重复：已存在演示宝宝则跳过，避免多次点击叠加
      if (prev.babies.some((b) => b.name === demoName)) {
        return prev;
      }
      const ts = Date.now();
      const bid = uid();
      const babies: Baby[] = [...prev.babies, {
        id: bid, name: demoName, birthday: '2024-02-10', gender: 'female',
        height: '60', weight: '7.5', bloodType: 'A',
        avatar: '', note: ZH ? '爱笑的小公主 👧' : 'A smiling little princess', createdAt: ts, updatedAt: ts,
      }];
      // 喂奶：过去 14 天，每天 4~5 次，奶量/类型有波动
      const feedings: Feeding[] = [...prev.feedings];
      const feedTimes = ['07:30', '11:00', '14:30', '18:00', '21:30'];
      for (let d = 14; d >= 0; d--) {
        const day = new Date(); day.setDate(day.getDate() - d);
        const n = d % 2 === 0 ? 5 : 4;
        for (let k = 0; k < n; k++) {
          feedings.push({
            id: uid(), babyId: bid, date: ymd(day), time: feedTimes[k],
            amount: String(110 + ((d + k) % 4) * 15), type: ['milk', 'formula', 'solid'][(d + k) % 3],
            note: '', createdAt: ts, updatedAt: ts,
          });
        }
      }
      // 换尿布：过去 14 天，每天 2~4 次
      const diapers: Diaper[] = [...prev.diapers];
      const diaperTimes = ['08:00', '12:30', '16:00', '20:30', '23:00'];
      for (let d = 14; d >= 0; d--) {
        const day = new Date(); day.setDate(day.getDate() - d);
        const n = 2 + (d % 3);
        for (let k = 0; k < n; k++) {
          diapers.push({
            id: uid(), babyId: bid, date: ymd(day), time: diaperTimes[k],
            type: ['wet', 'dirty', 'both'][(d + k) % 3], note: '', createdAt: ts, updatedAt: ts,
          });
        }
      }
      // 睡眠：过去 7 天，每天 夜睡 + 午睡
      const sleeps: Sleep[] = [...prev.sleeps];
      for (let d = 7; d >= 0; d--) {
        const day = new Date(); day.setDate(day.getDate() - d);
        sleeps.push({ id: uid(), babyId: bid, date: ymd(day), start: '21:30', end_time: '06:30', duration: 540, note: ZH ? '夜间睡眠' : 'Night sleep', createdAt: ts, updatedAt: ts });
        sleeps.push({ id: uid(), babyId: bid, date: ymd(day), start: '13:30', end_time: '15:00', duration: 90, note: ZH ? '午睡' : 'Nap', createdAt: ts, updatedAt: ts });
      }
      // 体温：过去 7 天，每天 1 次（轻微波动，便于看曲线）
      const temps: Temp[] = [...prev.temps];
      for (let d = 7; d >= 0; d--) {
        const day = new Date(); day.setDate(day.getDate() - d);
        temps.push({ id: uid(), babyId: bid, date: ymd(day), time: '08:00', value: (36.5 + ((d % 3) * 0.3)).toFixed(1), note: '', createdAt: ts, updatedAt: ts });
      }
      // 体重：过去 4 周，每周 1 次（稳定增长）+ 同步身高/头围
      const weights: Weight[] = [...prev.weights];
      for (let w = 4; w >= 0; w--) {
        const day = new Date(); day.setDate(day.getDate() - w * 7);
        const wk = 4 - w; // 0..4
        weights.push({
          id: uid(), babyId: bid, date: ymd(day),
          weight: (6.8 + wk * 0.18).toFixed(1),
          height: (60 + wk * 1.2).toFixed(1),
          head: (40 + wk * 0.5).toFixed(1),
          createdAt: ts, updatedAt: ts,
        });
      }
      // 用药：维 D 每日 1 次
      const today = ymd();
      const medicines: Medicine[] = [...prev.medicines, {
        id: uid(), babyId: bid, name: ZH ? '维生素D' : 'Vit D', startDate: today, totalDays: 30, freq: 1,
        doses: { [today]: 1 }, note: ZH ? '促进钙吸收' : 'Calcium absorption', createdAt: ts, updatedAt: ts,
      }];
      // 医疗：疫苗（已接种 + 下次预约）
      const nd = new Date(); nd.setDate(nd.getDate() + 21);
      const medicals: Medical[] = [...prev.medicals, {
        id: uid(), babyId: bid, type: 'vaccine', date: today, nextDate: ymd(nd), cost: '0',
        note: ZH ? '乙肝疫苗第2针' : 'HBV vaccine 2nd dose', syncedId: null, createdAt: ts, updatedAt: ts,
      }];
      // 消费
      const consumptions: Consumption[] = [...prev.consumptions,
        { id: uid(), babyId: bid, category: 'catfood', amount: '358', date: today, note: ZH ? '奶粉1罐' : 'Formula', source: 'manual', createdAt: ts, updatedAt: ts },
        { id: uid(), babyId: bid, category: 'catdiaper', amount: '129', date: ymd(new Date(Date.now() - 3 * 86400000)), note: ZH ? '纸尿裤' : 'Diapers', source: 'manual', createdAt: ts, updatedAt: ts },
        { id: uid(), babyId: bid, category: 'cattoy', amount: '89', date: ymd(new Date(Date.now() - 6 * 86400000)), note: ZH ? '摇铃玩具' : 'Toy', source: 'manual', createdAt: ts, updatedAt: ts },
      ];
      // 手动成长记录（成长里程碑）
      const milestones = [...prev.milestones,
        { id: uid(), babyId: bid, type: 'smile', date: ymd(new Date(Date.now() - 800 * 86400000)), note: ZH ? '第一次冲妈妈笑' : 'First smile at mommy', createdAt: ts, updatedAt: ts },
        { id: uid(), babyId: bid, type: 'rollover', date: ymd(new Date(Date.now() - 600 * 86400000)), note: ZH ? '学会翻身啦' : 'Learned to roll over', createdAt: ts, updatedAt: ts },
        { id: uid(), babyId: bid, type: 'sit', date: ymd(new Date(Date.now() - 400 * 86400000)), note: ZH ? '能自己坐稳玩玩具' : 'Can sit and play', createdAt: ts, updatedAt: ts },
        { id: uid(), babyId: bid, type: 'teeth', date: ymd(new Date(Date.now() - 300 * 86400000)), note: ZH ? '第一颗小乳牙冒头' : 'First tooth came out', createdAt: ts, updatedAt: ts },
      ];
      // 提醒
      const reminders: Reminder[] = [...prev.reminders,
        { id: uid(), babyId: bid, title: ZH ? '喂奶提醒' : 'Feeding', subTitle: ZH ? '每4小时' : 'Every 4h', icon: '🍼', cycle: JSON.stringify({ type: 'hourly', hours: 4 }), enabled: true, createdAt: ts, updatedAt: ts },
        { id: uid(), babyId: bid, title: ZH ? '测体温' : 'Measure temp', subTitle: ZH ? '每天 20:00' : 'Daily 20:00', icon: '🌡', cycle: JSON.stringify({ type: 'daily', time: '20:00' }), enabled: true, createdAt: ts, updatedAt: ts },
        { id: uid(), babyId: bid, title: ZH ? '疫苗预约' : 'Vaccine', subTitle: ZH ? '3周后' : 'In 3 weeks', icon: '💉', cycle: JSON.stringify({ type: 'once', days: 21 }), enabled: false, createdAt: ts, updatedAt: ts },
      ];
      const nextDb: DB = { profile: { ...prev.profile }, babies, feedings, diapers, sleeps, temps, medicines, medicals, weights, reminders, consumptions, milestones, milestoneDone: prev.milestoneDone || [] };
      // ⚠️ 演示数据【仅写入本地内存】，刻意不调用 schedulePush，避免污染云端/正式环境
      return nextDb;
    });
    toast(ZH ? '已载入演示数据（仅本地，不会同步到云端）' : 'Demo data loaded (local only, not synced)');
  };

  const clearData = () => {
    if (!confirm((lang === 'en' ? 'Clear all data?' : '确定清空所有数据？'))) return;
    const nextDb = JSON.parse(JSON.stringify(EMPTY_DB)) as DB;
    if (cloudOn) {
      // 云端模式：直接清空云端所有表，避免本地删了云端残留
      TABLES.forEach((tb) => {
        fetch(`${cloudUrl()}/rest/v1/${tb}?id=neq.00000000-0000-0000-0000-000000000000`, {
          method: 'DELETE',
          headers: { apikey: cloudKey(), Authorization: `Bearer ${getAuthToken() || cloudKey()}` },
        }).catch(() => undefined);
      });
      setTimeout(() => {
        cloudPush(EMPTY_DB).catch(() => undefined);
        setDb(nextDb);
        toast('已清空云端数据');
      }, 600);
    } else {
      setDb(nextDb);
    }
    schedulePush(nextDb);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(dbRef.current, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'babycare-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('已导出');
  };

  const importData = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result)) as DB;
        const nextDb: DB = { ...JSON.parse(JSON.stringify(EMPTY_DB)), ...d };
        TABLES.forEach((tb) => { if (!Array.isArray(nextDb[tb])) (nextDb as any)[tb] = []; });
        schedulePush(nextDb);
        setDb(nextDb);
        toast('已导入');
      } catch { toast('文件格式错误'); }
    };
    r.readAsText(file);
  };

  const toggleLang = () => {
    i18nToggle();
    setLangState(getLang());
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('babycare_theme', t);
    }
  };

  const login = (session?: SaSession) => {
    if (session) setSession(session);
    else mockLogin();
    const s = getSession();
    // 注入登录 JWT（dev mock 的 local-mock 视为未登录，回退 anon）
    setAuthToken(s?.access_token && s.access_token !== 'local-mock' ? s.access_token : null);
    setIsLoggedIn(true);
    setCurrentUser(s ? {
      phone: s.user?.phone,
      email: s.user?.email,
      name: s.user?.user_metadata?.display_name as string | undefined,
      avatar: s.user?.user_metadata?.avatar_url as string | undefined,
    } : null);
  };

  const loginWithSession = () => {
    const s = getSession();
    setAuthToken(s?.access_token && s.access_token !== 'local-mock' ? s.access_token : null);
    setIsLoggedIn(true);
    setCurrentUser(s ? {
      phone: s.user?.phone,
      email: s.user?.email,
      name: s.user?.user_metadata?.display_name as string | undefined,
      avatar: s.user?.user_metadata?.avatar_url as string | undefined,
    } : null);
  };

  // 更新当前登录用户的个人资料（昵称 / 头像），写入 Supabase user_metadata（与业务数据分离、按账号独立）
  const updateProfile = async (patch: { name?: string; avatar?: string }) => {
    const res = await authUpdateProfile({ display_name: patch.name, avatar_url: patch.avatar });
    if (res.error) { toast(res.error); return; }
    const s = getSession();
    setCurrentUser(s ? {
      phone: s.user?.phone,
      email: s.user?.email,
      name: s.user?.user_metadata?.display_name as string | undefined,
      avatar: s.user?.user_metadata?.avatar_url as string | undefined,
    } : null);
    toast('资料已保存 ✓');
  };

  const logout = () => {
    signOut();
    setAuthToken(null);
    setIsLoggedIn(false);
    setCurrentUser(null);
    toast('已退出登录');
  };

  // 我的页子视图状态（全局 Header 在 mine tab 点击进入个人资料）
  const [mineSub, setMineSub] = useState<MineSub>('main');

  const value: StoreCtx = {
    db, lang, cloudOn, theme, toastMsg, toast, clearToast, toggleLang, setTheme,
    saveProfile, updateProfile,
    isLoggedIn, currentUser, login, loginWithSession, logout,
    mineSub, setMineSub, lastSyncAt,
    upsertRow, deleteRow, toggleMilestoneDone, deleteBabyCascade, saveMedicalRow, deleteMedicalRow, doseMed,
    saveCloudCfg, syncNow, testConn, closeCloud, setLocalMode, usingDefaultCloud,
    loadSamples, clearData, exportData, importData,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { uid, ymd };
