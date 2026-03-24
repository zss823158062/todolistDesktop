import { create } from "zustand";
import type { AppSettings } from "@/types";
import {
  getSettings,
  saveSettings,
  setAlwaysOnTop,
  setAutoStart,
  setOpacity as apiSetOpacity,
} from "@/lib/tauri";

const DEFAULT_SETTINGS: AppSettings = {
  windowX: -1,
  windowY: -1,
  windowWidth: 280,
  windowHeight: 400,
  alwaysOnTop: true,
  opacity: 0.9,
  autoStart: false,
  theme: "auto",
};

interface SettingsStore {
  /** 当前应用设置 */
  settings: AppSettings;
  /** 初始化：从后端加载设置 */
  initialize(): Promise<void>;
  /** 更新透明度并应用到窗口 */
  setOpacity(opacity: number): Promise<void>;
  /** 切换置顶状态 */
  toggleAlwaysOnTop(): Promise<void>;
  /** 切换开机自启动 */
  toggleAutoStart(): Promise<void>;
  /** 更新主题 */
  setTheme(theme: AppSettings["theme"]): Promise<void>;
  /** 保存窗口位置/尺寸（窗口 move/resize 事件触发） */
  saveWindowBounds(
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void>;
}

/** 防抖计时器 ID */
let saveWindowBoundsTimer: ReturnType<typeof setTimeout> | null = null;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },

  initialize: async () => {
    try {
      const settings = await getSettings();
      set({ settings });
    } catch (err) {
      console.error("[settingsStore] initialize failed:", err);
      set({ settings: { ...DEFAULT_SETTINGS } });
    }
  },

  setOpacity: async (opacity: number) => {
    try {
      // 实时更新窗口透明度
      await apiSetOpacity(opacity);
      // 更新本地 store
      const newSettings: AppSettings = { ...get().settings, opacity };
      set({ settings: newSettings });
      // 持久化保存
      await saveSettings(newSettings);
    } catch (err) {
      console.error("[settingsStore] setOpacity failed:", err);
    }
  },

  toggleAlwaysOnTop: async () => {
    const current = get().settings.alwaysOnTop;
    const next = !current;
    try {
      await setAlwaysOnTop(next);
      const newSettings: AppSettings = {
        ...get().settings,
        alwaysOnTop: next,
      };
      set({ settings: newSettings });
      await saveSettings(newSettings);
    } catch (err) {
      console.error("[settingsStore] toggleAlwaysOnTop failed:", err);
    }
  },

  toggleAutoStart: async () => {
    const current = get().settings.autoStart;
    const next = !current;
    try {
      await setAutoStart(next);
      const newSettings: AppSettings = {
        ...get().settings,
        autoStart: next,
      };
      set({ settings: newSettings });
      await saveSettings(newSettings);
    } catch (err) {
      console.error("[settingsStore] toggleAutoStart failed:", err);
    }
  },

  setTheme: async (theme: AppSettings["theme"]) => {
    try {
      const newSettings: AppSettings = { ...get().settings, theme };
      set({ settings: newSettings });
      await saveSettings(newSettings);
    } catch (err) {
      console.error("[settingsStore] setTheme failed:", err);
    }
  },

  saveWindowBounds: async (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // 300ms 防抖，避免频繁写盘
    if (saveWindowBoundsTimer !== null) {
      clearTimeout(saveWindowBoundsTimer);
    }
    saveWindowBoundsTimer = setTimeout(async () => {
      try {
        const newSettings: AppSettings = {
          ...get().settings,
          windowX: x,
          windowY: y,
          windowWidth: width,
          windowHeight: height,
        };
        set({ settings: newSettings });
        await saveSettings(newSettings);
      } catch (err) {
        console.error("[settingsStore] saveWindowBounds failed:", err);
      }
      saveWindowBoundsTimer = null;
    }, 300);
  },
}));
