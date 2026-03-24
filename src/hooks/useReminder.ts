import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TodoItem } from "@/types";

/** 提醒时间点（24小时制） */
const REMINDER_HOURS = [11, 15];
/** 到期前多少天开始提醒 */
const REMINDER_DAYS_BEFORE = 2;
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
 * 在 REMINDER_HOURS 指定的时间点，对即将到期的未完成待办发送系统通知
 */
export function useReminder(todos: TodoItem[]) {
  const lastNotifiedSlot = useRef("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // 仅在指定小时的前 2 分钟内触发
      if (!REMINDER_HOURS.includes(hour) || minute > 1) return;

      // 构建时段 key，防止同一时段重复通知
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const slotKey = `${dateStr}-${hour}`;

      if (slotKey === lastNotifiedSlot.current) return;

      // 筛选：未完成 + 有截止日期 + 0~2 天内到期
      const dueTodos = todos.filter(
        (t) =>
          !t.completed &&
          t.dueDate !== null &&
          isDueWithinDays(t.dueDate, REMINDER_DAYS_BEFORE)
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
  }, [todos]);
}
