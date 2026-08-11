/* ==========================================================================
   Переводы интерфейса — ru / uz / en
   Ключи плоские, через точку.
   Бренд: ArzonOL
   ========================================================================== */

const LANGS = [
  { id: 'ru', label: 'RU', name: 'Русский' },
  { id: 'uz', label: 'UZ', name: "O'zbekcha" },
  { id: 'en', label: 'EN', name: 'English' }
];

const TRANSLATIONS = {
  ru: {
    'html.lang': 'ru',

    'nav.home': 'Главная',
    'nav.discover': 'Подборки',
    'nav.favorites': 'Отслеживаемые',
    'nav.compare': 'Сравнение',
    'nav.account': 'Аккаунт',

    'hero.tagline': 'Сравнение цен на мебель, технику и стройматериалы в Узбекистане',
    'search.placeholder': 'Какой товар или бренд вы ищете?',
    'search.label': 'Поиск товаров',
    'search.hint': 'Начните вводить название бренда или товара',
    'search.submit': 'Найти',
    'search.clear': 'Очистить',
    'categories.aria': 'Категории',

    'price.from': 'от',
    'badge.savings': 'Выгода до',
    'badge.stores': 'площадок',

    'sort.label': 'Сортировка:',
    'sort.priceAsc': 'Сначала выгодные',
    'sort.savingsDesc': 'Макс. скидка',
    'sort.ratingDesc': 'По рейтингу',
    'sort.popularDesc': 'По популярности',

    'filter.all': 'Все предложения',
    'filter.inStock': 'Только в наличии',
    'filter.platform': 'Маркетплейс',

    'region.prefix': 'Доставка в',
    'theme.toggle': 'Тема оформления',

    'chart.title': 'Динамика минимальной цены',
    'chart.trendDown': 'Цена снизилась на',
    'chart.trendUp': 'Цена выросла на',
    'chart.allTimeLow': 'Минимальная цена за всё время',
    'chart.bestTime': 'Выгодный момент для покупки',

    'alert.btn': 'Уведомить о скидке',
    'alert.title': 'Подписка на снижение цены',
    'alert.subtitle': 'Мы пришлём уведомление, как только цена на этот товар упадёт',
    'alert.targetLabel': 'Желаемая цена (сум)',
    'alert.contactLabel': 'Telegram @username или Email',
    'alert.submit': 'Подписаться',
    'alert.success': 'Уведомление настроено! Мы сообщим о снижении цены.',

    'results.reset': 'Сбросить',
    'results.favorites': 'Отслеживаемые цены',
    'empty.search': 'Ничего не нашлось. Попробуйте другой бренд или категорию.',
    'empty.favorites': 'Список отслеживаемых цен пуст. Нажмите ♡ на любой карточке, чтобы следить за изменением цены.',

    'section.all': 'Все товары',
    'cats.title': 'Категории',
    'cats.sub': 'Выберите раздел — откроется каталог',
    'cats.action': 'Смотреть цены',
    'bestsellers.title': 'Популярные товары',
    'bestsellers.sub': 'С максимальной выгодой за месяц',

    'partners.title': 'Маркетплейсы и бренды',
    'partners.sub': 'Собираем актуальные предложения со всего Узбекистана',

    'sheet.close': 'Закрыть',
    'sheet.reviews': 'отзывов',
    'sheet.desc': 'Сравните актуальные цены проверенных маркетплейсов Узбекистана и выберите самое выгодное предложение.',
    'sheet.bestPrice': 'Лучшая цена',
    'sheet.savingsPrefix': 'выгода до',
    'sheet.inStock': 'В наличии',
    'sheet.outOfStock': 'Нет в наличии',
    'sheet.delivery': 'доставка',
    'sheet.days': 'дн.',
    'sheet.visit': 'Перейти',
    'sheet.trackPrice': 'Следить за ценой',
    'sheet.tracked': 'В отслеживаемых',
    'sheet.compareAdd': 'К сравнению',
    'sheet.compareRemove': 'В сравнении',
    'sheet.offersTitle': 'Предложения площадок',
    'sheet.disclaimer': 'Цены и наличие носят демонстрационный характер и не являются публичной офертой.',

    'compare.drawerTitle': 'Список сравнения',
    'compare.empty': 'Список сравнения пуст. Добавляйте товары кнопкой «К сравнению».',
    'compare.openModal': 'Сравнить товары',
    'compare.clear': 'Очистить список',
    'compare.modalTitle': 'Сравнение товаров и цен',
    'compare.totalBundle': 'Итоговая выгода комплекта',
    'compare.totalBest': 'Сумма по лучшим ценам:',
    'compare.totalSaved': 'Ваша общая экономия:',
    'compare.param.bestPrice': 'Лучшая цена',
    'compare.param.range': 'Разброс цен',
    'compare.param.savings': 'Макс. выгода',
    'compare.param.platforms': 'Площадок',
    'compare.param.inStock': 'В наличии',
    'compare.param.rating': 'Рейтинг',
    'compare.param.action': 'Предложения',
    'compare.viewOffers': 'Смотреть цены',
    'compare.remove': 'Удалить из сравнения',

    'toast.favOn': 'Товар добавлен в отслеживание цен',
    'toast.favOff': 'Товар убран из отслеживания цен',
    'toast.compareOn': 'Товар добавлен к сравнению',
    'toast.compareOff': 'Товар убран из сравнения',
    'toast.compareCleared': 'Список сравнения очищен',
    'toast.compareLimit': 'Можно сравнивать до 4 товаров одновременно',

    'footer.blurb': 'ArzonOL — агрегатор цен на мебель, технику и стройматериалы в Узбекистане. Сравнивайте предложения маркетплейсов и покупайте выгоднее.',
    'footer.disclaimer': 'Внимание: цены и данные о наличии на сайте носят демонстрационный характер и не являются публичной офертой.',
    'footer.shop': 'Каталог',
    'footer.help': 'Помощь',
    'footer.company': 'О сервисе',
    'footer.link.selections': 'Подборки',
    'footer.link.brands': 'Бренды',
    'footer.link.new': 'Новинки',
    'footer.link.sale': 'Лучшие цены',
    'footer.link.delivery': 'О доставке',
    'footer.link.returns': 'Площадки',
    'footer.link.tracking': 'Отслеживание цен',
    'footer.link.support': 'Поддержка',
    'footer.link.about': 'О проекте',
    'footer.link.jobs': 'Вакансии',
    'footer.link.press': 'Пресса',
    'footer.link.partners': 'Подключение площадок',
    'footer.legal': 'Политика конфиденциальности · Условия · Демо-версия',

    'cookie.text': 'ArzonOL использует cookies, чтобы запоминать список сравнения и отслеживаемые товары. Подробнее — в',
    'cookie.link': 'политике конфиденциальности',
    'cookie.accept': 'Принять всё',
    'cookie.reject': 'Только необходимые',

    'lang.aria': 'Язык интерфейса',
    'currency': 'сум',
    'count': ['товар', 'товара', 'товаров']
  },

  uz: {
    'html.lang': 'uz',

    'nav.home': 'Bosh sahifa',
    'nav.discover': 'Tanlovlar',
    'nav.favorites': 'Kuzatilayotganlar',
    'nav.compare': 'Taqqoslash',
    'nav.account': 'Akkaunt',

    'hero.tagline': 'Mebel, texnika va qurilish materiallari narxlarini bir joyda taqqoslang',
    'search.placeholder': 'Bugun qanday tovar yoki brend qidiryapsiz?',
    'search.label': 'Tovarlarni qidirish',
    'search.hint': 'Brend yoki tovar nomini yozing',
    'search.submit': 'Qidirish',
    'search.clear': 'Tozalash',
    'categories.aria': 'Kategoriyalar',

    'price.from': 'dan',
    'badge.savings': 'Foyda',
    'badge.stores': 'maydon',

    'sort.label': 'Saralash:',
    'sort.priceAsc': 'Avval arzonlari',
    'sort.savingsDesc': 'Maks. chegirma',
    'sort.ratingDesc': 'Reyting bo\'yicha',
    'sort.popularDesc': 'Ommabopligi',

    'filter.all': 'Barcha takliflar',
    'filter.inStock': 'Faqat mavjudlari',
    'filter.platform': 'Marketpleys',

    'region.prefix': 'Yetkazish hududi:',
    'theme.toggle': 'Interfeys mavzusi',

    'chart.title': 'Minimal narx dinamikasi',
    'chart.trendDown': 'Narx pasaydi:',
    'chart.trendUp': 'Narx oshdi:',
    'chart.allTimeLow': 'Barcha davrlardagi eng past narx',
    'chart.bestTime': 'Xarid uchun ayni qulay fursat',

    'alert.btn': 'Chegirma haqida bildirish',
    'alert.title': 'Narx pasayishi bildirishnomasi',
    'alert.subtitle': 'Ushbu tovar narxi arzonlashishi bilan sizga xabar beramiz',
    'alert.targetLabel': 'Kutilayotgan narx (so\'m)',
    'alert.contactLabel': 'Telegram @username yoki Email',
    'alert.submit': 'Obuna bo\'lish',
    'alert.success': 'Bildirishnoma sozlandi! Narx pasayganda xabar beramiz.',

    'results.reset': 'Bekor qilish',
    'results.favorites': 'Kuzatilayotgan narxlar',
    'empty.search': 'Hech narsa topilmadi. Boshqa brend yoki kategoriyani sinab ko\'ring.',
    'empty.favorites': 'Kuzatilayotgan narxlar ro\'yxati bo\'sh. Narxni kuzatish uchun istalgan kartadagi ♡ belgisini bosing.',

    'section.all': 'Barcha tovarlar',
    'cats.title': 'Kategoriyalar',
    'cats.sub': 'Bo\'limni tanlang — katalog ochiladi',
    'cats.action': 'Narxlarni ko\'rish',
    'bestsellers.title': 'Ommabop tovarlar',
    'bestsellers.sub': 'Oy davomida eng katta tejamkorlik bilan',

    'partners.title': 'Marketpleyslar va brendlar',
    'partners.sub': 'Butun O\'zbekiston bo\'ylab dolzarb takliflarni to\'playmiz',

    'sheet.close': 'Yopish',
    'sheet.reviews': 'sharh',
    'sheet.desc': 'O\'zbekistonning ishonchli marketpleyslaridagi dolzarb narxlarni taqqoslang va eng maqbul taklifni tanlang.',
    'sheet.bestPrice': 'Eng yaxshi narx',
    'sheet.savingsPrefix': 'foyda',
    'sheet.inStock': 'Mavjud',
    'sheet.outOfStock': 'Mavjud emas',
    'sheet.delivery': 'yetkazish',
    'sheet.days': 'kun',
    'sheet.visit': 'O\'tish',
    'sheet.trackPrice': 'Narxni kuzatish',
    'sheet.tracked': 'Kuzatilmoqda',
    'sheet.compareAdd': 'Taqqoslashga',
    'sheet.compareRemove': 'Taqqoslanmoqda',
    'sheet.offersTitle': 'Maydonlardagi takliflar',
    'sheet.disclaimer': 'Narxlar va mavjudlik ko\'rgazmali bo\'lib, ommaviy oferta hisoblanmaydi.',

    'compare.drawerTitle': 'Taqqoslash ro\'yxati',
    'compare.empty': 'Taqqoslash ro\'yxati bo\'sh. Tovarlarni «Taqqoslashga» tugmasi bilan qo\'shing.',
    'compare.openModal': 'Tovarlarni taqqoslash',
    'compare.clear': 'Ro\'yxatni tozalash',
    'compare.modalTitle': 'Tovar va narxlar taqqosi',
    'compare.totalBundle': 'To\'plam umumiy tejamkorligi',
    'compare.totalBest': 'Eng yaxshi narxlar summasi:',
    'compare.totalSaved': 'Umumiy tejalgan mablag\':',
    'compare.param.bestPrice': 'Eng yaxshi narx',
    'compare.param.range': 'Narxlar diapazoni',
    'compare.param.savings': 'Maks. foyda',
    'compare.param.platforms': 'Maydonlar',
    'compare.param.inStock': 'Mavjudlik',
    'compare.param.rating': 'Reyting',
    'compare.param.action': 'Takliflar',
    'compare.viewOffers': 'Narxlarni ko\'rish',
    'compare.remove': 'Taqqoslashdan o\'chirish',

    'toast.favOn': 'Tovar narx kuzatuviga qo\'shildi',
    'toast.favOff': 'Tovar narx kuzatuvidan olib tashlandi',
    'toast.compareOn': 'Tovar taqqoslashga qo\'shildi',
    'toast.compareOff': 'Tovar taqqoslashdan olib tashlandi',
    'toast.compareCleared': 'Taqqoslash ro\'yxati tozalandi',
    'toast.compareLimit': 'Bir vaqtning o\'zida 4 tagacha tovarni taqqoslash mumkin',

    'footer.blurb': 'ArzonOL — O\'zbekistonda mebel, texnika va qurilish materiallari narx agregatori. Marketpleyslar takliflarini taqqoslang va tejamli xarid qiling.',
    'footer.disclaimer': 'Diqqat: saytdagi narxlar va mavjudlik ma\'lumotlari ko\'rgazmali bo\'lib, ommaviy oferta hisoblanmaydi.',
    'footer.shop': 'Katalog',
    'footer.help': 'Yordam',
    'footer.company': 'Xizmat haqida',
    'footer.link.selections': 'Tanlovlar',
    'footer.link.brands': 'Brendlar',
    'footer.link.new': 'Yangiliklar',
    'footer.link.sale': 'Eng yaxshi narxlar',
    'footer.link.delivery': 'Yetkazib berish haqida',
    'footer.link.returns': 'Marketpleyslar',
    'footer.link.tracking': 'Narx kuzatuvi',
    'footer.link.support': 'Qo\'llab-quvvatlash',
    'footer.link.about': 'Loyiha haqida',
    'footer.link.jobs': 'Vakansiyalar',
    'footer.link.press': 'Matbuot',
    'footer.link.partners': 'Maydonlarni ulash',
    'footer.legal': 'Maxfiylik siyosati · Shartlar · Demo versiya',

    'cookie.text': 'ArzonOL kuzatilayotgan va taqqoslash ro\'yxatlarini saqlash uchun cookies ishlatadi. Batafsil —',
    'cookie.link': 'maxfiylik siyosatida',
    'cookie.accept': 'Hammasini qabul qilish',
    'cookie.reject': 'Faqat zarurlari',

    'lang.aria': 'Interfeys tili',
    'currency': "so'm",
    'count': ['ta tovar']
  },

  en: {
    'html.lang': 'en',

    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.favorites': 'Tracked prices',
    'nav.compare': 'Comparison',
    'nav.account': 'Account',

    'hero.tagline': 'Compare prices on furniture, appliances and building materials in Uzbekistan',
    'search.placeholder': 'What product or brand are you looking for?',
    'search.label': 'Search products',
    'search.hint': 'Start typing a brand or product name',
    'search.submit': 'Search',
    'search.clear': 'Clear',
    'categories.aria': 'Categories',

    'price.from': 'from',
    'badge.savings': 'Save up to',
    'badge.stores': 'stores',

    'sort.label': 'Sort by:',
    'sort.priceAsc': 'Lowest price',
    'sort.savingsDesc': 'Max savings',
    'sort.ratingDesc': 'Top rated',
    'sort.popularDesc': 'Most popular',

    'filter.all': 'All offers',
    'filter.inStock': 'In stock only',
    'filter.platform': 'Marketplace',

    'region.prefix': 'Delivery to',
    'theme.toggle': 'Color theme',

    'chart.title': 'Price History & Trend',
    'chart.trendDown': 'Price dropped by',
    'chart.trendUp': 'Price increased by',
    'chart.allTimeLow': 'All-time lowest price',
    'chart.bestTime': 'Great time to buy',

    'alert.btn': 'Price Drop Alert',
    'alert.title': 'Get Price Drop Alerts',
    'alert.subtitle': 'We will notify you immediately when the price for this item drops',
    'alert.targetLabel': 'Target price (UZS)',
    'alert.contactLabel': 'Telegram @username or Email',
    'alert.submit': 'Subscribe',
    'alert.success': 'Price alert set! We will notify you when price drops.',

    'results.reset': 'Reset',
    'results.favorites': 'Tracked prices',
    'empty.search': 'Nothing found. Try another brand or category.',
    'empty.favorites': 'Your price tracking list is empty. Tap ♡ on any card to track prices.',

    'section.all': 'All products',
    'cats.title': 'Categories',
    'cats.sub': 'Pick a section — the catalog opens',
    'cats.action': 'Compare prices',
    'bestsellers.title': 'Popular items',
    'bestsellers.sub': 'With highest monthly savings',

    'partners.title': 'Marketplaces & brands',
    'partners.sub': 'Aggregating live offers across Uzbekistan',

    'sheet.close': 'Close',
    'sheet.reviews': 'reviews',
    'sheet.desc': 'Compare live prices across verified Uzbek marketplaces and pick the best offer.',
    'sheet.bestPrice': 'Best price',
    'sheet.savingsPrefix': 'save up to',
    'sheet.inStock': 'In stock',
    'sheet.outOfStock': 'Out of stock',
    'sheet.delivery': 'delivery',
    'sheet.days': 'days',
    'sheet.visit': 'Go to store',
    'sheet.trackPrice': 'Track price',
    'sheet.tracked': 'Tracked',
    'sheet.compareAdd': 'Compare',
    'sheet.compareRemove': 'In comparison',
    'sheet.offersTitle': 'Marketplace offers',
    'sheet.disclaimer': 'Prices and availability are for demonstration purposes and do not constitute a public offer.',

    'compare.drawerTitle': 'Comparison list',
    'compare.empty': 'Comparison list is empty. Add products using the "Compare" button.',
    'compare.openModal': 'Compare products',
    'compare.clear': 'Clear list',
    'compare.modalTitle': 'Product & price comparison',
    'compare.totalBundle': 'Total Bundle Savings',
    'compare.totalBest': 'Best deals sum:',
    'compare.totalSaved': 'Total money saved:',
    'compare.param.bestPrice': 'Best price',
    'compare.param.range': 'Price range',
    'compare.param.savings': 'Max savings',
    'compare.param.platforms': 'Platforms',
    'compare.param.inStock': 'In stock',
    'compare.param.rating': 'Rating',
    'compare.param.action': 'Offers',
    'compare.viewOffers': 'View prices',
    'compare.remove': 'Remove from comparison',

    'toast.favOn': 'Added to price tracking',
    'toast.favOff': 'Removed from price tracking',
    'toast.compareOn': 'Added to comparison',
    'toast.compareOff': 'Removed from comparison',
    'toast.compareCleared': 'Comparison list cleared',
    'toast.compareLimit': 'You can compare up to 4 products at once',

    'footer.blurb': 'ArzonOL — price aggregator for furniture, appliances and building materials in Uzbekistan. Compare marketplace offers and save more.',
    'footer.disclaimer': 'Note: All prices and product availability are demonstrational and do not constitute a public offer.',
    'footer.shop': 'Catalog',
    'footer.help': 'Help',
    'footer.company': 'About service',
    'footer.link.selections': 'Selections',
    'footer.link.brands': 'Brands',
    'footer.link.new': 'New arrivals',
    'footer.link.sale': 'Best deals',
    'footer.link.delivery': 'About delivery',
    'footer.link.returns': 'Marketplaces',
    'footer.link.tracking': 'Price tracking',
    'footer.link.support': 'Support',
    'footer.link.about': 'About project',
    'footer.link.jobs': 'Careers',
    'footer.link.press': 'Press',
    'footer.link.partners': 'For marketplaces',
    'footer.legal': 'Privacy policy · Terms · Demo version',

    'cookie.text': 'ArzonOL uses cookies to save your tracked prices and comparison items. Read more in our',
    'cookie.link': 'privacy policy',
    'cookie.accept': 'Accept all',
    'cookie.reject': 'Essential only',

    'lang.aria': 'Interface language',
    'currency': 'UZS',
    'count': ['product', 'products']
  }
};

/* Текущий язык */
function detectLang() {
  const saved = localStorage.getItem('arzonol:lang') || localStorage.getItem('bozor:lang');
  if (saved && TRANSLATIONS[saved]) return saved;
  const nav = (navigator.language || 'ru').slice(0, 2);
  return TRANSLATIONS[nav] ? nav : 'ru';
}

let LANG = detectLang();

const t = key => TRANSLATIONS[LANG][key] ?? TRANSLATIONS.ru[key] ?? key;
const tr = field => (typeof field === 'string' ? field : field[LANG] ?? field.ru);

function plural(n) {
  const forms = t('count');
  if (forms.length === 1) return forms[0];
  if (forms.length === 2) return forms[n === 1 ? 0 : 1];
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const money = n => `${n.toLocaleString('ru-RU').replace(/ /g, ' ').replace(/ /g, ' ')} ${t('currency')}`;

function formatPriceFrom(amount) {
  if (LANG === 'uz') {
    return `${money(amount)} ${t('price.from')}`;
  }
  return `${t('price.from')} ${money(amount)}`;
}

function formatSavings(amount, percent) {
  return `${t('sheet.savingsPrefix')} ${money(amount)} (${percent}%)`;
}

function formatDelivery(days) {
  return `${days} ${t('sheet.days')}`;
}

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  LANG = lang;
  localStorage.setItem('arzonol:lang', lang);
  document.documentElement.lang = t('html.lang');
}

function applyStaticI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}
