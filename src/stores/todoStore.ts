import { create } from "zustand";
import type { TodoColor, TodoItem } from "@/types";
import {
  addTodo as apiAddTodo,
  clearCompleted as apiClearCompleted,
  deleteTodo as apiDeleteTodo,
  getTodos,
  updateTodo,
} from "@/lib/tauri";
import { sortTodos } from "@/lib/utils";

interface TodoStore {
  /** 当前所有待办列表（未完成在前，已完成在后，同状态内按 createdAt 降序） */
  todos: TodoItem[];
  /** 是否正在加载（初始化时从后端拉取数据） */
  loading: boolean;
  /** 初始化：从后端加载所有待办 */
  initialize(): Promise<void>;
  /** 添加待办，前端生成 id/createdAt，调用 addTodo command */
  addTodo(content: string): Promise<void>;
  /** 切换完成状态 */
  toggleTodo(id: string): Promise<void>;
  /** 编辑待办内容 */
  editTodo(id: string, content: string): Promise<void>;
  /** 删除单条待办 */
  deleteTodo(id: string): Promise<void>;
  /** 批量清除已完成 */
  clearCompleted(): Promise<void>;
  /** 设置颜色标签（null 表示清除标签） */
  setTodoColor(id: string, color: TodoColor | null): Promise<void>;
  /** 设置截止日期（null 表示清除日期） */
  setTodoDueDate(id: string, dueDate: string | null): Promise<void>;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  loading: false,

  initialize: async () => {
    set({ loading: true });
    try {
      const todos = await getTodos();
      set({ todos: sortTodos(todos), loading: false });
    } catch (err) {
      console.error("[todoStore] initialize failed:", err);
      set({ todos: [], loading: false });
    }
  },

  addTodo: async (content: string) => {
    try {
      const params = {
        id: crypto.randomUUID(),
        content,
        createdAt: Date.now(),
      };
      const newTodo = await apiAddTodo(params);
      set((state) => ({
        todos: sortTodos([...state.todos, newTodo]),
      }));
    } catch (err) {
      console.error("[todoStore] addTodo failed:", err);
    }
  },

  toggleTodo: async (id: string) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    try {
      const updated = await updateTodo({
        ...todo,
        completed: !todo.completed,
        updatedAt: Date.now(),
      });
      set((state) => ({
        todos: sortTodos(
          state.todos.map((t) => (t.id === id ? updated : t))
        ),
      }));
    } catch (err) {
      console.error("[todoStore] toggleTodo failed:", err);
    }
  },

  editTodo: async (id: string, content: string) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    try {
      const updated = await updateTodo({
        ...todo,
        content,
        updatedAt: Date.now(),
      });
      set((state) => ({
        todos: sortTodos(
          state.todos.map((t) => (t.id === id ? updated : t))
        ),
      }));
    } catch (err) {
      console.error("[todoStore] editTodo failed:", err);
    }
  },

  deleteTodo: async (id: string) => {
    try {
      await apiDeleteTodo(id);
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
      }));
    } catch (err) {
      console.error("[todoStore] deleteTodo failed:", err);
    }
  },

  clearCompleted: async () => {
    try {
      await apiClearCompleted();
      set((state) => ({
        todos: state.todos.filter((t) => !t.completed),
      }));
    } catch (err) {
      console.error("[todoStore] clearCompleted failed:", err);
    }
  },

  setTodoColor: async (id: string, color: TodoColor | null) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    try {
      const updated = await updateTodo({
        ...todo,
        color,
        updatedAt: Date.now(),
      });
      set((state) => ({
        todos: sortTodos(
          state.todos.map((t) => (t.id === id ? updated : t))
        ),
      }));
    } catch (err) {
      console.error("[todoStore] setTodoColor failed:", err);
    }
  },

  setTodoDueDate: async (id: string, dueDate: string | null) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    try {
      const updated = await updateTodo({
        ...todo,
        dueDate,
        updatedAt: Date.now(),
      });
      set((state) => ({
        todos: sortTodos(
          state.todos.map((t) => (t.id === id ? updated : t))
        ),
      }));
    } catch (err) {
      console.error("[todoStore] setTodoDueDate failed:", err);
    }
  },
}));
