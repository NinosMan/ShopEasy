# Build plan

Personal, mobile-first, zero-backend price comparison for NZ supermarkets.

## Architecture (decided)

```
collector (your machine, residential IP, daily cron)
  → Playwright (passes anti-bot) + direct API calls where possible
  → normalize → /data/*.json (+ git history = price history)
  → git commit & push to repo
        │
        ▼
GitHub Pages (static)  →  index.html + app.js  →  fetch /data/*.json
        │
        ▼
You on mobile (just a URL, no backend)
```

- **Stack:** TypeScript/Node + Playwright (collector); plain HTML + vanilla JS
  (frontend, no build step); flat JSON (no DB); GitHub Pages (hosting); cron
  (scheduling).

## Data model (JSON on disk)

```
/data
  stores.json                 # {id, chain, name, region} for stores you track
  products/<chain>.json       # catalog: {id, name, brand, size, category, image}
  prices/YYYY-MM-DD.json       # daily snapshot: {productId, storeId, price, unitPrice}
  latest.json                 # denormalized "current best price" view for the UI
```

Price history = git history of `prices/`. `latest.json` is regenerated each run
so the frontend can load one small file.

## Repo layout (proposed)

```
/collector      # TS + Playwright scraper, normalizer, JSON writer
/web            # static site served by Pages (index.html, app.js, styles)
/data           # committed JSON output (the "database")
/docs           # RESEARCH.md, PLAN.md
.github/        # (optional) Pages deploy workflow only — NOT scraping
```

## Roadmap

### Phase 0 — Feasibility spike (do locally first) ⬅ next
Validate against real endpoints **from your own machine** (the sandbox can't —
anti-bot blocks it):
- [ ] Woolworths: store list + product search JSON via browser-like client.
- [ ] Foodstuffs: current endpoint paths + store cookie; confirm Playwright
      clears Cloudflare Turnstile.
- [ ] Capture sample JSON for store/search/detail; lock down the data model.

### Phase 1 — Collector MVP (one chain, e.g. Woolworths)
- [ ] Playwright session that passes anti-bot, scoped to one store.
- [ ] Search/enumerate a small basket of products; normalize → JSON.
- [ ] Idempotent daily run; write `prices/<date>.json` + rebuild `latest.json`.

### Phase 2 — Static frontend on Pages
- [ ] `index.html` + `app.js`: load `latest.json`, search box, results table.
- [ ] Per-product comparison across chains; cheapest highlighted.
- [ ] Deploy to GitHub Pages; verify on mobile.

### Phase 3 — All chains + history
- [ ] Add New World + Pak'nSave collectors.
- [ ] Price-history sparkline per product (read `prices/*.json`), e.g. uPlot.
- [ ] A saved "shopping list" view (localStorage) totalling cheapest basket.

### Phase 4 — Robustness
- [ ] Schema validation + alert on empty/garbage scrape (sites change often).
- [ ] Retry/backoff; polite rate limiting; cache.
- [ ] Document how to repair when an endpoint changes.

## Scheduling options for the local collector
- **macOS/Linux:** `cron` or a launchd/systemd timer running daily.
- **Raspberry Pi / always-on box:** ideal — set and forget.
- Pushes data to the repo; Pages redeploys automatically.

## Explicitly out of scope (personal-use posture)
- Public/commercial hosting, accounts, multi-user. (Would change the ToS/legal
  picture — revisit only if sharing later.)
- Scraping from cloud/CI runners (blocked by anti-bot; see RESEARCH.md).
