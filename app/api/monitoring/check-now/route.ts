import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { sendTelegramMessage, formatDownAlert, formatUpAlert } from "@/lib/telegram";

interface MonitoringConfig {
  id: string;
  url: string;
  notify_telegram: boolean;
  last_status: string;
  last_checked_at: string | null;
}

// POST — ручная проверка конкретного URL
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { configId } = body;

  if (!configId) {
    return NextResponse.json({ error: "configId required" }, { status: 400 });
  }

  const config = await queryOne<MonitoringConfig>(
    `SELECT id, url, notify_telegram, last_status, last_checked_at
     FROM hub_monitoring_config WHERE id = $1`,
    [configId]
  );

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  // Проверяем сайт
  const startTime = Date.now();
  let status: "up" | "down" = "down";
  let statusCode: number | null = null;
  let errorMessage: string | null = null;
  let responseTime = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(config.url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "BankaiHub-Monitor/1.0" },
    });

    clearTimeout(timeout);
    responseTime = Date.now() - startTime;
    statusCode = res.status;

    if (res.status >= 200 && res.status < 400) {
      status = "up";
    } else {
      errorMessage = `HTTP ${res.status} ${res.statusText}`;
    }
  } catch (err: any) {
    responseTime = Date.now() - startTime;
    errorMessage = err.name === "AbortError" ? "Timeout (15s)" : (err.message || "Connection failed");
  }

  // Сохраняем результат
  await execute(
    `INSERT INTO hub_site_checks (config_id, status, status_code, response_time_ms, error_message)
     VALUES ($1, $2, $3, $4, $5)`,
    [config.id, status, statusCode, responseTime, errorMessage]
  );

  // Обновляем конфигурацию
  await execute(
    `UPDATE hub_monitoring_config SET last_status = $1, last_checked_at = now() WHERE id = $2`,
    [status, config.id]
  );

  // Telegram уведомление при смене статуса
  if (config.notify_telegram) {
    if (config.last_status !== "down" && status === "down") {
      await sendTelegramMessage(formatDownAlert(config.url, statusCode, errorMessage));
    }
    if (config.last_status === "down" && status === "up") {
      await sendTelegramMessage(formatUpAlert(config.url, responseTime));
    }
  }

  return NextResponse.json({
    url: config.url,
    status,
    statusCode,
    responseTime,
    error: errorMessage,
  });
}
