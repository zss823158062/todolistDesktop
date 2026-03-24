import { useTodoStore } from "@/stores/todoStore";
import { sortTodos } from "@/lib/utils";
import { TodoItem } from "@/components/TodoItem";

export function TodoList() {
  const todos = useTodoStore((s) => s.todos);

  const sorted = sortTodos(todos);
  const uncompleted = sorted.filter((t) => !t.completed);
  const completed = sorted.filter((t) => t.completed);

  if (todos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <p className="text-sm text-gray-400 dark:text-gray-500 select-none">
          暂无待办，添加一个吧
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {/* 未完成列表 */}
      {uncompleted.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}

      {/* 分隔线：仅当两个列表都有条目时显示 */}
      {uncompleted.length > 0 && completed.length > 0 && (
        <div className="mx-3 my-1 border-t border-gray-200/80 dark:border-gray-700/60" />
      )}

      {/* 已完成列表 */}
      {completed.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
