
/* --------------------------------------------------------------------------
   ArzonOL Admin - Multilingual i18n Engine (UZ / RU / EN)
   -------------------------------------------------------------------------- */

const ADMIN_I18N = {
  uz: {
    "demo.notice": "Demo panel: do‘konlar ulanmagan. Ishga tushirish narxlarni yangilamaydi. Haqiqiy API kalitlarni kiritmang.",
    'title': 'Boshqaruv paneli',
    'nav.back': '← Saytga qaytish',
    'tab.integrations': '🔌 Marketpleyslar integratsiyasi & API',
    'tab.analytics': '📊 Talab va Tahlillar',

    // KPI
    'kpi.platforms': 'Marketpleyslar',
    'kpi.active': 'Faol kanallar',
    'kpi.offers': 'Narx va takliflar',
    'kpi.lastSync': 'Oxirgi Sync',
    'time.never': 'Hech qachon',
    'time.justNow': 'Hozirgina',
    'time.minAgo': 'daq oldin',
    'time.hourAgo': 'soat oldin',
    'time.dayAgo': 'kun oldin',

    // Toolbar
    'section.sources': 'Ulangan narx manbalari',
    'btn.syncAll': 'Barchasini demo ishga tushirish',
    'btn.addPlatform': '➕ Marketpleys qo‘shish',
    'section.logs': 'Sinxronizatsiya jurnali (Live Logs)',
    'btn.refreshLogs': '🔄 Yangilash',

    // Card
    'card.noSite': 'sayt ko‘rsatilmagan',
    'card.prices': 'Katalogdagi narxlar',
    'card.inStock': 'Mavjud',
    'card.channelType': 'Kanal turi:',
    'card.interval': 'Oraliq:',
    'card.lastSync': 'Oxirgi Sync:',
    'card.every': 'har',
    'card.min': 'daq',
    'card.hour': 'soat',
    'card.hours': 'soat',
    'card.day': '1 kunda 1 marta',
    'card.active': 'Faol',
    'card.paused': 'To‘xtatilgan',
    'btn.sync': 'Demo',
    'btn.test': 'Test',

    // Table logs
    'th.time': 'Vaqt',
    'th.platform': 'Marketpleys',
    'th.status': 'Holat',
    'th.updated': 'Yangilandi',
    'th.message': 'Xabar',
    'logs.loading': 'Yuklanmoqda...',
    'logs.empty': 'Loglar mavjud emas',
    'logs.success': 'Muvaffaqiyatli',
    'logs.error': 'Xatolik',
    'logs.pricesUnit': 'ta narx',

    // Analytics
    'an.users': 'Foydalanuvchilar',
    'an.tracked': 'Kuzatilayotgan tovarlar',
    'an.withTarget': 'Kutilgan narx bilan',
    'an.searches': 'Qidiruv so‘rovlari',
    'an.views': 'Tovar ko‘rishlari',
    'an.offers': 'Bazadagi takliflar',
    'an.topQueries': 'Eng ko‘p qidirilgan so‘rovlar',
    'an.topViewed': 'Eng ko‘p ko‘rilgan tovarlar',
    'an.byRegion': 'Foydalanuvchilar hududi',
    'an.wantedTitle': 'Xaridorlar kutayotgan narxlar',
    'an.empty': 'Hozircha bo‘sh',
    'an.now': 'hozir',
    'an.waiting': 'kutilmoqda',
    'an.currency': 'so‘m',
    'an.notice': 'Qidiruv so‘rovlari va ko‘rishlar barcha foydalanuvchilar (mehmonlar ham) uchun yoziladi: talab tahlili akkaunt talab qilmaydi.',

    // Modals
    'modal.settingsTitle': 'Marketpleysni sozlash',
    'modal.integrationType': 'Integratsiya turi',
    'modal.apiKey': 'API Kaliti / Bearer Token',
    'modal.apiKeyHint': 'Marketpleys APIsi uchun maxfiy avtorizatsiya kaliti',
    'modal.feedUrl': 'Endpoint URL / Feed URL',
    'modal.feedUrlHint': 'XML/YML/JSON tovarlar katalogi yoki API endpoint havolasi',
    'modal.interval': 'Avtomatik yangilanish oralig‘i',
    'modal.status': 'Kanal holati',
    'modal.activeOpt': '🟢 Faol (Avto-sinxronizatsiyaga ulangan)',
    'modal.pausedOpt': '🟡 To‘xtatilgan (Pauza)',
    'modal.btnTest': '🧪 Aloqani tekshirish',
    'modal.btnSave': '💾 Saqlash',

    // Add Modal
    'modal.addTitle': '➕ Yangi marketpleys / do‘kon qo‘shish',
    'modal.nameLabel': 'Do‘kon / Maydon nomi',
    'modal.namePlaceholder': 'Masalan: Sello Market',
    'modal.idLabel': 'Noyob ID (lotincha)',
    'modal.idPlaceholder': 'sello',
    'modal.idHint': 'Kichik lotin harflari va raqamlar, probellarsiz',
    'modal.colorLabel': 'Brend rangi (HEX)',
    'modal.siteLabel': 'Do‘kon veb-sayti',
    'modal.feedLabel': 'Feed URL / API Endpoint',
    'modal.btnAddSubmit': '➕ Maydonni ulash',

    // Notifications & Errors
    'toast.syncAllStart': 'Barcha faol manbalarni sinxronlash boshlandi...',
    'toast.syncSuccess': 'muvaffaqiyatli sinxronlandi!',
    'toast.saved': 'Sozlamalar muvaffaqiyatli saqlandi!',
    'toast.added': 'Yangi marketpleys qo‘shildi!',
    'test.testing': '⏳ Aloqa tekshirilmoqda...',
    'test.success': 'Demo tekshiruv yakunlandi.',
    'test.error': 'Ulanishda xatolik:',
    'auth.noAccess': 'Kirish cheklangan',
    'auth.noAccessDesc': 'Iltimos, administrator akkauntida (masalan, demo@arzonol.uz) kiring va qaytib keling.'
  },
  ru: {
    "demo.notice": "Демо-панель: магазины не подключены. Запуски не обновляют цены. Не вводите настоящие API-ключи.",
    'title': 'Панель управления',
    'nav.back': '← на витрину',
    'tab.integrations': '🔌 Интеграции и API маркетплейсов',
    'tab.analytics': '📊 Спрос и Аналитика',

    'kpi.platforms': 'Маркетплейсов',
    'kpi.active': 'Активных каналов',
    'kpi.offers': 'Цен и предложений',
    'kpi.lastSync': 'Последний Sync',
    'time.never': 'Никогда',
    'time.justNow': 'Только что',
    'time.minAgo': 'мин назад',
    'time.hourAgo': 'ч назад',
    'time.dayAgo': 'дн назад',

    'section.sources': 'Подключенные источники цен',
    'btn.syncAll': 'Демо-запуск всех',
    'btn.addPlatform': '➕ Добавить маркетплейс',
    'section.logs': 'Журнал синхронизаций (Live Logs)',
    'btn.refreshLogs': '🔄 Обновить журнал',

    'card.noSite': 'нет сайта',
    'card.prices': 'Цен в каталоге',
    'card.inStock': 'В наличии',
    'card.channelType': 'Тип канала:',
    'card.interval': 'Интервал:',
    'card.lastSync': 'Последний Sync:',
    'card.every': 'каждые',
    'card.min': 'мин',
    'card.hour': 'час',
    'card.hours': 'часов',
    'card.day': 'Раз в сутки',
    'card.active': 'Активен',
    'card.paused': 'Пауза',
    'btn.sync': 'Demo',
    'btn.test': 'Тест',

    'th.time': 'Время',
    'th.platform': 'Маркетплейс',
    'th.status': 'Статус',
    'th.updated': 'Обновлено',
    'th.message': 'Сообщение',
    'logs.loading': 'Загрузка...',
    'logs.empty': 'Журнал пока пуст',
    'logs.success': 'Успешно',
    'logs.error': 'Ошибка',
    'logs.pricesUnit': 'цен',

    'an.users': 'Пользователей',
    'an.tracked': 'Отслеживаний цены',
    'an.withTarget': 'С названной ценой',
    'an.searches': 'Поисковых запросов',
    'an.views': 'Просмотров товаров',
    'an.offers': 'Предложений в базе',
    'an.topQueries': 'Что ищут чаще всего',
    'an.topViewed': 'Самые просматриваемые товары',
    'an.byRegion': 'Пользователи по регионам',
    'an.wantedTitle': 'За какую цену готовы купить',
    'an.empty': 'Пока пусто',
    'an.now': 'сейчас',
    'an.waiting': 'ждут',
    'an.currency': 'сум',
    'an.notice': 'Поисковые запросы и просмотры пишутся и для незарегистрированных пользователей: аналитика спроса не требует аккаунта.',

    'modal.settingsTitle': 'Настройка маркетплейса',
    'modal.integrationType': 'Тип интеграции',
    'modal.apiKey': 'API Ключ / Bearer Token',
    'modal.apiKeyHint': 'Секретный ключ авторизации для API маркетплейса',
    'modal.feedUrl': 'Endpoint URL / Feed URL',
    'modal.feedUrlHint': 'Ссылка на XML/YML/JSON фид каталога или API endpoint',
    'modal.interval': 'Интервал обновления (демо-настройка)',
    'modal.status': 'Статус канала',
    'modal.activeOpt': '🟢 Активен в демо-режиме',
    'modal.pausedOpt': '🟡 Приостановлен (Пауза)',
    'modal.btnTest': '🧪 Проверить связь',
    'modal.btnSave': '💾 Сохранить',

    'modal.addTitle': '➕ Добавить новый маркетплейс / магазин',
    'modal.nameLabel': 'Название площадки',
    'modal.namePlaceholder': 'Например: Sello Market',
    'modal.idLabel': 'Уникальный ID (латиницей)',
    'modal.idPlaceholder': 'sello',
    'modal.idHint': 'Только строчные латинские буквы и цифры без пробелов',
    'modal.colorLabel': 'Фирменный цвет (HEX)',
    'modal.siteLabel': 'Веб-сайт магазина',
    'modal.feedLabel': 'URL фида / API Endpoint',
    'modal.btnAddSubmit': '➕ Подключить площадку',

    'toast.syncAllStart': 'Запуск синхронизации всех активных площадок...',
    'toast.syncSuccess': 'успешно синхронизирован!',
    'toast.saved': 'Настройки успешно сохранены!',
    'toast.added': 'Маркетплейс успешно добавлен!',
    'test.testing': '⏳ Проверка соединения...',
    'test.success': 'Демо-проверка завершена.',
    'test.error': 'Ошибка подключения:',
    'auth.noAccess': 'Нет доступа',
    'auth.noAccessDesc': 'Войдите на сайте под учётной записью администратора (например, demo@arzonol.uz), затем вернитесь сюда.'
  },
  en: {
    "demo.notice": "Demo panel: no stores are connected. Runs do not update prices. Do not enter real API keys.",
    'title': 'Admin Dashboard',
    'nav.back': '← Back to Store',
    'tab.integrations': '🔌 Marketplace Integrations & API',
    'tab.analytics': '📊 Demand & Analytics',

    'kpi.platforms': 'Marketplaces',
    'kpi.active': 'Active Channels',
    'kpi.offers': 'Prices & Offers',
    'kpi.lastSync': 'Last Sync',
    'time.never': 'Never',
    'time.justNow': 'Just now',
    'time.minAgo': 'min ago',
    'time.hourAgo': 'hr ago',
    'time.dayAgo': 'days ago',

    'section.sources': 'Connected Price Sources',
    'btn.syncAll': 'Demo run: all',
    'btn.addPlatform': '➕ Add Marketplace',
    'section.logs': 'Live Sync Logs',
    'btn.refreshLogs': '🔄 Refresh Logs',

    'card.noSite': 'no website',
    'card.prices': 'Catalog Prices',
    'card.inStock': 'In Stock',
    'card.channelType': 'Channel Type:',
    'card.interval': 'Interval:',
    'card.lastSync': 'Last Sync:',
    'card.every': 'every',
    'card.min': 'min',
    'card.hour': 'hour',
    'card.hours': 'hours',
    'card.day': 'Once a day',
    'card.active': 'Active',
    'card.paused': 'Paused',
    'btn.sync': 'Demo',
    'btn.test': 'Test',

    'th.time': 'Time',
    'th.platform': 'Marketplace',
    'th.status': 'Status',
    'th.updated': 'Updated',
    'th.message': 'Message',
    'logs.loading': 'Loading...',
    'logs.empty': 'No sync logs yet',
    'logs.success': 'Success',
    'logs.error': 'Error',
    'logs.pricesUnit': 'offers',

    'an.users': 'Users',
    'an.tracked': 'Price Trackers',
    'an.withTarget': 'With Target Price',
    'an.searches': 'Search Queries',
    'an.views': 'Product Views',
    'an.offers': 'Database Offers',
    'an.topQueries': 'Top Search Queries',
    'an.topViewed': 'Most Viewed Products',
    'an.byRegion': 'Users by Region',
    'an.wantedTitle': 'Target Prices Demanded',
    'an.empty': 'Nothing yet',
    'an.now': 'now',
    'an.waiting': 'target',
    'an.currency': 'UZS',
    'an.notice': 'Search queries and views are recorded for guest visitors as well: demand analytics does not require an account.',

    'modal.settingsTitle': 'Configure Marketplace',
    'modal.integrationType': 'Integration Type',
    'modal.apiKey': 'API Key / Bearer Token',
    'modal.apiKeyHint': 'Secret authorization token for marketplace API',
    'modal.feedUrl': 'Endpoint URL / Feed URL',
    'modal.feedUrlHint': 'XML/YML/JSON product feed or API endpoint URL',
    'modal.interval': 'Sync interval (demo setting)',
    'modal.status': 'Channel Status',
    'modal.activeOpt': '🟢 Active in demo mode',
    'modal.pausedOpt': '🟡 Paused',
    'modal.btnTest': '🧪 Test Connection',
    'modal.btnSave': '💾 Save',

    'modal.addTitle': '➕ Add New Marketplace / Store',
    'modal.nameLabel': 'Marketplace / Store Name',
    'modal.namePlaceholder': 'e.g. Sello Market',
    'modal.idLabel': 'Unique ID (latin lowercase)',
    'modal.idPlaceholder': 'sello',
    'modal.idHint': 'Lowercase latin letters and digits only, no spaces',
    'modal.colorLabel': 'Brand Color (HEX)',
    'modal.siteLabel': 'Store Website URL',
    'modal.feedLabel': 'Feed URL / API Endpoint',
    'modal.btnAddSubmit': '➕ Connect Marketplace',

    'toast.syncAllStart': 'Starting sync for all active channels...',
    'toast.syncSuccess': 'synced successfully!',
    'toast.saved': 'Settings saved successfully!',
    'toast.added': 'Marketplace added successfully!',
    'test.testing': '⏳ Testing connection...',
    'test.success': 'Demo validation complete.',
    'test.error': 'Connection failed:',
    'auth.noAccess': 'Access Restricted',
    'auth.noAccessDesc': 'Please log in on the website with an administrator account (e.g., demo@arzonol.uz), then return here.'
  }
};

let ADMIN_LANG = localStorage.getItem('arzonol:lang') || 'uz';
if (!ADMIN_I18N[ADMIN_LANG]) ADMIN_LANG = 'uz';

const t = (k) => ADMIN_I18N[ADMIN_LANG]?.[k] || ADMIN_I18N['uz']?.[k] || k;
const fmt = n => Number(n || 0).toLocaleString('ru-RU');
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);

let currentIntegrations = [];

function applyLanguage(lang) {
  ADMIN_LANG = lang;
  localStorage.setItem('arzonol:lang', lang);
  document.documentElement.lang = lang;
  document.title = `ArzonOL — ${t('title')}`;

  // Update switcher buttons
  document.querySelectorAll('.admin-lang-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.adminLang === lang);
  });

  // Update static texts
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Re-render current view
  const isIntegrations = !document.getElementById('tab-integrations-content').hidden;
  if (isIntegrations) {
    if (currentIntegrations.length) {
      renderIntegrationCards(currentIntegrations);
    }
  } else {
    loadAnalytics();
  }
}

// Language switcher clicks
document.querySelectorAll('.admin-lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyLanguage(btn.dataset.adminLang);
  });
});

function toast(msg) {
  const el = document.getElementById('admin-toast');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3200);
}

function authHeaders() { return { 'Content-Type': 'application/json' }; }

function timeAgo(dateStr) {
  if (!dateStr) return t('time.never');
  const diff = Math.floor((Date.now() - new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z').getTime()) / 1000);
  if (diff < 60) return t('time.justNow');
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t('time.minAgo')}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('time.hourAgo')}`;
  return `${Math.floor(diff / 86400)} ${t('time.dayAgo')}`;
}

function formatInterval(mins) {
  const m = Number(mins) || 60;
  if (m === 1440) return t('card.day');
  if (m >= 60) {
    const hrs = Math.round(m / 60);
    return `${t('card.every')} ${hrs} ${hrs > 1 ? t('card.hours') : t('card.hour')}`;
  }
  return `${t('card.every')} ${m} ${t('card.min')}`;
}

/* Tabs */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    const isIntegrations = tab.dataset.tab === 'integrations';
    document.getElementById('tab-integrations-content').hidden = !isIntegrations;
    document.getElementById('tab-analytics-content').hidden = isIntegrations;
    if (!isIntegrations) loadAnalytics();
    else loadIntegrations();
  });
});

function renderIntegrationCards(platforms) {
  const grid = document.getElementById('marketplaces-grid');
  grid.innerHTML = platforms.map(p => {
    const typeLabel = p.integration_type === 'api' ? '🔑 REST API' : (p.integration_type === 'feed' ? '📄 XML Feed' : '🕷️ Scraper');
    const isPaused = p.status === 'paused';
    const statusLabel = isPaused ? t('card.paused') : t('card.active');
    const statusClass = isPaused ? 'badge-status--paused' : 'badge-status--active';

    return `
      <div class="marketplace-card" style="border-top: 4px solid ${esc(p.color)}">
        <div>
          <div class="marketplace-card__header">
            <div class="marketplace-card__brand">
              <div class="marketplace-card__avatar" style="background: ${esc(p.color)}">
                ${esc(p.name[0])}
              </div>
              <div>
                <h3 class="marketplace-card__title">${esc(p.name)}</h3>
                <a class="marketplace-card__site" href="${esc(safeURL(p.site_url || '#'))}" target="_blank" rel="noopener">
                  ${esc(p.site_url ? p.site_url.replace(/^https?:\/\//, '') : t('card.noSite'))} ↗
                </a>
              </div>
            </div>
            <span class="badge-status ${statusClass}">${statusLabel}</span>
          </div>

          <div class="marketplace-card__body">
            <div class="marketplace-metrics">
              <div>
                <div class="metric-item__val">${fmt(p.offers_count)}</div>
                <div class="metric-item__lbl">${t('card.prices')}</div>
              </div>
              <div>
                <div class="metric-item__val">${fmt(p.in_stock_count)}</div>
                <div class="metric-item__lbl">${t('card.inStock')}</div>
              </div>
            </div>

            <div class="marketplace-info-row">
              <span>${t('card.channelType')}</span>
              <span class="badge-type">${typeLabel}</span>
            </div>
            <div class="marketplace-info-row">
              <span>${t('card.interval')}</span>
              <span><strong>${formatInterval(p.sync_interval)}</strong></span>
            </div>
            <div class="marketplace-info-row">
              <span>${t('card.lastSync')}</span>
              <span><strong>${timeAgo(p.last_sync_at)}</strong></span>
            </div>
          </div>
        </div>

        <div class="marketplace-card__footer">
          <button class="btn-admin btn-admin--primary btn-admin--sm" style="flex: 1;" data-sync="${esc(p.id)}">
            <span>🔄</span> ${t('btn.sync')}
          </button>
          <button class="btn-admin btn-admin--secondary btn-admin--sm" data-test="${esc(p.id)}">
            🧪 ${t('btn.test')}
          </button>
          <button class="btn-admin btn-admin--secondary btn-admin--sm" data-settings="${esc(p.id)}">
            ⚙️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* Load Integrations */
async function loadIntegrations() {
  try {
    const res = await fetch('/api/admin/integrations', { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      showNoAccess();
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    currentIntegrations = data.platforms || [];

    // Summary
    document.getElementById('kpi-total-platforms').textContent = data.summary.total_platforms;
    document.getElementById('kpi-active-platforms').textContent = data.summary.active_platforms;
    document.getElementById('kpi-total-offers').textContent = fmt(data.summary.total_offers);
    document.getElementById('kpi-last-sync').textContent = timeAgo(data.summary.last_sync);

    // Cards
    renderIntegrationCards(currentIntegrations);

    // Logs
    renderLogs(data.logs);
  } catch (err) {
    console.error('Integratsiyalarni yuklashda xatolik:', err);
  }
}

function renderLogs(logs) {
  const tbody = document.getElementById('logs-tbody');
  if (!logs || !logs.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-muted-gray);">${t('logs.empty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="color: var(--color-muted-gray); font-size: 12px;">${esc(l.created_at)}</td>
      <td>
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${esc(l.platform_color || '#5b3bf5')}"></span>
          ${esc(l.platform_name || l.platform_id)}
        </span>
      </td>
      <td>
        <span class="badge-status ${l.status === 'error' ? 'badge-status--error' : 'badge-status--active'}">
          ${l.status === 'demo' ? 'Demo' : l.status === 'success' ? t('logs.success') : t('logs.error')}
        </span>
      </td>
      <td><strong>${fmt(l.items_updated)}</strong> ${t('logs.pricesUnit')}</td>
      <td style="color: var(--color-muted-gray); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${esc(l.message)}
      </td>
    </tr>
  `).join('');
}

/* Actions */
async function syncOne(platformId, btn) {
  const original = btn.innerHTML;
  btn.innerHTML = '<span class="is-spinning">🔄</span>';
  btn.disabled = true;

  try {
    const res = await fetch(`/api/admin/integrations/sync/${platformId}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    toast(`✅ ${data.message || t('toast.syncSuccess')}`);
    await loadIntegrations();
  } catch (err) {
    toast(`❌ ${err.message}`);
  } finally {
    btn.innerHTML = original;
    btn.disabled = false;
  }
}

document.getElementById('btn-sync-all').addEventListener('click', async function() {
  const icon = document.getElementById('sync-all-icon');
  icon.classList.add('is-spinning');
  this.disabled = true;
  toast(t('toast.syncAllStart'));

  try {
    const res = await fetch('/api/admin/integrations/sync-all', {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    toast(`✅ ${data.message || t('toast.syncSuccess')}`);
    await loadIntegrations();
  } catch (err) {
    toast(`❌ ${err.message}`);
  } finally {
    icon.classList.remove('is-spinning');
    this.disabled = false;
  }
});

document.getElementById('btn-refresh-logs').addEventListener('click', loadIntegrations);

/* Settings Modal */
function openSettings(platformId) {
  const p = currentIntegrations.find(x => x.id === platformId);
  if (!p) return;

  document.getElementById('form-platform-id').value = p.id;
  document.getElementById('modal-platform-name').textContent = `${t('modal.settingsTitle')}: «${p.name}»`;
  const avatar = document.getElementById('modal-brand-avatar');
  avatar.style.background = p.color;
  avatar.textContent = p.name[0];

  document.getElementById('form-api-key').value = '';
  document.getElementById('form-api-key').placeholder = p.has_api_key ? '•••••••• (leave blank to keep)' : '';
  document.getElementById('form-feed-url').value = p.feed_url || '';
  document.getElementById('form-interval').value = String(p.sync_interval || 60);
  document.getElementById('form-status').value = p.status || 'active';

  // Radio selection
  const type = p.integration_type || 'api';
  document.querySelectorAll('input[name="integration_type"]').forEach(r => {
    r.checked = r.value === type;
    r.closest('.type-radio').classList.toggle('is-selected', r.value === type);
  });

  document.getElementById('modal-test-result').className = 'test-result-box';
  document.getElementById('modal-test-result').style.display = 'none';

  document.getElementById('settings-modal').hidden = false;
}

document.querySelectorAll('input[name="integration_type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.type-radio').forEach(r => r.classList.remove('is-selected'));
    radio.closest('.type-radio').classList.add('is-selected');
  });
});

document.getElementById('btn-test-connection').addEventListener('click', async () => {
  const platformId = document.getElementById('form-platform-id').value;
  const apiKey = document.getElementById('form-api-key').value;
  const feedUrl = document.getElementById('form-feed-url').value;
  const type = document.querySelector('input[name="integration_type"]:checked')?.value || 'api';
  const resBox = document.getElementById('modal-test-result');

  resBox.style.display = 'block';
  resBox.className = 'test-result-box';
  resBox.textContent = t('test.testing');

  try {
    const res = await fetch('/api/admin/integrations/test', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ platform_id: platformId, api_key: apiKey, feed_url: feedUrl, integration_type: type })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    if (data.success) {
      resBox.className = 'test-result-box is-success';
      resBox.textContent = `✅ ${t('test.success')} ${data.message || ''}`;
    } else {
      resBox.className = 'test-result-box is-error';
      resBox.textContent = `❌ ${t('test.error')} ${data.message || ''}`;
    }
  } catch (err) {
    resBox.className = 'test-result-box is-error';
    resBox.textContent = `❌ ${t('test.error')} ${err.message}`;
  }
});

async function testOne(platformId) {
  const p = currentIntegrations.find(x => x.id === platformId);
  if (!p) return;
  toast(t('test.testing'));
  try {
    const res = await fetch('/api/admin/integrations/test', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        platform_id: p.id,
        api_key: '',
        feed_url: p.feed_url,
        integration_type: p.integration_type
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    toast(data.success ? `ℹ️ ${data.message}` : `❌ ${t('test.error')} ${data.message}`);
  } catch (err) {
    toast(`❌ ${t('test.error')} ${err.message}`);
  }
}

document.getElementById('settings-form').addEventListener('submit', async e => {
  e.preventDefault();
  const platformId = document.getElementById('form-platform-id').value;
  const apiKey = document.getElementById('form-api-key').value;
  const feedUrl = document.getElementById('form-feed-url').value;
  const type = document.querySelector('input[name="integration_type"]:checked')?.value || 'api';
  const interval = parseInt(document.getElementById('form-interval').value, 10);
  const status = document.getElementById('form-status').value;

  try {
    const res = await fetch('/api/admin/integrations/save', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        platform_id: platformId,
        api_key: apiKey,
        feed_url: feedUrl,
        integration_type: type,
        sync_interval: interval,
        status: status
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    toast('✅ ' + t('toast.saved'));
    document.getElementById('settings-modal').hidden = true;
    await loadIntegrations();
  } catch (err) {
    toast('❌ ' + err.message);
  }
});

/* Add Platform */
document.getElementById('btn-add-platform').addEventListener('click', () => {
  document.getElementById('add-platform-modal').hidden = false;
});

document.getElementById('new-platform-color-picker').addEventListener('input', e => {
  document.getElementById('new-platform-color').value = e.target.value;
});

document.getElementById('add-platform-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('new-platform-name').value;
  const id = document.getElementById('new-platform-id').value;
  const color = document.getElementById('new-platform-color').value;
  const siteUrl = document.getElementById('new-platform-site').value;
  const type = document.getElementById('new-platform-type').value;
  const feedUrl = document.getElementById('new-platform-feed').value;

  try {
    const res = await fetch('/api/admin/platforms/create', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id: id,
        name: name,
        color: color,
        site_url: siteUrl,
        integration_type: type,
        feed_url: feedUrl,
        api_key: ''
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Xatolik');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    toast('✅ ' + t('toast.added'));
    document.getElementById('add-platform-modal').hidden = true;
    document.getElementById('add-platform-form').reset();
    await loadIntegrations();
  } catch (err) {
    toast('❌ ' + err.message);
  }
});

document.querySelectorAll('[data-close-modal]').forEach(b => {
  b.addEventListener('click', () => {
    document.getElementById('settings-modal').hidden = true;
    document.getElementById('add-platform-modal').hidden = true;
  });
});

/* Load Analytics */
async function loadAnalytics() {
  try {
    const res = await fetch('/api/stats/full', { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      showNoAccess();
      return;
    }
    const d = await res.json();

    document.getElementById('analytics-tiles').innerHTML =
        tile(d.users, t('an.users'))
      + tile(d.tracked, t('an.tracked'))
      + tile(d.withTarget, t('an.withTarget'))
      + tile(d.searches, t('an.searches'))
      + tile(d.views, t('an.views'))
      + tile(d.offers, t('an.offers'));

    const topQ = d.topQueries.map(q => ({ label: q.query, count: q.count }));
    const topV = d.topViewed.map(p => ({ label: p.title, count: p.views }));
    const reg  = d.byRegion.map(r => ({ label: r.region, count: r.count }));

    const wanted = d.mostWanted.length
      ? d.mostWanted.map(p => `
          <div class="list-row">
            <img src="${esc(p.image)}" alt="" loading="lazy">
            <div class="list-row__main">
              <div class="list-row__name">${esc(p.title)}</div>
              <div class="list-row__meta">${esc(p.brand)} · ${t('an.now')}: ${fmt(p.current)} ${t('an.currency')}</div>
            </div>
            <div class="list-row__value">${t('an.waiting')}: ${fmt(p.avgTarget)} ${t('an.currency')}</div>
          </div>`).join('')
      : `<p class="list-row__meta">${t('an.empty')}</p>`;

    document.getElementById('analytics-panels').innerHTML =
        barPanel(t('an.topQueries'), topQ, Math.max(1, ...topQ.map(x => x.count)))
      + barPanel(t('an.topViewed'), topV, Math.max(1, ...topV.map(x => x.count)))
      + barPanel(t('an.byRegion'), reg, Math.max(1, ...reg.map(x => x.count)))
      + `<div class="panel"><h2 class="panel__title">${t('an.wantedTitle')}</h2>${wanted}</div>`;
  } catch (err) {
    console.error('Analytics yuklashda xatolik:', err);
  }
}

const tile = (value, label) =>
  `<div class="tile-stat"><div class="tile-stat__value">${fmt(value)}</div><div class="tile-stat__label">${esc(label)}</div></div>`;

function barPanel(title, rows, max) {
  const body = rows.length ? rows.map(r => `
    <div class="bar-row">
      <span class="bar-row__label">${esc(r.label)}</span>
      <span class="bar-row__count">${fmt(r.count)}</span>
      <span class="bar"><span style="width:${Math.round((r.count / max) * 100)}%"></span></span>
    </div>`).join('') : `<p class="list-row__meta">${t('an.empty')}</p>`;
  return `<div class="panel"><h2 class="panel__title">${esc(title)}</h2>${body}</div>`;
}

function showNoAccess() {
  document.querySelector('.admin-layout').innerHTML =
    `<div class="admin-head"><h1 class="admin-title">${t('auth.noAccess')}</h1>`
    + `<a class="admin-btn-back" href="/">${t('nav.back')}</a></div>`
    + `<p style="color: var(--color-muted-gray); font-size: 15px;">${t('auth.noAccessDesc')}</p>`;
}

// Initial Boot with selected language
applyLanguage(ADMIN_LANG);
loadIntegrations();

// Delegated controls are compatible with a strict script CSP.
document.addEventListener('click', event => {
  const button = event.target.closest('[data-sync], [data-test], [data-settings]');
  if (!button) return;
  if (button.dataset.sync) syncOne(button.dataset.sync, button);
  else if (button.dataset.test) testOne(button.dataset.test);
  else openSettings(button.dataset.settings);
});
