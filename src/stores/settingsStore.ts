/**
 * 应用设置 Zustand Store
 * 此文件由 FE-2（TASK-FE2-002）负责完整实现。
 * 此处为 FE-1 编译验证所需的存根版本，仅导出空实现以通过 tsc --noEmit。
 * FE-2 合并时将覆盖本文件。
 */
import { create } from "zustand";
import type { AppSettings } from "@/types";

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
  settings: AppSettings;
  initialize(): Promise<void>;
  setOpacity(opacity: number): Promise<void>;
  toggleAlwaysOnTop(): Promise<void>;
  toggleAutoStart(): Promise<void>;
  setTheme(theme: AppSettings["theme"]): Promise<void>;
  saveWindowBounds(x: number, y: number, width: number, height: number): Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(() => ({
  settings: DEFAULT_SETTINGS,
  initialize: async () => {},
  setOpacity: async (_opacity: number) => {},
  toggleAlwaysOnTop: async () => {},
  toggleAutoStart: async () => {},
  setTheme: async (_theme: AppSettings["theme"]) => {},
  saveWindowBounds: async (_x: number, _y: number, _width: number, _height: number) => {},
}));
