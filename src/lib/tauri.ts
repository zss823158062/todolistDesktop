import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, CreateTodoParams, TodoItem } from "@/types";

/** 获取所有待办，返回按 createdAt 降序排列的列表；存储为空时返回空数组 */
export async function getTodos(): Promise<TodoItem[]> {
  return invoke<TodoItem[]>("get_todos");
}

/** 新增待办，返回完整的 TodoItem（completed=false, color=null, dueDate=null 由后端补全） */
export async function addTodo(params: CreateTodoParams): Promise<TodoItem> {
  return invoke<TodoItem>("add_todo", { params });
}

/** 更新待办（编辑内容 / 切换完成状态 / 修改标签 / 设置截止日期）；返回更新后的完整条目 */
export async function updateTodo(todo: TodoItem): Promise<TodoItem> {
  return invoke<TodoItem>("update_todo", { todo });
}

/** 删除指定 id 的待办；id 不存在时后端静默忽略 */
export async function deleteTodo(id: string): Promise<void> {
  return invoke<void>("delete_todo", { id });
}

/** 批量删除所有 completed=true 的条目 */
export async function clearCompleted(): Promise<void> {
  return invoke<void>("clear_completed");
}

/** 获取应用设置；文件不存在时返回默认值 */
export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("get_settings");
}

/** 保存应用设置到持久化存储 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke<void>("save_settings", { settings });
}

/** 切换窗口置顶状态 */
export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  return invoke<void>("set_always_on_top", { enabled });
}

/** 设置窗口不透明度（0.5~1.0） */
export async function setOpacity(opacity: number): Promise<void> {
  return invoke<void>("set_opacity", { opacity });
}

/** 切换开机自启动 */
export async function setAutoStart(enabled: boolean): Promise<void> {
  return invoke<void>("set_auto_start", { enabled });
}
