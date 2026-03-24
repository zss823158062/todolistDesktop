import { useRef } from "react";
import type { AppSettings } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { OpacitySlider } from "@/components/OpacitySlider";
import { X, Plus } from "lucide-react";

interface ThemeOption {
  value: AppSettings["theme"];
  label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "auto", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
];

const DAYS_OPTIONS = [0, 1, 2, 3, 5, 7];

/**
 * 设置面板
 * 包含：主题切换、开机自启动开关、透明度滑块、提醒设置
 */
export function SettingsPanel() {
  const {
    settings,
    setTheme,
    toggleAutoStart,
    toggleReminder,
    addReminderTime,
    removeReminderTime,
    setReminderDaysBefore,
  } = useSettingsStore();

  const timeInputRef = useRef<HTMLInputElement>(null);

  const handleAddTime = () => {
    const input = timeInputRef.current;
    if (!input || !input.value) return;
    addReminderTime(input.value);
    input.value = "";
  };

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

      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

      {/* 提醒设置 */}
      <div className="px-3 py-1">
        {/* 提醒开关 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            到期提醒
          </span>
          <button
            onClick={toggleReminder}
            role="switch"
            aria-checked={settings.reminderEnabled}
            className={[
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
              settings.reminderEnabled
                ? "bg-blue-500"
                : "bg-gray-300 dark:bg-gray-600",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                settings.reminderEnabled
                  ? "translate-x-4"
                  : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
        </div>

        {settings.reminderEnabled && (
          <div className="space-y-2">
            {/* 提醒时间列表 */}
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                提醒时间
              </p>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {settings.reminderTimes.map((time) => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-0.5 text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded"
                  >
                    {time}
                    <button
                      onClick={() => removeReminderTime(time)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              {/* 添加时间 */}
              <div className="flex items-center gap-1">
                <input
                  ref={timeInputRef}
                  type="time"
                  className="flex-1 text-[11px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={handleAddTime}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* 提前天数 */}
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                提前提醒
              </p>
              <div className="flex flex-wrap gap-1">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setReminderDaysBefore(d)}
                    className={[
                      "text-[11px] py-0.5 px-2 rounded transition-colors",
                      settings.reminderDaysBefore === d
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
                    ].join(" ")}
                  >
                    {d === 0 ? "当天" : `${d}天`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
