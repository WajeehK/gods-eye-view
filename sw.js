const V='gev-v4';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(['./','index.html?v=4','style.css?v=4','app.js?v=4','data/world.js?v=4','data/countries.json?v=4','img/earth-grey.jpg','img/icon-192.png','data/cities.json?v=4']).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||r.url.includes('gdeltproject'))return;
 e.respondWith(fetch(r).then(res=>{if(res.ok&&(res.type==='basic'||res.type==='cors')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))))});
