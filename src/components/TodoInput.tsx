import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { useTodoStore } from "@/stores/todoStore";

const MAX_LENGTH = 200;

export function TodoInput() {
  const addTodo = useTodoStore((s) => s.addTodo);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isBlank = value.trim().length === 0;
  const isOverLimit = value.length > MAX_LENGTH;
  const canSubmit = !isBlank && !isOverLimit;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addTodo(value.trim()).catch(console.error);
    setValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      {/* 左侧 "+" 图标 */}
      <Plus
        size={15}
        className="text-gray-400 dark:text-gray-500 shrink-0"
      />

      {/* 文本输入框 */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加待办..."
        maxLength={MAX_LENGTH + 10}
        className={`
          flex-1 text-sm bg-transparent outline-none
          placeholder-gray-400 dark:placeholder-gray-600
          text-gray-800 dark:text-gray-100
          border-b border-transparent
          focus:border-blue-400 dark:focus:border-blue-500
          transition-colors duration-150 py-0.5
          ${isOverLimit ? "border-red-400 dark:border-red-500 focus:border-red-400 dark:focus:border-red-500" : ""}
        `}
      />

      {/* 字数超限提示 */}
      {isOverLimit && (
        <span className="text-[10px] text-red-500 shrink-0">
          {value.length}/{MAX_LENGTH}
        </span>
      )}

      {/* 添加按钮 */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          shrink-0 text-xs px-2 py-1 rounded
          transition-colors duration-150
          ${
            canSubmit
              ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
              : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }
        `}
      >
        添加
      </button>
    </div>
  );
}
