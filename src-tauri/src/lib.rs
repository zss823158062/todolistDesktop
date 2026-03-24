pub mod commands;
pub mod models;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

use crate::commands::{
    add_todo, clear_completed, delete_todo, get_settings, get_todos, save_settings,
    set_always_on_top, set_auto_start, set_opacity, update_todo,
};
use crate::models::AppSettings;

/// Tauri 应用入口，由 main.rs 调用
pub fn run() {
    tauri::Builder::default()
        // 注册持久化存储插件
        .plugin(tauri_plugin_store::Builder::new().build())
        // 注册开机自启动插件
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        // 注册所有 Command
        .invoke_handler(tauri::generate_handler![
            get_todos,
            add_todo,
            update_todo,
            delete_todo,
            clear_completed,
            get_settings,
            save_settings,
            set_always_on_top,
            set_opacity,
            set_auto_start,
        ])
        .setup(|app| {
            // ---- 系统托盘初始化 ----
            let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // ---- 窗口位置恢复（TASK-BE1-006） ----
            if let Some(window) = app.get_webview_window("main") {
                // 读取保存的设置以恢复窗口位置
                let app_handle = app.handle().clone();
                let win_clone = window.clone();
                tauri::async_runtime::spawn(async move {
                    use tauri_plugin_store::StoreExt;

                    if let Ok(store) = app_handle.store("settings.json") {
                        let settings: AppSettings = match store.get("settings") {
                            Some(value) => {
                                serde_json::from_value(value).unwrap_or_default()
                            }
                            None => AppSettings::default(),
                        };

                        // 恢复窗口位置
                        if settings.window_x != -1 && settings.window_y != -1 {
                            let _ = win_clone.set_position(tauri::PhysicalPosition::new(
                                settings.window_x,
                                settings.window_y,
                            ));
                        } else {
                            // 首次运行：定位到屏幕右上角（距边缘 20px）
                            if let Ok(Some(monitor)) = win_clone.primary_monitor() {
                                let screen_size = monitor.size();
                                let win_size = win_clone
                                    .outer_size()
                                    .unwrap_or(tauri::PhysicalSize::new(280, 400));
                                let x = (screen_size.width as i32)
                                    - (win_size.width as i32)
                                    - 20;
                                let y = 20i32;
                                let _ = win_clone
                                    .set_position(tauri::PhysicalPosition::new(x, y));
                            }
                        }

                        // 恢复置顶设置
                        let _ = win_clone.set_always_on_top(settings.always_on_top);
                    }
                });

                // ---- 拦截关闭事件，改为隐藏窗口（TASK-BE1-004） ----
                let win_for_event = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win_for_event.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
