import { NextResponse } from "next/server";
import { queryMany, execute } from "@/lib/db";
import { sendTelegramMessage, formatDownAlert, formatUpAlert } from "@/lib/telegram";

interface MonitoringConfig {
  id: string;
  project_id: string;
  url: string;
  is_active: boolean;
  notify_telegram: boolean;
  last_status: string;
  last_checked_at: string | null;
}

// Vercel Cron вызывает этот endpoint каждый час
// Защита: проверяем CRON_SECRET заголовок
export async function GET(request: Request) {
  // Проверяем авторизацию cron job
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Получаем все активные конфигурации мониторинга
    const configs = await queryMany<MonitoringConfig>(
      `SELECT id, project_id, url, is_active, notify_telegram, last_status, last_checked_at
       FROM hub_monitoring_config
       WHERE is_active = true`
    );

    if (configs.length === 0) {
      return NextResponse.json({ message: "No active monitors", checked: 0 });
    }

    const results = [];

    for (const config of configs) {
      const result = await checkSite(config);
      results.push(result);
    }

    return NextResponse.json({
      message: "Check complete",
      checked: results.length,
      results,
    });
  } catch (error) {
    console.error("[Cron] check-sites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function checkSite(config: MonitoringConfig) {
  const startTime = Date.now();
  let status: "up" | "down" = "down";
  let statusCode: number | null = null;
  let errorMessage: string | null = null;
  let responseTime: number = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(config.url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "BankaiHub-Monitor/1.0",
      },
    });

    clearTimeout(timeout);
    responseTime = Date.now() - startTime;
    statusCode = res.status;

    // Считаем "up" если статус 2xx или 3xx
    if (res.status >= 200 && res.status < 400) {
      status = "up";
    } else {
      errorMessage = `HTTP ${res.status} ${res.statusText}`;
    }
  } catch (err: any) {
    responseTime = Date.now() - startTime;
    if (err.name === "AbortError") {
      errorMessage = "Timeout (15s)";
    } else {
      errorMessage = err.message || "Connection failed";
    }
  }

  // Сохраняем результат в БД
  await execute(
    `INSERT INTO hub_site_checks (config_id, status, status_code, response_time_ms, error_message)
     VALUES ($1, $2, $3, $4, $5)`,
    [config.id, status, statusCode, responseTime, errorMessage]
  );

  // Обновляем конфигурацию
  await execute(
    `UPDATE hub_monitoring_config
     SET last_status = $1, last_checked_at = now()
     WHERE id = $2`,
    [status, config.id]
  );

  // Отправляем уведомление в Telegram если статус изменился
  if (config.notify_telegram) {
    const previousStatus = config.last_status;

    // Сайт упал (был up → стал down)
    if (previousStatus !== "down" && status === "down") {
      await sendTelegramMessage(formatDownAlert(config.url, statusCode, errorMessage));
    }

    // Сайт вернулся (был down → стал up)
    if (previousStatus === "down" && status === "up") {
      // Подсчитываем сколько был недоступен
      let downDuration: string | undefined;
      if (config.last_checked_at) {
        const downSince = new Date(config.last_checked_at);
        const diffMs = Date.now() - downSince.getTime();
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin < 60) {
          downDuration = `${diffMin} мин.`;
        } else {
          const hours = Math.floor(diffMin / 60);
          const mins = diffMin % 60;
          downDuration = `${hours}ч ${mins}мин.`;
        }
      }
      await sendTelegramMessage(formatUpAlert(config.url, responseTime, downDuration));
    }
  }

  return {
    url: config.url,
    status,
    statusCode,
    responseTime,
    error: errorMessage,
    previousStatus: config.last_status,
  };
}
