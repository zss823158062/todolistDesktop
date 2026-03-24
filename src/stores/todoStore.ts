/**
 * 待办数据 Zustand Store
 * 此文件由 FE-2（TASK-FE2-001）负责完整实现。
 * 此处为 FE-1 编译验证所需的存根版本，仅导出空实现以通过 tsc --noEmit。
 * FE-2 合并时将覆盖本文件。
 */
import { create } from "zustand";
import type { TodoItem, TodoColor } from "@/types";

interface TodoStore {
  todos: TodoItem[];
  loading: boolean;
  initialize(): Promise<void>;
  addTodo(content: string): Promise<void>;
  toggleTodo(id: string): Promise<void>;
  editTodo(id: string, content: string): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  clearCompleted(): Promise<void>;
  setTodoColor(id: string, color: TodoColor | null): Promise<void>;
  setTodoDueDate(id: string, dueDate: string | null): Promise<void>;
}

export const useTodoStore = create<TodoStore>()(() => ({
  todos: [],
  loading: true,
  initialize: async () => {},
  addTodo: async (_content: string) => {},
  toggleTodo: async (_id: string) => {},
  editTodo: async (_id: string, _content: string) => {},
  deleteTodo: async (_id: string) => {},
  clearCompleted: async () => {},
  setTodoColor: async (_id: string, _color: TodoColor | null) => {},
  setTodoDueDate: async (_id: string, _dueDate: string | null) => {},
}));
