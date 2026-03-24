import { useState, useRef, useEffect } from "react";
import { Trash2, Check } from "lucide-react";
import type { TodoColor, TodoItem as TodoItemType } from "@/types";
import { useTodoStore } from "@/stores/todoStore";
import { getDueDateStatus, dueDateColorMap } from "@/lib/utils";
import { ColorLabel } from "@/components/ColorLabel";
import { DueDatePicker } from "@/components/DueDatePicker";

interface TodoItemProps {
  todo: TodoItemType;
}

export function TodoItem({ todo }: TodoItemProps) {
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const editTodo = useTodoStore((s) => s.editTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const setTodoColor = useTodoStore((s) => s.setTodoColor);
  const setTodoDueDate = useTodoStore((s) => s.setTodoDueDate);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.content);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 进入编辑模式时自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (todo.completed) return;
    setEditValue(todo.content);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== todo.content) {
      editTodo(todo.id, trimmed).catch(console.error);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(todo.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const handleToggle = () => {
    if (isEditing) return;
    toggleTodo(todo.id).catch(console.error);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTodo(todo.id).catch(console.error);
  };

  const dueDateStatus = getDueDateStatus(todo.dueDate);

  return (
    <div
      className="group flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 颜色标签选择器：hover 时可见，非 hover 时仅当有颜色时显示圆点 */}
      <div className={isHovered || todo.color !== null ? "opacity-100" : "opacity-0"}>
        <ColorLabel
          color={todo.color}
          onChange={(color: TodoColor | null) => {
            setTodoColor(todo.id, color).catch(console.error);
          }}
        />
      </div>

      {/* 自定义圆形复选框 */}
      <button
        onClick={handleToggle}
        className={`
          w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
          transition-all duration-150
          ${
            todo.completed
              ? "bg-blue-500 border-blue-500"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          }
        `}
        title={todo.completed ? "标记未完成" : "标记完成"}
      >
        {todo.completed && <Check size={9} strokeWidth={3} className="text-white" />}
      </button>

      {/* 文字区域或行内编辑框 */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            maxLength={200}
            className="flex-1 text-sm bg-transparent outline-none border-b border-blue-400 dark:border-blue-500 text-gray-800 dark:text-gray-100 py-0"
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className={`
              flex-1 text-sm leading-snug break-words cursor-default
              transition-all duration-150
              ${
                todo.completed
                  ? "line-through opacity-50 text-gray-500 dark:text-gray-400"
                  : "text-gray-800 dark:text-gray-100"
              }
            `}
          >
            {todo.content}
          </span>
        )}

        {/* 截止日期：hover 时显示日期选择器，非 hover 时仅显示日期标签 */}
        {!isEditing && (
          <div className="shrink-0">
            {isHovered ? (
              <DueDatePicker
                dueDate={todo.dueDate}
                onChange={(date) => {
                  setTodoDueDate(todo.id, date).catch(console.error);
                }}
              />
            ) : (
              todo.dueDate !== null && (
                <span
                  className={`text-[10px] font-medium ${dueDateColorMap[dueDateStatus]}`}
                >
                  {todo.dueDate}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* 删除按钮：hover 时淡入显示 */}
      {!isEditing && (
        <button
          onClick={handleDelete}
          className={`
            w-5 h-5 flex items-center justify-center rounded shrink-0
            text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20
            transition-all duration-150
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
          title="删除"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
