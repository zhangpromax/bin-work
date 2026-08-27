export interface Baby {
  id: string;
  name: string;
  birthday: string;
  gender: 'male' | 'female';
  height: string; // cm
  weight: string; // kg
  bloodType: string; // A|B|AB|O|''
  avatar: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Feeding {
  id: string;
  babyId: string;
  date: string;
  time: string;
  amount: string;
  type: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Diaper {
  id: string;
  babyId: string;
  date: string;
  time: string;
  type: string; // wet | dirty | both
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Sleep {
  id: string;
  babyId: string;
  date: string;
  start: string;
  end_time: string;
  duration: number; // minutes
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Temp {
  id: string;
  babyId: string;
  date: string;
  time: string;
  value: string; // °C
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Medicine {
  id: string;
  babyId: string;
  name: string;
  startDate: string;
  totalDays: number;
  freq: number;
  doses: Record<string, number>;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Medical {
  id: string;
  babyId: string;
  type: string; // vaccine | checkup | visit | other
  date: string;
  nextDate: string;
  cost: string;
  note: string;
  syncedId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Weight {
  id: string;
  babyId: string;
  date: string;
  weight: string; // kg
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  babyId: string;
  title: string;
  subTitle: string;
  icon: string;
  cycle: string; // JSON { type:'once'|'daily'|'hourly'|'weekly', ... }
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Consumption {
  id: string;
  babyId: string;
  category: string; // catfood | catmedical | cattoy | catcloth | catother
  amount: string;
  date: string;
  note: string;
  source: string; // manual | medical
  createdAt: number;
  updatedAt: number;
}

export interface Milestone {
  id: string;
  babyId: string;
  date: string;
  type: string; // smile | rollover | sit | teeth | crawl | stand | walk | talk | callparents | recognize | other
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  avatar: string;
  username: string;
  gender: 'male' | 'female' | '';
  phone: string;
  signature: string;
}

export const EMPTY_PROFILE: Profile = {
  avatar: '',
  username: '家有宝宝',
  gender: '',
  phone: '',
  signature: '',
};

export interface DB {
  profile: Profile;
  babies: Baby[];
  feedings: Feeding[];
  diapers: Diaper[];
  sleeps: Sleep[];
  temps: Temp[];
  medicines: Medicine[];
  medicals: Medical[];
  weights: Weight[];
  reminders: Reminder[];
  consumptions: Consumption[];
  milestones: Milestone[];
  milestoneDone: string[]; // 0-6岁成长里程碑模板中已被用户标记「完成」的项 id
}

export const TABLES = [
  'babies', 'feedings', 'diapers', 'sleeps', 'temps',
  'medicines', 'medicals', 'weights', 'reminders', 'consumptions', 'milestones',
] as const;

export type TableName = (typeof TABLES)[number];

export const EMPTY_DB: DB = {
  profile: { ...EMPTY_PROFILE },
  babies: [], feedings: [], diapers: [], sleeps: [], temps: [],
  medicines: [], medicals: [], weights: [], reminders: [], consumptions: [], milestones: [], milestoneDone: [],
};
