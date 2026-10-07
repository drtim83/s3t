import { create } from 'zustand';
import type { Profile, Project, ProjectRole } from '../lib/database.types';

// ─── Auth Store ──────────────────────────────────────────────────
interface AuthState {
  user: Profile | null;
  sessionRole: ProjectRole | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setSessionRole: (role: ProjectRole | null) => void;
  setLoading: (v: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  sessionRole: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSessionRole: (role) => set({ sessionRole: role }),
  setLoading: (v) => set({ isLoading: v }),
  clearAuth: () => set({ user: null, sessionRole: null }),
}));

// ─── UI Store ────────────────────────────────────────────────────
interface UIState {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),
}));

// ─── Toast / Notification Store ─────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface NotifState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useNotifStore = create<NotifState>()((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: Math.random().toString(36).slice(2) },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Helper hook for convenient toast usage
export const useToast = () => {
  const { addToast } = useNotifStore();
  return {
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error:   (title: string, message?: string) => addToast({ type: 'error',   title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info:    (title: string, message?: string) => addToast({ type: 'info',    title, message }),
  };
};
