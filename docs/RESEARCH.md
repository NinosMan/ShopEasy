# R&D: How NZ supermarket price comparison tools work

Date: 2026-05-31. Findings from studying grocer.nz + open-source clones, and
probing the live endpoints.

## The NZ supermarket landscape

Two retailer groups cover the major chains, each with a different API shape:

| Group | Chains | Sites | API style |
|---|---|---|---|
| **Woolworths** (was Countdown) | Countdown / Woolworths | woolworths.co.nz | Clean JSON: `/api/v1/products?...`, `/api/v1/addresses/pickup-points` |
| **Foodstuffs** | New World, Pak'nSave | ishopnewworld.co.nz, paknsave.co.nz/shop | `/CommonApi/...` JSON (e.g. `Store/GetStoreList`, product search) |

Note: store-scoped pricing. Prices differ per physical store, so requests must
be scoped to a chosen store via a cookie/header/store-id.

## How grocer.nz does it

grocer.nz was built by **Roc Wang**, who open-sourced an earlier version,
[`rocwang/grocery-wise`](https://github.com/rocwang/grocery-wise) (Vue + Netlify,
archived July 2022). Rather than HTML scraping, it **called the retailers'
internal REST APIs** through an **nginx proxy** (to get around browser CORS).
Prices update daily. The author has publicly acknowledged it likely breaches
the supermarkets' ToS.

## The two scraping approaches people use

1. **Direct internal-API calls** (grocer.nz, [`TonyCui02/grocer`](https://github.com/TonyCui02/grocer)).
   Hit the JSON endpoints the website's own frontend uses. Fast, clean,
   structured (id, name, size, price, unit price). Needs a server-side proxy for
   CORS and a per-store cookie/header. **Best when it works.**
2. **Headless browser** (Playwright + Cheerio):
   [`Jason-nzd/countdown-scraper`](https://github.com/Jason-nzd/countdown-scraper),
   [`Jason-nzd/pakn-scraper`](https://github.com/Jason-nzd/pakn-scraper). Drives a
   real browser, sets geolocation, parses rendered HTML. Heavier/slower but
   survives anti-bot and JS challenges much better.

Other references: [`jesmcc/GroceryCompare`](https://github.com/jesmcc/GroceryCompare)
(Flask), [`Jason-nzd/supermarket-prices-nextjs`](https://github.com/Jason-nzd/supermarket-prices-nextjs)
(Next.js frontend with price-history charts).

## Live probe results (2026-05-31)

Probed from a cloud sandbox. Results:

| Endpoint | Result | Interpretation |
|---|---|---|
| `woolworths.co.nz/api/v1/products?...` | `503` / connection reset | **Akamai bot manager** blocking datacenter IPs |
| `paknsaveonline.co.nz/CommonApi/...` | `301` → `paknsave.co.nz/shop/CommonApi/...` | **URLs restructured since 2022** |
| `paknsave.co.nz/shop/CommonApi/Store/GetStoreList` | Cloudflare **"Just a moment…"** challenge page | **Cloudflare Turnstile** bot protection |

### Anti-bot is the real constraint

Both groups now run active bot management (Akamai + Cloudflare) that **blocks
cloud/datacenter IPs**. This was *not* the case in 2022 when the clones were
written with plain `fetch` — which is exactly why many of those repos are now
archived/broken.

Consequences:
- **Browser `fetch` from a static site won't work** (CORS + anti-bot).
- **GitHub Actions won't reliably work** — runners are datacenter IPs and get
  challenged the same way.
- **A residential IP + a real browser (Playwright)** is the reliable path. Running
  the collector on your own machine/home network gives you both, and keeps volume
  low — the most defensible posture for personal use.
- Endpoints/URLs/cookies change without notice; keep the collector small and easy
  to repair, and validate output each run.

## Open questions to resolve during the spike (run locally)

- [ ] From a residential IP, do the Woolworths JSON APIs respond without Akamai
      blocking? (Likely yes for a browser-like client.)
- [ ] Confirm the current Foodstuffs endpoint paths + the store-selection
      cookie/header, and whether Cloudflare Turnstile passes under Playwright.
- [ ] Capture exact JSON shapes for: store list, product search, product detail.
- [ ] Determine pagination + category traversal to enumerate a useful catalog.
