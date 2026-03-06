import { LucideIcon, Cloud, FileText, Search, BarChart3, Megaphone, Activity } from "lucide-react";

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "coming-soon" | "beta";
  category: "seo" | "content" | "analytics" | "marketing";
}

export const toolRegistry: ToolDefinition[] = [
  {
    slug: "relevance-cloud",
    name: "Relevance Cloud",
    description: "Анализ семантического облака релевантности: сбор SERP, парсинг страниц, построение облака сущностей и сравнение с вашей страницей",
    icon: Cloud,
    status: "active",
    category: "seo",
  },
  {
    slug: "content-plan",
    name: "Контент-план",
    description: "Генерация контент-плана на основе семантического ядра и анализа конкурентов",
    icon: FileText,
    status: "coming-soon",
    category: "content",
  },
  {
    slug: "page-audit",
    name: "Аудит страницы",
    description: "Полный SEO-аудит: мета-теги, заголовки, контент, скорость, мобильность",
    icon: Search,
    status: "coming-soon",
    category: "seo",
  },
  {
    slug: "competitor-analysis",
    name: "Анализ конкурентов",
    description: "Сравнительный анализ конкурентов: позиции, контент, ссылки, трафик",
    icon: BarChart3,
    status: "coming-soon",
    category: "analytics",
  },
  {
    slug: "ad-tracker",
    name: "Трекер рекламы",
    description: "Мониторинг рекламных кампаний конкурентов и отслеживание креативов",
    icon: Megaphone,
    status: "coming-soon",
    category: "marketing",
  },
  {
    slug: "site-monitor",
    name: "Мониторинг сайта",
    description: "Отслеживание доступности сайта каждый час с уведомлениями в Telegram при падении",
    icon: Activity,
    status: "active",
    category: "analytics",
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return toolRegistry.find((t) => t.slug === slug);
}

export function getActiveTools(): ToolDefinition[] {
  return toolRegistry.filter((t) => t.status === "active");
}
