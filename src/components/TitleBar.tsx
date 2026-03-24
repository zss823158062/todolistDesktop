import { Pin, Minus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSettingsStore } from "@/stores/settingsStore";

export function TitleBar() {
  const settings = useSettingsStore((s) => s.settings);
  const toggleAlwaysOnTop = useSettingsStore((s) => s.toggleAlwaysOnTop);

  const handlePin = () => {
    // 预留：调用 settingsStore.toggleAlwaysOnTop()
    toggleAlwaysOnTop().catch(console.error);
  };

  const handleMinimize = () => {
    getCurrentWindow().minimize().catch(console.error);
  };

  const handleClose = () => {
    getCurrentWindow().hide().catch(console.error);
  };

  return (
    <div
      className="flex items-center justify-between h-8 px-2 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm select-none shrink-0"
      data-tauri-drag-region
    >
      {/* 左侧：图标 + 标题 */}
      <div
        className="flex items-center gap-1.5"
        data-tauri-drag-region
      >
        <div className="w-4 h-4 rounded-sm bg-blue-500 flex items-center justify-center shrink-0">
          <span className="text-white text-[8px] font-bold leading-none">T</span>
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
          TodoList
        </span>
      </div>

      {/* 右侧：操作按钮（排除拖拽区域） */}
      <div className="flex items-center gap-0.5">
        {/* 置顶切换按钮 */}
        <button
          onClick={handlePin}
          title={settings.alwaysOnTop ? "取消置顶" : "置顶窗口"}
          className={`
            w-6 h-6 rounded flex items-center justify-center
            transition-colors duration-150
            ${
              settings.alwaysOnTop
                ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }
          `}
        >
          <Pin
            size={13}
            className={settings.alwaysOnTop ? "fill-blue-500" : ""}
          />
        </button>

        {/* 最小化按钮 */}
        <button
          onClick={handleMinimize}
          title="最小化"
          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150"
        >
          <Minus size={13} />
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          title="关闭"
          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 dark:text-gray-500 dark:hover:text-white dark:hover:bg-red-500 transition-colors duration-150"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
