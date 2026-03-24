import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTodoStore } from "@/stores/todoStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TitleBar } from "@/components/TitleBar";
import { TodoList } from "@/components/TodoList";
import { TodoInput } from "@/components/TodoInput";

function App() {
  const todoLoading = useTodoStore((s) => s.loading);
  const todoInitialize = useTodoStore((s) => s.initialize);
  const settingsInitialize = useSettingsStore((s) => s.initialize);
  const saveWindowBounds = useSettingsStore((s) => s.saveWindowBounds);
  const settings = useSettingsStore((s) => s.settings);

  // 初始化：并行加载待办数据和设置
  useEffect(() => {
    Promise.all([todoInitialize(), settingsInitialize()]).catch(console.error);
  }, [todoInitialize, settingsInitialize]);

  // 监听窗口 move / resize 事件，保存窗口位置尺寸
  useEffect(() => {
    const appWindow = getCurrentWindow();

    const unlistenMove = appWindow.onMoved(({ payload }) => {
      saveWindowBounds(
        payload.x,
        payload.y,
        settings.windowWidth,
        settings.windowHeight
      ).catch(console.error);
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
