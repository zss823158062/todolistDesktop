import { useEffect, useRef } from "react";
import { getCurrentWindow, currentMonitor } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { useTodoStore } from "@/stores/todoStore";
import { useReminder } from "@/hooks/useReminder";
import { useSettingsStore } from "@/stores/settingsStore";
import { TitleBar } from "@/components/TitleBar";
import { TodoList } from "@/components/TodoList";
import { TodoInput } from "@/components/TodoInput";

function App() {
  const todos = useTodoStore((s) => s.todos);
  const todoLoading = useTodoStore((s) => s.loading);
  const todoInitialize = useTodoStore((s) => s.initialize);
  const settingsInitialize = useSettingsStore((s) => s.initialize);
  const saveWindowBounds = useSettingsStore((s) => s.saveWindowBounds);
  const settings = useSettingsStore((s) => s.settings);

  // 到期提醒
  useReminder(todos);

  // 初始化：并行加载待办数据和设置
  useEffect(() => {
    Promise.all([todoInitialize(), settingsInitialize()]).catch(console.error);
  }, [todoInitialize, settingsInitialize]);

  // 贴边吸附：setPosition 触发的 onMoved 需要跳过，防止无限循环
  const isSnapping = useRef(false);

  // 监听窗口 move / resize 事件，保存窗口位置尺寸
  useEffect(() => {
    const SNAP_THRESHOLD = 15;
    const appWindow = getCurrentWindow();

    const unlistenMove = appWindow.onMoved(async ({ payload }) => {
      // 吸附触发的移动：保存最终位置后跳过
      if (isSnapping.current) {
        isSnapping.current = false;
        saveWindowBounds(payload.x, payload.y, settings.windowWidth, settings.windowHeight).catch(console.error);
        return;
      }

      let snappedX = payload.x;
      let snappedY = payload.y;
      let needsSnap = false;

      try {
        const monitor = await currentMonitor();
        if (monitor) {
          const winSize = await appWindow.outerSize();
          // 使用 workArea（排除任务栏）而非全屏尺寸
          const mx = monitor.workArea.position.x;
          const my = monitor.workArea.position.y;
          const mw = monitor.workArea.size.width;
          const mh = monitor.workArea.size.height;

          // 左边缘
          if (Math.abs(payload.x - mx) <= SNAP_THRESHOLD) {
            snappedX = mx;
            needsSnap = true;
          }
          // 右边缘
          else if (Math.abs(payload.x + winSize.width - (mx + mw)) <= SNAP_THRESHOLD) {
            snappedX = mx + mw - winSize.width;
            needsSnap = true;
          }

          // 上边缘
          if (Math.abs(payload.y - my) <= SNAP_THRESHOLD) {
            snappedY = my;
            needsSnap = true;
          }
          // 下边缘
          else if (Math.abs(payload.y + winSize.height - (my + mh)) <= SNAP_THRESHOLD) {
            snappedY = my + mh - winSize.height;
            needsSnap = true;
          }

          if (needsSnap && (snappedX !== payload.x || snappedY !== payload.y)) {
            isSnapping.current = true;
            await appWindow.setPosition(new PhysicalPosition(snappedX, snappedY));
            return; // saveWindowBounds 在吸附后的 onMoved 中调用
          }
        }
      } catch (e) {
        console.error("[App] snap detection failed:", e);
      }

      saveWindowBounds(snappedX, snappedY, settings.windowWidth, settings.windowHeight).catch(console.error);
    });

    const unlistenResize = appWindow.onResized(({ payload }) => {
      saveWindowBounds(
        settings.windowX,
        settings.windowY,
        payload.width,
        payload.height
      ).catch(console.error);
    });

    return () => {
      unlistenMove.then((fn) => fn()).catch(console.error);
      unlistenResize.then((fn) => fn()).catch(console.error);
    };
  }, [saveWindowBounds, settings.windowWidth, settings.windowHeight, settings.windowX, settings.windowY]);

  // 根据 theme 切换 document 的 dark class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      // auto：跟随系统
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [settings.theme]);

  // loading 占位
  if (todoLoading) {
    return (
      <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-900">
        <div className="h-8 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-700/60 animate-pulse" />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-gray-400 dark:text-gray-500">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
      <TitleBar />
      <TodoList />
      <TodoInput />
    </div>
  );
}

export default App;
