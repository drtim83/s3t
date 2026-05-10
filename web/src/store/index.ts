import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Project, ProjectRole } from '../lib/database.types';

// ─── Auth Store ──────────────────────────────────────────────────────────────
interface AuthState {
  user: Profile | null;
  sessionRole: ProjectRole | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setSessionRole: (role: ProjectRole | null) => void;
  setLoading: (v: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionRole: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSessionRole: (role) => set({ sessionRole: role }),
      setLoading: (v) => set({ isLoading: v }),
      clearAuth: () => set({ user: null, sessionRole: null }),
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user }) }
  )
);

// ─── UI Store ────────────────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  activeProjectId: string | null;
  activeProject: Project | null;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  setActiveProject: (project: Project | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  activeProjectId: null,
  activeProject: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setActiveProject: (project) =>
    set({ activeProject: project, activeProjectId: project?.id ?? null }),
}));

// ─── Notification Store ──────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
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
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Helper hook for easy toast usage
export const useToast = () => {
  const { addToast } = useNotifStore();
  return {
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error:   (title: string, message?: string) => addToast({ type: 'error',   title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info:    (title: string, message?: string) => addToast({ type: 'info',    title, message }),
  };
};
