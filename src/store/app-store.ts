import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { configureFal } from '../fal/client';
import type { ToastItem } from '../components/Toast';

export type BgStyle = 'fine' | 'coarse' | 'cross';

interface AppState {
  falApiKey: string;
  theme: 'dark' | 'light';
  bgStyle: BgStyle;
  showGradient: boolean;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  flowBrowserOpen: boolean;
  selectedNodeId: string | null;
  toasts: ToastItem[];

  setFalApiKey: (key: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setBgStyle: (style: BgStyle) => void;
  setShowGradient: (show: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setFlowBrowserOpen: (open: boolean) => void;
  setSelectedNodeId: (id: string | null) => void;
  initializeFal: () => void;
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

const ENV_API_KEY = import.meta.env.VITE_FAL_KEY || '';

let toastCounter = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      falApiKey: ENV_API_KEY,
      theme: 'dark',
      bgStyle: 'fine' as BgStyle,
      showGradient: true,
      sidebarOpen: true,
      settingsOpen: false,
      flowBrowserOpen: false,
      selectedNodeId: null,
      toasts: [],

      setFalApiKey: (key: string) => {
        set({ falApiKey: key });
        if (key) configureFal(key);
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
      },

      setTheme: (theme) => set({ theme }),
      setBgStyle: (style) => set({ bgStyle: style }),
      setShowGradient: (show) => set({ showGradient: show }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setFlowBrowserOpen: (open) => set({ flowBrowserOpen: open }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      initializeFal: () => {
        const key = get().falApiKey;
        if (key) configureFal(key);
      },

      addToast: (message, type = 'info') => {
        const id = `toast_${Date.now()}_${++toastCounter}`;
        set({ toasts: [...get().toasts, { id, message, type }] });
      },

      removeToast: (id) => {
        set({ toasts: get().toasts.filter((t) => t.id !== id) });
      },
    }),
    {
      name: 'fal-canvas-app',
      partialize: (state) => ({
        falApiKey: state.falApiKey !== ENV_API_KEY ? state.falApiKey : undefined,
        theme: state.theme,
        bgStyle: state.bgStyle,
        showGradient: state.showGradient,
      }),
    }
  )
);
