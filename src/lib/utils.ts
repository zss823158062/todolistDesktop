import type { DueDateStatus, TodoColor, TodoItem } from "@/types";

/**
 * 根据截止日期字符串计算日期状态
 * @param dueDate ISO 8601 格式日期字符串（"YYYY-MM-DD"）或 null
 * @returns DueDateStatus
 */
export function getDueDateStatus(dueDate: string | null): DueDateStatus {
  if (!dueDate) return "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate + "T00:00:00");
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return "upcoming";
}

/**
 * 对待办列表排序：未完成在前（按 createdAt 降序），已完成在后（按 createdAt 降序）
 * @param todos 待排序的待办列表
 * @returns 排序后的新数组（不修改原数组）
 */
export function sortTodos(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort((a, b) => {
    // 未完成在前，已完成在后
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // 同状态内按 createdAt 降序（新的在前）
    return b.createdAt - a.createdAt;
  });
}

/**
 * 颜色标签到 Tailwind CSS class 的映射
 * key: TodoColor 枚举值
 * value: 对应的 Tailwind 背景色 class
 */
export const colorMap: Record<TodoColor, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
};

/**
 * 截止日期状态到 Tailwind CSS class 的映射（文字颜色）
 */
export const dueDateColorMap: Record<DueDateStatus, string> = {
  overdue: "text-red-500",
  today: "text-orange-500",
  tomorrow: "text-yellow-500",
  upcoming: "text-gray-400",
  none: "text-gray-400",
};
