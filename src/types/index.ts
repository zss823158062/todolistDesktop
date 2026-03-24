/** 待办条目 */
export interface TodoItem {
  /** 唯一标识，UUID v4 格式，由前端 crypto.randomUUID() 生成 */
  id: string;
  /** 待办文字内容，不能为纯空格，最大 200 字符 */
  content: string;
  /** 是否已完成，默认 false */
  completed: boolean;
  /** 创建时间戳，Unix 毫秒（ms），由前端 Date.now() 生成 */
  createdAt: number;
  /** 最后更新时间戳，Unix 毫秒（ms），每次 update_todo 时刷新 */
  updatedAt: number;
  /** 颜色标签，null 表示无标签；枚举值：red/orange/green/blue */
  color: "red" | "orange" | "green" | "blue" | null;
  /** 截止日期，ISO 8601 日期字符串（如 "2026-03-25"），null 表示无截止日期 */
  dueDate: string | null;
}

/** 创建待办的参数（前端构造后传给后端） */
export interface CreateTodoParams {
  /** 新待办的唯一标识，UUID v4，前端生成 */
  id: string;
  /** 待办文字内容 */
  content: string;
  /** 创建时间戳，Unix 毫秒 */
  createdAt: number;
}

/** 应用全局设置 */
export interface AppSettings {
  /** 窗口左上角 X 坐标（屏幕像素），-1 表示使用默认位置（屏幕右上角） */
  windowX: number;
  /** 窗口左上角 Y 坐标（屏幕像素），-1 表示使用默认位置（屏幕右上角） */
  windowY: number;
  /** 窗口宽度（像素），范围 200~500，默认 280 */
  windowWidth: number;
  /** 窗口高度（像素），范围 200~700，默认 400 */
  windowHeight: number;
  /** 是否窗口置顶，默认 true */
  alwaysOnTop: boolean;
  /** 窗口不透明度，范围 0.5~1.0，步进 0.05，默认 0.9 */
  opacity: number;
  /** 是否开机自启动，默认 false */
  autoStart: boolean;
  /** 主题模式：auto=跟随系统, light=浅色, dark=深色；默认 "auto" */
  theme: "auto" | "light" | "dark";
  /** 是否启用到期提醒，默认 true */
  reminderEnabled: boolean;
  /** 提醒时间点列表，24小时制 "HH:mm" 格式，默认 ["11:00", "15:00"] */
  reminderTimes: string[];
  /** 到期前多少天开始提醒，范围 0~7，默认 2 */
  reminderDaysBefore: number;
}

/** 颜色标签枚举值（用于类型守卫和 UI 映射） */
export type TodoColor = "red" | "orange" | "green" | "blue";

/** 截止日期状态（用于 UI 高亮逻辑） */
export type DueDateStatus = "overdue" | "today" | "tomorrow" | "upcoming" | "none";
