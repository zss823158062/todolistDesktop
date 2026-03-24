import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TodoItem } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";

/** 轮询间隔（毫秒） */
const CHECK_INTERVAL = 30_000;

/**
 * 判断截止日期是否在 0 ~ days 天内（含当天和第 days 天）
 */
function isDueWithinDays(dueDate: string, days: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate + "T00:00:00");
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= days;
}

/**
 * 到期提醒 hook
 * 在用户设置的时间点，对即将到期的未完成待办发送系统通知
 */
export function useReminder(todos: TodoItem[]) {
  const lastNotifiedSlot = useRef("");
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    const timer = setInterval(() => {
      // 提醒未启用或无提醒时间点
      if (!settings.reminderEnabled || settings.reminderTimes.length === 0)
        return;

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      // 检查当前时间是否匹配任一提醒时间点（允许 0~1 分钟偏差）
      const matched = settings.reminderTimes.some((t) => {
        const [h, m] = t.split(":").map(Number);
        return hour === h && minute >= m && minute <= m + 1;
      });
      if (!matched) return;

      // 构建时段 key，防止同一时段重复通知
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const slotKey = `${dateStr}-${currentTime}`;

      if (slotKey === lastNotifiedSlot.current) return;

      // 筛选：未完成 + 有截止日期 + N 天内到期
      const dueTodos = todos.filter(
        (t) =>
          !t.completed &&
          t.dueDate !== null &&
          isDueWithinDays(t.dueDate, settings.reminderDaysBefore)
      );

      if (dueTodos.length === 0) return;

      // 发送通知
      let title: string;
      let body: string;
      if (dueTodos.length === 1) {
        title = "待办提醒";
        body = `「${dueTodos[0].content}」${dueTodos[0].dueDate} 到期`;
      } else {
        const lines = dueTodos.map((t) => `· ${t.content}`).join("\n");
        title = "待办提醒";
        body = `你有 ${dueTodos.length} 个待办即将到期\n${lines}`;
      }

      invoke("send_notification", { title, body }).catch(console.error);
      lastNotifiedSlot.current = slotKey;
    }, CHECK_INTERVAL);

    return () => clearInterval(timer);
  }, [todos, settings.reminderEnabled, settings.reminderTimes, settings.reminderDaysBefore]);
}
