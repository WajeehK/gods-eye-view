(async()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],G=window.GEV,wide=()=>innerWidth>=900;
const [C,CITIES,topo]=await Promise.all([fetch('./data/countries.json?v=5').then(r=>r.json()),fetch('./data/cities.json?v=5').then(r=>r.json()),fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json())]);
const feats=topojson.feature(topo,topo.objects.countries).features.filter(f=>f.properties.name!=='Antarctica');
const by3={};for(const k in C)by3[C[k].iso3]=k;
feats.forEach(f=>{f.c=C[f.id]||Object.values(C).find(c=>c.name===f.properties.name)||{name:f.properties.name};f.iso=f.c.iso3});
const featBy3={};feats.forEach(f=>f.iso&&(featBy3[f.iso]=f));
const OV={RUS:[61,95],USA:[39,-98],CAN:[58,-100],FRA:[46.6,2.4],NOR:[62,10],FJI:[-17.8,178],NZL:[-41.5,173],IDN:[-2,118],CHL:[-33,-71],JPN:[36.5,138.5],GBR:[53,-1.8],ISR:[31.3,35],PSE:[31.5,34.8]};
feats.forEach(f=>{const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;let best=null,ba=0,tot=0;
 for(const p of polys){const r=p[0];let a=0;for(let i=0;i<r.length-1;i++)a+=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];a=Math.abs(a)/2;tot+=a;if(a>ba){ba=a;best=r}}
 f.area=tot;let x=0,y=0,x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;best.forEach(q=>{x+=q[0];y+=q[1];x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])});
 f.ll=OV[f.iso]||[y/best.length,x/best.length];f.ext=Math.max(y1-y0,Math.min(x1-x0,60)*Math.cos(f.ll[0]*Math.PI/180))});
const list=s=>(s||'').split(' ').filter(Boolean),flag=i=>(C[by3[i]]||{}).flag||'';
const LV=['','#9aa0a6','#f5d300','#ff3b30'],LN=['','Tension','Development','Escalation'],KIND=['','Tension','Armed conflict','War'];
const coord=(a,b)=>`${Math.abs(a).toFixed(2)}°${a>=0?'N':'S'}, ${Math.abs(b).toFixed(2)}°${b>=0?'E':'W'}`;
const dist=(a,b)=>{const r=Math.PI/180,d=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 12742*Math.asin(Math.sqrt(d))};
const hotsOf=iso=>G.hot.filter(h=>list(h[4]).includes(iso)),memb=iso=>Object.keys(G.alliances).filter(a=>list(G.alliances[a]).includes(iso));
const fmt=(n,p='')=>n==null?'—':p+(n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':Math.round(n).toLocaleString());
const nearC=h=>list(h[4]).filter(i=>featBy3[i]).sort((a,b)=>dist(featBy3[a].ll,[h[1],h[2]])-dist(featBy3[b].ll,[h[1],h[2]]))[0];
const up=new Date(G.updated),UPD=`UPDATED ${up.getUTCDate()} ${up.toLocaleString('en',{month:'short',timeZone:'UTC'}).toUpperCase()} · ${String(up.getUTCHours()).padStart(2,'0')}:${String(up.getUTCMinutes()).padStart(2,'0')}`;
let sel=null,selLL=null,flying=0;
// globe
const el=$('#globe'),W=Globe({animateIn:false})(el).backgroundColor('#000').showAtmosphere(false).globeImageUrl('./img/earth-dark.jpg')
 .polygonsData(feats).polygonsTransitionDuration(0).polygonSideColor(()=>'rgba(0,0,0,0)')
 .polygonCapColor(f=>f===sel?'rgba(245,211,0,.28)':'rgba(0,0,0,0)').polygonStrokeColor(f=>f===sel?'#f5d300':'rgba(200,200,200,.26)').polygonAltitude(f=>f===sel?.004:.001)
 .onPolygonClick(f=>{const h=hotsOf(f.iso)[0];h?pickStory(T.indexOf(G.hot.indexOf(h))):pickCountry(f)})
 .pointsData(G.hot).pointLat(h=>h[1]).pointLng(h=>h[2]).pointColor(h=>LV[h[3]]).pointAltitude(.003).pointRadius(h=>.26+h[3]*.05).pointsMerge(false).pointsTransitionDuration(0)
 .onPointClick(h=>pickStory(T.indexOf(G.hot.indexOf(h))))
 .ringsData(G.hot.filter(h=>h[3]>1).map(h=>({lat:h[1],lng:h[2],c:h[3]==3?'255,59,48':'245,211,0',r:1+h[3]*.5,p:2200-h[3]*300})))
 .ringColor(d=>t=>`rgba(${d.c},${(1-t)*.9})`).ringMaxRadius(d=>d.r).ringPropagationSpeed(.8).ringRepeatPeriod(d=>d.p).ringAltitude(.002)
 .labelsData(feats.filter(f=>f.area>140&&f.c.name.length<16).sort((a,b)=>b.area-a.area).slice(0,24).map(f=>({t:f.c.name.toUpperCase().split('').join(' '),lat:f.ll[0],lng:f.ll[1],s:.42}))
   .concat(G.seas.map(s=>({t:s[0],lat:s[1],lng:s[2],s:.4}))))
 .labelLat(d=>d.lat).labelLng(d=>d.lng).labelText(d=>d.t).labelSize(d=>d.s).labelDotRadius(0).labelColor(()=>'rgba(120,124,128,.75)').labelResolution(2).labelAltitude(.002)
 .htmlLat(d=>d.lat).htmlLng(d=>d.lng).htmlAltitude(.005).htmlElement(d=>d.el).htmlTransitionDuration(0);
const ctl=W.controls();ctl.autoRotate=false;ctl.zoomSpeed=.8;ctl.rotateSpeed=.6;
// map area + view offset so the globe centre sits under the reticle (centre of area above the card)
let mapH=innerHeight;function layout(){const H=innerHeight,Wd=innerWidth;mapH=wide()?H:H-$('#card').offsetHeight;
 document.documentElement.style.setProperty('--mapc',mapH/2+'px');W.width(Wd).height(H);const cam=W.camera();cam.setViewOffset(Wd,H,0,H/2-mapH/2,Wd,H);cam.updateProjectionMatrix()}
addEventListener('resize',()=>{layout();size()});
const altFor=e=>Math.max(.3,Math.min(3,e/(26.7*Math.min(innerWidth/innerHeight,mapH/innerHeight))));
function fly(lat,lng,alt){flying=Date.now()+1300;W.pointOfView({lat,lng,altitude:alt},1200)}
// html overlays: active-dot coord tag, selected pill, selected country's cities
const H=(cls,txt)=>{const w=document.createElement('div');w.className='hw';const i=document.createElement('div');i.className=cls;i.textContent=txt;w.appendChild(i);return w};
let activeTag=null,selEls=[];const draw=()=>W.htmlElementsData((activeTag?[activeTag]:[]).concat(selEls));
function clearSel(){if(!sel&&!selEls.length)return;sel=null;selEls=[];W.polygonsData(feats);draw()}
ctl.addEventListener('start',()=>{if(Date.now()>flying)clearSel()});
function highlight(f,ll){sel=f;selLL=ll;W.polygonsData(feats);
 const cs=CITIES.filter(c=>c[5]===f.iso),cap=cs.find(c=>c[4]),big=cs.filter(c=>!c[4]).slice(0,cap?3:4);
 const pk=[ll];selEls=[{lat:ll[0],lng:ll[1],el:H('pill',f.c.name)}].concat((cap?[cap]:[]).concat(cs.filter(c=>!c[4]).slice(0,10)).filter(c=>{if(pk.some(q=>dist(q,[c[1],c[2]])<160)||pk.length>4)return false;pk.push([c[1],c[2]]);return true}).map(c=>({lat:c[1],lng:c[2],el:H('city',(c[4]?'★ ':'● ')+c[0].toUpperCase())})));draw()}
// stories
const T=G.hot.map((h,i)=>({h,i})).sort((a,b)=>b.h[3]-a.h[3]).map(o=>o.i);let cur=0;
$('#pager').innerHTML=T.map((_,k)=>`<i data-k="${k}"></i>`).join('');
const head=t=>t.replace(/^(.*?)(\s*[–&(].*)?$/,(m,a,b)=>`<span>${a}</span>${b||''}`);
function storyHTML(h){const c=featBy3[nearC(h)];return`<div class="hl">Live updates from the ${head(h[0])}</div><div class="upd">${UPD}</div>
 <div class="upd2">${list(h[4]).map(flag).join(' ')} ${c?c.c.name:''} · ${KIND[h[3]]} · ${coord(h[1],h[2])}</div><div class="tu"><b>What happened:</b> ${h[5]}</div>`}
function setCard(html,badge,idx){$('#cbody').innerHTML=html;const b=$('#badge');b.className='tag '+(badge?'yk':'red');b.textContent=badge?'Key development':'● Tracking';
 $('#cidx').textContent=idx;$$('#pager i').forEach((x,j)=>x.classList.toggle('on',j===cur&&!badge))}
function story(k){cur=((k%T.length)+T.length)%T.length;const h=G.hot[T[cur]];setCard(storyHTML(h),0,`${String(cur+1).padStart(2,'0')} / ${T.length}`);
 activeTag={lat:h[1],lng:h[2],el:H('ctag',coord(h[1],h[2]))};return h}
function pickStory(k){const h=story(k),f=featBy3[nearC(h)];clearSel();if(f){highlight(f,[h[1],h[2]]);fly(h[1],h[2],altFor(f.ext))}else{draw();fly(h[1],h[2],1.2)}}
function pickCountry(f){clearSel();const c=f.c,al=memb(f.iso);
 setCard(`<div class="hl"><span>${c.name}</span> at a glance</div><div class="upd">${UPD}</div><div class="upd2">${c.flag||''} ${c.capital||''} · ${c.subregion||c.region||''}</div>
 <div class="tu"><b>What happened:</b> led by ${c.hos||'—'}${c.hog&&c.hog!==c.hos?', head of government '+c.hog:''}. Population ${fmt(c.pop)}, GDP ${fmt(c.gdp,'$')}${al.length?'. Member of '+al.join(', '):''}.</div>`,1,'');
 highlight(f,f.ll);fly(f.ll[0],f.ll[1],altFor(f.ext));profile=f}
let profile=null;
$('#pager').onclick=e=>{const k=e.target.dataset.k;if(k!=null)pickStory(+k)};
let sx=null;const cd=$('#card');cd.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
cd.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>45)pickStory(cur+(dx<0?1:-1))});
$('#full').onclick=()=>{const h=G.hot[T[cur]],f=sel||featBy3[nearC(h)],c=f?f.c:{};openDrawer('cp');const st=(k,v)=>`<div class="st"><small>${k}</small><b>${v||'—'}</b></div>`;
 $('#cp').innerHTML=`<h2 style="margin:14px 0 4px">${h[0]}</h2><div class="cat c${h[3]}">${LN[h[3]].toUpperCase()} · ${KIND[h[3]].toUpperCase()}</div><p style="color:#c9cbc6">${h[5]}</p><h4>Involved</h4><div class="chips">${list(h[4]).map(i=>`<span class="chip">${flag(i)} ${(C[by3[i]]||{}).name||i}</span>`).join('')}</div>
 ${f?`<h4>${c.flag||''} ${c.name}</h4><div class="grid">${st('Head of state',c.hos)}${st('Head of government',c.hog)}${st('Population',fmt(c.pop))}${st('GDP',fmt(c.gdp,'$'))}</div>`:''}<h4>Latest headlines</h4><div class="news" id="news">Loading…</div>`;news(h[0].replace(/[()&–]/g,' '))};
async function news(q){const n=$('#news'),g=`https://news.google.com/search?q=${encodeURIComponent(q)}`;
 try{const ac=new AbortController();setTimeout(()=>ac.abort(),8000);const j=await (await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent('"'+q.trim().replace(/\s+/g,' ')+'" sourcelang:english')}&mode=artlist&maxrecords=6&sort=datedesc&format=json&timespan=3d`,{signal:ac.signal})).json();
  if(!j.articles||!j.articles.length)throw 0;n.innerHTML=j.articles.map(a=>`<a href="${a.url}" target="_blank" rel="noopener">${a.title}<br><small>${a.domain}</small></a>`).join('')}
 catch(e){n.innerHTML=`<a href="${g}" target="_blank" rel="noopener">Open latest ${q} news →</a>`}}
// drawer, ticker, search
$('#ev').innerHTML=T.map((i,k)=>{const h=G.hot[i];return`<div class="rep" data-k="${k}"><div class="rtop"><span class="rn">${list(h[4]).slice(0,3).map(flag).join('')} ${h[0]}</span><span class="cat c${h[3]}">${LN[h[3]].toUpperCase()}</span></div><p>${h[5]}</p></div>`}).join('');
$('#ev').onclick=e=>{const d=e.target.closest('.rep');if(d){closeDrawer();pickStory(+d.dataset.k)}};
function openDrawer(t){$('#drawer').classList.remove('hide');tab(t)}function closeDrawer(){$('#drawer').classList.add('hide')}
$('#menu').onclick=()=>$('#drawer').classList.contains('hide')?openDrawer('ev'):closeDrawer();$('#dx').onclick=closeDrawer;
$$('.rt').forEach(t=>t.onclick=()=>tab(t.dataset.t));function tab(t){$$('.rt').forEach(x=>x.classList.toggle('on',x.dataset.t===t));$('#ev').classList.toggle('hide',t!=='ev');$('#cp').classList.toggle('hide',t!=='cp');$('#inst').classList.toggle('hide',t!=='ev'||standalone)}
$('#tkin').innerHTML=T.map(i=>{const h=G.hot[i];return`<span><i class="c${h[3]}">${LN[h[3]].toUpperCase()}</i>${h[0]} — ${h[5]}</span>`}).join('');
$('#cl').innerHTML=feats.map(f=>`<option value="${f.c.name}">`).sort().join('');
$('#sbtn').onclick=()=>{$('#q').classList.toggle('hide');$('#q').focus()};
$('#q').onchange=e=>{const f=feats.find(f=>f.c.name.toLowerCase()===e.target.value.toLowerCase());if(f){const h=hotsOf(f.iso)[0];h?pickStory(T.indexOf(G.hot.indexOf(h))):pickCountry(f);e.target.value='';e.target.blur();$('#q').classList.add('hide')}};
// install
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;let bip=null;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
$('#ihint').textContent=ios?'On iPhone: tap Share (□↑) in Safari, then "Add to Home Screen".':'If the button does nothing, open Chrome\'s ⋮ menu → "Install app" / "Add to Home screen".';
addEventListener('beforeinstallprompt',e=>{e.preventDefault();bip=e;$('#ibtn').textContent='⬇ INSTALL APP'});
$('#ibtn').onclick=async()=>{if(bip){bip.prompt();await bip.userChoice;bip=null}else alert($('#ihint').textContent)};
if(ios)$('#ibtn').textContent='⬇ ADD TO HOME SCREEN';
// initial view
layout();const h0=story(0);draw();W.pointOfView({lat:h0[1],lng:h0[2],altitude:1.7});
// liquid-glass dock
const dock=$('#dock'),bub=$('#bubble'),tbs=$$('.tb');let bx=0,bv=0,btgt=0,bw=0,sc=1,scT=1,drag=null,active=0,still=0;
const slotX=i=>tbs[i].offsetLeft;function size(){bw=tbs[0].offsetWidth;bub.style.width=bw+'px';btgt=slotX(active)}
function step(){const k=drag?.5:.16,d=drag?.55:.72;bv=(bv+(btgt-bx)*k)*d;bx+=bv;sc+=(scT-sc)*.25;const s=1+Math.min(Math.abs(bv)/40,.25);
 bub.style.transform=`translateX(${bx}px) scale(${s*sc},${sc/Math.sqrt(s)})`;if(Math.abs(bv)<.01&&Math.abs(btgt-bx)<.1&&Math.abs(scT-sc)<.001&&!drag){still=0;return}requestAnimationFrame(step)}
const kick=()=>{if(!still){still=1;requestAnimationFrame(step)}};
function choose(i){active=i;btgt=slotX(i);tbs.forEach((b,j)=>b.classList.toggle('on',j===i));const t=tbs[i].dataset.t;$('#soon').classList.toggle('hide',t==='globe');$('#soont').textContent=t;kick()}
const nearest=x=>{let b=0,bd=1e9;tbs.forEach((t,i)=>{const d=Math.abs(slotX(i)-x);if(d<bd){bd=d;b=i}});return b};
const rub=x=>{const mn=slotX(0),mx=slotX(tbs.length-1);return x<mn?mn-(mn-x)*.3:x>mx?mx+(x-mx)*.3:x};
dock.addEventListener('pointerdown',e=>{dock.setPointerCapture(e.pointerId);const r=dock.getBoundingClientRect();drag={l:r.left};scT=1.08;dock.classList.add('drag');btgt=rub(e.clientX-r.left-bw/2);kick();try{navigator.vibrate&&navigator.vibrate(5)}catch(_){}});
dock.addEventListener('pointermove',e=>{if(drag){btgt=rub(e.clientX-drag.l-bw/2);kick()}});
const end=()=>{if(!drag)return;drag=null;scT=1;dock.classList.remove('drag');choose(nearest(btgt))};dock.addEventListener('pointerup',end);dock.addEventListener('pointercancel',end);
size();bx=btgt=slotX(0);still=1;step();
window.__gev={W,pickStory,T,G,pickCountry:n=>pickCountry(feats.find(f=>f.c.name===n))};
})();
