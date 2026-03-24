pub mod models;

/// Tauri 应用入口，由 main.rs 调用
pub fn run() {
    tauri::Builder::default()
        // 注册持久化存储插件
        .plugin(tauri_plugin_store::Builder::new().build())
        // Command 注册占位 - 后续由 BE-1 填充实际 Command
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
