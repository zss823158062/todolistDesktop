# TodoList Desktop Pin - 开发任务分配

## 团队配置

> 项目经理根据需求规模动态决定团队配置。本项目共 12 个功能点（P0×5 + P1×4 + P2×3），全量实现，全栈（Rust 后端 + React 前端），配置 4 人团队。

| 角色 | ID | 职责概述 |
|------|----|---------|
| 项目经理 / 基础设施 | PM | 项目初始化、公共类型、API 契约文件、Tauri 配置骨架 |
| 前端开发 1 号 | FE-1 | 核心 UI 组件：TitleBar、TodoList、TodoItem、TodoInput |
| 前端开发 2 号 | FE-2 | 状态管理、工具函数、高级功能组件（透明度、标签、日期、设置） |
| 后端开发 1 号 | BE-1 | Rust 后端全部：models、commands、lib、系统托盘、自启动 |

---

## 架构概要

### 技术栈

- 前端：React 18 + TypeScript 5 + Vite
- 样式：Tailwind CSS 3
- 状态管理：Zustand 4
- 后端：Tauri 2.x（Rust）+ tauri-plugin-store
- 图标：Lucide React
- 数据持久化：tauri-plugin-store（JSON 文件，AppData 目录）
- UUID 生成：`crypto.randomUUID()`（前端原生，零依赖）

### 目录结构

```
todolist-desktop-pin/
├── src/
│   ├── components/
│   │   ├── TitleBar.tsx          # 自定义标题栏
│   │   ├── TodoList.tsx          # 待办列表容器
│   │   ├── TodoItem.tsx          # 单条待办组件
│   │   ├── TodoInput.tsx         # 添加待办输入框
│   │   ├── OpacitySlider.tsx     # 透明度调节滑块（F-010）
│   │   ├── ColorLabel.tsx        # 颜色标签选择器（F-008）
│   │   ├── DueDatePicker.tsx     # 截止日期选择器（F-009）
│   │   └── SettingsPanel.tsx     # 设置面板（F-010/F-012）
│   ├── stores/
│   │   ├── todoStore.ts          # 待办数据 Zustand store
│   │   └── settingsStore.ts      # 设置 Zustand store
│   ├── types/
│   │   └── index.ts              # 共享 TS 类型（与 Rust 模型对应）
│   ├── lib/
│   │   ├── tauri.ts              # Tauri Command 调用封装（函数签名层）
│   │   └── utils.ts              # 通用工具函数（日期格式化、颜色映射等）
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/
│   ├── src/
│   │   ├── main.rs               # Tauri 入口
│   │   ├── lib.rs                # 应用配置、插件注册、托盘初始化
│   │   ├── commands.rs           # 所有 Tauri Command handler
│   │   └── models.rs             # Rust 数据模型（Serialize/Deserialize）
│   ├── icons/                    # 应用图标
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── docs/
    ├── prd.md
    └── tasks.md
```

---

## API 契约规范

### 共享类型定义（`src/types/index.ts`）

每个字段含语义注释：

```typescript
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
  color: 'red' | 'orange' | 'green' | 'blue' | null;
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
  theme: 'auto' | 'light' | 'dark';
}

/** 颜色标签枚举值（用于类型守卫和 UI 映射） */
export type TodoColor = 'red' | 'orange' | 'green' | 'blue';

/** 截止日期状态（用于 UI 高亮逻辑） */
export type DueDateStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';
```

### Rust 模型（`src-tauri/src/models.rs`）

```rust
/// 待办条目（与前端 TodoItem 完全对应）
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// 创建待办参数
#[derive(Debug, Deserialize)]
pub struct CreateTodoParams {
    pub id: String,
    pub content: String,
    pub created_at: i64,
}

/// 应用设置（与前端 AppSettings 对应）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub window_x: i32,
    pub window_y: i32,
    pub window_width: u32,
    pub window_height: u32,
    pub always_on_top: bool,
    pub opacity: f64,
    pub auto_start: bool,
    pub theme: String,
}
```

> **命名映射规则**：前端 camelCase（`createdAt`）↔ Rust snake_case（`created_at`），通过 `serde(rename_all = "camelCase")` 自动转换，JSON 中统一使用 camelCase。

### 函数签名定义

#### 前端 Tauri Command 调用层（`src/lib/tauri.ts`）

```typescript
/** 获取所有待办，返回按 createdAt 降序排列的列表；存储为空时返回空数组 */
function getTodos(): Promise<TodoItem[]>;

/** 新增待办，返回完整的 TodoItem（completed=false, color=null, dueDate=null 由后端补全） */
function addTodo(params: CreateTodoParams): Promise<TodoItem>;

/** 更新待办（编辑内容 / 切换完成状态 / 修改标签 / 设置截止日期）；返回更新后的完整条目 */
function updateTodo(todo: TodoItem): Promise<TodoItem>;

/** 删除指定 id 的待办；id 不存在时后端静默忽略 */
function deleteTodo(id: string): Promise<void>;

/** 批量删除所有 completed=true 的条目 */
function clearCompleted(): Promise<void>;

/** 获取应用设置；文件不存在时返回默认值 */
function getSettings(): Promise<AppSettings>;

/** 保存应用设置到持久化存储 */
function saveSettings(settings: AppSettings): Promise<void>;
```

#### Rust Tauri Command Handler（`src-tauri/src/commands.rs`）

```rust
/// 获取所有待办
#[tauri::command]
pub async fn get_todos(store: State<'_, StoreState>) -> Result<Vec<TodoItem>, String>;

/// 新增待办（参数由前端构造，后端补全 completed/color/due_date 默认值）
#[tauri::command]
pub async fn add_todo(
    params: CreateTodoParams,
    store: State<'_, StoreState>,
) -> Result<TodoItem, String>;

/// 更新待办（全量替换，前端传入完整 TodoItem，后端更新 updated_at）
#[tauri::command]
pub async fn update_todo(
    todo: TodoItem,
    store: State<'_, StoreState>,
) -> Result<TodoItem, String>;

/// 删除待办（id 不存在时静默成功）
#[tauri::command]
pub async fn delete_todo(
    id: String,
    store: State<'_, StoreState>,
) -> Result<(), String>;

/// 批量删除所有已完成条目
#[tauri::command]
pub async fn clear_completed(store: State<'_, StoreState>) -> Result<(), String>;

/// 获取应用设置（不存在时返回 AppSettings 默认值）
#[tauri::command]
pub async fn get_settings(store: State<'_, StoreState>) -> Result<AppSettings, String>;

/// 保存应用设置
#[tauri::command]
pub async fn save_settings(
    settings: AppSettings,
    store: State<'_, StoreState>,
) -> Result<(), String>;

/// 切换窗口置顶状态（前端调用，直接操作 Window）
#[tauri::command]
pub async fn set_always_on_top(
    enabled: bool,
    window: tauri::Window,
) -> Result<(), String>;

/// 设置窗口不透明度（0.5~1.0）
#[tauri::command]
pub async fn set_opacity(
    opacity: f64,
    window: tauri::Window,
) -> Result<(), String>;

/// 切换开机自启动（使用 tauri-plugin-autostart）
#[tauri::command]
pub async fn set_auto_start(
    enabled: bool,
    autostart: State<'_, AutostartManager>,
) -> Result<(), String>;
```

#### 前端 Zustand Store 接口（`src/stores/todoStore.ts`）

```typescript
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

interface SettingsStore {
  /** 当前应用设置 */
  settings: AppSettings;
  /** 初始化：从后端加载设置 */
  initialize(): Promise<void>;
  /** 更新透明度并应用到窗口 */
  setOpacity(opacity: number): Promise<void>;
  /** 切换置顶状态 */
  toggleAlwaysOnTop(): Promise<void>;
  /** 切换开机自启动 */
  toggleAutoStart(): Promise<void>;
  /** 更新主题 */
  setTheme(theme: AppSettings['theme']): Promise<void>;
  /** 保存窗口位置/尺寸（窗口 move/resize 事件触发） */
  saveWindowBounds(x: number, y: number, width: number, height: number): Promise<void>;
}
```

### 错误处理规范

```typescript
/** 所有 Tauri Command 调用均通过 try/catch 捕获，错误统一 console.error，不弹窗 */
/** Rust 端所有 Command 返回 Result<T, String>，错误信息为人类可读字符串 */
/** JSON 文件损坏时：Rust 端返回 Err("store corrupted")，前端降级为空列表/默认设置 */
```

---

## 跨模块数据流

### 数据流图

#### [添加待办 - F-002]
```
用户在 TodoInput 输入文字 → 按 Enter 或点击添加按钮
  → TodoInput 调用 todoStore.addTodo(content)
  → todoStore 生成 { id: crypto.randomUUID(), createdAt: Date.now() }
  → 调用 lib/tauri.ts::addTodo(CreateTodoParams)
  → invoke('add_todo', { id, content, createdAt })
  → commands.rs::add_todo() 补全 completed=false/color=null/due_date=null
  → 写入 tauri-plugin-store (todos.json)
  → 返回完整 TodoItem
  → todoStore 将新条目插入 todos 列表头部
  → TodoList → TodoItem 重新渲染
```

#### [切换完成状态 - F-003]
```
用户点击 TodoItem 复选框
  → TodoItem 调用 todoStore.toggleTodo(id)
  → todoStore 找到目标条目，翻转 completed，更新 updatedAt = Date.now()
  → 调用 lib/tauri.ts::updateTodo(updatedTodoItem)
  → invoke('update_todo', { todo: updatedTodoItem })
  → commands.rs::update_todo() 写入 store
  → 返回更新后 TodoItem
  → todoStore 重新排序（已完成沉底）→ 列表重新渲染
```

#### [删除待办 - F-004]
```
用户 hover TodoItem → 点击删除按钮
  → TodoItem 调用 todoStore.deleteTodo(id)
  → 调用 lib/tauri.ts::deleteTodo(id)
  → invoke('delete_todo', { id })
  → commands.rs::delete_todo() 从 store 移除
  → todoStore 从本地列表中移除该条目
  → TodoItem 淡出动画 → 列表重新渲染
```

#### [持久化存储读取 - F-006]
```
应用启动 → App.tsx useEffect
  → todoStore.initialize() + settingsStore.initialize() 并行调用
  → getTodos() → invoke('get_todos') → commands.rs 读取 todos.json
  → getSettings() → invoke('get_settings') → commands.rs 读取 settings.json
  → 返回数据 → store 更新 → 列表渲染
  （JSON 损坏时：返回空数组/默认设置，不崩溃）
```

#### [透明度调节 - F-010]
```
用户拖动 OpacitySlider
  → settingsStore.setOpacity(value)
  → 调用 lib/tauri.ts::setOpacity(value) → invoke('set_opacity', { opacity: value })
  → commands.rs::set_opacity() 调用 window.set_opacity(value)
  → 实时预览效果
  → 同时调用 lib/tauri.ts::saveSettings(settings) 持久化
```

#### [系统托盘 - F-011]
```
用户点击窗口关闭按钮 ✕
  → Tauri close-requested 事件
  → lib.rs 监听 → 调用 window.hide() 而非 window.close()
  → 系统托盘显示应用图标
  → 左键托盘图标 → window.show() / window.hide() 切换
  → 右键托盘菜单 → "显示窗口" 调用 window.show()
  → 右键托盘菜单 → "退出" 调用 save_settings + app.exit(0)
```

#### [开机自启动 - F-012]
```
用户切换 SettingsPanel 中的自启动开关
  → settingsStore.toggleAutoStart()
  → 调用 lib/tauri.ts::setAutoStart(enabled)
  → invoke('set_auto_start', { enabled })
  → commands.rs::set_auto_start() 调用 tauri-plugin-autostart
  → 同时更新 settings.autoStart → saveSettings 持久化
```

### 集成验证要点

| 验证项 | 检查内容 | 涉及模块 |
|--------|---------|---------|
| 类型一致 | `TodoItem` 字段名/类型与 Rust `TodoItem` 完全对应（注意 camelCase↔snake_case + serde 配置） | FE-1/FE-2 + BE-1 |
| 函数签名 | `lib/tauri.ts` 每个函数的 invoke 命令名与 `commands.rs` 中 `#[tauri::command]` 函数名一致 | FE-2 + BE-1 |
| 命名一致 | 共享概念命名与下方规范表一致，不自行发明 | FE-1/FE-2/BE-1 |
| 数据格式 | `createdAt`/`updatedAt` 为 Unix 毫秒整数；`dueDate` 为 `"YYYY-MM-DD"` 字符串 | FE-2 + BE-1 |
| 导入路径 | 所有组件从 `@/types` 导入 `TodoItem`/`AppSettings`（配置 tsconfig paths alias） | FE-1/FE-2 |

---

## 共享概念命名规范表

> 所有开发者必须严格使用此表中的命名和格式，禁止自行发明。

| 概念 | 前端命名（TS） | Rust 命名 | JSON key | 格式 | 生成方 | 示例 |
|------|--------------|-----------|----------|------|--------|------|
| 待办 ID | `id` | `id` | `id` | UUID v4 字符串 | 前端 `crypto.randomUUID()` | `"550e8400-e29b-41d4-a716-446655440000"` |
| 创建时间 | `createdAt` | `created_at` | `createdAt` | Unix 毫秒整数 | 前端 `Date.now()` | `1742694000000` |
| 更新时间 | `updatedAt` | `updated_at` | `updatedAt` | Unix 毫秒整数 | 前端 `Date.now()` | `1742694000000` |
| 截止日期 | `dueDate` | `due_date` | `dueDate` | ISO 8601 日期字符串 `YYYY-MM-DD` | 前端日期选择器 | `"2026-03-25"` |
| 颜色标签 | `color` | `color` | `color` | 枚举字符串或 null | 前端 | `"red"` / `null` |
| 完成状态 | `completed` | `completed` | `completed` | boolean | 前端 | `true` / `false` |
| 窗口不透明度 | `opacity` | `opacity` | `opacity` | float，范围 0.5~1.0，步进 0.05 | 前端滑块 | `0.9` |
| 置顶开关 | `alwaysOnTop` | `always_on_top` | `alwaysOnTop` | boolean | 前端 | `true` |
| 自启动开关 | `autoStart` | `auto_start` | `autoStart` | boolean | 前端 | `false` |
| 主题 | `theme` | `theme` | `theme` | 枚举字符串：`auto`/`light`/`dark` | 前端 | `"auto"` |
| Tauri Command | — | snake_case 函数名 | — | 前端 invoke 时使用相同名称 | — | `"add_todo"` |

---

## 任务分配

### PM（项目经理 / 基础设施）

#### TASK-INFRA-001: 项目骨架初始化

- **关联需求**：全功能前置
- **文件范围**：
  - `package.json`（新建）
  - `vite.config.ts`（新建）
  - `tailwind.config.js`（新建）
  - `tsconfig.json`（新建）
  - `src/main.tsx`（新建）
  - `src/index.css`（新建）
  - `src-tauri/Cargo.toml`（新建）
  - `src-tauri/tauri.conf.json`（新建）
  - `src-tauri/src/main.rs`（新建）
  - `.gitignore`（新建）
- **依赖**：无
- **验收标准**：
  - [ ] `npm install` 后无报错，`node_modules` 正常生成
  - [ ] `cargo check` 在 `src-tauri/` 目录下通过
  - [ ] `npm run tauri dev` 能启动空白窗口（无内容但不崩溃）
  - [ ] Tailwind CSS v3 配置完整（content 路径已配置）
  - [ ] tsconfig 配置 `@/` 路径别名指向 `src/`

#### TASK-INFRA-002: 公共类型与 API 契约文件

- **关联需求**：全功能前置（数据契约）
- **文件范围**：
  - `src/types/index.ts`（新建）—— 全部共享 TypeScript 类型
  - `src/lib/tauri.ts`（新建）—— 所有 Tauri Command 调用函数（签名层，函数体为 `invoke(...)` 调用）
  - `src/lib/utils.ts`（新建）—— 通用工具函数（`getDueDateStatus`、`colorMap`、`sortTodos` 等）
- **依赖**：TASK-INFRA-001
- **验收标准**：
  - [ ] `src/types/index.ts` 包含 `TodoItem`、`CreateTodoParams`、`AppSettings`、`TodoColor`、`DueDateStatus` 类型，每个字段含语义注释
  - [ ] `src/lib/tauri.ts` 包含 `getTodos`、`addTodo`、`updateTodo`、`deleteTodo`、`clearCompleted`、`getSettings`、`saveSettings`、`setAlwaysOnTop`、`setOpacity`、`setAutoStart` 函数签名及实现
  - [ ] `src/lib/utils.ts` 包含 `getDueDateStatus(dueDate: string | null): DueDateStatus` 和 `sortTodos(todos: TodoItem[]): TodoItem[]` 函数
  - [ ] `npx tsc --noEmit` 通过，无类型错误

#### TASK-INFRA-003: Rust 公共模型与 Tauri 配置

- **关联需求**：全功能前置（后端数据契约）
- **文件范围**：
  - `src-tauri/src/models.rs`（新建）—— Rust 数据模型（含 serde camelCase 配置）
  - `src-tauri/src/lib.rs`（新建）—— Tauri Builder 配置（注册插件、command 注册占位）
  - `src-tauri/tauri.conf.json`（修改（独占））—— 窗口配置（无边框、默认尺寸、权限）
- **依赖**：TASK-INFRA-001
- **验收标准**：
  - [ ] `models.rs` 中 `TodoItem` 和 `AppSettings` 使用 `#[serde(rename_all = "camelCase")]`，字段注释完整
  - [ ] `tauri.conf.json` 配置：`decorations: false`，默认尺寸 280×400，`alwaysOnTop: true`
  - [ ] `cargo check` 通过

---

### FE-1（前端开发 1 号）

#### TASK-FE1-001: 自定义标题栏组件（F-001）

- **关联需求**：F-001
- **文件范围**：
  - `src/components/TitleBar.tsx`（新建）
- **依赖**：TASK-INFRA-001、TASK-INFRA-002
- **验收标准**：
  - [ ] 标题栏高度 32px，包含：应用图标、"TodoList" 标题文字（左侧）
  - [ ] 右侧按钮：置顶切换（图钉图标，激活/非激活状态区分）、透明度调节入口、最小化、关闭
  - [ ] 整个标题栏区域添加 `data-tauri-drag-region` 属性（按钮区域排除）
  - [ ] 点击置顶按钮调用 `settingsStore.toggleAlwaysOnTop()`，按钮状态实时同步
  - [ ] 点击最小化按钮调用 Tauri `appWindow.minimize()`
  - [ ] 点击关闭按钮调用 Tauri `appWindow.hide()`（不退出，配合系统托盘）
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE1-002: 待办列表容器与空状态（F-002/F-003/F-004）

- **关联需求**：F-002、F-003、F-004
- **文件范围**：
  - `src/components/TodoList.tsx`（新建）
- **依赖**：TASK-INFRA-001、TASK-INFRA-002
- **验收标准**：
  - [ ] 从 `todoStore` 读取 `todos`，按未完成在前/已完成在后排列渲染 `TodoItem` 列表
  - [ ] 未完成与已完成条目之间有视觉分隔（分隔线或间距）
  - [ ] 列表为空时显示空状态提示文字（"暂无待办，添加一个吧"）
  - [ ] 支持滚动，超出窗口高度时出现滚动条（样式美化，细滚动条）
  - [ ] 条目数量变化时列表流畅更新（无闪烁）
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE1-003: 单条待办组件（F-003/F-004/F-005）

- **关联需求**：F-003、F-004、F-005
- **文件范围**：
  - `src/components/TodoItem.tsx`（新建）
- **依赖**：TASK-INFRA-001、TASK-INFRA-002
- **验收标准**：
  - [ ] 左侧自定义圆形复选框：未选中为空心圆（边框色），选中为主题色实心圆带勾，切换附带 150ms 过渡
  - [ ] 完成状态：文字添加删除线，降低透明度（`opacity-50`）
  - [ ] 鼠标悬停时右侧显示删除图标（`Trash2`），点击调用 `todoStore.deleteTodo(id)`，附带 150ms 淡出动画
  - [ ] 双击文字区域进入行内编辑模式（`<input>` 替换文字，预填当前内容）
  - [ ] 编辑时按 `Enter` 或失焦保存（调用 `todoStore.editTodo`）；按 `Escape` 取消；内容为空时不保存
  - [ ] 编辑模式下不触发完成/删除操作
  - [ ] 若 `color !== null`，在复选框左侧显示对应颜色圆点（4px 直径）
  - [ ] 若 `dueDate !== null`，在文字右侧显示日期标签（颜色由 `getDueDateStatus` 决定：逾期红、今天橙、明天黄、将来灰）
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE1-004: 添加待办输入框（F-002）

- **关联需求**：F-002
- **文件范围**：
  - `src/components/TodoInput.tsx`（新建）
- **依赖**：TASK-INFRA-001、TASK-INFRA-002
- **验收标准**：
  - [ ] 固定在列表底部，宽度撑满；左侧含 "+" 图标，右侧含 "添加" 按钮
  - [ ] Placeholder 文字："添加待办..."
  - [ ] 聚焦时输入框边框高亮（主题色）
  - [ ] 按 `Enter` 触发添加；内容为纯空格时按钮置灰/Enter 无效
  - [ ] 内容超 200 字符时输入框显示红色边框并禁止添加
  - [ ] 添加成功后输入框自动清空并保持焦点
  - [ ] 新条目出现时附带从顶部淡入的动画
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE1-005: 根组件与应用初始化（F-001/F-006）

- **关联需求**：F-001、F-006
- **文件范围**：
  - `src/App.tsx`（新建）
- **依赖**：TASK-INFRA-001、TASK-INFRA-002、TASK-FE1-001、TASK-FE1-002、TASK-FE1-004
- **验收标准**：
  - [ ] `App.tsx` 组合 `TitleBar`、`TodoList`、`TodoInput` 三个组件
  - [ ] `useEffect` 中并行调用 `todoStore.initialize()` 和 `settingsStore.initialize()`
  - [ ] 监听 Tauri `window` 的 `move` 和 `resize` 事件，触发 `settingsStore.saveWindowBounds()`
  - [ ] 根据 `settingsStore.settings.theme` 切换 `document.documentElement` 的 `dark` class（支持 Tailwind dark mode）
  - [ ] 根据 `settingsStore.settings.opacity` 设置根元素透明度
  - [ ] `loading` 为 true 时显示加载占位（避免数据未加载时空屏闪烁）
  - [ ] `npx tsc --noEmit` 通过

---

### FE-2（前端开发 2 号）

#### TASK-FE2-001: 待办数据状态管理（F-002~F-007）

- **关联需求**：F-002、F-003、F-004、F-005、F-006、F-007
- **文件范围**：
  - `src/stores/todoStore.ts`（新建）
- **依赖**：TASK-INFRA-002
- **验收标准**：
  - [ ] 实现 `TodoStore` 接口所有方法（`initialize`、`addTodo`、`toggleTodo`、`editTodo`、`deleteTodo`、`clearCompleted`、`setTodoColor`、`setTodoDueDate`）
  - [ ] `addTodo` 使用 `crypto.randomUUID()` 生成 id，`Date.now()` 生成 `createdAt`
  - [ ] 所有写操作：先调用 Tauri Command，成功后更新本地 store（不做乐观更新，避免数据不一致）
  - [ ] `initialize` 失败时（JSON 损坏），设置 `todos = []`，不抛出未捕获异常
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE2-002: 应用设置状态管理（F-001/F-010/F-011/F-012）

- **关联需求**：F-001、F-010、F-011、F-012
- **文件范围**：
  - `src/stores/settingsStore.ts`（新建）
- **依赖**：TASK-INFRA-002
- **验收标准**：
  - [ ] 实现 `SettingsStore` 接口所有方法（`initialize`、`setOpacity`、`toggleAlwaysOnTop`、`toggleAutoStart`、`setTheme`、`saveWindowBounds`）
  - [ ] `setOpacity` 调用 `setOpacity` Command 实时更新窗口，再调用 `saveSettings` 持久化
  - [ ] `toggleAlwaysOnTop` 调用 `setAlwaysOnTop` Command，再 `saveSettings`
  - [ ] `saveWindowBounds` 对高频事件做防抖（300ms），避免频繁写盘
  - [ ] `initialize` 失败时使用默认 `AppSettings` 值，不崩溃
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE2-003: 透明度调节与设置面板（F-010/F-012）

- **关联需求**：F-010、F-012
- **文件范围**：
  - `src/components/OpacitySlider.tsx`（新建）
  - `src/components/SettingsPanel.tsx`（新建）
- **依赖**：TASK-INFRA-002、TASK-FE2-002
- **验收标准**：
  - [ ] `OpacitySlider`：范围 50~100（内部用 50~100 整数，映射到 0.5~1.0），步进 5；拖动时实时调用 `settingsStore.setOpacity()`
  - [ ] `SettingsPanel`：包含主题切换（auto/light/dark）、开机自启动 Toggle、透明度滑块入口
  - [ ] 从 `TitleBar` 点击透明度图标展开 `OpacitySlider` 浮层（TitleBar 中引用，通过 props 控制显隐）
  - [ ] 自启动 Toggle 状态与 `settingsStore.settings.autoStart` 实时同步
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE2-004: 颜色标签选择器（F-008）

- **关联需求**：F-008
- **文件范围**：
  - `src/components/ColorLabel.tsx`（新建）
- **依赖**：TASK-INFRA-002、TASK-FE2-001
- **验收标准**：
  - [ ] `ColorLabel` 接受 `color: TodoColor | null` 和 `onChange: (color: TodoColor | null) => void` props
  - [ ] 点击颜色圆点循环切换：`null → red → orange → green → blue → null`
  - [ ] 在 `TodoItem.tsx` 中条目 hover 时显示颜色圆点可点击切换；点击调用 `todoStore.setTodoColor`
  - [ ] 修改 `src/components/TodoItem.tsx`（修改（独占））：集成 `ColorLabel` 组件
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE2-005: 截止日期选择器（F-009）

- **关联需求**：F-009
- **文件范围**：
  - `src/components/DueDatePicker.tsx`（新建）
- **依赖**：TASK-INFRA-002、TASK-FE2-001
- **验收标准**：
  - [ ] `DueDatePicker` 接受 `dueDate: string | null` 和 `onChange: (date: string | null) => void` props
  - [ ] 使用原生 `<input type="date">` 实现日期选择，自定义样式（Tailwind）
  - [ ] 可清除日期（清除按钮，设置为 null）
  - [ ] 在 `TodoItem.tsx` hover 时显示日历图标，点击弹出 `DueDatePicker`；选择后调用 `todoStore.setTodoDueDate`
  - [ ] 日期标签颜色逻辑使用 `lib/utils.ts::getDueDateStatus` 函数
  - [ ] `npx tsc --noEmit` 通过

#### TASK-FE2-006: 一键清除已完成按钮（F-007）

- **关联需求**：F-007
- **文件范围**：
  - 修改 `src/components/TitleBar.tsx`（修改（追加））—— 追加清除按钮（仅在有已完成条目时显示）
- **依赖**：TASK-FE1-001、TASK-FE2-001
- **验收标准**：
  - [ ] 标题栏中添加"清除已完成"按钮（垃圾桶图标），仅当 `todos` 中存在已完成条目时显示（否则不渲染或置灰）
  - [ ] 点击调用 `todoStore.clearCompleted()`，无需二次确认
  - [ ] `npx tsc --noEmit` 通过

---

### BE-1（后端开发 1 号）

#### TASK-BE1-001: Rust 数据模型与存储层（F-006）

- **关联需求**：F-006
- **文件范围**：
  - `src-tauri/src/models.rs`（修改（独占））—— 补全完整模型实现（在 INFRA-003 骨架基础上）
- **依赖**：TASK-INFRA-003
- **验收标准**：
  - [ ] `TodoItem` 和 `AppSettings` 实现 `Default` trait，`AppSettings::default()` 返回正确默认值（windowX=-1, windowY=-1, windowWidth=280, windowHeight=400, alwaysOnTop=true, opacity=0.9, autoStart=false, theme="auto"）
  - [ ] 所有字段使用 `#[serde(rename_all = "camelCase")]`，与前端命名规范表一致
  - [ ] `cargo check` 通过

#### TASK-BE1-002: 待办 CRUD Command（F-002/F-003/F-004/F-006）

- **关联需求**：F-002、F-003、F-004、F-006
- **文件范围**：
  - `src-tauri/src/commands.rs`（新建）—— 待办相关 Command handler
- **依赖**：TASK-BE1-001、TASK-INFRA-003
- **验收标准**：
  - [ ] 实现 `get_todos`：从 store 读取 todos 列表，返回 `Vec<TodoItem>`；key 为 `"todos"`
  - [ ] 实现 `add_todo`：接受 `CreateTodoParams`，补全 `completed=false, color=None, due_date=None`，追加到列表后写入 store，返回完整 `TodoItem`
  - [ ] 实现 `update_todo`：全量替换指定 id 条目，写入 store，返回更新后 `TodoItem`；id 不存在时返回 `Err("todo not found")`
  - [ ] 实现 `delete_todo`：按 id 从列表移除，写入 store；id 不存在时静默成功
  - [ ] 实现 `clear_completed`：过滤掉所有 `completed=true` 的条目，写入 store
  - [ ] 所有 Command 使用 `tauri_plugin_store::Store` 进行读写，写操作调用 `store.save()` 刷盘
  - [ ] JSON 解析失败时返回 `Ok(vec![])` 而非 panic
  - [ ] `cargo check` 通过

#### TASK-BE1-003: 设置 Command（F-001/F-010）

- **关联需求**：F-001、F-010
- **文件范围**：
  - 修改 `src-tauri/src/commands.rs`（修改（追加））—— 追加设置相关 Command
- **依赖**：TASK-BE1-002
- **验收标准**：
  - [ ] 实现 `get_settings`：从 store 读取设置（key `"settings"`），不存在时返回 `AppSettings::default()`
  - [ ] 实现 `save_settings`：接受 `AppSettings`，写入 store 并调用 `store.save()` 刷盘
  - [ ] 实现 `set_always_on_top`：接受 `enabled: bool`，调用 `window.set_always_on_top(enabled)`
  - [ ] 实现 `set_opacity`：接受 `opacity: f64`（范围校验 0.5~1.0），调用 `window.set_opacity(opacity)`
  - [ ] `cargo check` 通过

#### TASK-BE1-004: 系统托盘集成（F-011）

- **关联需求**：F-011
- **文件范围**：
  - 修改 `src-tauri/src/lib.rs`（修改（独占））—— 添加托盘初始化、close-requested 事件监听
- **依赖**：TASK-INFRA-003
- **验收标准**：
  - [ ] `lib.rs` 中配置系统托盘：图标使用 `icons/icon.png`，构建托盘菜单（"显示窗口" / "退出"）
  - [ ] 监听 `close-requested` 事件：调用 `window.hide()` 而非默认关闭行为（`event.prevent_default()`）
  - [ ] 左键单击托盘图标：切换窗口 `show()`/`hide()`
  - [ ] 右键菜单 "显示窗口"：调用 `window.show()` 并 `set_focus()`
  - [ ] 右键菜单 "退出"：调用 `std::process::exit(0)`（Tauri 2.x 方式）
  - [ ] `cargo check` 通过

#### TASK-BE1-005: 开机自启动 Command（F-012）

- **关联需求**：F-012
- **文件范围**：
  - 修改 `src-tauri/src/commands.rs`（修改（追加））—— 追加自启动 Command
  - 修改 `src-tauri/Cargo.toml`（修改（追加））—— 追加 `tauri-plugin-autostart` 依赖
  - 修改 `src-tauri/src/lib.rs`（修改（追加））—— 注册 autostart 插件
- **依赖**：TASK-BE1-003、TASK-BE1-004
- **验收标准**：
  - [ ] `Cargo.toml` 添加 `tauri-plugin-autostart = "2"` 依赖
  - [ ] `lib.rs` 中注册 `tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None)`
  - [ ] 实现 `set_auto_start` Command：`enabled=true` 时调用 `autostart.enable()`，`false` 时调用 `autostart.disable()`
  - [ ] Windows 下测试：开启后注册表 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` 有对应项
  - [ ] `cargo check` 通过

#### TASK-BE1-006: Tauri 应用配置与窗口行为（F-001）

- **关联需求**：F-001
- **文件范围**：
  - 修改 `src-tauri/tauri.conf.json`（修改（追加））—— 追加权限配置（capabilities）
  - 修改 `src-tauri/src/lib.rs`（修改（追加））—— 追加窗口事件：窗口 move/resize 时记录位置
- **依赖**：TASK-INFRA-003、TASK-BE1-004
- **验收标准**：
  - [ ] `tauri.conf.json` 配置 capabilities，允许前端调用所有自定义 Command 及系统插件（store、autostart）
  - [ ] 窗口 `moved` 和 `resized` 事件：触发前端 JS 通过 `settingsStore.saveWindowBounds` 保存（事件通过 Tauri emit 传递，或直接在前端监听 `window.__TAURI__.event`）
  - [ ] 应用启动时，读取 `settings.windowX/Y`，若非 -1 则调用 `window.set_position()` 恢复窗口位置
  - [ ] 若 `windowX/Y = -1`（首次运行），定位到屏幕右上角（距边缘 20px）
  - [ ] `cargo check` 通过

---

## 基础设施清单（项目经理负责）

### TASK-INFRA-001: 项目骨架初始化

（见上方任务详情）

### TASK-INFRA-002: 公共类型与 API 契约文件

（见上方任务详情）

### TASK-INFRA-003: Rust 公共模型与 Tauri 配置

（见上方任务详情）

---

## 文件分配矩阵

| 文件路径 | 负责人 | 操作 | 备注 |
|---------|--------|------|------|
| `package.json` | PM | 新建 | Vite + React + Tauri + Tailwind + Zustand + Lucide 依赖 |
| `vite.config.ts` | PM | 新建 | Tauri 官方 Vite 插件配置 |
| `tailwind.config.js` | PM | 新建 | content 路径 + dark mode class |
| `tsconfig.json` | PM | 新建 | `@/` 路径别名配置 |
| `src/main.tsx` | PM | 新建 | React 入口，挂载 App |
| `src/index.css` | PM | 新建 | Tailwind 指令 + 全局滚动条样式 |
| `src-tauri/Cargo.toml` | PM | 新建 | Rust 依赖（tauri-plugin-store, serde, uuid 等）；BE-1 追加 autostart 依赖 |
| `src-tauri/tauri.conf.json` | PM → BE-1 | 新建后修改（独占）| PM 创建骨架，BE-1 补全权限配置（TASK-INFRA-003 + TASK-BE1-006 串行） |
| `src-tauri/src/main.rs` | PM | 新建 | 仅调用 `lib::run()` |
| `src-tauri/src/models.rs` | PM → BE-1 | 新建后修改（独占）| PM 创建类型骨架，BE-1 补全 Default 实现（TASK-INFRA-003 + TASK-BE1-001 串行） |
| `src-tauri/src/lib.rs` | PM → BE-1 | 新建后修改（独占）| PM 创建配置骨架；BE-1 添加托盘（独占）+ 注册插件（追加）+ 窗口事件（追加） |
| `src-tauri/src/commands.rs` | BE-1 | 新建 | 待办 CRUD（TASK-BE1-002）+ 设置 Command（追加）+ 自启动（追加） |
| `src/types/index.ts` | PM | 新建 | 全部共享类型，FE-1/FE-2/BE-1 只读引用 |
| `src/lib/tauri.ts` | PM | 新建 | Tauri Command 调用封装，FE-1/FE-2 调用 |
| `src/lib/utils.ts` | PM | 新建 | `getDueDateStatus`、`sortTodos`、`colorMap` 工具函数 |
| `src/stores/todoStore.ts` | FE-2 | 新建 | 待办 Zustand store |
| `src/stores/settingsStore.ts` | FE-2 | 新建 | 设置 Zustand store |
| `src/components/TitleBar.tsx` | FE-1 | 新建 | FE-2 追加清除已完成按钮（修改（追加）） |
| `src/components/TodoList.tsx` | FE-1 | 新建 | |
| `src/components/TodoItem.tsx` | FE-1 | 新建 | FE-2 集成 ColorLabel/DueDatePicker（修改（独占），FE-2 在 FE-1 完成后接手） |
| `src/components/TodoInput.tsx` | FE-1 | 新建 | |
| `src/App.tsx` | FE-1 | 新建 | |
| `src/components/OpacitySlider.tsx` | FE-2 | 新建 | |
| `src/components/SettingsPanel.tsx` | FE-2 | 新建 | |
| `src/components/ColorLabel.tsx` | FE-2 | 新建 | |
| `src/components/DueDatePicker.tsx` | FE-2 | 新建 | |
| `src-tauri/Cargo.toml` | BE-1 | 修改（追加） | 追加 tauri-plugin-autostart 依赖（TASK-BE1-005） |
| `src-tauri/src/lib.rs` | BE-1 | 修改（追加） | 注册 autostart 插件（TASK-BE1-005）；追加窗口位置恢复逻辑（TASK-BE1-006） |

### 操作类型说明

| 操作类型 | 含义 | 重叠规则 |
|---------|------|---------|
| **新建** | 创建全新文件 | 不允许重叠，每个新建文件只属于一个开发者 |
| **修改（独占）** | 修改已有文件，全权负责 | 不允许重叠 |
| **修改（追加）** | 在已有文件中追加内容（如注册 Command、添加依赖） | 允许多人操作，需按备注说明各自追加的位置 |

---

## 任务依赖图

```
TASK-INFRA-001（骨架）
    ├── TASK-INFRA-002（公共类型/契约）
    │       ├── TASK-FE1-001（TitleBar）
    │       ├── TASK-FE1-002（TodoList）
    │       ├── TASK-FE1-003（TodoItem）── TASK-FE2-004（ColorLabel 集成 TodoItem）
    │       ├── TASK-FE1-004（TodoInput）                └── TASK-FE2-005（DueDatePicker 集成）
    │       ├── TASK-FE1-005（App.tsx）
    │       ├── TASK-FE2-001（todoStore）── TASK-FE2-006（清除已完成按钮）
    │       └── TASK-FE2-002（settingsStore）── TASK-FE2-003（OpacitySlider/SettingsPanel）
    └── TASK-INFRA-003（Rust 模型骨架）
            └── TASK-BE1-001（models 完整实现）
                    └── TASK-BE1-002（CRUD Command）
                            └── TASK-BE1-003（设置 Command）
                                    └── TASK-BE1-004（系统托盘）
                                            └── TASK-BE1-005（开机自启动）
                                                    └── TASK-BE1-006（窗口配置）
```

---

## 里程碑对应关系

| 里程碑 | 需求 | 涉及任务 |
|--------|------|---------|
| MVP (P0) | F-001/002/003/004/006 | INFRA-001~003, FE1-001~005, FE2-001~002, BE1-001~004 |
| V1.1 (P1) | F-005/007/010/011 | FE1-003（编辑）, FE2-006（清除）, FE2-003（透明度）, BE1-003~004（系统托盘）|
| V2.0 (P2) | F-008/009/012 | FE2-004（颜色标签）, FE2-005（截止日期）, BE1-005（自启动） |
