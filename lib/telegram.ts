/**
 * Telegram Bot — уведомления о мониторинге
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set");
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Telegram] Send failed:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram] Error:", error);
    return false;
  }
}

export function formatDownAlert(url: string, statusCode: number | null, error: string | null): string {
  const time = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  return [
    `🔴 <b>Сайт недоступен!</b>`,
    ``,
    `🌐 <code>${url}</code>`,
    statusCode ? `📊 Статус: ${statusCode}` : `📊 Статус: нет ответа`,
    error ? `❌ Ошибка: ${error}` : "",
    ``,
    `🕐 ${time}`,
  ].filter(Boolean).join("\n");
}

export function formatUpAlert(url: string, responseTime: number, downDuration?: string): string {
  const time = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  return [
    `🟢 <b>Сайт снова доступен!</b>`,
    ``,
    `🌐 <code>${url}</code>`,
    `⚡ Время ответа: ${responseTime}ms`,
    downDuration ? `⏱ Был недоступен: ${downDuration}` : "",
    ``,
    `🕐 ${time}`,
  ].filter(Boolean).join("\n");
}
