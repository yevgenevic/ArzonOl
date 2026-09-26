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
  { id: 'uzum',      kind: 'market', name: 'Uzum Market',  color: '#7000ff' },
  { id: 'olcha',     kind: 'market', name: 'Olcha.uz',     color: '#f04e23' },
  { id: 'texnomart', kind: 'market', name: 'Texnomart',    color: '#e31e24' },
  { id: 'mediapark', kind: 'market', name: 'Mediapark',    color: '#0066b3' },
  { id: 'asaxiy',    kind: 'market', name: 'Asaxiy',       color: '#1a7f4e' },
  { id: 'idea',      kind: 'market', name: 'Idea',         color: '#ff6b00' },
  { id: 'elmakon',   kind: 'market', name: 'Elmakon',      color: '#004b93' },
  { id: 'zoodmall',  kind: 'market', name: 'ZoodMall',     color: '#00b2a9' },
  { id: 'milan',     kind: 'brand',  name: 'Milan Mebel',  color: '#b0553f' },
  { id: 'artel',     kind: 'brand',  name: 'Artel',        color: '#d95f4c' },
  { id: 'grohe',     kind: 'brand',  name: 'Grohe',        color: '#0066b3' },
  { id: 'knauf',     kind: 'brand',  name: 'Knauf',        color: '#2f6fd0' },
  { id: 'apple',     kind: 'brand',  name: 'Apple',        color: '#111827' },
  { id: 'samsung',   kind: 'brand',  name: 'Samsung',      color: '#1428a0' },
  { id: 'bosch',     kind: 'brand',  name: 'Bosch',        color: '#e21a22' }
];
