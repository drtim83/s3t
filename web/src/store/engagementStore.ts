// S3T — Zustand store for engagement-level state (per-project financial data)
// Persists to localStorage keyed by project ID
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RateCardItem, EngagementResource, ProjectEngagementConfig,
  ExpenseItem, ForexRate, ProjectAttachment,
} from '../lib/calculations';
import {
  DEFAULT_RATE_CARD, DEFAULT_FOREX, DEFAULT_ENGAGEMENT_CONFIG,
} from '../lib/calculations';

interface EngagementState {
  // Per-project data (keyed by projectId)
  rateCards: Record<string, RateCardItem[]>;
  resources: Record<string, EngagementResource[]>;
  configs: Record<string, ProjectEngagementConfig>;
  expenses: Record<string, ExpenseItem[]>;
  attachments: Record<string, ProjectAttachment[]>;
  forex: ForexRate[];
  secondaryCurrency: string;
  isForexLoading: boolean;

  // Actions
  getRateCard: (projectId: string) => RateCardItem[];
  setRateCard: (projectId: string, rc: RateCardItem[]) => void;
  getResources: (projectId: string) => EngagementResource[];
  setResources: (projectId: string, res: EngagementResource[]) => void;
  getConfig: (projectId: string) => ProjectEngagementConfig;
  setConfig: (projectId: string, cfg: ProjectEngagementConfig) => void;
  updateConfig: (projectId: string, updates: Partial<ProjectEngagementConfig>) => void;
  getExpenses: (projectId: string) => ExpenseItem[];
  setExpenses: (projectId: string, exp: ExpenseItem[]) => void;
  getAttachments: (projectId: string) => ProjectAttachment[];
  setAttachments: (projectId: string, att: ProjectAttachment[]) => void;
  setForex: (forex: ForexRate[]) => void;
  setForexLoading: (v: boolean) => void;
  setSecondaryCurrency: (code: string) => void;
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      rateCards: {},
      resources: {},
      configs: {},
      expenses: {},
      attachments: {},
      forex: DEFAULT_FOREX,
      secondaryCurrency: 'USD',
      isForexLoading: false,

      getRateCard: (pid) => get().rateCards[pid] ?? DEFAULT_RATE_CARD.map(r => ({ ...r, project_id: pid })),
      setRateCard: (pid, rc) => set(s => ({ rateCards: { ...s.rateCards, [pid]: rc } })),

      getResources: (pid) => get().resources[pid] ?? [],
      setResources: (pid, res) => set(s => ({ resources: { ...s.resources, [pid]: res } })),

      getConfig: (pid) => get().configs[pid] ?? { ...DEFAULT_ENGAGEMENT_CONFIG },
      setConfig: (pid, cfg) => set(s => ({ configs: { ...s.configs, [pid]: cfg } })),
      updateConfig: (pid, updates) => {
        const cur = get().configs[pid] ?? { ...DEFAULT_ENGAGEMENT_CONFIG };
        set(s => ({ configs: { ...s.configs, [pid]: { ...cur, ...updates } } }));
      },

      getExpenses: (pid) => get().expenses[pid] ?? [],
      setExpenses: (pid, exp) => set(s => ({ expenses: { ...s.expenses, [pid]: exp } })),

      getAttachments: (pid) => get().attachments[pid] ?? [],
      setAttachments: (pid, att) => set(s => ({ attachments: { ...s.attachments, [pid]: att } })),

      setForex: (forex) => set({ forex }),
      setForexLoading: (v) => set({ isForexLoading: v }),
      setSecondaryCurrency: (code) => set({ secondaryCurrency: code }),
    }),
    {
      name: 's3t-engagement-store',
    }
  )
);
