/* ==========================================================================
   Bozor — Агрегатор цен в Узбекистане
   Основная логика витрины, сравнения, истории цен, фильтрации и тем
   ========================================================================== */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// byId объявлен в data.js — здесь только категории
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
   Авторизация

   Токен непрозрачный, живёт в localStorage и уходит в заголовке Authorization.
   Цены гейтятся на сервере: у гостя их нет в ответе API вообще, поэтому
   размытие — только визуальная часть, а не защита.
   -------------------------------------------------------------------------- */

let currentUser = null;

async function restoreSession() {
  if (!localStorage.getItem('arzonol:token')) return;
  try {
    const { user } = await api('/api/auth/me');
    currentUser = user;
  } catch {
    // токен протух или база пересоздана — молча выходим
    localStorage.removeItem('arzonol:token');
  }
}

async function doAuth(mode, payload) {
  const { token, user } = await api(`/api/auth/${mode}`, { method: 'POST', body: payload, auth: false });
  localStorage.setItem('arzonol:token', token);
  currentUser = user;

  // после входа каталог перезапрашивается — теперь с ценами
  await loadCatalog();
  await pullUserData();
  renderAll();

  // Регистрируются чаще всего прямо из гейта в карточке товара. Если её не
  // перерисовать, человек увидит тот же размытый блок и решит, что ничего
  // не произошло — ровно так этот баг и выглядел.
  if (openProductId) fillSheet(byId(openProductId));

  closeAuthModal();
  checkNotifications();
  toast(t(mode === 'register' ? 'auth.registered' : 'auth.loggedIn'));
}

async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* уже невалиден */ }
  localStorage.removeItem('arzonol:token');
  currentUser = null;
  state.favorites.clear();
  state.compare.clear();
  await loadCatalog();
  renderAll();
  renderNotifications([]);
  toast(t('auth.loggedOut'));
}

/* Сработавшие цели по цене. Показываем при входе — это замыкает цикл:
   человек назвал цену, мы следили, цена достигнута. */
async function checkNotifications() {
  if (!currentUser) return;
  try {
    const { notifications } = await api('/api/notifications');
    renderNotifications(notifications);
  } catch { /* не критично */ }
}

function renderNotifications(list) {
  const box = $('#notifications');
  if (!box) return;

  box.hidden = !list.length;
  if (!list.length) { box.innerHTML = ''; return; }

  box.innerHTML = `
    <div class="notif__head">
      <svg class="notif__icon"><use href="#i-bell"/></svg>
      <span>${t('notif.title')}</span>
      <button class="notif__close" type="button" data-close-notif aria-label="${t('sheet.close')}">
        <svg><use href="#i-close"/></svg>
      </button>
    </div>
    <div class="notif__list">
      ${list.map(n => {
        const p = byId(n.product_id);
        if (!p) return '';
        return `
          <button class="notif__item" type="button" data-open="${p.id}">
            <img src="${p.thumbs[0] || p.image}" alt="" loading="lazy">
            <span class="notif__text">
              <span class="notif__name">${p.brand} — ${tr(p.title)}</span>
              <span class="notif__prices">${t('notif.reached')} ${money(n.current)}
                <s>${money(n.target)}</s></span>
            </span>
          </button>`;
      }).join('')}
    </div>`;
}

/* Отслеживаемые и сравнение переезжают на сервер, как только человек вошёл */
async function pullUserData() {
  if (!currentUser) return;
  try {
    const [{ tracked }, { compare }] = await Promise.all([api('/api/tracked'), api('/api/compare')]);
    state.favorites = new Set(tracked.map(r => r.product_id));
    state.compare = new Set(compare);
    persist();
  } catch { /* не критично для показа каталога */ }
}

function renderAuthUI() {
  const box = $('#auth-actions');
  if (!box) return;

  box.innerHTML = currentUser
    ? `<button class="topnav__user" type="button" id="user-menu-btn" title="${currentUser.email}">
         <span class="topnav__user-avatar">${(currentUser.name || currentUser.email)[0].toUpperCase()}</span>
         <span class="topnav__user-name">${currentUser.name || currentUser.email.split('@')[0]}</span>
       </button>`
    : `<button class="topnav__btn" type="button" data-auth="login" data-i18n-attr="title:nav.account,aria-label:nav.account" title="${t('nav.account')}">
         <svg><use href="#i-user"/></svg>
       </button>`;
}

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
  if (!p) return '';
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

/* Цена для гостя закрыта: показываем призыв войти, а не «от 0 сум» */
const priceLabel = p => CATALOG_UNLOCKED
  ? formatPriceFrom(bestOffer(p).price)
  : `<span class="price-locked">${t('gate.showPrices')}</span>`;

function cardHTML(p, rank) {
  const on = state.favorites.has(p.id) ? ' is-on' : '';
  const badge = rank ? `<span class="card__rank" aria-hidden="true">${rank}</span>` : '';
  const sav = savings(p);

  const savingsTag = sav.amount > 0
    ? `<span class="card__tag-savings">${t('badge.savings')} ${money(sav.amount)}</span>`
    : '';

  // offersCount известен и гостю — число площадок не секрет, секрет цены
  const storesTag = `<span class="card__tag-stores">${offersCount(p)} ${t('badge.stores')}</span>`;

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
            <span class="card__price">${priceLabel(p)}</span>
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
  // На мобильном три кнопки не помещаются в шапку, поэтому там показывается одна:
  // подписана текущим языком, а ведёт на следующий по кругу
  const next = LANGS[(LANGS.findIndex(l => l.id === LANG) + 1) % LANGS.length];
  const current = LANGS.find(l => l.id === LANG) ?? LANGS[0];

  $('#lang').innerHTML = LANGS.map(l => `
    <button class="lang__btn${l.id === LANG ? ' is-active' : ''}" type="button"
            data-lang="${l.id}" title="${l.name}" aria-pressed="${l.id === LANG}">${l.label}</button>`).join('')
    + `<button class="lang__cycle" type="button" data-lang="${next.id}"
               title="${next.name}" aria-label="${next.name}">${current.label}</button>`;
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
    <button class="rail__link" type="button" data-nav="account">
      ${icon('user')}
      <span>${t('nav.account')}</span>
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
    <div class="partner-card" style="--brand-color:${p.color}" ${clone ? 'aria-hidden="true"' : ''}>
      <div class="partner-card__logo" style="background:${p.bg}">
        <span class="partner-card__icon">${p.icon}</span>
      </div>
      <div class="partner-card__info">
        <span class="partner-card__name">${p.name}</span>
        <span class="partner-card__type">${p.type}</span>
      </div>
    </div>`;

  const track = $('#partners-track');
  if (track) {
    track.innerHTML =
      PARTNERS.map(p => chip(p, false)).join('') +
      PARTNERS.map(p => chip(p, true)).join('');
  }
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
    $('#cabinet').hidden = true;
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
  $('#cabinet').hidden = true;
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
        <span class="suggest__brand">${p.brand} · ${priceLabel(p)}</span>
      </span>
    </button>`).join('');
  box.hidden = false;
}

/* --------------------------------------------------------------------------
   Отслеживание цен и Сравнение
   -------------------------------------------------------------------------- */

function toggleFav(id) {
  // Отслеживание цены без аккаунта бессмысленно — некуда слать уведомление
  if (!currentUser) { openAuthModal('register'); return; }

  const on = state.favorites.has(id);
  on ? state.favorites.delete(id) : state.favorites.add(id);
  persist();

  // Сервер — источник правды; локальное состояние обновляем сразу, чтобы
  // интерфейс не ждал сеть
  (on ? api(`/api/tracked/${id}`, { method: 'DELETE' })
      : api('/api/tracked', { method: 'POST', body: { product_id: id } })
  ).catch(err => console.error('Не удалось сохранить отслеживание:', err));

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

  if (currentUser) {
    api('/api/compare', { method: 'PUT', body: [...state.compare] })
      .catch(err => console.error('Не удалось сохранить сравнение:', err));
  }

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

/* --------------------------------------------------------------------------
   Фокус в диалогах

   Открытое окно должно забирать фокус, удерживать его по Tab и возвращать
   на кнопку, которая его вызвала. Фон помечаем inert, чтобы скринридер
   не читал страницу за окном.
   -------------------------------------------------------------------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function focusablesIn(root) {
  return $$(FOCUSABLE, root).filter(el => el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function trapFocus(e, dialog) {
  if (e.key !== 'Tab') return;
  const items = focusablesIn(dialog);
  if (!items.length) return;

  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

let activeDialog = null;

function openDialog(dialog) {
  activeDialog = dialog;
  $('.shell')?.setAttribute('inert', '');
  $('.topnav')?.setAttribute('inert', '');
  // ждём кадр: до снятия hidden элементы ещё не имеют размеров
  requestAnimationFrame(() => {
    const first = focusablesIn(dialog)[0];
    (first || dialog).focus?.();
  });
}

function closeDialog() {
  activeDialog = null;
  $('.shell')?.removeAttribute('inert');
  $('.topnav')?.removeAttribute('inert');
  lastFocused?.focus();
}

/* Страховка: если окно закрылось в обход closeDialog, страница осталась бы
   inert и полностью неработоспособной. Цена ошибки слишком велика, поэтому
   сверяемся с фактическим состоянием окон. */
function syncDialogState() {
  // .map($) передал бы индекс во второй параметр $ (root) — отсюда обёртка
  const open = ['#auth-modal', '#alert-modal', '#compare-modal', '#overlay'].map(sel => $(sel)).find(el => el && !el.hidden)
            || ($('#drawer').classList.contains('is-open') ? $('#drawer') : null);
  if (!open && activeDialog) closeDialog();
  else if (open) activeDialog = open;
}

function openSheet(id) {
  const p = byId(id);
  lastFocused = document.activeElement;
  openProductId = id;

  fillSheet(p);

  const overlay = $('#overlay');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
  openDialog(overlay);

  // Помощник должен советовать по тому товару, который перед глазами
  renderAssistantContext();
  renderAssistantPrompts();

  // Просмотры пишутся и для гостей, как и поисковые запросы: на них держатся
  // «Недавно просмотренные» в кабинете и статистика в админке
  api(`/api/analytics/view/${id}`, { method: 'POST' })
    .catch(() => { /* аналитика не должна ломать карточку */ });
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

  // Цена, выгода и график — часть закрытого блока
  $('#sheet-price').textContent = CATALOG_UNLOCKED ? formatPriceFrom(best.price) : t('gate.pricesHidden');
  $('#sheet-price').classList.toggle('is-hidden-price', !CATALOG_UNLOCKED);

  const savBadge = $('#sheet-savings');
  savBadge.hidden = !CATALOG_UNLOCKED || sav.amount <= 0;
  if (!savBadge.hidden) savBadge.textContent = formatSavings(sav.amount, sav.percent);

  $('#sheet-desc').textContent = t('sheet.desc');

  $('#sheet-chart-box').hidden = !CATALOG_UNLOCKED;
  if (CATALOG_UNLOCKED) renderPriceChart(p);

  // Сортировка предложений
  const sortedOffers = [...p.offers].sort((a, b) => {
    if (a.inStock === b.inStock) return a.price - b.price;
    return a.inStock ? -1 : 1;
  });

  const bestOfferItem = bestOffer(p);

  // Гость: цен нет в данных вообще, поэтому рисуем заглушки по offersCount
  // и накрываем их гейтом. Число строк настоящее — видно, что предложений много.
  $('#offers-gate').hidden = CATALOG_UNLOCKED;
  $('#sheet-offers').classList.toggle('is-locked', !CATALOG_UNLOCKED);

  $('#sheet-offers').innerHTML = !CATALOG_UNLOCKED
    ? Array.from({ length: offersCount(p) || 3 }, () => `
        <div class="offer-row offer-row--skeleton" aria-hidden="true">
          <div class="offer-row__platform"><span class="offer-row__dot"></span><span class="skeleton-bar" style="width:88px"></span></div>
          <div class="offer-row__meta"><span class="skeleton-bar" style="width:64px"></span></div>
          <div class="offer-row__price"><span class="skeleton-bar" style="width:104px"></span></div>
          <div class="offer-row__action"><span class="skeleton-bar" style="width:72px;height:30px"></span></div>
        </div>`).join('')
    : sortedOffers.map(o => {
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

  // Раньше здесь любая недешевеющая цена подписывалась как «минимальная за всё
  // время». Пока история была одинаковой и всегда падающей, это не проявлялось.
  const pct = Math.abs(trend.percent);
  if (trend.isDrop && pct > 0) {
    trendBadge.textContent = `${t('chart.trendDown')} ${pct}%` +
      (trend.isAllTimeLow ? ` · ${t('chart.bestTime')}` : '');
  } else if (!trend.isDrop && pct > 0) {
    trendBadge.textContent = `${t('chart.trendUp')} ${pct}%`;
  } else {
    trendBadge.textContent = trend.isAllTimeLow ? t('chart.allTimeLow') : '';
  }
  trendBadge.classList.toggle('is-up', !trend.isDrop && pct > 0);

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
  closeDialog();

  renderAssistantContext();
  renderAssistantPrompts();
}

/* --------------------------------------------------------------------------
   Модалка входа и регистрации
   -------------------------------------------------------------------------- */

let authMode = 'register';

let authOpener = null;

function openAuthModal(mode = 'register') {
  authMode = mode;
  const modal = $('#auth-modal');
  authOpener = document.activeElement;

  $('#auth-title').textContent = t(mode === 'register' ? 'auth.registerTitle' : 'auth.loginTitle');
  $('#auth-subtitle').textContent = t(mode === 'register' ? 'auth.registerSub' : 'auth.loginSub');
  $('#auth-submit-label').textContent = t(mode === 'register' ? 'auth.register' : 'auth.login');

  const isReg = mode === 'register';
  $('#tab-auth-login')?.classList.toggle('is-active', !isReg);
  $('#tab-auth-register')?.classList.toggle('is-active', isReg);

  $('#auth-switch').innerHTML = isReg
    ? `${t('auth.haveAccount')} <button type="button" class="link-btn" data-auth="login">${t('auth.login')}</button>`
    : `${t('auth.noAccount')} <button type="button" class="link-btn" data-auth="register">${t('auth.register')}</button>`;

  $('#auth-name-row').hidden = !isReg;
  $('#auth-error').hidden = true;
  $('#auth-form').reset();
  $('#auth-password').type = 'password';

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
  openDialog(modal);
}

function closeAuthModal() {
  const modal = $('#auth-modal');
  modal.classList.remove('is-open');
  setTimeout(() => { modal.hidden = true; }, 200);

  // Под входом может лежать открытая карточка товара: тогда фон остаётся
  // заблокированным, а активным диалогом снова становится она
  if (openProductId) {
    activeDialog = $('#overlay');
    document.body.style.overflow = 'hidden';
    authOpener?.focus();
  } else {
    document.body.style.overflow = '';
    lastFocused = authOpener;
    closeDialog();
  }
}

async function submitAuth(e) {
  e.preventDefault();
  const btn = $('#auth-submit');
  const err = $('#auth-error');
  err.hidden = true;
  btn.disabled = true;

  const payload = {
    email: $('#auth-email').value.trim(),
    password: $('#auth-password').value,
    lang: LANG,
    region: state.region,
  };
  if (authMode === 'register') payload.name = $('#auth-name').value.trim();

  try {
    await doAuth(authMode, payload);
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

/* --------------------------------------------------------------------------
   Модалка подписки на цену
   -------------------------------------------------------------------------- */

function openAlertModal(productId) {
  // Без аккаунта подписку принять некуда — сначала регистрация
  if (!currentUser) { openAuthModal('register'); return; }

  const p = byId(productId);
  const best = bestOffer(p);
  $('#alert-target-price').value = Math.round(best.price * 0.9);
  const modal = $('#alert-modal');
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  // подписка открывается поверх карточки товара — запоминаем, куда вернуть фокус
  alertOpener = document.activeElement;
  activeDialog = modal;
  requestAnimationFrame(() => focusablesIn(modal)[0]?.focus());
}

let alertOpener = null;

function closeAlertModal() {
  const modal = $('#alert-modal');
  modal.classList.remove('is-open');
  setTimeout(() => { modal.hidden = true; }, 200);
  // возвращаемся в карточку товара, если она ещё открыта
  activeDialog = openProductId ? $('#overlay') : null;
  alertOpener?.focus();
}

/* --------------------------------------------------------------------------
   Сравнение
   -------------------------------------------------------------------------- */

function openCompareDrawer() {
  renderCompareDrawer();
  lastFocused = document.activeElement;
  $('#drawer').classList.add('is-open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('is-open');
  document.body.style.overflow = 'hidden';
  openDialog($('#drawer'));
}

function closeCompareDrawer(keepFocus) {
  $('#drawer').classList.remove('is-open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#scrim').classList.remove('is-open');
  document.body.style.overflow = '';
  // при переходе в таблицу сравнения фокус отдаём ей, а не возвращаем назад
  if (!keepFocus) closeDialog();
}

function openCompareModal() {
  const opener = document.activeElement;
  closeCompareDrawer(true);
  renderCompareTable();
  lastFocused = opener;
  const modal = $('#compare-modal');
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
  openDialog(modal);
}

function closeCompareModal() {
  const modal = $('#compare-modal');
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => { modal.hidden = true; }, 200);
  closeDialog();
}

function renderCompareTable() {
  const container = $('#compare-table-container');
  const ids = [...state.compare];

  if (!ids.length) {
    container.innerHTML = `<p class="empty">${t('compare.empty')}</p>`;
    return;
  }

  const products = ids.map(byId).filter(Boolean);
  if (!products.length) {
    container.innerHTML = `<p class="empty">${t('compare.empty')}</p>`;
    return;
  }
  const bundle = totalBundleSavings(ids);

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>${t('compare.param.category')}</th>
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
   ArzonOL AI: katalogdagi faktlar asosida xarid maslahati
   -------------------------------------------------------------------------- */

const AI_COPY = {
  uz: {
    title: 'ArzonOL AI', status: 'Xarid maslahatchisi', typing: 'yozmoqda…', placeholder: 'Masalan: Samsung qayerda arzon?',
    hint: 'Sizga nima yordam kerak?',
    hello: 'Salom! Men ArzonOL maslahatchisiman. Qaysi tovarni tanlamoqchisiz — narxlarni solishtirib, eng arzonini topaman.',
    contextHint: 'Shu tovar bo‘yicha savol bering',
    prompts: [
      { label: 'Eng tejamkor', text: 'Katalogdagi eng tejamkor tovarni tavsiya qil' },
      { label: 'Ko‘p sharhli', text: 'Eng ko‘p sharh yig‘gan tovar qaysi?' },
      { label: 'Taqqoslash', text: 'Marketpleyslarni narx bo‘yicha solishtir' },
      { label: 'Yetkazish', text: 'Qaysi marketpleys tezroq yetkazadi?' },
    ],
    productPrompts: [
      { label: 'Olsam bo‘ladimi?', text: 'Shu tovarni olsam bo‘ladimi? Maslahat ber' },
      { label: 'Qayerda arzon?', text: 'Shu tovar qaysi marketpleysda arzonroq?' },
      { label: 'Sharhlar', text: 'Shu tovarning reytingi va sharhlari qanday?' },
    ],
    scope: 'Men faqat ArzonOL katalogi, narxlar, marketpleyslar va xarid tanlovi bo‘yicha yordam bera olaman.',
    signIn: 'Aniq narxlar va marketpleyslar taqqoslanishi uchun avval tizimga kiring.',
    askProduct: 'Mahsulot nomini yozing. Masalan: “Samsung qayerda arzon?”',
    compare: 'Tovar nomini yozing — eng arzon taklif, tejaladigan summa, mavjudlik va yetkazishni solishtiraman.',
    noBonus: 'Hozir katalogda bonuslar haqida ma’lumot yo‘q. Men narx, mavjudlik, yetkazish va sharhlar bo‘yicha maslahat bera olaman.',
    offline: 'AI serveri javob bermadi — katalog ma’lumotlari asosida javob berdim.',
    rateLimit: 'Juda ko‘p so‘rov yubordingiz. Bir necha daqiqadan so‘ng urinib ko‘ring.',
    reviews: 'Eng ko‘p sharh yig‘gan tovar', best: 'eng arzon taklif', save: 'tejam', delivery: 'yetkazish', days: 'kun', reviewsLabel: 'sharh', allTime: 'Bu mahsulotdagi hozirgi eng past narx.',
  },
  ru: {
    title: 'ArzonOL AI', status: 'Помощник покупателя', typing: 'печатает…', placeholder: 'Например: Где дешевле Samsung?',
    hint: 'Чем помочь с выбором?',
    hello: 'Здравствуйте! Я помощник ArzonOL. Скажите, что ищете — сравню цены и найду самое выгодное предложение.',
    contextHint: 'Спросите об этом товаре',
    prompts: [
      { label: 'Максимальная выгода', text: 'Посоветуй товар с максимальной выгодой' },
      { label: 'Больше отзывов', text: 'У какого товара больше всего отзывов?' },
      { label: 'Сравнить', text: 'Сравни маркетплейсы по ценам' },
      { label: 'Доставка', text: 'Какой маркетплейс доставляет быстрее?' },
    ],
    productPrompts: [
      { label: 'Стоит брать?', text: 'Стоит ли брать этот товар? Посоветуй' },
      { label: 'Где дешевле?', text: 'На каком маркетплейсе этот товар дешевле?' },
      { label: 'Отзывы', text: 'Какой рейтинг и отзывы у этого товара?' },
    ],
    scope: 'Я отвечаю только о каталоге ArzonOL, ценах, маркетплейсах и выборе товара.',
    signIn: 'Войдите в аккаунт, чтобы увидеть точные цены и сравнение маркетплейсов.',
    askProduct: 'Напишите название товара. Например: «Где дешевле Samsung?»',
    compare: 'Напишите товар — сравню лучшую цену, экономию, наличие и доставку.',
    noBonus: 'В каталоге пока нет данных о бонусах. Я могу подсказать по цене, наличию, доставке и отзывам.',
    offline: 'AI-сервер не ответил — отвечаю по данным каталога.',
    rateLimit: 'Слишком много запросов. Попробуйте через несколько минут.',
    reviews: 'Больше всего отзывов у товара', best: 'лучшее предложение', save: 'экономия', delivery: 'доставка', days: 'дн.', reviewsLabel: 'отзывов', allTime: 'Это минимальная текущая цена для товара.',
  },
  en: {
    title: 'ArzonOL AI', status: 'Shopping advisor', typing: 'typing…', placeholder: 'For example: Where is Samsung cheaper?',
    hint: 'Need help choosing?',
    hello: 'Hi! I am the ArzonOL advisor. Tell me what you are looking for and I will compare prices to find the best deal.',
    contextHint: 'Ask about this product',
    prompts: [
      { label: 'Best savings', text: 'Recommend the product with the biggest savings' },
      { label: 'Most reviewed', text: 'Which product has the most reviews?' },
      { label: 'Compare', text: 'Compare the marketplaces by price' },
      { label: 'Delivery', text: 'Which marketplace delivers faster?' },
    ],
    productPrompts: [
      { label: 'Worth buying?', text: 'Is this product worth buying? Advise me' },
      { label: 'Where cheaper?', text: 'Which marketplace sells this product cheaper?' },
      { label: 'Reviews', text: 'What are the rating and reviews of this product?' },
    ],
    scope: 'I can only answer about the ArzonOL catalog, prices, marketplaces, and choosing products.',
    signIn: 'Please sign in to see exact prices and marketplace comparisons.',
    askProduct: 'Type a product name, for example: “Where is Samsung cheaper?”',
    compare: 'Name a product and I will compare the best price, savings, stock, and delivery.',
    noBonus: 'The catalog does not include bonus data yet. I can advise on price, availability, delivery, and reviews.',
    offline: 'The AI server did not respond — answering from catalog data.',
    rateLimit: 'Too many requests. Please try again in a few minutes.',
    reviews: 'The product with the most reviews is', best: 'best offer', save: 'savings', delivery: 'delivery', days: 'days', reviewsLabel: 'reviews', allTime: 'This is the product’s current lowest price.',
  }
};

const aiText = key => AI_COPY[LANG]?.[key] ?? AI_COPY.uz[key];
const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

function assistantProduct(query) {
  const normalized = query.toLocaleLowerCase();
  const match = PRODUCTS.map(product => {
    const terms = `${product.brand} ${Object.values(product.title || {}).join(' ')}`
      .toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(term => term.length > 2);
    return { product, score: terms.reduce((total, term) => total + (normalized.includes(term) ? term.length : 0), 0) };
  }).sort((left, right) => right.score - left.score)[0];
  return match?.score ? match.product : null;
}

function assistantMessage(text, type = 'bot') {
  const box = $('#ai-assistant-messages');
  if (!box) return;
  box.insertAdjacentHTML('beforeend', `<div class="ai-message ai-message--${type}">${escapeHTML(text)}</div>`);
  box.scrollTop = box.scrollHeight;
}

function assistantProductAdvice(product) {
  if (!product) return aiText('askProduct');
  if (!product.offers?.length) {
    return `${product.brand} ${tr(product.title)}: ${product.rating.toFixed(1)} / 5, ${product.reviews.toLocaleString('ru-RU')} ${aiText('reviewsLabel')}. ${aiText('signIn')}`;
  }

  const best = bestOffer(product);
  const gain = savings(product);
  const platform = platformOf(best.platform);
  const trend = priceTrend(product);
  const parts = [
    `${product.brand} ${tr(product.title)}: ${aiText('best')} — ${platform.name}, ${money(best.price)}.`,
    gain.amount ? `${aiText('save')}: ${money(gain.amount)} (${gain.percent}%).` : '',
    `${aiText('delivery')}: ${calcDeliveryDays(best, state.region)} ${aiText('days')}; ${product.reviews.toLocaleString('ru-RU')} ${aiText('reviewsLabel')}.`,
    trend.isAllTimeLow ? aiText('allTime') : '',
  ];
  return parts.filter(Boolean).join(' ');
}

function assistantReply(question) {
  const query = question.trim();
  const normalized = query.toLocaleLowerCase();
  const product = assistantProduct(query);
  const inScope = /arzonol|narx|arzon|qimmat|tovar|mahsulot|market|marketpleys|uzum|olcha|texnomart|mediapark|asaxiy|idea|elmakon|zood|yetkaz|bonus|chegirma|sharh|komment|review|rating|taqqos|mebel|texnika|qurilish/i.test(query) || Boolean(product);

  if (!inScope) return aiText('scope');
  if (/bonus|cashback|keshbek/i.test(query)) return aiText('noBonus');
  if (/marketpleys|taqqos|solishtir|compare/i.test(query) && !product) return aiText('compare');

  if (/sharh|komment|review|rating/i.test(query) && !product) {
    const top = [...PRODUCTS].sort((left, right) => right.reviews - left.reviews)[0];
    return `${aiText('reviews')} ${top.brand} ${tr(top.title)} — ${top.reviews.toLocaleString('ru-RU')} ${aiText('reviewsLabel')}.`;
  }

  if (/tejam|savings|эконом|save/i.test(query) && !product) {
    const top = [...PRODUCTS].filter(item => item.offers?.length).sort((left, right) => savings(right).amount - savings(left).amount)[0];
    return top ? assistantProductAdvice(top) : aiText('signIn');
  }

  return assistantProductAdvice(product);
}

/* Диалог с моделью.

   Ключ OpenRouter лежит на сервере, поэтому запрос идёт через /api/ai/chat.
   Если сервер недоступен или ключ не настроен — отвечаем локальным движком
   выше: он считает по тем же данным каталога, только без свободной речи. */

const aiState = { history: [], busy: false };

function assistantTyping(on) {
  const box = $('#ai-assistant-messages');
  $('#ai-typing')?.remove();
  if (on) {
    box.insertAdjacentHTML('beforeend', '<div class="ai-typing" id="ai-typing"><span></span><span></span><span></span></div>');
    box.scrollTop = box.scrollHeight;
  }
  $('#ai-assistant-status').textContent = on ? aiText('typing') : aiText('status');
  $('.ai-assistant__send').toggleAttribute('disabled', on);
}

/* Карточка открытого товара: показывает, о чём именно идёт речь */
function renderAssistantContext() {
  const box = $('#ai-assistant-context');
  const product = openProductId ? byId(openProductId) : null;
  if (!product) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.hidden = false;
  box.innerHTML = `
    <img src="${product.image}" alt="">
    <div class="ai-context__text">
      <strong>${escapeHTML(`${product.brand} ${tr(product.title)}`)}</strong>
      <span>${escapeHTML(aiText('contextHint'))}</span>
    </div>`;
}

function renderAssistantPrompts() {
  const list = openProductId ? aiText('productPrompts') : aiText('prompts');
  $('#ai-assistant-prompts').innerHTML = list
    .map(item => `<button type="button" data-ai-prompt="${escapeHTML(item.text)}">${escapeHTML(item.label)}</button>`)
    .join('');
}

function openAssistant() {
  const panel = $('#ai-assistant');
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  $('#ai-assistant-toggle').setAttribute('aria-expanded', 'true');
  $('#ai-assistant-toggle').classList.remove('is-hinting');

  renderAssistantContext();
  renderAssistantPrompts();

  if (!$('#ai-assistant-messages').children.length) {
    assistantMessage(aiText('hello'));
    // Карточка товара открыта — совет по нему нужен сразу, без вопроса
    if (openProductId) assistantMessage(assistantProductAdvice(byId(openProductId)));
  }
  $('#ai-assistant-input').focus();
}

function closeAssistant() {
  $('#ai-assistant').classList.remove('is-open');
  $('#ai-assistant').setAttribute('aria-hidden', 'true');
  $('#ai-assistant-toggle').setAttribute('aria-expanded', 'false');
}

function resetAssistant() {
  aiState.history = [];
  $('#ai-assistant-messages').innerHTML = '';
  assistantMessage(aiText('hello'));
  renderAssistantPrompts();
}

async function submitAssistant(question) {
  const value = question.trim();
  if (!value || aiState.busy) return;

  assistantMessage(value, 'user');
  aiState.busy = true;
  assistantTyping(true);

  let reply;
  let note = '';
  try {
    const data = await api('/api/ai/chat', {
      method: 'POST',
      body: {
        message: value.slice(0, 500),
        lang: LANG,
        product_id: openProductId,
        history: aiState.history.slice(-8),
      },
    });
    reply = data.reply;
  } catch (err) {
    console.warn('AI backend недоступен, отвечаем локально:', err.message);
    reply = assistantReply(value);
    note = err.status === 429 ? aiText('rateLimit') : aiText('offline');
  }

  assistantTyping(false);
  aiState.busy = false;
  assistantMessage(reply);
  if (note) assistantMessage(note, 'error');

  aiState.history.push({ role: 'user', content: value }, { role: 'assistant', content: reply });
  aiState.history = aiState.history.slice(-10);
}

function renderAssistantUI() {
  $('#ai-assistant-title').textContent = aiText('title');
  $('#ai-assistant-status').textContent = aiText('status');
  $('#ai-assistant-input').placeholder = aiText('placeholder');
  $('#ai-fab-hint').textContent = aiText('hint');
  renderAssistantPrompts();
}

/* Подсказка у кнопки — один раз за браузер: иначе она превращается в баннер */
function primeAssistantHint() {
  if (store.read('arzonol:ai-hinted', false)) return;
  store.write('arzonol:ai-hinted', true);
  setTimeout(() => {
    const fab = $('#ai-assistant-toggle');
    fab.classList.add('is-hinting');
    setTimeout(() => fab.classList.remove('is-hinting'), 6000);
  }, 2500);
}

/* --------------------------------------------------------------------------
   Смена языка / региона
   -------------------------------------------------------------------------- */

function switchLang(lang) {
  if (lang === LANG) return;
  setLang(lang);

  applyStaticI18n();
  renderAuthUI();          // кнопки «Войти» / «Регистрация» тоже переводятся
  renderLangSwitch();
  renderRegionSelector();
  renderPlatformFilterChips();
  renderNav();
  renderHero();
  renderCategories();
  renderSections();
  renderPartners();
  renderCompareDrawer();
  renderAssistantUI();

  // Открытая модалка входа сохраняет режим, но меняет язык подписей
  if (!$('#auth-modal').hidden) openAuthModal(authMode);
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

/* --------------------------------------------------------------------------
   Личный кабинет: отслеживаемые товары с назначенными порогами цен
   -------------------------------------------------------------------------- */

async function showCabinet() {
  if (!currentUser) { openAuthModal('login'); return; }

  let tracked = [];
  try {
    ({ tracked } = await api('/api/tracked'));
  } catch (err) {
    toast(err.message);
    return;
  }

  const rows = tracked.map(r => {
    const p = byId(r.product_id);
    if (!p) return null;
    const current = bestOffer(p).price;
    const target = r.target_price;
    // Насколько цена ещё должна упасть, чтобы дойти до названной
    const gap = target ? current - target : null;
    return { p, current, target, gap, reached: target !== null && gap <= 0 };
  }).filter(Boolean).sort((a, b) => (a.gap ?? Infinity) - (b.gap ?? Infinity));

  const initial = (currentUser.name || currentUser.email)[0].toUpperCase();
  const avatar = $('#cabinet-avatar');
  if (avatar) avatar.textContent = initial;
  $('#cabinet-name').textContent = currentUser.name || currentUser.email.split('@')[0];
  $('#cabinet-email').textContent = currentUser.email;
  $('#cabinet-count').textContent = String(rows.length);
  $('#cabinet-reached').textContent = String(rows.filter(r => r.reached).length);

  $('#cabinet-list').innerHTML = rows.length ? rows.map(r => `
    <div class="cab-row${r.reached ? ' is-reached' : ''}">
      <button class="cab-row__open" type="button" data-open="${r.p.id}">
        <img src="${r.p.thumbs[0] || r.p.image}" alt="" loading="lazy">
        <span class="cab-row__main">
          <span class="cab-row__name">${r.p.brand} — ${tr(r.p.title)}</span>
          <span class="cab-row__meta">${t('cabinet.now')} ${money(r.current)}</span>
        </span>
      </button>
      <span class="cab-row__target">
        ${r.target
          ? `<span class="cab-row__goal">${t('cabinet.goal')} ${money(r.target)}</span>
             <span class="cab-row__gap${r.reached ? ' is-ok' : ''}">${
               r.reached ? t('cabinet.reached') : `${t('cabinet.left')} ${money(r.gap)}`}</span>`
          : `<span class="cab-row__gap">${t('cabinet.noGoal')}</span>`}
      </span>
      <button class="cab-row__del" type="button" data-untrack="${r.p.id}" aria-label="${t('compare.remove')}">
        <svg><use href="#i-trash"/></svg>
      </button>
    </div>`).join('') : `<p class="empty">${t('cabinet.empty')}</p>`;

  // Админ-панель показывается только тому, у кого есть права
  $('#cabinet-admin').hidden = !currentUser.isAdmin;

  fillProfileForm();
  loadActivity();

  // Прячем все остальные блоки главной страницы
  const hero = $('.hero');
  if (hero) hero.hidden = true;
  const controls = $('#controls-bar');
  if (controls) controls.hidden = true;
  $('#results').hidden = true;
  $('#sections').hidden = true;
  $('#cats').hidden = true;
  const partners = $('.partners');
  if (partners) partners.hidden = true;

  $('#cabinet').hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function switchCabTab(tab) {
  $$('.cab-tab').forEach(b => b.classList.toggle('is-active', b.dataset.tab === tab));
  ['tracked', 'activity', 'settings'].forEach(name => {
    $(`#pane-${name}`).hidden = name !== tab;
  });
}

function fillProfileForm() {
  $('#prof-name').value = currentUser.name || '';
  $('#prof-region').innerHTML = REGIONS.map(r =>
    `<option value="${r.id}"${r.id === currentUser.region ? ' selected' : ''}>${tr(r.name)}</option>`).join('');
  $('#profile-msg').hidden = true;
  $('#password-msg').hidden = true;
}

async function loadActivity() {
  let data;
  try { data = await api('/api/profile/activity'); } catch { return; }

  $('#cabinet-viewed').innerHTML = data.viewed.length
    ? data.viewed.map(v => `
        <button class="cab-mini" type="button" data-open="${v.id}">
          <img src="${v.image}" alt="" loading="lazy">
          <span class="cab-mini__text">
            <span class="cab-mini__name">${v.brand} — ${v.title}</span>
            <span class="cab-mini__date">${v.at.slice(0, 10)}</span>
          </span>
        </button>`).join('')
    : `<p class="cab-msg">${t('cabinet.noActivity')}</p>`;

  $('#cabinet-searches').innerHTML = data.searches.length
    ? data.searches.map(sq => `
        <button class="cab-query" type="button" data-requery="${sq.query}">
          <span>${sq.query}</span><span class="cab-mini__date">${sq.at.slice(0, 10)}</span>
        </button>`).join('')
    : `<p class="cab-msg">${t('cabinet.noActivity')}</p>`;
}

async function saveProfile(e) {
  e.preventDefault();
  const msg = $('#profile-msg');
  try {
    const { user } = await api('/api/profile', {
      method: 'PUT',
      body: { name: $('#prof-name').value.trim(), region: $('#prof-region').value, lang: LANG },
    });
    currentUser = user;
    state.region = user.region;
    persist();
    renderAuthUI();
    renderRegionSelector();
    $('#cabinet-name').textContent = user.name || user.email;
    msg.textContent = t('cabinet.saved');
    msg.className = 'cab-msg is-ok';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'cab-msg is-error';
  }
  msg.hidden = false;
}

async function changePassword(e) {
  e.preventDefault();
  const msg = $('#password-msg');
  try {
    await api('/api/profile/password', {
      method: 'POST',
      body: { current_password: $('#pw-current').value, new_password: $('#pw-new').value },
    });
    $('#password-form').reset();
    msg.textContent = t('cabinet.passwordChanged');
    msg.className = 'cab-msg is-ok';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'cab-msg is-error';
  }
  msg.hidden = false;
}

async function untrack(id) {
  try {
    await api(`/api/tracked/${id}`, { method: 'DELETE' });
    state.favorites.delete(id);
    persist();
    syncBadges();
    renderSections();
    showCabinet();
    checkNotifications();
  } catch (err) {
    toast(err.message);
  }
}

function goHome() {
  state.filter = null;
  state.query = '';
  clearSearchInputs();
  syncCatState();

  const hero = $('.hero');
  if (hero) hero.hidden = false;
  const controls = $('#controls-bar');
  if (controls) controls.hidden = false;
  const partners = $('.partners');
  if (partners) partners.hidden = false;
  $('#cabinet').hidden = true;

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

    // Аналитика спроса пишется и для гостей — регистрация для неё не нужна
    if (state.query) {
      api('/api/analytics/search', {
        method: 'POST',
        body: { query: state.query, results: search(state.query).length, lang: LANG },
      }).catch(() => { /* аналитика не должна ломать поиск */ });
    }
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
    const assistantToggle = e.target.closest('#ai-assistant-toggle');
    if (assistantToggle) {
      $('#ai-assistant').classList.contains('is-open') ? closeAssistant() : openAssistant();
      return;
    }
    if (e.target.closest('#ai-assistant-close')) { closeAssistant(); return; }
    if (e.target.closest('#ai-assistant-reset')) { resetAssistant(); return; }

    const assistantPrompt = e.target.closest('[data-ai-prompt]');
    if (assistantPrompt) {
      openAssistant();
      submitAssistant(assistantPrompt.dataset.aiPrompt);
      return;
    }

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

    // showCabinet сам откроет окно входа, если пользователь не авторизован
    if (e.target.closest('[data-nav="account"]')) {
      showCabinet();
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
    if (e.target.closest('[data-close-notif]')) { $('#notifications').hidden = true; return; }

    if (e.target.closest('#user-menu-btn')) { showCabinet(); return; }

    const tab = e.target.closest('[data-tab]');
    if (tab) { switchCabTab(tab.dataset.tab); return; }

    const rq = e.target.closest('[data-requery]');
    if (rq) {
      syncSearchInputs(rq.dataset.requery);
      state.query = rq.dataset.requery;
      applyView();
      return;
    }

    const un = e.target.closest('[data-untrack]');
    if (un) { untrack(un.dataset.untrack); return; }

    const authBtn = e.target.closest('[data-auth]');
    if (authBtn) { openAuthModal(authBtn.dataset.auth); return; }

    if (e.target.closest('#toggle-auth-pw')) {
      const pwInput = $('#auth-password');
      pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
      return;
    }

    if (e.target.closest('[data-close-auth]') || e.target.id === 'auth-modal') { closeAuthModal(); return; }
    if (e.target.closest('#logout-btn') || e.target.closest('#cab-logout-btn')) {
      logout();
      goHome();
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
  // Подписка на снижение цены: пишем цель в БД, а не показываем тост в пустоту
  $('#alert-form').addEventListener('submit', async e => {
    e.preventDefault();
    const productId = $('#sheet-alert-btn').dataset.id;
    const target = parseInt($('#alert-target-price').value, 10);

    try {
      await api('/api/tracked', {
        method: 'POST',
        body: {
          product_id: productId,
          target_price: Number.isFinite(target) ? target : null,
          contact: $('#alert-contact').value.trim(),
        },
      });
      state.favorites.add(productId);
      persist();
      syncBadges();
      renderSections();
      closeAlertModal();
      toast(t('alert.success'));
      checkNotifications();
    } catch (err) {
      toast(err.message);
    }
  });

  $('#sheet-compare').addEventListener('click', e => {
    toggleCompare(e.currentTarget.dataset.id);
  });

  $('#sheet-fav').addEventListener('click', e => toggleFav(e.currentTarget.dataset.id));
  $('#auth-form').addEventListener('submit', submitAuth);
  $('#profile-form').addEventListener('submit', saveProfile);
  $('#password-form').addEventListener('submit', changePassword);
  $('#open-compare-modal').addEventListener('click', openCompareModal);
  $('#clear-compare').addEventListener('click', clearCompare);
  $('#ai-assistant-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#ai-assistant-input');
    submitAssistant(input.value);
    input.value = '';
  });

  SEARCH_FIELDS.forEach(wireSearch);
  watchHeroSearch();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      // Открытость проверяем по hidden, а не по .is-open: класс навешивается
      // внутри requestAnimationFrame, и завязывать на него закрытие окна значит
      // ставить работоспособность в зависимость от кадра отрисовки.
      if ($('#ai-assistant').classList.contains('is-open')) closeAssistant();
      else if (!$('#auth-modal').hidden) closeAuthModal();
      else if (!$('#alert-modal').hidden) closeAlertModal();
      else if (!$('#compare-modal').hidden) closeCompareModal();
      else if (!$('#overlay').hidden) closeSheet();
      else if ($('#drawer').classList.contains('is-open')) closeCompareDrawer();
      else hideSuggests();
    }
    // Tab не должен выводить из открытого окна
    syncDialogState();
    if (activeDialog) { trapFocus(e, activeDialog); return; }

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

/* Полная перерисовка: используется при старте, смене языка и входе/выходе */
function renderAll() {
  applyStaticI18n();
  renderAuthUI();
  renderLangSwitch();
  renderRegionSelector();
  renderPlatformFilterChips();
  renderNav();
  renderHero();
  renderCategories();
  renderSections();
  renderPartners();
  renderCompareDrawer();
  renderAssistantUI();
  syncBadges();
  $('#sort-select').value = state.sort;

  // Блок результатов скрыт, но не пуст: после выхода в нём остались бы цены,
  // отрисованные для авторизованного. Обновляем, если открыт, иначе чистим.
  const results = $('#results');
  if (!results.hidden) applyView();
  else $('#results-grid').innerHTML = '';
}

async function boot() {
  document.documentElement.lang = t('html.lang');
  applyTheme(state.theme);

  try {
    await restoreSession();
    await loadCatalog();
    await pullUserData();
  } catch (err) {
    // Без каталога показывать нечего — говорим прямо, а не оставляем пустой экран
    $('#boot-error').hidden = false;
    $('#boot-error-detail').textContent = String(err.message || err);
    console.error('Не удалось загрузить каталог:', err);
    return;
  }

  renderAll();
  wireEvents();
  checkNotifications();
  primeAssistantHint();

  if (!store.read('arzonol:cookies', null)) {
    setTimeout(() => { $('#cookie').hidden = false; }, 900);
  }
}

boot();
