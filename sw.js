const V='gev-v5',CORE=['./','./index.html','./style.css?v=5','./app.js?v=5','./data/world.js?v=5','./data/countries.json?v=5','./data/cities.json?v=5','./img/earth-dark.jpg','./img/icon-192.png','./manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||r.url.includes('gdeltproject'))return;
 e.respondWith(fetch(r).then(res=>{if(res.ok&&(res.type==='basic'||res.type==='cors')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})
 .catch(()=>caches.match(r,{ignoreSearch:r.mode==='navigate'}).then(m=>m||(r.mode==='navigate'?caches.match('./'):new Response('',{status:504})))))});
