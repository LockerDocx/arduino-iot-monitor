import { create } from 'zustand';

type CursorState = 'default' | 'thermal' | 'liquid';
type MetricType = 'temperature' | 'humidity' | null;

interface UIStore {
  cursorState: CursorState;
  setCursorState: (state: CursorState) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isBooting: boolean;
  setBooting: (state: boolean) => void;
  isDrawerOpen: boolean;
  setDrawerOpen: (state: boolean) => void;
  expandedMetric: MetricType;
  setExpandedMetric: (metric: MetricType) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  cursorState: 'default',
  setCursorState: (state) => set({ cursorState: state }),
  isFullscreen: false,
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  isBooting: true,
  setBooting: (state) => set({ isBooting: state }),
  isDrawerOpen: false,
  setDrawerOpen: (state) => set({ isDrawerOpen: state }),
  expandedMetric: null,
  setExpandedMetric: (metric) => set({ expandedMetric: metric }),
}));
