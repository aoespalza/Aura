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
};
