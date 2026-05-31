"use strict";

// ShopEasy — static price-comparison frontend.
// Loads ./data/latest.json (produced by the collector) and renders a
// searchable, mobile-first comparison view. No backend, no build step.

const state = {
  products: [],
  category: "All",
  query: "",
};

const els = {
  search: document.getElementById("search"),
  chips: document.getElementById("chips"),
  results: document.getElementById("results"),
  empty: document.getElementById("empty"),
  meta: document.getElementById("meta"),
  banner: document.getElementById("sample-banner"),
  footerMeta: document.getElementById("footer-meta"),
};

const nzd = (n) =>
  new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n);

async function init() {
  try {
    const res = await fetch("./data/latest.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.products = Array.isArray(data.products) ? data.products : [];
    if (data.sample) els.banner.hidden = false;

    const when = data.generatedAt ? new Date(data.generatedAt) : null;
    els.footerMeta.textContent = when
      ? `Prices as at ${when.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}` +
        (data.sample ? " · sample data" : "")
      : "";

    buildChips();
    render();
  } catch (err) {
    els.results.innerHTML = "";
    els.empty.hidden = false;
    els.empty.textContent =
      "Couldn't load price data (data/latest.json). " +
      "Once the collector has run and committed data, it'll show here.";
  }
}

function buildChips() {
  const cats = ["All", ...new Set(state.products.map((p) => p.category).filter(Boolean))].sort(
    (a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b))
  );
  els.chips.innerHTML = "";
  for (const cat of cats) {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = cat;
    btn.setAttribute("aria-pressed", String(cat === state.category));
    btn.addEventListener("click", () => {
      state.category = cat;
      buildChips();
      render();
    });
    els.chips.appendChild(btn);
  }
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  return state.products.filter((p) => {
    if (state.category !== "All" && p.category !== state.category) return false;
    if (!q) return true;
    return [p.name, p.brand, p.category]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(q));
  });
}

function render() {
  const items = filtered();
  els.results.innerHTML = "";
  els.empty.hidden = items.length > 0;
  els.meta.textContent = `${items.length} product${items.length === 1 ? "" : "s"}` +
    (state.category !== "All" ? ` in ${state.category}` : "");

  for (const product of items) {
    els.results.appendChild(renderCard(product));
  }
}

function renderCard(product) {
  const prices = [...(product.prices || [])]
    .filter((p) => typeof p.price === "number")
    .sort((a, b) => a.price - b.price);

  const card = document.createElement("article");
  card.className = "card";

  const head = document.createElement("div");
  head.className = "card-head";
  const titleWrap = document.createElement("div");
  const name = document.createElement("h2");
  name.className = "card-name";
  name.textContent = product.name;
  const sub = document.createElement("p");
  sub.className = "card-sub";
  sub.textContent = [product.brand, product.size].filter(Boolean).join(" · ");
  titleWrap.append(name, sub);
  head.appendChild(titleWrap);

  if (prices.length >= 2) {
    const saving = prices[prices.length - 1].price - prices[0].price;
    if (saving > 0) {
      const save = document.createElement("span");
      save.className = "card-save";
      save.textContent = `Save ${nzd(saving)}`;
      head.appendChild(save);
    }
  }
  card.appendChild(head);

  const list = document.createElement("ul");
  list.className = "prices";
  const cheapest = prices.length ? prices[0].price : null;

  for (const p of prices) {
    const row = document.createElement("li");
    row.className = "price-row" + (p.price === cheapest ? " best" : "");

    const store = document.createElement("div");
    store.className = "store";
    const chain = document.createElement("span");
    chain.className = "store-chain";
    chain.textContent = p.chain;
    if (p.price === cheapest) {
      const tag = document.createElement("span");
      tag.className = "best-tag";
      tag.textContent = "CHEAPEST";
      chain.appendChild(tag);
    }
    const sname = document.createElement("span");
    sname.className = "store-name";
    sname.textContent = p.store || "";
    store.append(chain, sname);

    const block = document.createElement("div");
    block.className = "price-block";
    const price = document.createElement("div");
    price.className = "price";
    price.textContent = nzd(p.price);
    block.appendChild(price);
    if (p.unitPrice) {
      const unit = document.createElement("div");
      unit.className = "unit";
      unit.textContent = p.unitPrice;
      block.appendChild(unit);
    }

    row.append(store, block);
    list.appendChild(row);
  }
  card.appendChild(list);
  return card;
}

els.search.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

init();
