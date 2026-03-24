use serde::{Deserialize, Serialize};

/// 待办条目（与前端 TodoItem 完全对应）
/// 使用 camelCase 序列化以匹配前端命名规范
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodoItem {
    /// UUID v4 字符串，前端生成并传入
    pub id: String,
    /// 待办文字，最大 200 字符
    pub content: String,
    /// 是否已完成
    pub completed: bool,
    /// 创建时间戳（Unix 毫秒）
    pub created_at: i64,
    /// 最后更新时间戳（Unix 毫秒）
    pub updated_at: i64,
    /// 颜色标签，None 表示无标签
    pub color: Option<String>,
    /// 截止日期，ISO 8601 格式字符串，None 表示无日期
    pub due_date: Option<String>,
}

impl Default for TodoItem {
    fn default() -> Self {
        TodoItem {
            id: String::new(),
            content: String::new(),
            completed: false,
            created_at: 0,
            updated_at: 0,
            color: None,
            due_date: None,
        }
    }
}

/// 创建待办参数（前端构造，后端补全剩余字段）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTodoParams {
    /// UUID v4 字符串，前端生成
    pub id: String,
    /// 待办文字内容
    pub content: String,
    /// 创建时间戳（Unix 毫秒）
    pub created_at: i64,
}

/// 应用设置（与前端 AppSettings 对应）
/// 使用 camelCase 序列化以匹配前端命名规范
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    /// 窗口左上角 X 坐标，-1 表示使用默认位置
    pub window_x: i32,
    /// 窗口左上角 Y 坐标，-1 表示使用默认位置
    pub window_y: i32,
    /// 窗口宽度（像素），范围 200~500
    pub window_width: u32,
    /// 窗口高度（像素），范围 200~700
    pub window_height: u32,
    /// 是否窗口置顶
    pub always_on_top: bool,
    /// 窗口不透明度，范围 0.5~1.0
    pub opacity: f64,
    /// 是否开机自启动
    pub auto_start: bool,
    /// 主题模式：auto/light/dark
    pub theme: String,
    /// 是否启用到期提醒
    #[serde(default = "default_true")]
    pub reminder_enabled: bool,
    /// 提醒时间点列表，"HH:mm" 格式
    #[serde(default = "default_reminder_times")]
    pub reminder_times: Vec<String>,
    /// 到期前多少天开始提醒
    #[serde(default = "default_reminder_days_before")]
    pub reminder_days_before: u32,
}

fn default_true() -> bool {
    true
}

fn default_reminder_times() -> Vec<String> {
    vec!["11:00".to_string(), "15:00".to_string()]
}

fn default_reminder_days_before() -> u32 {
    2
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            window_x: -1,
            window_y: -1,
            window_width: 280,
            window_height: 400,
            always_on_top: true,
            opacity: 0.9,
            auto_start: false,
            theme: "auto".to_string(),
            reminder_enabled: true,
            reminder_times: vec!["11:00".to_string(), "15:00".to_string()],
            reminder_days_before: 2,
        }
    }
}
