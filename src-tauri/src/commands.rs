use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::models::{AppSettings, CreateTodoParams, TodoItem};

// ============================================================
// 待办 CRUD Commands (TASK-BE1-002)
// ============================================================

/// 获取所有待办，返回 Vec<TodoItem>；store 为空时返回空数组
#[tauri::command]
pub async fn get_todos(app: AppHandle) -> Result<Vec<TodoItem>, String> {
    let store = app
        .store("todos.json")
        .map_err(|e| format!("failed to open store: {e}"))?;

    let todos: Vec<TodoItem> = match store.get("todos") {
        Some(value) => serde_json::from_value(value).unwrap_or_default(),
        None => vec![],
    };

    Ok(todos)
}

/// 新增待办，由前端提供 id/content/createdAt，后端补全其余字段
#[tauri::command]
pub async fn add_todo(params: CreateTodoParams, app: AppHandle) -> Result<TodoItem, String> {
    let store = app
        .store("todos.json")
        .map_err(|e| format!("failed to open store: {e}"))?;

    let mut todos: Vec<TodoItem> = match store.get("todos") {
        Some(value) => serde_json::from_value(value).unwrap_or_default(),
        None => vec![],
    };

    let new_todo = TodoItem {
        id: params.id,
        content: params.content,
        completed: false,
        created_at: params.created_at,
        updated_at: params.created_at,
        color: None,
        due_date: None,
    };

    todos.push(new_todo.clone());

    store.set(
        "todos",
        serde_json::to_value(&todos).map_err(|e| format!("serialization error: {e}"))?,
    );
    store
        .save()
        .map_err(|e| format!("failed to save store: {e}"))?;

    Ok(new_todo)
}

/// 更新待办（全量替换），前端传入完整 TodoItem
#[tauri::command]
pub async fn update_todo(todo: TodoItem, app: AppHandle) -> Result<TodoItem, String> {
    let store = app
        .store("todos.json")
        .map_err(|e| format!("failed to open store: {e}"))?;

    let mut todos: Vec<TodoItem> = match store.get("todos") {
        Some(value) => serde_json::from_value(value).unwrap_or_default(),
        None => vec![],
    };

    let pos = todos
        .iter()
        .position(|t| t.id == todo.id)
        .ok_or_else(|| "todo not found".to_string())?;

    todos[pos] = todo.clone();

    store.set(
        "todos",
        serde_json::to_value(&todos).map_err(|e| format!("serialization error: {e}"))?,
    );
    store
        .save()
        .map_err(|e| format!("failed to save store: {e}"))?;

    Ok(todo)
}

/// 删除待办，id 不存在时静默成功
#[tauri::command]
pub async fn delete_todo(id: String, app: AppHandle) -> Result<(), String> {
    let store = app
        .store("todos.json")
        .map_err(|e| format!("failed to open store: {e}"))?;

    let mut todos: Vec<TodoItem> = match store.get("todos") {
        Some(value) => serde_json::from_value(value).unwrap_or_default(),
        None => vec![],
    };

    todos.retain(|t| t.id != id);

    store.set(
        "todos",
        serde_json::to_value(&todos).map_err(|e| format!("serialization error: {e}"))?,
    );
    store
        .save()
        .map_err(|e| format!("failed to save store: {e}"))?;

    Ok(())
}

/// 批量删除所有 completed=true 的条目
#[tauri::command]
pub async fn clear_completed(app: AppHandle) -> Result<(), String> {
    let store = app
        .store("todos.json")
        .map_err(|e| format!("failed to open store: {e}"))?;

    let mut todos: Vec<TodoItem> = match store.get("todos") {
        Some(value) => serde_json::from_value(value).unwrap_or_default(),
        None => vec![],
    };

    todos.retain(|t| !t.completed);

    store.set(
        "todos",
        serde_json::to_value(&todos).map_err(|e| format!("serialization error: {e}"))?,
    );
    store
        .save()
        .map_err(|e| format!("failed to save store: {e}"))?;

    Ok(())
}

// ============================================================
// 设置 Commands (TASK-BE1-003)
// ============================================================

/// 获取应用设置，不存在时返回 AppSettings::default()
#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("failed to open store: {e}"))?;

    let settings: AppSettings = match store.get("settings") {
        Some(value) => serde_json::from_value(value).unwrap_or_default(),
        None => AppSettings::default(),
    };

    Ok(settings)
}

/// 保存应用设置
#[tauri::command]
pub async fn save_settings(settings: AppSettings, app: AppHandle) -> Result<(), String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("failed to open store: {e}"))?;

    store.set(
        "settings",
        serde_json::to_value(&settings).map_err(|e| format!("serialization error: {e}"))?,
    );
    store
        .save()
        .map_err(|e| format!("failed to save store: {e}"))?;

    Ok(())
}

/// 切换窗口置顶状态
#[tauri::command]
pub async fn set_always_on_top(
    enabled: bool,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    window
        .set_always_on_top(enabled)
        .map_err(|e| format!("failed to set always on top: {e}"))
}

/// 设置窗口不透明度（0.5~1.0），超出范围返回错误
/// 注意：Tauri 2.x 当前版本中窗口运行时透明度 API 尚未暴露，
/// 前端通过 CSS opacity 控制视觉效果，此命令仅做范围校验并返回
#[tauri::command]
pub async fn set_opacity(opacity: f64) -> Result<(), String> {
    if opacity < 0.5 || opacity > 1.0 {
        return Err(format!(
            "opacity {opacity} out of range, must be between 0.5 and 1.0"
        ));
    }
    // 透明度由前端通过 CSS opacity 实现实时效果
    Ok(())
}

// ============================================================
// 开机自启动 Command (TASK-BE1-005)
// ============================================================

// ============================================================
// 系统通知 Command（到期提醒）
// ============================================================

/// 发送系统通知
#[tauri::command]
pub fn send_notification(title: String, body: String) -> Result<(), String> {
    notify_rust::Notification::new()
        .appname("TodoList Desktop Pin")
        .summary(&title)
        .body(&body)
        .show()
        .map_err(|e| format!("failed to send notification: {e}"))?;
    Ok(())
}

/// 切换开机自启动
#[tauri::command]
pub async fn set_auto_start(
    enabled: bool,
    app: AppHandle,
) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;

    let autostart = app.autolaunch();
    if enabled {
        autostart
            .enable()
            .map_err(|e| format!("failed to enable autostart: {e}"))?;
    } else {
        autostart
            .disable()
            .map_err(|e| format!("failed to disable autostart: {e}"))?;
    }
    Ok(())
}
