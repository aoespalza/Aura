import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('aura_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export interface DailyEntry {
  id?: string;
  date: string;
  mood: number;
  moodNotes?: string;
  hasIntimacy?: boolean;
  intimacyQuality?: number;
  hasDisgust?: boolean;
  disgustReason?: string;
  disgustCategory?: string;
  disgustIntensity?: number;
  disgustResolved?: boolean;
  isPeriodDay?: boolean;
  periodDayNumber?: number;
  periodSymptoms?: string;
  hasDetail?: boolean;
  detailFrom?: string;
  detailType?: string;
  detailDescription?: string;
  energyLevel?: number;
  herMood?: number;
  herMoodNotes?: string;
  herEnergyLevel?: number;
  herNotes?: string;
  [key: string]: any;
}

export interface PeriodCycle {
  id: string;
  startDate: string;
  endDate?: string;
  duration?: number;
  notes?: string;
}

export interface Stats {
  total: number;
  avgMood: number;
  intimacyDays: number;
  disgustDays: number;
  periodDays: number;
  detailDays: number;
  periodDisgustRate: number;
  moodByWeekday: Record<string, number>;
}

export interface SpecialDate {
  id: string;
  name: string;
  month: number;
  day: number;
  type: string;
  notes?: string;
  reminderDays: number;
  daysUntil?: number;
  nextDate?: string;
}

export interface Points {
  totalPoints: number;
  periodPoints: number;
  level: { min: number; label: string; color: string };
  nextLevel?: { min: number; label: string; color: string };
  progressToNext: number;
  breakdown: { days: number; intimacyBonus: number; detailBonus: number; moodBonus: number; resolvedBonus: number };
  monthly: { month: string; points: number }[];
}

export interface Suggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

export const auraApi = {
  login: async (pin: string) => {
    const { data } = await api.post('/auth/login', { pin });
    return data;
  },

  getEntries: async (month: string): Promise<DailyEntry[]> => {
    const { data } = await api.get(`/entries?month=${month}`);
    return data;
  },

  getEntry: async (date: string): Promise<DailyEntry | null> => {
    const { data } = await api.get(`/entries/${date}`);
    return data;
  },

  saveEntry: async (entry: DailyEntry): Promise<DailyEntry> => {
    const { data } = await api.post('/entries', entry);
    return data;
  },

  deleteEntry: async (date: string) => {
    await api.delete(`/entries/${date}`);
  },

  getStats: async (months = 3): Promise<Stats> => {
    const { data } = await api.get(`/entries/stats?months=${months}`);
    return data;
  },

  getPeriodCycles: async (): Promise<PeriodCycle[]> => {
    const { data } = await api.get('/period');
    return data;
  },

  createPeriodCycle: async (cycle: { startDate: string; endDate?: string; notes?: string }) => {
    const { data } = await api.post('/period', cycle);
    return data;
  },

  updatePeriodCycle: async (id: string, data: { endDate?: string; notes?: string }) => {
    const res = await api.put(`/period/${id}`, data);
    return res.data;
  },

  deletePeriodCycle: async (id: string) => {
    await api.delete(`/period/${id}`);
  },

  getNextPeriodPrediction: async () => {
    const { data } = await api.get('/period/next');
    return data;
  },

  // Fechas especiales
  getSpecialDates: async (): Promise<SpecialDate[]> => {
    const { data } = await api.get('/special-dates');
    return data;
  },
  getUpcomingSpecialDates: async (days = 30): Promise<SpecialDate[]> => {
    const { data } = await api.get(`/special-dates/upcoming?days=${days}`);
    return data;
  },
  createSpecialDate: async (d: Omit<SpecialDate, 'id'>): Promise<SpecialDate> => {
    const { data } = await api.post('/special-dates', d);
    return data;
  },
  updateSpecialDate: async (id: string, d: Partial<SpecialDate>): Promise<SpecialDate> => {
    const { data } = await api.put(`/special-dates/${id}`, d);
    return data;
  },
  deleteSpecialDate: async (id: string) => { await api.delete(`/special-dates/${id}`); },

  // Matripuntos
  getPoints: async (months = 3): Promise<Points> => {
    const { data } = await api.get(`/points?months=${months}`);
    return data;
  },

  // Sugerencias
  getSuggestions: async (): Promise<Suggestion[]> => {
    const { data } = await api.get('/suggestions');
    return data;
  },
};
