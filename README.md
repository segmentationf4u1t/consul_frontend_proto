## Consul Wallboard — Frontend

A real-time dashboard built with Next.js and Shadcn UI. It visualizes live wallboard data, historical trends, and daily forecasts from the backend API.

### Features

- **Live data (SSE)**: listens to `/wallboard/events` and updates without page reloads
- **Forecasts (optional)**: "Prognoza" column and progress bars per campaign; inline Prophet badge with model tags
- **KPI panels**: animated metric cards, SL/ASA panel, global health of forecasts (MAPE)
- **Historical views**: responsive chart, queue/calls heatmaps, drilldown drawer per campaign
- **Status & controls**: connection indicator, quick revalidation actions, toggles for predictions/animations/debug

### Tech stack

- Next.js 15 (App Router), React 19, TypeScript
- Shadcn UI, Tailwind CSS
- Recharts, date-fns-tz

---

## Quickstart

### Prerequisites

- Node 18+ (Node 20 recommended) or Bun 1.1+
- Backend API running (defaults to port `3001` in this repo)

### Install

```bash
cd front
bun install
```

### Run (dev)

```bash
bun run dev
```

Open `http://localhost:3000`. The app will auto-detect the API:
- Client-side: same hostname, port `3001` (e.g., `http://localhost:3001`)
- Server-side (SSR): override recommended via env var (see below)

### Configure API URL (optional)

By default the app targets the same host on port `3001`. To point at a different backend, set `NEXT_PUBLIC_API_URL`:

```bash
# Bash
export NEXT_PUBLIC_API_URL=http://your-backend-host:3001
bun run dev
```

```powershell
# PowerShell
$env:NEXT_PUBLIC_API_URL="http://your-backend-host:3001"
bun run dev
```

In production builds this should be set to a stable backend URL to avoid SSR fallback behavior.

### Build & start (prod)

```bash
bun run build
bun run start   # serves on port 3000
```

Available scripts (from `front/package.json`):

```bash
bun run dev     # next dev --turbopack
bun run build   # next build
bun run start   # next start
bun run lint    # next lint
```

---

## Architecture overview

- Entry page: `app/bot/page.tsx` — composes metric cards, campaigns table, charts, heatmaps and the drilldown drawer
- Live data: SSE from `GET /wallboard/events` updates `tip` and `energa` panels
- Predictions: `hooks/use-predictions.ts` fetches `GET /predictions/campaigns/:campaign`
- Historical: charts/heatmaps fetch `GET /historical/panels` and `GET /historical/calls` with cursor pagination
- Revalidation actions: UI triggers endpoints exposed by the backend via helpers in `lib/api-revalidate.ts`
- API base URL resolution: `lib/api-config.ts` (uses `NEXT_PUBLIC_API_URL` when provided)

Key components (selected):
- `components/bot/MetricCards.tsx` — live panel metrics (with optional animations)
- `components/bot/CampaignsTable.tsx` — sortable table with predictions and coverage badges
- `components/bot/HistoricalChart.tsx` — 48h capped responsive area chart
- `components/bot/CallsHeatmap.tsx`, `components/bot/QueueHeatmap.tsx` — day×hour heatmaps
- `components/bot/ProphetIndicator.tsx` — model tags/summary badge
- `components/bot/HistoricalSummary.tsx` — per‑campaign data coverage and recent totals
- `components/bot/SlaKpiPanel.tsx` — ASA, answer/abandon proxy, SL 80/20 proxy

Types live in `types/`, utilities in `lib/` and hooks in `hooks/`.

---

## Troubleshooting

- **SSE not connecting**: ensure backend is reachable from the browser at `http(s)://<host>:3001` and CORS allows the frontend origin
- **Wrong API host/port**: set `NEXT_PUBLIC_API_URL` explicitly; for remote access, prefer a DNS name/IP stable for both client and server
- **Empty history/heatmaps**: historical endpoints require pre-populated data; check backend revalidation tasks
- **Predictions missing**: ensure prediction endpoints are enabled and populated in the backend; toggle predictions in the footer chip
- **Timezone mismatches**: visuals assume `Europe/Warsaw` for bucketing/labels in charts/heatmaps

---

## Notes

- Default backend port is `3001` (see `lib/api-config.ts`); dev server runs on `3000`
- For deployments, set `NEXT_PUBLIC_API_URL` to a stable backend URL to keep SSR and client consistent
