# Bankai Hub — Modular SEO Platform v2.0

## Architecture Overview

```
bankai-hub/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main UI (imports modular components)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles & design tokens
│   └── api/
│       ├── analyze/route.ts      # Analysis pipeline API (uses module registry)
│       ├── modules/route.ts      # Module management API (list/activate/deactivate)
│       ├── debug/route.ts        # Debug endpoint
│       └── test-serp/route.ts    # SERP test endpoint
│
├── components/                   # Reusable UI Components
│   ├── ui/
│   │   ├── StatCard.tsx          # Metric display card
│   │   ├── TabButton.tsx         # Tab navigation button
│   │   └── EntityTag.tsx         # Entity badge with tooltip
│   └── views/
│       ├── CloudView.tsx         # Relevance cloud visualization
│       ├── ComparisonView.tsx    # Page audit comparison view
│       ├── ExportView.tsx        # JSON export view
│       └── ModulesView.tsx       # Module management dashboard
│
├── lib/                          # Core Library
│   ├── types.ts                  # Shared TypeScript types
│   ├── modules/                  # Module System
│   │   ├── types.ts              # Module interfaces & types
│   │   ├── registry.ts           # Central module registry (singleton)
│   │   ├── index.ts              # Module initialization & exports
│   │   ├── relevance-cloud/      # Relevance Cloud Module
│   │   │   ├── index.ts          # Module class & metadata
│   │   │   └── prompts.ts        # LLM prompts & response parsing
│   │   ├── page-audit/           # Page Audit Module
│   │   │   └── index.ts          # Comparison logic
│   │   ├── serp-collector/       # SERP Collection Module
│   │   │   └── index.ts          # Multi-provider SERP fetching
│   │   └── page-parser/          # Page Parser Module
│   │       └── index.ts          # HTML content extraction
│   │
│   ├── providers/                # Provider Abstraction Layer
│   │   ├── llm/                  # LLM Providers
│   │   │   ├── types.ts          # LLM provider interface
│   │   │   ├── claude.ts         # Anthropic Claude provider
│   │   │   ├── deepseek.ts       # DeepSeek provider
│   │   │   └── index.ts          # Provider factory & helpers
│   │   └── serp/                 # SERP Providers
│   │       ├── types.ts          # SERP provider interface
│   │       ├── xmlriver.ts       # XMLRiver provider
│   │       ├── serpapi.ts        # SerpAPI provider
│   │       └── index.ts          # Provider factory & helpers
│   │
│   ├── analyzer.ts               # [Legacy] Direct analyzer (kept for compatibility)
│   ├── comparator.ts             # [Legacy] Direct comparator
│   ├── parser.ts                 # [Legacy] Direct parser
│   └── serp.ts                   # [Legacy] Direct SERP collector
│
└── config files                  # next.config.js, tailwind.config.js, tsconfig.json, etc.
```

## Module System

### Core Concepts

- **Module** — self-contained unit of functionality with metadata, validation, and execution
- **Registry** — central singleton that manages module lifecycle (register → activate → execute)
- **Provider** — abstraction for external services (LLM, SERP) with factory pattern
- **Pipeline** — ordered chain of modules with conditional execution

### Adding a New Module

1. Create folder: `lib/modules/my-module/index.ts`
2. Implement `AnalysisModule<TInput, TOutput>` interface
3. Register in `lib/modules/index.ts`
4. Module auto-activates on first execution

### Adding a New Provider

1. Create file: `lib/providers/<category>/my-provider.ts`
2. Implement the provider interface (e.g., `LLMProvider` or `SerpProvider`)
3. Register in the factory's `providers` map in `index.ts`

## API Endpoints

- `POST /api/analyze` — Run full analysis pipeline
- `GET /api/modules` — List all modules and providers with status
- `POST /api/modules` — Manage modules (activate/deactivate/status)
- `GET /api/debug` — Check environment variables
- `GET /api/test-serp` — Test SERP provider
