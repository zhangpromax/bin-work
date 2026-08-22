export interface Baby {
  id: string;
  name: string;
  birthday: string;
  gender: 'male' | 'female';
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

export interface DB {
  babies: Baby[];
  feedings: Feeding[];
  diapers: Diaper[];
  sleeps: Sleep[];
  temps: Temp[];
  medicines: Medicine[];
  medicals: Medical[];
  weights: Weight[];
  consumptions: Consumption[];
}

export const TABLES = [
  'babies', 'feedings', 'diapers', 'sleeps', 'temps',
  'medicines', 'medicals', 'weights', 'consumptions',
] as const;

export type TableName = (typeof TABLES)[number];

export const EMPTY_DB: DB = {
  babies: [], feedings: [], diapers: [], sleeps: [], temps: [],
  medicines: [], medicals: [], weights: [], consumptions: [],
};
