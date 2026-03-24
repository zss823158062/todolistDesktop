import React from "react";
import type { TodoColor } from "@/types";
import { colorMap } from "@/lib/utils";

interface ColorLabelProps {
  /** 当前颜色标签，null 表示无标签 */
  color: TodoColor | null;
  /** 颜色切换回调 */
  onChange: (color: TodoColor | null) => void;
}

/** 颜色循环顺序：null → red → orange → green → blue → null */
const COLOR_CYCLE: Array<TodoColor | null> = [
  null,
  "red",
  "orange",
  "green",
  "blue",
];

function getNextColor(current: TodoColor | null): TodoColor | null {
  const idx = COLOR_CYCLE.indexOf(current);
  return COLOR_CYCLE[(idx + 1) % COLOR_CYCLE.length];
}

/**
 * 颜色标签选择器
 * 点击循环切换颜色标签：null → red → orange → green → blue → null
 */
export function ColorLabel({ color, onChange }: ColorLabelProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(getNextColor(color));
  };

  return (
    <button
      onClick={handleClick}
      title={color ? `颜色: ${color}（点击切换）` : "点击添加颜色标签"}
      className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-transform hover:scale-110 focus:outline-none"
    >
      {color ? (
        <span
          className={[
            "block w-3 h-3 rounded-full",
            colorMap[color],
          ].join(" ")}
        />
      ) : (
        <span className="block w-3 h-3 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600" />
      )}
    </button>
  );
}
