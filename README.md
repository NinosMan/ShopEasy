# ShopEasy — NZ Supermarket Price Comparison (personal)

A personal tool to compare grocery prices across the major New Zealand
supermarkets (Woolworths/Countdown, New World, Pak'nSave), inspired by
[grocer.nz](https://grocer.nz/).

> **Status:** R&D / planning. No app code yet. See [`docs/RESEARCH.md`](docs/RESEARCH.md)
> for how the existing tools work and what we learned probing the real endpoints,
> and [`docs/PLAN.md`](docs/PLAN.md) for the proposed build.

## TL;DR of the approach

The supermarkets serve their own sites from internal JSON APIs, so in principle
you fetch prices the same way their frontends do. **But** both retailer groups
now sit behind active anti-bot protection (Akamai for Woolworths, Cloudflare for
Foodstuffs) that blocks datacenter/cloud IPs. That single fact drives the whole
design:

```
Your machine (residential IP, daily cron)
  → collector scrapes APIs / via Playwright
  → writes normalized JSON + price history
  → git commit & push
        │
        ▼
GitHub Pages (static frontend)
  → fetches /data/*.json, renders search + comparison + charts
        │
        ▼
You, on mobile (just a URL — no backend)
```

- **Scraping** runs on *your* machine (laptop / Raspberry Pi), not in the cloud,
  to stay on a residential IP and avoid the bot blocks.
- **Frontend** is fully static → free GitHub Pages, mobile-friendly, no backend.
- **Price history** comes for free from git history of the committed JSON.

## Why not just scrape from GitHub Actions?

GitHub Actions runners use datacenter IPs, which get challenged/blocked by the
same Cloudflare/Akamai protection. The collector therefore runs locally. See
[`docs/RESEARCH.md`](docs/RESEARCH.md#anti-bot-is-the-real-constraint).

## Legal / ethical note

Prices are public, but the grocer.nz author has acknowledged this likely
breaches the supermarkets' Terms of Service. For **personal, low-volume** use
the risk is small, but it is not a settled "this is allowed." Be a polite
client: daily (not constant) scrapes, cache aggressively, low request rates.
