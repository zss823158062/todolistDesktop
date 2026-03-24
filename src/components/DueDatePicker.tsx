import React, { useRef } from "react";
import { X } from "lucide-react";
import { getDueDateStatus, dueDateColorMap } from "@/lib/utils";

interface DueDatePickerProps {
  /** 当前截止日期，ISO 8601 格式（"YYYY-MM-DD"）或 null */
  dueDate: string | null;
  /** 日期变更回调 */
  onChange: (date: string | null) => void;
}

/**
 * 截止日期选择器
 * 使用原生 input[type=date]，支持清除日期
 * 日期标签颜色由 getDueDateStatus 决定
 */
export function DueDatePicker({ dueDate, onChange }: DueDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const status = getDueDateStatus(dueDate);
  const dateColorClass = dueDateColorMap[status];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange(value || null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {/* 日期标签 / 触发按钮 */}
      <button
        type="button"
        onClick={handleLabelClick}
        className={[
          "text-xs px-1.5 py-0.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
          dueDate ? dateColorClass : "text-gray-400 dark:text-gray-500",
        ].join(" ")}
        title={dueDate ? `截止日期: ${dueDate}` : "设置截止日期"}
      >
        {dueDate || "日期"}
      </button>

      {/* 清除按钮 */}
      {dueDate && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="清除截止日期"
        >
          <X size={10} />
        </button>
      )}

      {/* 隐藏的原生日期输入 */}
      <input
        ref={inputRef}
        type="date"
        value={dueDate ?? ""}
        onChange={handleChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
