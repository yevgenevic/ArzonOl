/* Catalogue state and price calculations. Demo fixtures live on the server. */
/* Активные структуры данных */
let PLATFORMS  = [];
let REGIONS    = [];
let CATEGORIES = [];
let PRODUCTS   = [];
let CATALOG_UNLOCKED = false;

const platformOf = id => PLATFORMS.find(p => p.id === id) || { id, name: id, color: '#787574' };
const regionOf   = id => REGIONS.find(r => r.id === id) || REGIONS[0] || { id, name: { ru: id, uz: id, en: id }, offset: 0 };
const byId = id => PRODUCTS.find(p => p.id === id);

async function loadCatalog() {
  const [refs, prods] = await Promise.all([api('/api/catalog'), api('/api/products')]);
  if (!Array.isArray(refs.platforms) || !Array.isArray(refs.categories) ||
      !Array.isArray(refs.regions) || !Array.isArray(prods.products)) {
    throw new Error('Invalid catalogue response');
  }
  PLATFORMS = refs.platforms;
  REGIONS = refs.regions;
  CATEGORIES = refs.categories;
  PRODUCTS = prods.products;
  CATALOG_UNLOCKED = prods.unlocked === true;
}

/* --------------------------------------------------------------------------
   Вычисления над предложениями
   -------------------------------------------------------------------------- */

const EMPTY_OFFER = { platform: 'uzum', price: 0, inStock: false, delivery: 0, url: '#' };

function offerPool(product) {
  if (!product || !product.offers || !product.offers.length) return null;
  const inStock = product.offers.filter(o => o && o.inStock);
  return inStock.length ? inStock : null;
}

/* Лучшее предложение (минимальная цена) */
function bestOffer(product) {
  const pool = offerPool(product);
  if (!pool || !pool.length) return EMPTY_OFFER;
  return pool.reduce((min, cur) => ((cur && cur.price < min.price) ? cur : min), pool[0]);
}

/* Худшее предложение (максимальная цена) */
function worstOffer(product) {
  const pool = offerPool(product);
  if (!pool || !pool.length) return EMPTY_OFFER;
  return pool.reduce((max, cur) => ((cur && cur.price > max.price) ? cur : max), pool[0]);
}

function priceRange(product) {
  return { min: bestOffer(product).price, max: worstOffer(product).price };
}

function savings(product) {
  const { min, max } = priceRange(product);
  const diff = Math.max(0, max - min);
  return { amount: diff, percent: max > 0 ? Math.round((diff / max) * 100) : 0 };
}

function inStockCount(product) {
  return (product?.availability || product?.offers || []).filter(o => o && o.inStock).length;
}

function offersCount(product) {
  return product ? (product.offersCount ?? (product.offers || []).length) : 0;
}

function calcDeliveryDays(offer, regionId) {
  const region = regionOf(regionId);
  return (offer ? offer.delivery : 1) + (region ? region.offset : 0);
}

/* --------------------------------------------------------------------------
   История цен и аналитика
   -------------------------------------------------------------------------- */

function priceHistory(product) {
  return (product?.history || []).filter(h => Number.isFinite(h.price) && h.price > 0);
}

function priceTrend(product) {
  const history = priceHistory(product);
  if (!history || history.length < 2) {
    return { diff: 0, percent: 0, isDrop: false, isAllTimeLow: false };
  }

  const start = history[0].price;
  const current = history[history.length - 1].price;
  const diff = start - current;
  const allPrices = history.map(h => h.price);
  const minPrice = allPrices.length ? Math.min(...allPrices) : current;

  return {
    diff,
    percent: start > 0 ? Math.round((diff / start) * 100) : 0,
    isDrop: diff > 0,
    isAllTimeLow: current <= minPrice,
  };
}

function totalBundleSavings(productIds) {
  const products = (productIds || []).map(byId).filter(Boolean);
  if (!products.length) return { bestTotal: 0, worstTotal: 0, savedAmount: 0, savedPercent: 0 };

  const bestTotal = products.reduce((s, p) => s + bestOffer(p).price, 0);
  const worstTotal = products.reduce((s, p) => s + worstOffer(p).price, 0);
  const savedAmount = Math.max(0, worstTotal - bestTotal);
  return {
    bestTotal,
    worstTotal,
    savedAmount,
    savedPercent: worstTotal > 0 ? Math.round((savedAmount / worstTotal) * 100) : 0,
  };
}

/* --------------------------------------------------------------------------
   Конфигурация витрины и презентации
   -------------------------------------------------------------------------- */

const SECTIONS = ['mebel', 'qurilish', 'texnika'];

const CONSTELLATION = [
  { id: 'f01', kind: 'bare', w: 132 },
  { id: 't04', kind: 'card', w: 156 },
  { id: 'q01', kind: 'bare', w: 104 },
  { id: 'f10', kind: 'card', w: 172 },
  { id: 't03', kind: 'bare', w: 148 },
  { id: 'q09', kind: 'bare', w: 96  },
  { id: 'f04', kind: 'card', w: 164 },
  { id: 't09', kind: 'bare', w: 120 },
  { id: 'q03', kind: 'card', w: 144 },
  { id: 'f05', kind: 'bare', w: 128 },
  { id: 't01', kind: 'bare', w: 112 },
  { id: 'q08', kind: 'card', w: 152 }
];

const PARTNERS = [
  { id: 'uzum',      name: 'Uzum Market', type: 'Маркетплейс', color: '#7000ff', bg: 'linear-gradient(135deg, #7000ff, #9333ea)', icon: '🛒' },
  { id: 'olcha',     name: 'Olcha.uz',    type: 'Маркетплейс', color: '#f04e23', bg: 'linear-gradient(135deg, #f04e23, #ea580c)', icon: '🍒' },
  { id: 'texnomart', name: 'Texnomart',   type: 'Электроника', color: '#e31e24', bg: 'linear-gradient(135deg, #e31e24, #dc2626)', icon: '⚡' },
  { id: 'mediapark', name: 'Mediapark',   type: 'Техника',     color: '#0066b3', bg: 'linear-gradient(135deg, #0066b3, #0284c7)', icon: '📱' },
  { id: 'asaxiy',    name: 'Asaxiy',      type: 'Маркетплейс', color: '#1a7f4e', bg: 'linear-gradient(135deg, #1a7f4e, #16a34a)', icon: '📦' },
  { id: 'idea',      name: 'Idea',        type: 'Магазин',     color: '#ff6b00', bg: 'linear-gradient(135deg, #ff6b00, #f97316)', icon: '💡' },
  { id: 'elmakon',   name: 'Elmakon',     type: 'Электроника', color: '#004b93', bg: 'linear-gradient(135deg, #004b93, #2563eb)', icon: '🔌' },
  { id: 'zoodmall',  name: 'ZoodMall',    type: 'Маркетплейс', color: '#00b2a9', bg: 'linear-gradient(135deg, #00b2a9, #0d9488)', icon: '🛍️' },
  { id: 'milan',     name: 'Milan Mebel', type: 'Мебель',      color: '#b0553f', bg: 'linear-gradient(135deg, #b0553f, #c2410c)', icon: '🛋️' },
  { id: 'artel',     name: 'Artel',       type: 'Бытовая техника', color: '#d95f4c', bg: 'linear-gradient(135deg, #d95f4c, #ef4444)', icon: '❄️' },
  { id: 'grohe',     name: 'Grohe',       type: 'Сантехника',  color: '#0066b3', bg: 'linear-gradient(135deg, #0066b3, #0369a1)', icon: '🚿' },
  { id: 'knauf',     name: 'Knauf',       type: 'Стройматериалы', color: '#2f6fd0', bg: 'linear-gradient(135deg, #2f6fd0, #3b82f6)', icon: '🧱' },
  { id: 'apple',     name: 'Apple',       type: 'Оригинал',    color: '#111827', bg: 'linear-gradient(135deg, #4b5563, #111827)', icon: '🍎' },
  { id: 'samsung',   name: 'Samsung',     type: 'Официальный', color: '#1428a0', bg: 'linear-gradient(135deg, #1428a0, #1d4ed8)', icon: '✨' },
  { id: 'bosch',     name: 'Bosch',       type: 'Инструменты', color: '#e21a22', bg: 'linear-gradient(135deg, #e21a22, #b91c1c)', icon: '🔧' }
];
