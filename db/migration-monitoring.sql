-- ═══════════════════════════════════════════════
-- Bankai.Hub — Site Monitoring Tables
-- ═══════════════════════════════════════════════

-- Конфигурация мониторинга для каждого проекта
CREATE TABLE IF NOT EXISTS hub_monitoring_config (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    UUID NOT NULL REFERENCES hub_projects(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  check_interval_minutes INTEGER DEFAULT 60,
  is_active     BOOLEAN DEFAULT true,
  notify_telegram BOOLEAN DEFAULT true,
  last_status   TEXT DEFAULT 'unknown', -- 'up', 'down', 'unknown'
  last_checked_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, url)
);

-- История проверок
CREATE TABLE IF NOT EXISTS hub_site_checks (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id     UUID NOT NULL REFERENCES hub_monitoring_config(id) ON DELETE CASCADE,
  status        TEXT NOT NULL, -- 'up', 'down'
  status_code   INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at    TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_hub_monitoring_config_project ON hub_monitoring_config(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_monitoring_config_active ON hub_monitoring_config(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hub_site_checks_config ON hub_site_checks(config_id);
CREATE INDEX IF NOT EXISTS idx_hub_site_checks_checked_at ON hub_site_checks(checked_at DESC);

-- Триггер обновления updated_at
CREATE OR REPLACE TRIGGER set_hub_monitoring_config_updated
  BEFORE UPDATE ON hub_monitoring_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
