/* ==========================================================================
   Bozor — Агрегатор цен в Узбекистане
   Основная логика витрины, сравнения, истории цен, фильтрации и тем
   ========================================================================== */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const byId  = id => PRODUCTS.find(p => p.id === id);
const catOf = id => CATEGORIES.find(c => c.id === id);

const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

const starsHTML = rating => {
  const full = Math.round(rating);
  return `<span class="stars" aria-hidden="true">${
    [1, 2, 3, 4, 5].map(n => `<svg class="${n <= full ? '' : 'is-empty'}"><use href="#i-star"/></svg>`).join('')
  }</span>`;
};

const num = n => n.toLocaleString('ru-RU');

/* --------------------------------------------------------------------------
   Хранилище и состояние
   -------------------------------------------------------------------------- */

const store = {
  read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  }
};

const state = {
  favorites: new Set(store.read('arzonol:favorites', store.read('bozor:favorites', []))),
  compare: new Set(store.read('arzonol:compare', store.read('bozor:compare', []))),
  region: store.read('arzonol:region', store.read('bozor:region', 'tashkent')),
  theme: store.read('arzonol:theme', store.read('bozor:theme', 'light')),
  sort: store.read('arzonol:sort', store.read('bozor:sort', 'priceAsc')),
  inStockOnly: false,
  platformFilter: null,
  filter: null,
  query: ''
};

const persist = () => {
  store.write('arzonol:favorites', [...state.favorites]);
  store.write('arzonol:compare', [...state.compare]);
  store.write('arzonol:region', state.region);
  store.write('arzonol:theme', state.theme);
  store.write('arzonol:sort', state.sort);
};

/* --------------------------------------------------------------------------
   Темы оформления
   -------------------------------------------------------------------------- */

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  persist();
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

/* --------------------------------------------------------------------------
   Шаблоны карточек
   -------------------------------------------------------------------------- */

function orbitHTML({ id, kind, w }, index, clone) {
  const p = byId(id);
  const bare = kind === 'bare';
  const style = `--w:${w}px;animation-delay:${(-index * 0.9).toFixed(1)}s`;
  const hidden = clone ? ' tabindex="-1" aria-hidden="true"' : '';
  const alt = `${p.brand} — ${tr(p.title)}`;

  const inner = bare
    ? `<img src="${p.image}" alt="${alt}" loading="lazy">`
    : `<div class="orbit__media"><img src="${p.image}" alt="${alt}" loading="lazy"></div>
       <div class="orbit__meta">
         <div class="orbit__brand">${p.brand}</div>
         <div class="orbit__rating">${starsHTML(p.rating)}<span>${num(p.reviews)}</span></div>
       </div>`;

  return `<button class="orbit orbit--${kind}" type="button" data-open="${p.id}" style="${style}"${hidden}>${inner}</button>`;
}

function cardHTML(p, rank) {
  const on = state.favorites.has(p.id) ? ' is-on' : '';
  const badge = rank ? `<span class="card__rank" aria-hidden="true">${rank}</span>` : '';
  const best = bestOffer(p);
  const sav = savings(p);

  const savingsTag = sav.amount > 0
    ? `<span class="card__tag-savings">${t('badge.savings')} ${money(sav.amount)}</span>`
    : '';

  const storesTag = `<span class="card__tag-stores">${p.offers.length} ${t('badge.stores')}</span>`;

  return `
    <div class="card" data-id="${p.id}">
      ${badge}
      <button class="fav${on}" type="button" data-fav="${p.id}" aria-label="${t('sheet.trackPrice')}" aria-pressed="${on ? 'true' : 'false'}">${icon('heart')}</button>
      <button class="card__open" type="button" data-open="${p.id}">
        <div class="card__media"><img src="${p.image}" alt="${p.brand} — ${tr(p.title)}" loading="lazy"></div>
        <div class="card__body">
          <div class="card__brand">${p.brand}</div>
          <div class="card__title">${tr(p.title)}</div>
          <div class="card__foot">
            <span class="card__price">${formatPriceFrom(best.price)}</span>
            <span class="card__rating">${starsHTML(p.rating)}<span>${num(p.reviews)}</span></span>
          </div>
        </div>
        <div class="card__badges">
          ${savingsTag}
          ${storesTag}
        </div>
      </button>
      <div class="card__strip">${p.thumbs.map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}</div>
    </div>`;
}

/* --------------------------------------------------------------------------
   Рендер главной
   -------------------------------------------------------------------------- */

function renderHero() {
  const set   = CONSTELLATION.map((item, i) => orbitHTML(item, i, false)).join('');
  const clone = CONSTELLATION.map((item, i) => orbitHTML(item, i, true)).join('');
  $('#constellation').innerHTML = set + clone;
}

function renderLangSwitch() {
  $('#lang').innerHTML = LANGS.map(l => `
    <button class="lang__btn${l.id === LANG ? ' is-active' : ''}" type="button"
            data-lang="${l.id}" title="${l.name}" aria-pressed="${l.id === LANG}">${l.label}</button>`).join('');
}

function renderRegionSelector() {
  const current = regionOf(state.region);
  $('#region-current-label').textContent = tr(current.name);

  $('#region-dropdown').innerHTML = REGIONS.map(r => `
    <button class="region-opt${r.id === state.region ? ' is-active' : ''}" type="button" data-region="${r.id}" role="option">
      <span>${tr(r.name)}</span>
      ${r.id === state.region ? icon('check') : ''}
    </button>`).join('');
}

function renderPlatformFilterChips() {
  $('#platform-chips').innerHTML = PLATFORMS.map(p => `
    <button class="platform-chip${state.platformFilter === p.id ? ' is-active' : ''}" type="button" data-platform-filter="${p.id}">
      ${p.name}
    </button>`).join('');
}

function renderNav() {
  const links = ({ home, cls }) => [
    `<button class="${cls}${!state.filter && !state.query ? ' is-active' : ''}" type="button" data-nav="home">${home}</button>`,
    ...CATEGORIES.map(c =>
      `<button class="${cls}${state.filter === c.id ? ' is-active' : ''}" type="button" data-cat="${c.id}">${tr(c.label)}</button>`)
  ].join('');

  $('#topnav-cats').innerHTML = links({ home: t('nav.home'), cls: 'topnav__link' });

  // Мобильный бар навигации
  $('#rail').innerHTML = `
    <button class="rail__link${!state.filter && !state.query ? ' is-active' : ''}" type="button" data-nav="home">
      ${icon('house')}
      <span>${t('nav.home')}</span>
    </button>
    <button class="rail__link" type="button" data-nav="favorites">
      ${icon('heart')}
      <span>${t('nav.favorites')}</span>
      <span class="rail__badge" id="rail-badge-fav" ${state.favorites.size ? '' : 'hidden'}>${state.favorites.size}</span>
    </button>
    <button class="rail__link" type="button" data-open-compare>
      ${icon('compare')}
      <span>${t('nav.compare')}</span>
      <span class="rail__badge" id="rail-badge-compare" ${state.compare.size ? '' : 'hidden'}>${state.compare.size}</span>
    </button>
  `;
}

function renderCategories() {
  $('#categories').innerHTML = CATEGORIES.map(c => `
    <button class="pill" type="button" data-cat="${c.id}" aria-pressed="${state.filter === c.id}">
      <span class="pill__icon" style="background:${c.icon}"></span>${tr(c.label)}
    </button>`).join('');

  $('#cats-grid').innerHTML = CATEGORIES.map(c => {
    const count = PRODUCTS.filter(p => p.cat === c.id).length;
    return `
      <button class="cat" type="button" data-cat="${c.id}" style="--cat:${c.icon}">
        <span class="cat__blob" aria-hidden="true"></span>
        <span class="cat__icon">${icon(c.glyph)}</span>
        <span class="cat__name">${tr(c.label)}</span>
        <span class="cat__meta">${count} ${plural(count)} · ${tr(c.hint)}</span>
      </button>`;
  }).join('');

  syncCatState();
}

const syncCatState = () => {
  $$('[data-cat]').forEach(b => {
    const active = b.dataset.cat === state.filter;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  $$('[data-nav="home"]').forEach(b => b.classList.toggle('is-active', !state.filter && !state.query));
};

const sectionHead = (title, count, sub) => `
  <div class="section__head">
    <h2 class="section__title">${title}</h2>
    <span class="section__chevron">${icon('chevron-right')}</span>
    <span class="section__count">${sub ?? `${count} ${plural(count)}`}</span>
  </div>`;

function renderSections() {
  const blocks = SECTIONS.map(cat => {
    let items = PRODUCTS.filter(p => p.cat === cat);
    items = sortAndFilterItems(items);
    return `
      <section class="section">
        ${sectionHead(tr(catOf(cat).label), items.length)}
        ${railHTML(items.map(p => cardHTML(p)).join(''))}
      </section>`;
  });

  const best = sortAndFilterItems([...PRODUCTS]).slice(0, 8);
  blocks.push(`
    <section class="section">
      ${sectionHead(t('bestsellers.title'), best.length, t('bestsellers.sub'))}
      ${railHTML(best.map((p, i) => cardHTML(p, i + 1)).join(''))}
    </section>`);

  $('#sections').innerHTML = blocks.join('');
  $$('.scroller').forEach(initScroller);
}

const railHTML = inner => `
  <div class="scroller">
    <button class="scroller__arrow scroller__arrow--prev" type="button" data-scroll="-1" aria-label="${t('search.clear')}">${icon('chevron-left')}</button>
    <div class="scroller__track">${inner}</div>
    <button class="scroller__arrow scroller__arrow--next" type="button" data-scroll="1" aria-label="${t('search.submit')}">${icon('chevron-right')}</button>
  </div>`;

function renderPartners() {
  const chip = (p, clone) => `
    <span class="partner"${clone ? ' aria-hidden="true"' : ''}>
      <span class="partner__dot" style="background:${p.color}"></span>${p.name}
    </span>`;

  $('#partners-track').innerHTML =
    PARTNERS.map(p => chip(p, false)).join('') +
    PARTNERS.map(p => chip(p, true)).join('');
}

function initScroller(scroller) {
  const track = $('.scroller__track', scroller);
  const prev  = $('[data-scroll="-1"]', scroller);
  const next  = $('[data-scroll="1"]', scroller);
  if (!track || !prev || !next) return;

  const sync = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  };

  [prev, next].forEach(btn => btn.addEventListener('click', () => {
    track.scrollBy({ left: Number(btn.dataset.scroll) * track.clientWidth * 0.8, behavior: 'smooth' });
  }));

  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
}

/* --------------------------------------------------------------------------
   Сортировка и фильтрация
   -------------------------------------------------------------------------- */

function sortAndFilterItems(items) {
  let list = [...items];

  if (state.inStockOnly) {
    list = list.filter(p => inStockCount(p) > 0);
  }

  if (state.platformFilter) {
    list = list.filter(p => p.offers.some(o => o.platform === state.platformFilter && o.inStock));
  }

  switch (state.sort) {
    case 'priceAsc':
      list.sort((a, b) => bestOffer(a).price - bestOffer(b).price);
      break;
    case 'savingsDesc':
      list.sort((a, b) => savings(b).amount - savings(a).amount);
      break;
    case 'ratingDesc':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'popularDesc':
      list.sort((a, b) => b.sold - a.sold);
      break;
  }

  return list;
}

function match(p, q) {
  const hay = `${p.brand} ${p.title.ru} ${p.title.uz} ${p.title.en} ${p.cat}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every(term => hay.includes(term));
}

function search(q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return PRODUCTS.filter(p => match(p, needle));
}

function applyView() {
  const results  = $('#results');
  const sections = $('#sections');

  if (!state.query && !state.filter) {
    results.hidden = true;
    sections.hidden = false;
    $('#cats').hidden = false;
    renderSections();
    return;
  }

  let items = PRODUCTS;
  let title = '';

  if (state.filter) {
    items = items.filter(p => p.cat === state.filter);
    title = tr(catOf(state.filter).label);
  }
  if (state.query) {
    const needle = state.query.trim().toLowerCase();
    items = items.filter(p => match(p, needle));
    title = title ? `${title} · «${state.query}»` : `«${state.query}»`;
  }

  items = sortAndFilterItems(items);
  renderResults(title, items, t('empty.search'));
}

function renderResults(title, items, emptyText) {
  $('#results-title').textContent = title;
  $('#results-count').textContent = `${items.length} ${plural(items.length)}`;
  $('#results-grid').innerHTML = items.length
    ? items.map(p => cardHTML(p)).join('')
    : `<p class="empty" style="grid-column:1/-1">${emptyText}</p>`;

  $('#results').hidden = false;
  $('#sections').hidden = true;
  $('#cats').hidden = true;
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderSuggest(q, box) {
  const hits = search(q).slice(0, 6);
  if (!hits.length) { box.hidden = true; box.innerHTML = ''; return; }

  box.innerHTML = hits.map(p => `
    <button class="suggest__item" type="button" data-suggest="${p.id}" role="option">
      <img class="suggest__thumb" src="${p.thumbs[0]}" alt="" loading="lazy">
      <span>
        <span class="suggest__title">${tr(p.title)}</span><br>
        <span class="suggest__brand">${p.brand} · ${formatPriceFrom(bestOffer(p).price)}</span>
      </span>
    </button>`).join('');
  box.hidden = false;
}

/* --------------------------------------------------------------------------
   Отслеживание цен и Сравнение
   -------------------------------------------------------------------------- */

function toggleFav(id) {
  const on = state.favorites.has(id);
  on ? state.favorites.delete(id) : state.favorites.add(id);
  persist();

  $$(`[data-fav="${id}"]`).forEach(btn => {
    btn.classList.toggle('is-on', !on);
    btn.setAttribute('aria-pressed', String(!on));
  });

  const sheetFav = $('#sheet-fav');
  if (sheetFav && sheetFav.dataset.id === id) {
    sheetFav.classList.toggle('is-on', !on);
  }

  syncBadges();
  toast(on ? t('toast.favOff') : t('toast.favOn'));
}

function toggleCompare(id) {
  const on = state.compare.has(id);
  if (!on && state.compare.size >= 4) {
    toast(t('toast.compareLimit'));
    return;
  }

  on ? state.compare.delete(id) : state.compare.add(id);
  persist();

  updateSheetCompareBtn(id);
  renderCompareDrawer();
  syncBadges();

  if ($('#compare-modal').classList.contains('is-open')) {
    renderCompareTable();
  }

  toast(on ? t('toast.compareOff') : t('toast.compareOn'));
}

function clearCompare() {
  state.compare.clear();
  persist();
  renderCompareDrawer();
  syncBadges();
  if (openProductId) updateSheetCompareBtn(openProductId);
  closeCompareModal();
  toast(t('toast.compareCleared'));
}

function updateSheetCompareBtn(id) {
  const btn = $('#sheet-compare');
  const label = $('#sheet-compare-label');
  if (!btn || btn.dataset.id !== id) return;

  const inCompare = state.compare.has(id);
  btn.classList.toggle('is-active', inCompare);
  label.textContent = inCompare ? t('sheet.compareRemove') : t('sheet.compareAdd');
}

function renderCompareDrawer() {
  const list = $('#compare-list');
  const ids = [...state.compare];

  list.innerHTML = ids.length
    ? ids.map(id => {
        const p = byId(id);
        const best = bestOffer(p);
        const sav = savings(p);
        const savText = sav.amount > 0 ? ` · ${formatSavings(sav.amount, sav.percent)}` : '';
        return `
          <div class="compare-item" data-id="${id}">
            <img src="${p.thumbs[0]}" alt="" loading="lazy">
            <div class="compare-item__meta">
              <div class="compare-item__brand">${p.brand}</div>
              <div class="compare-item__title">${tr(p.title)}</div>
              <div class="compare-item__price">${formatPriceFrom(best.price)}<span style="color:var(--color-success-green)">${savText}</span></div>
            </div>
            <button class="compare-item__del" type="button" data-del-compare="${id}" aria-label="${t('compare.remove')}">
              <svg><use href="#i-trash"/></svg>
            </button>
          </div>`;
      }).join('')
    : `<p class="empty">${t('compare.empty')}</p>`;

  // Калькулятор общей выгоды комплекта
  const bundleBox = $('#drawer-bundle');
  if (ids.length >= 2) {
    const calc = totalBundleSavings(ids);
    bundleBox.hidden = false;
    bundleBox.innerHTML = `
      <div class="bundle-row"><span>${t('compare.totalBest')}</span><strong>${money(calc.bestTotal)}</strong></div>
      <div class="bundle-row bundle-row--saved"><span>${t('compare.totalSaved')}</span><span>${money(calc.savedAmount)} (${calc.savedPercent}%)</span></div>
    `;
  } else {
    bundleBox.hidden = true;
    bundleBox.innerHTML = '';
  }

  $('#open-compare-modal').disabled = !ids.length;
  $('#clear-compare').disabled = !ids.length;
}

function syncBadges() {
  const favCount = state.favorites.size;
  const compCount = state.compare.size;

  const badgeFav = $('#badge-fav');
  if (badgeFav) {
    badgeFav.textContent = String(favCount);
    badgeFav.hidden = favCount === 0;
  }

  const badgeComp = $('#badge-compare');
  if (badgeComp) {
    badgeComp.textContent = String(compCount);
    badgeComp.hidden = compCount === 0;
  }

  const railBadgeFav = $('#rail-badge-fav');
  if (railBadgeFav) {
    railBadgeFav.textContent = String(favCount);
    railBadgeFav.hidden = favCount === 0;
  }

  const railBadgeComp = $('#rail-badge-compare');
  if (railBadgeComp) {
    railBadgeComp.textContent = String(compCount);
    railBadgeComp.hidden = compCount === 0;
  }
}

/* --------------------------------------------------------------------------
   Модалка товара: блок сравнения + SVG-график цен
   -------------------------------------------------------------------------- */

let lastFocused = null;
let openProductId = null;

function openSheet(id) {
  const p = byId(id);
  lastFocused = document.activeElement;
  openProductId = id;

  fillSheet(p);

  const overlay = $('#overlay');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
}

function fillSheet(p) {
  $('#sheet-image').src = p.image;
  $('#sheet-image').alt = `${p.brand} — ${tr(p.title)}`;
  $('#sheet-thumbs').innerHTML = [p.image, ...p.thumbs]
    .map(src => `<img src="${src}" alt="" data-swap="${src}" loading="lazy">`).join('');
  $('#sheet-brand').textContent = p.brand;
  $('#sheet-title').textContent = tr(p.title);
  $('#sheet-rating').innerHTML = `${starsHTML(p.rating)}<span>${p.rating} · ${num(p.reviews)} ${t('sheet.reviews')}</span>`;

  const best = bestOffer(p);
  const sav = savings(p);

  $('#sheet-price').textContent = formatPriceFrom(best.price);
  const savBadge = $('#sheet-savings');
  if (sav.amount > 0) {
    savBadge.textContent = formatSavings(sav.amount, sav.percent);
    savBadge.hidden = false;
  } else {
    savBadge.hidden = true;
  }

  $('#sheet-desc').textContent = t('sheet.desc');

  // График истории цен
  renderPriceChart(p);

  // Сортировка предложений
  const sortedOffers = [...p.offers].sort((a, b) => {
    if (a.inStock === b.inStock) return a.price - b.price;
    return a.inStock ? -1 : 1;
  });

  const bestOfferItem = bestOffer(p);

  $('#sheet-offers').innerHTML = sortedOffers.map(o => {
    const plat = platformOf(o.platform);
    const isBest = o.inStock && o.platform === bestOfferItem.platform && o.price === bestOfferItem.price;
    const rowClass = `offer-row ${isBest ? 'offer-row--best' : ''} ${!o.inStock ? 'offer-row--out' : ''}`;
    const bestBadge = isBest ? `<span class="offer-row__best-badge">${t('sheet.bestPrice')}</span>` : '';
    const stockStatus = o.inStock
      ? `<span class="offer-row__stock">${t('sheet.inStock')}</span>`
      : `<span class="offer-row__stock is-out">${t('sheet.outOfStock')}</span>`;
    
    // Пересчёт срока доставки для выбранного региона
    const deliveryDays = calcDeliveryDays(o, state.region);
    const delivery = `<span class="offer-row__delivery">${t('sheet.delivery')} ${formatDelivery(deliveryDays)}</span>`;

    const action = o.inStock
      ? `<a class="offer-row__btn" href="${o.url}" target="_blank" rel="noopener noreferrer">${t('sheet.visit')}<svg><use href="#i-external"/></svg></a>`
      : `<button class="offer-row__btn is-disabled" type="button" disabled>${t('sheet.visit')}</button>`;

    return `
      <div class="${rowClass}">
        <div class="offer-row__platform">
          <span class="offer-row__dot" style="background:${plat.color}"></span>
          <span>${plat.name}</span>
          ${bestBadge}
        </div>
        <div class="offer-row__meta">
          ${stockStatus}
          ${delivery}
        </div>
        <div class="offer-row__price">${money(o.price)}</div>
        <div class="offer-row__action">${action}</div>
      </div>`;
  }).join('');

  // Кнопка сравнения
  const compareBtn = $('#sheet-compare');
  compareBtn.dataset.id = p.id;
  updateSheetCompareBtn(p.id);

  // Кнопка подписки на цену
  const alertBtn = $('#sheet-alert-btn');
  alertBtn.dataset.id = p.id;

  // Кнопка отслеживания
  const fav = $('#sheet-fav');
  fav.dataset.id = p.id;
  fav.classList.toggle('is-on', state.favorites.has(p.id));
}

function renderPriceChart(p) {
  const trend = priceTrend(p);
  const trendBadge = $('#sheet-trend-badge');
  trendBadge.textContent = trend.isDrop ? `-${trend.percent}% · ${t('chart.bestTime')}` : t('chart.allTimeLow');

  const history = priceHistory(p);
  const chartBox = $('#sheet-chart');

  const width = 340;
  const height = 80;
  const padX = 24;
  const padY = 16;

  const prices = history.map(h => h.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const rangeP = Math.max(1, maxP - minP);

  const points = history.map((h, i) => {
    const x = padX + (i / (history.length - 1)) * (width - padX * 2);
    const y = height - padY - ((h.price - minP) / rangeP) * (height - padY * 2);
    return { x, y, price: h.price, date: h.date };
  });

  const pathD = 'M ' + points.map(pt => `${pt.x},${pt.y}`).join(' L ');
  const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  chartBox.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-shop-violet)" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="var(--color-shop-violet)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#chartGrad)"/>
      <path d="${pathD}" fill="none" stroke="var(--color-shop-violet)" stroke-width="2.5" stroke-linecap="round"/>
      ${points.map(pt => `
        <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="var(--surface-surface)" stroke="var(--color-shop-violet)" stroke-width="2">
          <title>${pt.date}: ${money(pt.price)}</title>
        </circle>
        <text x="${pt.x}" y="${height - 2}" font-size="8" fill="var(--color-muted-gray)" text-anchor="middle">${pt.date.slice(5)}</text>
      `).join('')}
    </svg>
  `;
}

function closeSheet() {
  const overlay = $('#overlay');
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  openProductId = null;
  setTimeout(() => { overlay.hidden = true; }, 200);
  lastFocused?.focus();
}

/* --------------------------------------------------------------------------
   Модалка подписки на цену
   -------------------------------------------------------------------------- */

function openAlertModal(productId) {
  const p = byId(productId);
  const best = bestOffer(p);
  $('#alert-target-price').value = Math.round(best.price * 0.9);
  const modal = $('#alert-modal');
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

function closeAlertModal() {
  const modal = $('#alert-modal');
  modal.classList.remove('is-open');
  setTimeout(() => { modal.hidden = true; }, 200);
}

/* --------------------------------------------------------------------------
   Сравнение
   -------------------------------------------------------------------------- */

function openCompareDrawer() {
  renderCompareDrawer();
  $('#drawer').classList.add('is-open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCompareDrawer() {
  $('#drawer').classList.remove('is-open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#scrim').classList.remove('is-open');
  document.body.style.overflow = '';
}

function openCompareModal() {
  closeCompareDrawer();
  renderCompareTable();
  const modal = $('#compare-modal');
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
}

function closeCompareModal() {
  const modal = $('#compare-modal');
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => { modal.hidden = true; }, 200);
}

function renderCompareTable() {
  const container = $('#compare-table-container');
  const ids = [...state.compare];

  if (!ids.length) {
    container.innerHTML = `<p class="empty">${t('compare.empty')}</p>`;
    return;
  }

  const products = ids.map(byId);
  const bundle = totalBundleSavings(ids);

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>${t('cats.title')}</th>
            ${products.map(p => `
              <th class="matrix-col">
                <div class="matrix-product-card">
                  <button class="matrix-remove-btn" type="button" data-del-compare="${p.id}" aria-label="${t('compare.remove')}">
                    <svg><use href="#i-close"/></svg>
                  </button>
                  <img src="${p.thumbs[0]}" alt="" loading="lazy">
                  <div class="matrix-product-brand">${p.brand}</div>
                  <div class="matrix-product-title">${tr(p.title)}</div>
                </div>
              </th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${t('compare.param.bestPrice')}</td>
            ${products.map(p => {
              const best = bestOffer(p);
              const plat = platformOf(best.platform);
              return `<td class="matrix-col"><span class="matrix-val-price">${money(best.price)}</span><br><small style="color:var(--color-muted-gray)">${plat.name}</small></td>`;
            }).join('')}
          </tr>
          <tr>
            <td>${t('compare.param.range')}</td>
            ${products.map(p => {
              const range = priceRange(p);
              return `<td class="matrix-col"><span class="matrix-val-text">${money(range.min)} – ${money(range.max)}</span></td>`;
            }).join('')}
          </tr>
          <tr>
            <td>${t('compare.param.savings')}</td>
            ${products.map(p => {
              const sav = savings(p);
              return `<td class="matrix-col"><span class="matrix-val-savings">${formatSavings(sav.amount, sav.percent)}</span></td>`;
            }).join('')}
          </tr>
          <tr>
            <td>${t('compare.param.platforms')}</td>
            ${products.map(p => `<td class="matrix-col"><span class="matrix-val-text">${p.offers.length} ${t('sheet.offersTitle').toLowerCase()}</span></td>`).join('')}
          </tr>
          <tr>
            <td>${t('compare.param.inStock')}</td>
            ${products.map(p => {
              const stock = inStockCount(p);
              return `<td class="matrix-col"><span class="matrix-val-text">${stock} / ${p.offers.length}</span></td>`;
            }).join('')}
          </tr>
          <tr>
            <td>${t('compare.param.rating')}</td>
            ${products.map(p => `<td class="matrix-col">${starsHTML(p.rating)} <span class="matrix-val-text">${p.rating} (${num(p.reviews)})</span></td>`).join('')}
          </tr>
          <tr>
            <td>${t('compare.param.action')}</td>
            ${products.map(p => `
              <td class="matrix-col">
                <button class="btn btn--primary" type="button" style="height:36px;font-size:13px;padding:0 16px;" data-open="${p.id}">
                  ${t('compare.viewOffers')}
                </button>
              </td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
    ${ids.length >= 2 ? `
      <div style="margin-top:20px;padding:16px 20px;background:var(--color-success-bg);border:1px solid rgba(26,127,78,0.2);border-radius:var(--radius-2xl-2);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${t('compare.totalBundle')}:</strong>
          <span style="margin-left:8px;color:var(--color-muted-gray)">${t('compare.totalBest')} ${money(bundle.bestTotal)}</span>
        </div>
        <div style="font-size:16px;font-weight:600;color:var(--color-success-green);">
          ${t('compare.totalSaved')} ${money(bundle.savedAmount)} (${bundle.savedPercent}%)
        </div>
      </div>
    ` : ''}
  `;
}

/* --------------------------------------------------------------------------
   Toast
   -------------------------------------------------------------------------- */

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-open'), 2200);
}

/* --------------------------------------------------------------------------
   Смена языка / региона
   -------------------------------------------------------------------------- */

function switchLang(lang) {
  if (lang === LANG) return;
  setLang(lang);

  applyStaticI18n();
  renderLangSwitch();
  renderRegionSelector();
  renderPlatformFilterChips();
  renderNav();
  renderHero();
  renderCategories();
  renderSections();
  renderPartners();
  renderCompareDrawer();

  if ($('#compare-modal').classList.contains('is-open')) renderCompareTable();
  if (openProductId) fillSheet(byId(openProductId));
  if (!$('#results').hidden) {
    if (state.filter || state.query) applyView();
    else showFavorites();
  }
}

function setRegion(regionId) {
  state.region = regionId;
  persist();
  renderRegionSelector();
  $('#region-dropdown').hidden = true;
  if (openProductId) fillSheet(byId(openProductId));
  toast(`${t('region.prefix')} ${tr(regionOf(regionId).name)}`);
}

function showFavorites() {
  const items = PRODUCTS.filter(p => state.favorites.has(p.id));
  renderResults(t('results.favorites'), items, t('empty.favorites'));
}

function goHome() {
  state.filter = null;
  state.query = '';
  clearSearchInputs();
  syncCatState();
  applyView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------------------------------------
   Поиск
   -------------------------------------------------------------------------- */

const SEARCH_FIELDS = [
  { form: '#search-form',     input: '#q',     clear: '#search-clear',     suggest: '#suggest' },
  { form: '#search-form-top', input: '#q-top', clear: '#search-clear-top', suggest: '#suggest-top' }
];

function clearSearchInputs() {
  SEARCH_FIELDS.forEach(f => {
    $(f.input).value = '';
    $(f.clear).hidden = true;
    $(f.suggest).hidden = true;
  });
}

function syncSearchInputs(value) {
  SEARCH_FIELDS.forEach(f => {
    if ($(f.input).value !== value) $(f.input).value = value;
    $(f.clear).hidden = !value;
  });
}

const hideSuggests = () => SEARCH_FIELDS.forEach(f => $(f.suggest).hidden = true);
const activeSearchInput = () => $('#topnav-search').classList.contains('is-visible') ? $('#q-top') : $('#q');

function wireSearch({ form, input, clear, suggest }) {
  const el = $(input), box = $(suggest);

  el.addEventListener('input', () => {
    syncSearchInputs(el.value);
    renderSuggest(el.value, box);
  });

  el.addEventListener('focus', () => { if (el.value) renderSuggest(el.value, box); });

  $(clear).addEventListener('click', () => {
    state.query = '';
    clearSearchInputs();
    applyView();
    el.focus();
  });

  $(form).addEventListener('submit', e => {
    e.preventDefault();
    state.query = el.value.trim();
    box.hidden = true;
    applyView();
  });
}

function watchHeroSearch() {
  const hero = $('.hero .search');
  const top  = $('#topnav-search');
  const nav  = $('.topnav');
  if (!hero || !top) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const navHeight = nav ? nav.offsetHeight : 60;
    const covered = hero.getBoundingClientRect().bottom < navHeight;
    top.classList.toggle('is-visible', covered);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

/* --------------------------------------------------------------------------
   Слушатели событий
   -------------------------------------------------------------------------- */

function wireEvents() {
  document.addEventListener('click', e => {
    // Язык
    const lang = e.target.closest('[data-lang]');
    if (lang) { switchLang(lang.dataset.lang); return; }

    // Регион
    const regionBtn = e.target.closest('#region-btn');
    if (regionBtn) {
      const drop = $('#region-dropdown');
      drop.hidden = !drop.hidden;
      return;
    }
    const regOpt = e.target.closest('[data-region]');
    if (regOpt) { setRegion(regOpt.dataset.region); return; }
    if (!e.target.closest('#region-select-wrap')) $('#region-dropdown').hidden = true;

    // Тёмная тема
    if (e.target.closest('#theme-toggle')) { toggleTheme(); return; }

    // Открытие карточки
    const open = e.target.closest('[data-open]');
    if (open) {
      if ($('#compare-modal').classList.contains('is-open')) closeCompareModal();
      openSheet(open.dataset.open);
      return;
    }

    // Отслеживание
    const fav = e.target.closest('[data-fav]');
    if (fav) { toggleFav(fav.dataset.fav); return; }

    // Удаление из сравнения
    const delComp = e.target.closest('[data-del-compare]');
    if (delComp) {
      toggleCompare(delComp.dataset.delCompare);
      return;
    }

    // Фильтр по категории
    const pill = e.target.closest('[data-cat]');
    if (pill) {
      const id = pill.dataset.cat;
      state.filter = state.filter === id ? null : id;
      syncCatState();
      applyView();
      return;
    }

    // Быстрый фильтр: Только в наличии
    const stockBtn = e.target.closest('#filter-stock');
    if (stockBtn) {
      state.inStockOnly = !state.inStockOnly;
      stockBtn.classList.toggle('is-active', state.inStockOnly);
      stockBtn.setAttribute('aria-pressed', String(state.inStockOnly));
      applyView();
      return;
    }

    // Быстрый фильтр: Маркетплейс
    const platChip = e.target.closest('[data-platform-filter]');
    if (platChip) {
      const pId = platChip.dataset.platformFilter;
      state.platformFilter = state.platformFilter === pId ? null : pId;
      renderPlatformFilterChips();
      applyView();
      return;
    }

    if (e.target.closest('[data-reset]') || e.target.closest('[data-nav="home"]')) {
      goHome();
      return;
    }

    if (e.target.closest('[data-nav="favorites"]')) {
      showFavorites();
      return;
    }

    const suggest = e.target.closest('[data-suggest]');
    if (suggest) {
      suggest.closest('.search__suggest').hidden = true;
      openSheet(suggest.dataset.suggest);
      return;
    }

    const swap = e.target.closest('[data-swap]');
    if (swap) { $('#sheet-image').src = swap.dataset.swap; return; }

    // Модалка подписки на цену
    if (e.target.closest('#sheet-alert-btn')) {
      openAlertModal(openProductId);
      return;
    }
    if (e.target.closest('[data-close-alert]') || e.target.id === 'alert-modal') {
      closeAlertModal();
      return;
    }

    if (e.target.closest('[data-open-compare]')) { openCompareDrawer(); return; }
    if (e.target.closest('[data-close-compare]') || e.target.id === 'scrim') { closeCompareDrawer(); return; }
    if (e.target.closest('[data-close-compare-modal]')) { closeCompareModal(); return; }
    if (e.target.closest('[data-close-sheet]') || e.target.id === 'overlay') { closeSheet(); return; }

    if (!e.target.closest('.search, .topnav__search')) hideSuggests();
  });

  // Изменение сортировки
  $('#sort-select').addEventListener('change', e => {
    state.sort = e.target.value;
    persist();
    applyView();
  });

  // Сабмит формы подписки на цену
  $('#alert-form').addEventListener('submit', e => {
    e.preventDefault();
    closeAlertModal();
    toast(t('alert.success'));
  });

  $('#sheet-compare').addEventListener('click', e => {
    toggleCompare(e.currentTarget.dataset.id);
  });

  $('#sheet-fav').addEventListener('click', e => toggleFav(e.currentTarget.dataset.id));
  $('#open-compare-modal').addEventListener('click', openCompareModal);
  $('#clear-compare').addEventListener('click', clearCompare);

  SEARCH_FIELDS.forEach(wireSearch);
  watchHeroSearch();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#alert-modal').classList.contains('is-open')) closeAlertModal();
      else if ($('#compare-modal').classList.contains('is-open')) closeCompareModal();
      else if ($('#overlay').classList.contains('is-open')) closeSheet();
      else if ($('#drawer').classList.contains('is-open')) closeCompareDrawer();
      else hideSuggests();
    }
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      activeSearchInput().focus();
    }
  });

  $$('[data-cookie]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.write('arzonol:cookies', btn.dataset.cookie);
      const bar = $('#cookie');
      bar.classList.add('is-hiding');
      setTimeout(() => { bar.hidden = true; }, 240);
    });
  });
}

/* --------------------------------------------------------------------------
   Старт
   -------------------------------------------------------------------------- */

document.documentElement.lang = t('html.lang');
applyTheme(state.theme);
applyStaticI18n();
renderLangSwitch();
renderRegionSelector();
renderPlatformFilterChips();
renderNav();
renderHero();
renderCategories();
renderSections();
renderPartners();
renderCompareDrawer();
syncBadges();
wireEvents();

$('#sort-select').value = state.sort;

if (!store.read('arzonol:cookies', store.read('bozor:cookies', null))) {
  setTimeout(() => { $('#cookie').hidden = false; }, 900);
}
