import { Trash2 } from "lucide-react";
import { useTodoStore } from "@/stores/todoStore";

/**
 * 一键清除已完成按钮
 * 仅当存在已完成条目时渲染
 * 点击调用 todoStore.clearCompleted()
 *
 * 注意：此组件供集成工程师集成到 TitleBar 中使用
 */
export function ClearCompletedButton() {
  const { todos, clearCompleted } = useTodoStore();
  const hasCompleted = todos.some((t) => t.completed);

  if (!hasCompleted) return null;

  return (
    <button
      onClick={clearCompleted}
      title="清除已完成"
      className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      aria-label="清除所有已完成待办"
    >
      <Trash2 size={14} />
    </button>
  );
}
