/* Search, transliteration and catalogue filters. */
function sortAndFilterItems(items) {
  let list = [...items];

  if (state.inStockOnly) {
    list = list.filter(p => inStockCount(p) > 0);
  }

  if (state.platformFilter) {
    list = list.filter(p => (p.availability || p.offers).some(o => o.platform === state.platformFilter && o.inStock));
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

/* --------------------------------------------------------------------------
   Ko'p tilli aqlli qidiruv tizimi (Multilingual Smart Search Engine)
   Qo'llab-quvvatlaydi: O'zbekcha (Lotin va Kirill), Ruscha, Inglizcha + Sinonimlar
   -------------------------------------------------------------------------- */

const SEARCH_SYNONYMS = {
  smartphones: [
    'смартфон', 'смартфоны', 'телефон', 'телефоны', 'сотка', 'мобильник',
    'smartfon', 'smartfonlar', 'telefon', 'telefonlar', 'sotka', 'mobil',
    'smartphone', 'smartphones', 'phone', 'phones', 'mobile', 'cellphone'
  ],
  laptops: [
    'ноутбук', 'ноутбуки', 'ноут', 'компьютер', 'компьютеры', 'комп', 'лэптоп',
    'noutbuk', 'noutbuklar', 'nout', 'kompyuter', 'kompyuterlar', 'komp', 'leptop',
    'laptop', 'laptops', 'notebook', 'notebooks', 'computer', 'pc', 'macbook', 'макбук'
  ],
  audio: [
    'наушники', 'наушник', 'гарнитура', 'уши', 'вкладыши', 'беспроводные наушники',
    'quloqchin', 'quloqchinlar', 'naushnik', 'naushniklar', 'garnitura', 'simsiz quloqchin',
    'headphones', 'headphone', 'earphones', 'earbuds', 'headset', 'airpods', 'аирподс', 'эйрподс', 'buds'
  ],
  tablets: [
    'планшет', 'планшеты', 'таблет', 'айпад',
    'planshet', 'planshetlar', 'tab',
    'tablet', 'tablets', 'ipad'
  ],
  apple: ['apple', 'эппл', 'эпл', 'яблоко', 'айфон', 'iphone', 'айпад', 'ipad', 'макбук', 'macbook', 'airpods', 'аирподс', 'эйрподс'],
  samsung: ['samsung', 'самсунг', 'galaxy', 'галакси'],
  xiaomi: ['xiaomi', 'redmi', 'сяоми', 'ксиаоми', 'редми', 'poco', 'поко'],
  sony: ['sony', 'сони'],
  huawei: ['huawei', 'хуавей', 'honor', 'хонор'],
  asus: ['asus', 'асус'],
  lenovo: ['lenovo', 'леново', 'thinkpad'],
  acer: ['acer', 'асер', 'эйсер'],
  jbl: ['jbl', 'жбл', 'джбл']
};

const CYR_TO_LAT = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
  'я': 'ya', 'ў': "o'", 'ғ': "g'", 'қ': 'q', 'ҳ': 'h'
};

const LAT_TO_CYR = {
  'sh': 'ш', 'ch': 'ч', 'yo': 'ё', 'yu': 'ю', 'ya': 'я', 'ts': 'ц',
  "o'": 'ў', "g'": 'ғ', "o‘": 'ў', "g‘": 'ғ', "o`": 'ў', "g`": 'ғ',
  'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'j': 'ж',
  'z': 'з', 'i': 'и', 'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н',
  'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф',
  'x': 'х', 'q': 'қ', 'h': 'ҳ', 'w': 'в', 'c': 'к'
};

function normalizeSearchText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[‘`ʼ’]/g, "'")
    .replace(/[^a-zа-яёўғқҳ0-9\s']/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function transliterateCyrToLat(str) {
  return str.split('').map(c => CYR_TO_LAT[c] !== undefined ? CYR_TO_LAT[c] : c).join('');
}

function transliterateLatToCyr(str) {
  let res = str;
  ['sh', 'ch', 'yo', 'yu', 'ya', 'ts', "o'", "g'", "o‘", "g‘"].forEach(k => {
    if (LAT_TO_CYR[k]) res = res.replaceAll(k, LAT_TO_CYR[k]);
  });
  return res.split('').map(c => LAT_TO_CYR[c] !== undefined ? LAT_TO_CYR[c] : c).join('');
}

function buildProductSearchCorpus(p) {
  const cat = catOf(p.cat);
  const catLabels = cat ? `${cat.label?.ru || ''} ${cat.label?.uz || ''} ${cat.label?.en || ''}` : '';
  const catSynonyms = (SEARCH_SYNONYMS[p.cat] || []).join(' ');
  const brandLower = (p.brand || '').toLowerCase();
  const brandSynonyms = (SEARCH_SYNONYMS[brandLower] || []).join(' ');

  const titles = `${p.title?.ru || ''} ${p.title?.uz || ''} ${p.title?.en || ''}`;
  const raw = `${p.brand || ''} ${titles} ${p.cat || ''} ${catLabels} ${catSynonyms} ${brandSynonyms}`;

  const norm = normalizeSearchText(raw);
  const lat = transliterateCyrToLat(norm);
  const cyr = transliterateLatToCyr(norm);

  return `${norm} ${lat} ${cyr}`;
}

function match(p, q) {
  const normQuery = normalizeSearchText(q);
  if (!normQuery) return true;

  if (!p._searchCorpus) {
    p._searchCorpus = buildProductSearchCorpus(p);
  }

  const terms = normQuery.split(/\s+/).filter(Boolean);

  return terms.every(term => {
    const termLat = transliterateCyrToLat(term);
    const termCyr = transliterateLatToCyr(term);
    return p._searchCorpus.includes(term) ||
           p._searchCorpus.includes(termLat) ||
           p._searchCorpus.includes(termCyr);
  });
}

function searchScore(p, needle) {
  let score = 0;
  const currentTitle = (tr(p.title) || '').toLowerCase();
  const brand = (p.brand || '').toLowerCase();
  const normNeedle = normalizeSearchText(needle);

  if (currentTitle.includes(normNeedle)) score += 100;
  if (brand.includes(normNeedle)) score += 80;
  if (p.cat && normNeedle.includes(p.cat)) score += 50;
  if (p._searchCorpus && p._searchCorpus.includes(normNeedle)) score += 30;

  return score;
}

function search(q) {
  const needle = q.trim();
  if (!needle) return [];
  const matched = PRODUCTS.filter(p => match(p, needle));
  matched.sort((a, b) => searchScore(b, needle) - searchScore(a, needle));
  return matched;
}
