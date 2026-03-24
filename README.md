# TodoList Desktop Pin

一个轻量级桌面待办事项置顶小组件，常驻桌面随时可见，零切换、低干扰、高感知。

## 特性

- **桌面置顶** — 窗口始终在最前面，随时查看待办
- **待办管理** — 添加、编辑、删除、标记完成
- **颜色分类** — 四色标签（红/橙/绿/蓝）快速分类
- **截止日期** — 设置到期时间，逾期/今天/明天高亮提示
- **到期提醒** — 自定义提醒时间点和提前天数，系统通知推送
- **深色模式** — 跟随系统 / 手动切换浅色与深色主题
- **窗口透明** — 可调节透明度（50%~100%），不遮挡桌面内容
- **贴边吸附** — 拖拽窗口靠近屏幕边缘自动吸附对齐
- **位置记忆** — 记住窗口位置和尺寸，重启后自动恢复
- **开机自启** — 可选开机自动启动
- **本地存储** — 数据完全离线，存储在本地 AppData 目录

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2.x |
| 后端 | Rust |
| 前端 | React 18 + TypeScript |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 构建工具 | Vite |

## 开发

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) >= 1.70
- [Tauri 2 CLI](https://tauri.app/start/)

### 安装依赖

```bash
npm install
```

### 启动开发

```bash
npm run tauri dev
```

### 构建生产包

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 项目结构

```
todoList_desktop_pin/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── hooks/              # React Hooks（提醒逻辑）
│   ├── stores/             # Zustand 状态管理
│   ├── lib/                # 工具函数与 Tauri API 封装
│   ├── types/              # TypeScript 类型定义
│   └── App.tsx             # 根组件
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── lib.rs          # 应用配置、托盘、窗口恢复
│   │   ├── commands.rs     # Tauri Command 处理器
│   │   └── models.rs       # 数据模型
│   └── tauri.conf.json     # Tauri 窗口配置
└── docs/                   # 需求文档
```

## 许可证

MIT
