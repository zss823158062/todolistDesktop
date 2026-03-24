import React from "react";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * 透明度调节滑块
 * 范围 50~100（整数），映射到 0.5~1.0
 * 步进 5（对应 0.05）
 */
export function OpacitySlider() {
  const { settings, setOpacity } = useSettingsStore();

  // 将 0.5~1.0 映射到 50~100 整数
  const sliderValue = Math.round(settings.opacity * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const intValue = Number(e.target.value);
    const opacityValue = intValue / 100;
    setOpacity(opacityValue);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">
        {sliderValue}%
      </span>
      <input
        type="range"
        min={50}
        max={100}
        step={5}
        value={sliderValue}
        onChange={handleChange}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-600 accent-blue-500 cursor-pointer"
        aria-label="窗口透明度"
      />
    </div>
  );
}
