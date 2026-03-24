import type { AppSettings } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { OpacitySlider } from "@/components/OpacitySlider";

interface ThemeOption {
  value: AppSettings["theme"];
  label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "auto", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
];

/**
 * 设置面板
 * 包含：主题切换、开机自启动开关、透明度滑块
 */
export function SettingsPanel() {
  const { settings, setTheme, toggleAutoStart } = useSettingsStore();

  return (
    <div className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2">
      {/* 主题切换 */}
      <div className="px-3 pb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          主题
        </p>
        <div className="flex gap-1">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={[
                "flex-1 text-xs py-1 px-1.5 rounded transition-colors",
                settings.theme === opt.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

      {/* 开机自启动 */}
      <div className="px-3 py-1.5 flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-300">
          开机自启动
        </span>
        <button
          onClick={toggleAutoStart}
          role="switch"
          aria-checked={settings.autoStart}
          className={[
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
            settings.autoStart
              ? "bg-blue-500"
              : "bg-gray-300 dark:bg-gray-600",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              settings.autoStart ? "translate-x-4" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

      {/* 透明度滑块 */}
      <div className="px-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 mb-0.5">
          透明度
        </p>
        <OpacitySlider />
      </div>
    </div>
  );
}
