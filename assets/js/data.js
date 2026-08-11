/* ==========================================================================
   Каталог: мебель, техника, стройматериалы
   Bozor — агрегатор цен по торговым площадкам Узбекистана

   Фото лежат локально в assets/img/products/ — <id>.jpg и <id>-1..3.jpg.
   Все изображения локальные для автономной работы на демо.
   ========================================================================== */

const img = (id, n) => `assets/img/products/${id}${n ? `-${n}` : ''}.jpg`;

/* Справочник площадок с реальными узбекскими маркетплейсами */
const PLATFORMS = [
  { id: 'uzum',      name: 'Uzum Market', color: '#7000ff' },
  { id: 'olcha',     name: 'Olcha',       color: '#f04e23' },
  { id: 'texnomart', name: 'Texnomart',   color: '#e31e24' },
  { id: 'mediapark', name: 'Mediapark',   color: '#0066b3' },
  { id: 'asaxiy',    name: 'Asaxiy',      color: '#1a7f4e' },
  { id: 'idea',      name: 'Idea',        color: '#ff6b00' },
  { id: 'elmakon',   name: 'Elmakon',     color: '#004b93' },
  { id: 'zoodmall',  name: 'ZoodMall',    color: '#00b2a9' }
];

const platformOf = id => PLATFORMS.find(p => p.id === id) || { id, name: id, color: '#787574' };

/* Регионы и города Узбекистана для расчёта доставки */
const REGIONS = [
  { id: 'tashkent',  name: { ru: 'Ташкент', uz: 'Toshkent', en: 'Tashkent' }, offset: 0 },
  { id: 'samarkand', name: { ru: 'Самарканд', uz: 'Samarqand', en: 'Samarkand' }, offset: 1 },
  { id: 'bukhara',   name: { ru: 'Бухара', uz: 'Buxoro', en: 'Bukhara' }, offset: 1 },
  { id: 'fergana',   name: { ru: 'Фергана', uz: "Farg'ona", en: 'Fergana' }, offset: 1 },
  { id: 'namangan',  name: { ru: 'Наманган', uz: 'Namangan', en: 'Namangan' }, offset: 2 },
  { id: 'andijan',   name: { ru: 'Андижан', uz: 'Andijon', en: 'Andijan' }, offset: 2 }
];

const regionOf = id => REGIONS.find(r => r.id === id) || REGIONS[0];

const CATEGORIES = [
  { id: 'mebel',    icon: '#b0553f', glyph: 'bed',
    label: { ru: 'Мебель',         uz: 'Mebel',                 en: 'Furniture' },
    hint:  { ru: 'диваны, шкафы, столы',
             uz: 'divanlar, shkaflar, stollar',
             en: 'sofas, wardrobes, tables' } },
  { id: 'qurilish', icon: '#7a9a6b', glyph: 'house',
    label: { ru: 'Стройматериалы', uz: 'Qurilish materiallari', en: 'Building materials' },
    hint:  { ru: 'отделка, крепёж, смеси',
             uz: 'pardoz, mahkamlagich, aralashmalar',
             en: 'finishing, fasteners, mixes' } },
  { id: 'texnika',  icon: '#2f6fd0', glyph: 'monitor',
    label: { ru: 'Техника',        uz: 'Texnika',               en: 'Appliances' },
    hint:  { ru: 'кухня, климат, уборка',
             uz: 'oshxona, iqlim, tozalash',
             en: 'kitchen, climate, cleaning' } }
];

/* Каталог товаров с предложениями различных площадок */
const PRODUCTS = [
  /* ---------- Мебель ---------- */
  {
    id: 'f01', cat: 'mebel', brand: 'Milan Mebel', rating: 4.8, reviews: 412, sold: 118,
    title: { ru: 'Угловой диван «Милан»', uz: 'Burchak divan «Milan»', en: 'Corner Sofa "Milan"' },
    offers: [
      { platform: 'uzum',      price: 8900000,  inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 9350000,  inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',    price: 9600000,  inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall',  price: 10200000, inStock: true,  delivery: 3, url: '#demo' },
      { platform: 'texnomart', price: 8750000,  inStock: false, delivery: 4, url: '#demo' }
    ]
  },
  {
    id: 'f02', cat: 'mebel', brand: 'Uy Mebel', rating: 4.7, reviews: 288, sold: 96,
    title: { ru: 'Кровать двуспальная 160×200', uz: 'Ikki kishilik krovat 160×200', en: 'Double Bed 160×200' },
    offers: [
      { platform: 'olcha',    price: 5400000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',     price: 5650000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall', price: 5900000, inStock: true,  delivery: 3, url: '#demo' },
      { platform: 'asaxiy',   price: 6200000, inStock: false, delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'f03', cat: 'mebel', brand: 'Aura Mebel', rating: 4.6, reviews: 197, sold: 74,
    title: { ru: 'Шкаф-купе трёхдверный', uz: 'Uch eshikli kupe shkaf', en: 'Three-Door Sliding Wardrobe' },
    offers: [
      { platform: 'uzum',     price: 4200000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'olcha',    price: 4500000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'idea',     price: 4750000, inStock: true,  delivery: 3, url: '#demo' },
      { platform: 'mediapark',price: 4990000, inStock: true,  delivery: 4, url: '#demo' }
    ]
  },
  {
    id: 'f04', cat: 'mebel', brand: 'Grand Wood', rating: 4.9, reviews: 341, sold: 132,
    title: { ru: 'Обеденный стол дубовый 140×80', uz: 'Dubli tushlik stoli 140×80', en: 'Oak Dining Table 140×80' },
    offers: [
      { platform: 'olcha',    price: 2800000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy',   price: 2950000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'uzum',     price: 3100000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall', price: 3400000, inStock: false, delivery: 4, url: '#demo' }
    ]
  },
  {
    id: 'f05', cat: 'mebel', brand: 'ErgoComfort', rating: 4.8, reviews: 520, sold: 210,
    title: { ru: 'Кресло офисное эргономичное', uz: 'Ergonomik ofis kreslosi', en: 'Ergonomic Office Chair' },
    offers: [
      { platform: 'uzum',      price: 1650000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 1780000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 1850000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'elmakon',   price: 1990000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'f06', cat: 'mebel', brand: 'LoftHome', rating: 4.5, reviews: 142, sold: 65,
    title: { ru: 'Комод на 4 ящика', uz: '4 tortmali komod', en: 'Four-Drawer Dresser' },
    offers: [
      { platform: 'olcha',   price: 1950000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'uzum',    price: 2100000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',  price: 2280000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'f07', cat: 'mebel', brand: 'KuxnyaLux', rating: 4.7, reviews: 168, sold: 52,
    title: { ru: 'Кухонный гарнитур модульный 2.4м', uz: 'Modulli oshxona garnituri 2.4m', en: 'Modular Kitchen Set 2.4m' },
    offers: [
      { platform: 'uzum',     price: 12400000, inStock: true,  delivery: 3, url: '#demo' },
      { platform: 'olcha',    price: 13200000, inStock: true,  delivery: 3, url: '#demo' },
      { platform: 'mediapark',price: 13900000, inStock: true,  delivery: 4, url: '#demo' },
      { platform: 'asaxiy',   price: 14500000, inStock: false, delivery: 5, url: '#demo' }
    ]
  },
  {
    id: 'f08', cat: 'mebel', brand: 'Nordic Wood', rating: 4.6, reviews: 183, sold: 88,
    title: { ru: 'Стеллаж открытый, 5 полок', uz: 'Ochiq stellaj, 5 javon', en: 'Open Shelving Unit 5 Tiers' },
    offers: [
      { platform: 'uzum',    price: 890000,  inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',   price: 950000,  inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',  price: 1050000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'f09', cat: 'mebel', brand: 'ModernLine', rating: 4.7, reviews: 220, sold: 94,
    title: { ru: 'Тумба под телевизор 160 см', uz: 'Televizor osti tumbasi 160 sm', en: 'TV Stand 160 cm' },
    offers: [
      { platform: 'olcha',     price: 1420000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',      price: 1490000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'texnomart', price: 1650000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'idea',      price: 1720000, inStock: false, delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'f10', cat: 'mebel', brand: 'SleepWell', rating: 4.9, reviews: 630, sold: 290,
    title: { ru: 'Матрас ортопедический 160×200', uz: 'Ortopedik matras 160×200', en: 'Orthopedic Mattress 160×200' },
    offers: [
      { platform: 'uzum',    price: 3200000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',   price: 3450000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',  price: 3700000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall',price: 3990000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'f11', cat: 'mebel', brand: 'LoftHome', rating: 4.6, reviews: 175, sold: 110,
    title: { ru: 'Стулья мягкие, комплект 4 шт', uz: 'Yumshoq stullar, 4 dona to\'plam', en: 'Upholstered Chairs Set of 4' },
    offers: [
      { platform: 'olcha',  price: 1850000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'uzum',   price: 1980000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy', price: 2150000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'f12', cat: 'mebel', brand: 'Milan Mebel', rating: 4.8, reviews: 260, sold: 82,
    title: { ru: 'Прихожая с зеркалом и вешалкой', uz: 'Ko\'zguli va ilgichli dahliz mebeli', en: 'Hallway Unit with Mirror' },
    offers: [
      { platform: 'uzum',      price: 2750000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'olcha',     price: 2990000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'mediapark', price: 3250000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },

  /* ---------- Техника ---------- */
  {
    id: 't01', cat: 'texnika', brand: 'Samsung', rating: 4.9, reviews: 840, sold: 340,
    title: { ru: 'Холодильник Side-by-Side 510 л', uz: 'Side-by-Side muzlatkich 510 l', en: 'Side-by-Side Refrigerator 510L' },
    offers: [
      { platform: 'texnomart', price: 14200000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'mediapark', price: 14650000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',      price: 14890000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'olcha',     price: 15100000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'idea',      price: 15450000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'elmakon',   price: 15900000, inStock: false, delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 't02', cat: 'texnika', brand: 'LG', rating: 4.8, reviews: 710, sold: 280,
    title: { ru: 'Стиральная машина 7 кг Steam', uz: 'Kir yuvish mashinasi 7 kg Steam', en: 'Front Load Washing Machine 7kg' },
    offers: [
      { platform: 'olcha',     price: 5290000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 5450000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',      price: 5600000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',    price: 5750000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'mediapark', price: 5890000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 't03', cat: 'texnika', brand: 'Artel', rating: 4.7, reviews: 950, sold: 430,
    title: { ru: 'Кондиционер инверторный 12000 BTU', uz: 'Invertor konditsioner 12000 BTU', en: 'Inverter Air Conditioner 12000 BTU' },
    offers: [
      { platform: 'uzum',      price: 4100000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 4250000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 4320000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'idea',      price: 4480000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'mediapark', price: 4600000, inStock: false, delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 't04', cat: 'texnika', brand: 'Xiaomi', rating: 4.8, reviews: 1200, sold: 610,
    title: { ru: 'Телевизор 55" 4K Smart TV A2', uz: 'Televizor 55" 4K Smart TV A2', en: 'Smart TV 55" 4K HDR' },
    offers: [
      { platform: 'asaxiy',    price: 4690000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',      price: 4790000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 4950000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 5120000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'elmakon',   price: 5290000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 't05', cat: 'texnika', brand: 'Panasonic', rating: 4.7, reviews: 310, sold: 185,
    title: { ru: 'Микроволновая печь 25 л гриль', uz: 'Mikroto\'lqinli pech 25 l grill', en: 'Microwave Oven 25L Grill' },
    offers: [
      { platform: 'olcha',     price: 1390000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',      price: 1450000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 1520000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 't06', cat: 'texnika', brand: 'Philips', rating: 4.8, reviews: 490, sold: 240,
    title: { ru: 'Пылесос циклонный без мешка 2000 Вт', uz: 'Qopsiz siklon changyutgich 2000 Vt', en: 'Bagless Cyclonic Vacuum 2000W' },
    offers: [
      { platform: 'uzum',      price: 1580000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 1650000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 1720000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',    price: 1840000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 't07', cat: 'texnika', brand: 'Bosch', rating: 4.9, reviews: 360, sold: 145,
    title: { ru: 'Духовой шкаф электрический встраиваемый', uz: 'O\'rnatiladigan elektr duxovka', en: 'Built-in Electric Oven' },
    offers: [
      { platform: 'mediapark', price: 6200000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 6450000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'olcha',     price: 6700000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',    price: 6990000, inStock: false, delivery: 4, url: '#demo' }
    ]
  },
  {
    id: 't08', cat: 'texnika', brand: 'Beko', rating: 4.7, reviews: 290, sold: 130,
    title: { ru: 'Посудомоечная машина 60 см 14 компл.', uz: 'Idish yuvish mashinasi 60 sm 14 komplekt', en: 'Dishwasher 60cm 14 Settings' },
    offers: [
      { platform: 'texnomart', price: 4790000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 4950000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'uzum',      price: 5100000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'idea',      price: 5350000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 't09', cat: 'texnika', brand: 'Dreame', rating: 4.9, reviews: 680, sold: 370,
    title: { ru: 'Робот-пылесос с влажной уборкой', uz: 'Nam tozalovchi robot-changyutgich', en: 'Robot Vacuum with Wet Mopping' },
    offers: [
      { platform: 'uzum',      price: 3650000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy',    price: 3790000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 3950000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'texnomart', price: 4150000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 't10', cat: 'texnika', brand: 'Ariston', rating: 4.8, reviews: 540, sold: 290,
    title: { ru: 'Водонагреватель электрический 80 л', uz: 'Elektr suv isitgich 80 l', en: 'Electric Water Heater Boiler 80L' },
    offers: [
      { platform: 'olcha',     price: 1980000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',      price: 2050000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 2190000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',    price: 2320000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 't11', cat: 'texnika', brand: 'DeLonghi', rating: 4.9, reviews: 420, sold: 195,
    title: { ru: 'Кофемашина автоматическая Magnifica', uz: 'Avtomatik kofemashina Magnifica', en: 'Automatic Coffee Machine Magnifica' },
    offers: [
      { platform: 'mediapark', price: 7400000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'texnomart', price: 7650000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 7890000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'uzum',      price: 8100000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 't12', cat: 'texnika', brand: 'Gorenje', rating: 4.7, reviews: 310, sold: 140,
    title: { ru: 'Варочная панель индукционная 4 зоны', uz: '4 zonali induksion pishirish paneli', en: 'Induction Cooktop 4 Zones' },
    offers: [
      { platform: 'texnomart', price: 4200000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',     price: 4390000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'uzum',      price: 4550000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'mediapark', price: 4780000, inStock: false, delivery: 3, url: '#demo' }
    ]
  },

  /* ---------- Стройматериалы ---------- */
  {
    id: 'q01', cat: 'qurilish', brand: 'Ceramica Grani', rating: 4.8, reviews: 390, sold: 520,
    title: { ru: 'Керамогранит 60×60 мрамор, м²', uz: 'Marmar keramogranit 60×60, m²', en: 'Porcelain Tile 60x60 Marble, m²' },
    offers: [
      { platform: 'uzum',    price: 185000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',   price: 198000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',  price: 215000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall',price: 230000, inStock: false, delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'q02', cat: 'qurilish', brand: 'Qizilqum Cement', rating: 4.9, reviews: 880, sold: 1400,
    title: { ru: 'Цемент М400, мешок 50 кг', uz: 'Sement M400, 50 kg qop', en: 'Cement M400, 50 kg Bag' },
    offers: [
      { platform: 'uzum',    price: 68000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',   price: 72000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy',  price: 75000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'q03', cat: 'qurilish', brand: 'FarbaLux', rating: 4.7, reviews: 310, sold: 410,
    title: { ru: 'Краска водоэмульсионная интерьерная 10 л', uz: 'Suv-emulsiya ichki bo\'yoq 10 l', en: 'Interior Wall Paint 10L Bucket' },
    offers: [
      { platform: 'olcha',  price: 240000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',   price: 255000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy', price: 275000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'q04', cat: 'qurilish', brand: 'Kronotex', rating: 4.8, reviews: 450, sold: 680,
    title: { ru: 'Ламинат 33 класс Дуб Натур, м²', uz: 'Laminat 33 sinf Dub Natur, m²', en: 'Oak Laminate Flooring 33 Class, m²' },
    offers: [
      { platform: 'uzum',    price: 145000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',   price: 158000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy',  price: 168000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall',price: 182000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'q05', cat: 'qurilish', brand: 'Knauf', rating: 4.9, reviews: 760, sold: 1100,
    title: { ru: 'Гипсокартон влагостойкий 12.5 мм, лист', uz: 'Namga chidamli gipsokarton 12.5 mm, list', en: 'Moisture Resistant Drywall 12.5mm' },
    offers: [
      { platform: 'uzum',   price: 62000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',  price: 66000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy', price: 71000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'q06', cat: 'qurilish', brand: 'ProfNastil', rating: 4.6, reviews: 290, sold: 850,
    title: { ru: 'Профиль CD 60×27 оцинкованный, 3 м', uz: 'Ruxlangan CD 60×27 profil, 3 m', en: 'Galvanized Metal Profile CD 60x27, 3m' },
    offers: [
      { platform: 'olcha',   price: 27000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',    price: 29000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy',  price: 31000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall',price: 34000, inStock: false, delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'q07', cat: 'qurilish', brand: 'Ursa', rating: 4.8, reviews: 340, sold: 490,
    title: { ru: 'Утеплитель минвата рулон 10 м²', uz: 'Mineral paxta izolyatsiya rulon 10 m²', en: 'Mineral Wool Thermal Insulation 10 m²' },
    offers: [
      { platform: 'uzum',   price: 195000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',  price: 210000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy', price: 230000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'q08', cat: 'qurilish', brand: 'Grohe', rating: 4.9, reviews: 510, sold: 320,
    title: { ru: 'Смеситель для кухни хром', uz: 'Oshxona uchun xrom jo\'mrak', en: 'Chrome Kitchen Sink Faucet Mixer' },
    offers: [
      { platform: 'olcha',    price: 1250000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',     price: 1320000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy',   price: 1440000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'zoodmall', price: 1560000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'q09', cat: 'qurilish', brand: 'EuroBrick', rating: 4.7, reviews: 230, sold: 980,
    title: { ru: 'Кирпич облицовочный красный, 100 шт', uz: 'Qizil qoplama g\'isht, 100 dona', en: 'Red Facing Brick Pack of 100' },
    offers: [
      { platform: 'uzum',   price: 340000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'olcha',  price: 365000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy', price: 395000, inStock: true,  delivery: 3, url: '#demo' }
    ]
  },
  {
    id: 'q10', cat: 'qurilish', brand: 'GrandDeco', rating: 4.6, reviews: 280, sold: 440,
    title: { ru: 'Обои виниловые на флизелине 1.06×10 м', uz: 'Flizelin asosli vinil oboy 1.06×10 m', en: 'Vinyl Wallpaper Roll 1.06x10 m' },
    offers: [
      { platform: 'olcha',  price: 210000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',   price: 225000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy', price: 245000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'q11', cat: 'qurilish', brand: 'Cersanit', rating: 4.8, reviews: 360, sold: 580,
    title: { ru: 'Плитка настенная белая 30×60, м²', uz: 'Oq devor koshin 30×60, m²', en: 'Subway Wall Tile White 30x60, m²' },
    offers: [
      { platform: 'uzum',   price: 155000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'olcha',  price: 168000, inStock: true,  delivery: 2, url: '#demo' },
      { platform: 'asaxiy', price: 182000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  },
  {
    id: 'q12', cat: 'qurilish', brand: 'Ceresit', rating: 4.9, reviews: 490, sold: 820,
    title: { ru: 'Затирка для швов водоотталкивающая 5 кг', uz: 'Suv qaytaruvchi chok qorishmasi 5 kg', en: 'Waterproof Tile Grout 5 kg' },
    offers: [
      { platform: 'olcha',  price: 85000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'uzum',   price: 89000, inStock: true,  delivery: 1, url: '#demo' },
      { platform: 'asaxiy', price: 97000, inStock: true,  delivery: 2, url: '#demo' }
    ]
  }
];

/* Заполняем пути к картинкам */
PRODUCTS.forEach(p => {
  p.image = img(p.id);
  p.thumbs = [img(p.id, 1), img(p.id, 2), img(p.id, 3)];
});

/* Лучшее предложение (минимальная цена среди тех, что в наличии) */
function bestOffer(product) {
  if (!product || !product.offers || !product.offers.length) {
    return { platform: 'uzum', price: 0, inStock: false, delivery: 0, url: '#' };
  }
  const inStockOffers = product.offers.filter(o => o.inStock);
  const pool = inStockOffers.length ? inStockOffers : product.offers;
  return pool.reduce((min, cur) => cur.price < min.price ? cur : min, pool[0]);
}

/* Худшее (самое дорогое) предложение среди тех, что в наличии */
function worstOffer(product) {
  if (!product || !product.offers || !product.offers.length) {
    return { platform: 'uzum', price: 0, inStock: false, delivery: 0, url: '#' };
  }
  const inStockOffers = product.offers.filter(o => o.inStock);
  const pool = inStockOffers.length ? inStockOffers : product.offers;
  return pool.reduce((max, cur) => cur.price > max.price ? cur : max, pool[0]);
}

/* Диапазон цен */
function priceRange(product) {
  const best = bestOffer(product);
  const worst = worstOffer(product);
  return { min: best.price, max: worst.price };
}

/* Экономия */
function savings(product) {
  const range = priceRange(product);
  const diff = Math.max(0, range.max - range.min);
  const percent = range.max > 0 ? Math.round((diff / range.max) * 100) : 0;
  return { amount: diff, percent };
}

/* Число предложений в наличии */
function inStockCount(product) {
  if (!product || !product.offers) return 0;
  return product.offers.filter(o => o.inStock).length;
}

/* Расчёт срока доставки с учётом выбранного региона */
function calcDeliveryDays(offer, regionId) {
  const region = regionOf(regionId);
  return offer.delivery + region.offset;
}

/* 6-месячная история цен для SVG-графика */
function priceHistory(product) {
  const best = bestOffer(product).price;
  const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
  const factors = [1.14, 1.11, 1.09, 1.05, 1.02, 1.0];
  return months.map((m, i) => ({
    date: m,
    price: Math.round((best * factors[i]) / 1000) * 1000
  }));
}

/* Анализ тренда цены */
function priceTrend(product) {
  const history = priceHistory(product);
  const start = history[0].price;
  const current = history[history.length - 1].price;
  const diff = start - current;
  const percent = Math.round((diff / start) * 100);
  return {
    diff,
    percent,
    isDrop: diff > 0,
    isAllTimeLow: current <= Math.min(...history.map(h => h.price))
  };
}

/* Калькулятор общей экономии комплекта товаров */
function totalBundleSavings(productIds) {
  const products = productIds.map(byId).filter(Boolean);
  if (!products.length) return { bestTotal: 0, worstTotal: 0, savedAmount: 0, savedPercent: 0 };
  const bestTotal = products.reduce((sum, p) => sum + bestOffer(p).price, 0);
  const worstTotal = products.reduce((sum, p) => sum + worstOffer(p).price, 0);
  const savedAmount = Math.max(0, worstTotal - bestTotal);
  const savedPercent = worstTotal > 0 ? Math.round((savedAmount / worstTotal) * 100) : 0;
  return { bestTotal, worstTotal, savedAmount, savedPercent };
}

/* Секции главной */
const SECTIONS = ['mebel', 'qurilish', 'texnika'];

/* Лента над вордмарком */
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

/* Партнёры и маркетплейсы */
const PARTNERS = [
  { name: 'Uzum Market',  color: '#7000ff' },
  { name: 'Olcha',        color: '#f04e23' },
  { name: 'Texnomart',    color: '#e31e24' },
  { name: 'Mediapark',    color: '#0066b3' },
  { name: 'Asaxiy',       color: '#1a7f4e' },
  { name: 'Idea',         color: '#ff6b00' },
  { name: 'Elmakon',      color: '#004b93' },
  { name: 'ZoodMall',     color: '#00b2a9' },
  { name: 'Milan Mebel',  color: '#b0553f' },
  { name: 'Artel',        color: '#d95f4c' },
  { name: 'Grohe',        color: '#0066b3' },
  { name: 'Knauf',        color: '#2f6fd0' }
];
