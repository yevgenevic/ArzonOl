const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
function context() {
  const elements = new Map();
  const document = {querySelector: key => {
    if (!elements.has(key)) elements.set(key, {innerHTML:'',textContent:'',addEventListener(){}});
    return elements.get(key);
  }};
  const c = vm.createContext({document,location:{origin:'http://localhost'},URL,AbortController,setTimeout,clearTimeout,console,
    localStorage:{getItem(){return null;},setItem(){},removeItem(){}},
    t:key=>key,tr:value=>value.ru,LANG:'ru'});
  for (const file of ['api.js','data.js','search.js','app.js']) {
    let s=fs.readFileSync(path.join(root,'frontend/assets/js',file),'utf8');
    if (file==='app.js') s=s.replace(/\nboot\(\);\s*$/, '\n');
    vm.runInContext(s,c);
  }
  return {c,e:elements,run:s=>vm.runInContext(s,c)};
}
test('Profile and search activity strings are escaped in HTML',async()=>{
  const {run,e,c}=context();
  run(`currentUser={name:'<img src=x onerror=alert(1)>',email:'test@example.com'}; renderAuthUI();`);
  const html=e.get('#auth-actions').innerHTML;
  assert(!html.includes('<img'));
  assert(html.includes('&lt;img'));
  c.activity={viewed:[],searches:[{query:'"><img src=x onerror=alert(1)>',at:'2026-09-25'}]};
  run('api=async()=>activity'); await run('loadActivity()');
  assert(!e.get('#cabinet-searches').innerHTML.includes('<img'));
});
test('Guest availability filters do not depend on hidden prices',()=>{
  const {run}=context();
  run(`PRODUCTS=[{id:'a',offers:[],availability:[{platform:'uzum',inStock:true}]},{id:'b',offers:[],availability:[{platform:'olcha',inStock:false}]}]; state.inStockOnly=true; state.sort='priceAsc'; state.platformFilter='uzum';`);
  assert.equal(run('sortAndFilterItems(PRODUCTS).map(p=>p.id).join()'),'a');
});
test('Missing history and stock do not invent a deal',()=>{
  const {run}=context();
  assert.equal(run('priceHistory({}).length'),0);
  assert.equal(run('priceTrend({}).isAllTimeLow'),false);
  assert.equal(run('bestOffer({offers:[{price:100,inStock:false}]}).inStock'),false);
});
test('Failed API does not restore a made-up catalogue',async()=>{
  const {run}=context();
  run(`api=async()=>{throw new Error('offline')}`);
  await assert.rejects(run('loadCatalog()'),/offline/);
  assert.equal(run('PRODUCTS.length'),0);
  assert.equal(run('CATALOG_UNLOCKED'),false);
});
test('Empty successful catalogue clears previous data',async()=>{
  const {run}=context();
  run(`PRODUCTS=[{id:'old'}]; api=async(path)=>path==='/api/catalog'?{platforms:[],categories:[],regions:[]}:{products:[],unlocked:false}`);
  await run('loadCatalog()');
  assert.equal(run('PRODUCTS.length'),0);
});
test('URLs cannot execute script',()=>{
  const {run}=context();
  assert.equal(run(`safeURL('javascript:alert(1)')`),'#');
  assert.equal(run(`safeURL('data:text/html,test')`),'#');
  assert.equal(run(`safeURL('https://example.com/item')`),'https://example.com/item');
});
