(async()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],G=window.GEV,mob=()=>innerWidth<900;
const C=await (await fetch('data/countries.json?v=4')).json();const CITIES=await (await fetch('data/cities.json?v=4')).json();
const topo=await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')).json();
const feats=topojson.feature(topo,topo.objects.countries).features.filter(f=>f.properties.name!=='Antarctica');
const by3={};for(const k in C)by3[C[k].iso3]=k;
const info=f=>C[f.id]||Object.values(C).find(c=>c.name===f.properties.name)||{name:f.properties.name};
feats.forEach(f=>{f.c=info(f);f.iso=f.c.iso3});
const featBy3={};feats.forEach(f=>f.iso&&(featBy3[f.iso]=f));
const OV={RUS:[61,95],USA:[39,-98],CAN:[58,-100],FRA:[46.6,2.4],NOR:[62,10],FJI:[-17.8,178],NZL:[-41.5,173],IDN:[-2,118],CHL:[-33,-71],JPN:[36.5,138.5],GBR:[53,-1.8],ISR:[31.3,35],PSE:[31.5,34.8]};
let area={};
function centroid(f){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;let best=null,ba=0,tot=0;
 for(const p of polys){const r=p[0];let a=0;for(let i=0;i<r.length-1;i++)a+=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];a=Math.abs(a);tot+=a;if(a>ba){ba=a;best=r}}
 f.area=tot;if(OV[f.iso])return OV[f.iso];let x=0,y=0;best.forEach(q=>{x+=q[0];y+=q[1]});return[y/best.length,x/best.length]}
feats.forEach(f=>f.ll=centroid(f));
const ll3=i=>featBy3[i]?featBy3[i].ll:null,list=s=>(s||'').split(' ').filter(Boolean);
const memb=iso=>Object.keys(G.alliances).filter(a=>list(G.alliances[a]).includes(iso));
const hotsOf=iso=>G.hot.filter(h=>list(h[4]).includes(iso));
const LV=['','#9aa0a6','#f2d200','#ff3b30'],LN=['','Tension','Development','Escalation'],KIND=['','Tension','Armed conflict','War'];
const flag=i=>(C[by3[i]]||{}).flag||'';
const coord=(a,b)=>`${Math.abs(a).toFixed(2)}°${a>=0?'N':'S'} ${Math.abs(b).toFixed(2)}°${b>=0?'E':'W'}`;
const dist=(a,b)=>{const r=Math.PI/180,d=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 12742*Math.asin(Math.sqrt(d))};
const heat={};G.hot.forEach(h=>list(h[4]).forEach(i=>heat[i]=Math.max(heat[i]||0,h[3])));
let selLit=false,flying=0,hover=null,sel=null,mode=null,range=null,hl={},extra=[],showNames=true,target=null;
function cap(f){if(f===sel&&selLit)return'rgba(242,210,0,.32)';if(f===hover)return'rgba(255,255,255,.10)';
 if(range&&dist(range[0],f.ll)<=range[1])return'rgba(255,59,48,.25)';if(sel&&mode&&hl[f.iso])return hl[f.iso];
 return heat[f.iso]===3?'rgba(255,59,48,.035)':'rgba(0,0,0,0)'}
const names=feats.filter(f=>f.area>2).map(f=>({n:f.c.name.toUpperCase(),lat:f.ll[0],lng:f.ll[1],nm:1}));
const el=$('#globe'),W=Globe({animateIn:false})(el).backgroundColor('#000')
 .globeImageUrl('img/earth-grey.jpg').bumpImageUrl('img/topo.png').showAtmosphere(true).atmosphereColor('#cfd3d8').atmosphereAltitude(.1)
 .polygonsData(feats).polygonCapColor(cap).polygonSideColor(()=>'rgba(0,0,0,0)').polygonStrokeColor(f=>f===sel&&selLit?'#ffe74a':'rgba(255,255,255,.55)')
 .polygonAltitude(f=>f===sel&&selLit?.009:.003).polygonsTransitionDuration(200)
 .onPolygonHover(f=>{hover=f;el.style.cursor=f?'pointer':'';W.polygonCapColor(cap);tip(f&&f.c.name)})
 .onPolygonClick((f,e,c)=>selectCountry(f,c))
 .pointsData(G.hot).pointLat(h=>h[1]).pointLng(h=>h[2]).pointColor(h=>LV[h[3]]).pointAltitude(.006).pointRadius(h=>.22+h[3]*.07).pointsMerge(false)
 .onPointClick(h=>{stopTour();go(T.indexOf(G.hot.indexOf(h)),true)}).onPointHover(h=>tip(h&&h[0]))
 .ringsData(G.hot.filter(h=>h[3]>1).map(h=>({lat:h[1],lng:h[2],c:h[3]==3?'255,59,48':'242,210,0',r:.8+h[3]*.6,p:2200-h[3]*300})))
 .ringColor(d=>t=>`rgba(${d.c},${1-t})`).ringMaxRadius(d=>d.r).ringPropagationSpeed(.9).ringRepeatPeriod(d=>d.p)
 .arcColor(a=>a.c).arcStroke(.5).arcDashLength(.45).arcDashGap(.12).arcDashAnimateTime(2200).arcAltitudeAutoScale(.35)
 .labelLat(d=>d.lat).labelLng(d=>d.lng).labelText(d=>d.n).labelSize(d=>d.nm?.32:.42).labelDotRadius(d=>d.nm?0:.2).labelColor(d=>d.nm?'rgba(220,222,225,.62)':'#f2d200').labelResolution(2).labelAltitude(.004)
 .onZoom(p=>{const s=p.altitude<1.5;if(s!==showNames){showNames=s;labels()}onMove(p)});
const m=W.globeMaterial();m.bumpScale=12;m.shininess=2;
function labels(){W.labelsData((showNames?names.filter(n=>!sel||!selLit||n.n!==sel.c.name.toUpperCase()):[]).concat(extra))}
const ctl=W.controls();ctl.autoRotate=false;ctl.autoRotateSpeed=.3;ctl.zoomSpeed=.8;
addEventListener('resize',()=>{W.width(innerWidth).height(innerHeight);place(cur,true)});
document.addEventListener('mousemove',e=>{const t=$('#tip');t.style.left=e.clientX+14+'px';t.style.top=e.clientY+14+'px'});
function tip(s){const t=$('#tip');t.style.display=s&&!('ontouchstart'in window)?'block':'none';t.textContent=s||''}
// centre reticle: lat/lon under the screen centre
let lastC='';(function loop(){const g=W.toGlobeCoords(innerWidth/2,innerHeight/2);const t=g?`${Math.abs(g.lat).toFixed(2)}°${g.lat>=0?'N':'S'}, ${Math.abs(g.lng).toFixed(2)}°${g.lng>=0?'E':'W'}`:'—';if(t!==lastC){lastC=t;$('#cco').textContent=t}requestAnimationFrame(loop)})();
function aim(){}
function fly(lat,lng,alt){flying=Date.now()+1300;W.pointOfView({lat,lng,altitude:alt||(mob()?1.15:1.05)},1200)}
const altFor=f=>Math.max(1.12,Math.min(2.1,.2+Math.sqrt(f.area)*.035));
// semantic-zoom labels (cities, capitals, geography, selected-country pill)
const elc=new Map();function mk(k,cls,txt){let e=elc.get(k);if(!e){e=document.createElement('div');e.className='ml '+cls;e.textContent=txt;elc.set(k,e)}return e}
let lt=0,ltimer=null;function onMove(p){
 if(sel&&selLit&&Date.now()>flying&&dist([p.lat,p.lng],sel.ll)>Math.max(500,Math.sqrt(sel.area)*45)){selLit=false;W.polygonCapColor(cap).polygonStrokeColor(W.polygonStrokeColor()).polygonAltitude(W.polygonAltitude())}
 clearTimeout(ltimer);ltimer=setTimeout(()=>ml(W.pointOfView()),Date.now()-lt>250?0:200)}
function ml(p){lt=Date.now();const out=[],boxes=[],R=p.altitude*3400+400;
 const fits=(ll,w)=>{const s=W.getScreenCoords(ll[0],ll[1],.01);if(!s||s.x<0||s.y<60||s.x>innerWidth||s.y>innerHeight)return false;for(const b of boxes)if(Math.abs(b.x-s.x)<(b.w+w)/2+6&&Math.abs(b.y-s.y)<16)return false;boxes.push({x:s.x,y:s.y,w});return true};
 if(sel&&selLit)fits(sel.ll,sel.c.name.length*9+20)&&out.push({lat:sel.ll[0],lng:sel.ll[1],el:mk('sel'+sel.iso,'selp',sel.c.name.toUpperCase())});
 if(p.altitude<1.3){let n=0;for(const c of CITIES){if(n>=40)break;if(dist([p.lat,p.lng],[c[1],c[2]])>R)continue;
  if(!c[4]&&c[3]<(p.altitude<.9?150000:350000))continue;const t=(c[4]?'★ ':'● ')+c[0].toUpperCase();if(fits([c[1],c[2]],t.length*6.4)){out.push({lat:c[1],lng:c[2],el:mk('c'+c[0]+c[1],c[4]?'cap':'city',t)});n++}}}
 if(p.altitude<1.4)for(const g of G.geo){if(dist([p.lat,p.lng],[g[1],g[2]])>R*1.1)continue;if(fits([g[1],g[2]],g[0].length*6.5))out.push({lat:g[1],lng:g[2],el:mk('g'+g[0],'geo',g[0])})}
 W.htmlElementsData(out)}
W.htmlLat(d=>d.lat).htmlLng(d=>d.lng).htmlAltitude(.01).htmlElement(d=>d.el);
const fmt=(n,p='')=>n==null?'—':p+(n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n).toLocaleString():(+n).toFixed(1));
const chip=(i,c)=>`<span class="chip ${c}" data-i="${i}">${flag(i)} ${(featBy3[i]||{c:C[by3[i]]||{name:i}}).c.name}</span>`;
// tracked conflicts carousel
const T=G.hot.map((h,i)=>({h,i})).sort((a,b)=>b.h[3]-a.h[3]).map(o=>o.i);let cur=0;
$('#pager').innerHTML=T.slice(0,10).map((_,k)=>`<i data-k="${k}"></i>`).join('');
const near=h=>{const inv=list(h[4]).filter(i=>featBy3[i]);inv.sort((a,b)=>dist(featBy3[a].ll,[h[1],h[2]])-dist(featBy3[b].ll,[h[1],h[2]]));return inv[0]?featBy3[inv[0]].c.name:h[0]};
const KW=/(war|conflict|crisis|insurgency|confrontation|violence|tensions?|strait|sea|peninsula)/i;
function head(t){return t.replace(/^(.*?)(\s*[–&(].*)?$/,(m,a,b)=>`<span>${a}</span>${b||''}`)}
function card(h){return`<div class="hl">Live updates from the ${head(h[0])}</div><div class="upd">${KIND[h[3]].toUpperCase()} · ${LN[h[3]].toUpperCase()} · ONGOING</div><div class="upd2">${list(h[4]).map(flag).join(' ')} ${near(h).toUpperCase()} · ${coord(h[1],h[2])}</div>
 <div class="tu"><b>What happened:</b> ${h[5]} <a href="https://news.google.com/search?q=${encodeURIComponent(h[0])}" target="_blank" rel="noopener" style="color:var(--mu);font:600 10px var(--mono);text-decoration:none">SOURCE ↗</a></div>`}
function setBadge(k){$('.ctop .tag').className='tag '+(k?'yk':'red');$('.ctop .tag').textContent=k?'Key development':'● Tracking'}
function profileCard(f){const c=f.c,al=memb(f.iso);$('#cbody').innerHTML=`<div class="hl"><span>${c.name}</span> at a glance</div><div class="upd">${(c.gov||'COUNTRY PROFILE').toUpperCase()}</div><div class="upd2">${c.flag||''} ${(c.capital||'').toUpperCase()} · ${coord(f.ll[0],f.ll[1])}</div>
 <div class="tu"><b>What happened:</b> led by ${c.hos||'—'}${c.hog&&c.hog!==c.hos?' (head of government '+c.hog+')':''}. Population ${fmt(c.pop)}, GDP ${fmt(c.gdp,'$')}${al.length?'. Member of '+al.join(', '):''}.</div>`;
 setBadge(1);$('#cidx').textContent=(c.subregion||c.region||'').toUpperCase();$$('#pager i').forEach(x=>x.classList.remove('on'))}
function go(k,quiet,keep){cur=((k%T.length)+T.length)%T.length;const h=G.hot[T[cur]];const b=$('#cbody');setBadge(0);if(!quiet)b.classList.add('sw');
 const put=()=>{b.innerHTML=card(h);b.classList.remove('sw')};quiet?put():setTimeout(put,180);$('#cidx').textContent=`${String(cur+1).padStart(2,'0')} / ${T.length}`;
 $$('#pager i').forEach((x,j)=>x.classList.toggle('on',j===Math.min(cur,9)));
 if(!keep){const nf=featBy3[list(h[4]).filter(i=>featBy3[i]).sort((a,b)=>dist(featBy3[a].ll,[h[1],h[2]])-dist(featBy3[b].ll,[h[1],h[2]]))[0]];sel=nf||null;selLit=!!nf;W.polygonCapColor(cap).polygonStrokeColor(W.polygonStrokeColor()).polygonAltitude(W.polygonAltitude());extra=[];labels();fly(h[1],h[2],nf?Math.min(altFor(nf),1.2):1.15)}}
function place(){}
$('#pager').onclick=e=>{const k=e.target.dataset.k;if(k!=null){stopTour();go(+k)}};
let sx=null;const cd=$('#card');cd.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
cd.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>45){stopTour();if(sel)clearSel();go(cur+(dx<0?1:-1))}});
let tour=setInterval(()=>go(cur+1),14000);const stopTour=()=>{clearInterval(tour);tour=null};el.addEventListener('pointerdown',stopTour);
$('#full').onclick=()=>{stopTour();const h=G.hot[T[cur]];openDrawer('cp');$('#cp').innerHTML=`<div class="cph"><div><span class="cat c${h[3]}">${LN[h[3]].toUpperCase()}</span><h2>${h[0]}</h2><div class="sub">${KIND[h[3]]} · ${coord(h[1],h[2])}</div></div></div><p style="color:#c9cbc6">${h[5]}</p><h4>Involved</h4><div class="chips">${list(h[4]).map(i=>chip(i,'')).join('')}</div><h4>Latest headlines</h4><div class="news" id="news">Loading…</div>`;news(h[0].replace(/[()&–]/g,' '))};
// drawer
$('#ev').innerHTML=T.map(i=>{const h=G.hot[i];return`<div class="rep" data-h="${i}"><div class="rtop"><span class="rn">${list(h[4]).slice(0,3).map(x=>`<span class="fl">${flag(x)}</span>`).join('')}${h[0]}</span><span class="cat c${h[3]}">${LN[h[3]].toUpperCase()}</span></div><p>${h[5]}</p><small>${KIND[h[3]]} · ${coord(h[1],h[2])}</small></div>`}).join('');
$('#ev').onclick=e=>{const d=e.target.closest('.rep');if(d){stopTour();clearSel();go(T.indexOf(+d.dataset.h));if(mob())closeDrawer()}};
function openDrawer(t){$('#drawer').classList.remove('hide');tab(t)}function closeDrawer(){$('#drawer').classList.add('hide')}
$('#menu').onclick=()=>$('#drawer').classList.contains('hide')?openDrawer('ev'):closeDrawer();$('#dx').onclick=closeDrawer;
$$('.rt').forEach(t=>t.onclick=()=>tab(t.dataset.t));
function tab(t){$$('.rt').forEach(x=>x.classList.toggle('on',x.dataset.t===t));$('#ev').classList.toggle('hide',t!=='ev');$('#cp').classList.toggle('hide',t!=='cp');$('#drawer').scrollTop=0}
// ticker + search
$('#tkin').innerHTML=T.map(i=>{const h=G.hot[i];return`<span><i class="c${h[3]}">${LN[h[3]].toUpperCase()}</i>${list(h[4]).map(flag).join('')} ${h[0]} — ${h[5]}</span>`}).join('');
$('#cl').innerHTML=feats.map(f=>`<option value="${f.c.name}">`).sort().join('');
$('#sbtn').onclick=()=>{$('#q').classList.toggle('hide');$('#q').focus()};
$('#q').onchange=e=>{const f=feats.find(f=>f.c.name.toLowerCase()===e.target.value.toLowerCase());if(f){selectCountry(f);e.target.value='';e.target.blur();$('#q').classList.add('hide')}};
document.body.addEventListener('click',e=>{const c=e.target.closest('.chip[data-i]');if(c&&featBy3[c.dataset.i])selectCountry(featBy3[c.dataset.i])});
$$('#filters button[data-m]').forEach(b=>b.onclick=()=>setMode(mode===b.dataset.m?null:b.dataset.m));
$('#filters [data-x]').onclick=()=>{clearSel();go(cur,true)};
function clearSel(){sel=null;selLit=false;setMode(null);$('#filters').classList.add('hide');W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude())}
function selectCountry(f,c){stopTour();sel=f;const ci=f.c,i=f.iso,r=(G.rel[i]||[]).map(list),nk=G.nuclear[i],hs=hotsOf(i),al=memb(i);
 selLit=true;fly(f.ll[0],f.ll[1],altFor(f));W.polygonCapColor(cap).polygonStrokeColor(W.polygonStrokeColor()).polygonAltitude(W.polygonAltitude());labels();$('#filters').classList.remove('hide');
 if(hs[0])go(T.indexOf(G.hot.indexOf(hs[0])),true,1);else profileCard(f)
 const st=(k,v)=>`<div class="st"><small>${k}</small><b>${v||'—'}</b></div>`,sec=(t,a,cl)=>a&&a.length?`<h4>${t}</h4><div class="chips">${a.map(x=>chip(x,cl)).join('')}</div>`:'';
 $('#cp').innerHTML=`<div class="cph"><span class="flag">${ci.flag||'🏳️'}</span><div><h2>${ci.name}</h2><div class="sub">${[ci.subregion||ci.region,ci.capital&&'Capital: '+ci.capital].filter(Boolean).join(' · ')}</div></div></div>
 <div class="grid">${st('Head of state',ci.hos)}${st('Head of government',ci.hog)}${st('Population',fmt(ci.pop))}${st('GDP',fmt(ci.gdp,'$'))}${st('GDP per capita',ci.gdppc&&'$'+Math.round(ci.gdppc).toLocaleString())}${st('Military spend',ci.milgdp&&ci.milgdp.toFixed(1)+'% GDP')}</div>
 ${ci.gov?`<h4>Government</h4><div style="font-size:13px">${ci.gov}</div>`:''}
 ${hs.length?`<h4>Armed conflict & flashpoints</h4><div class="chips">${hs.map(h=>`<span class="chip" style="color:${LV[h[3]]}">● ${h[0]}</span>`).join('')}</div>`:''}
 ${al.length?`<h4>Orgs & alliances</h4><div class="chips">${al.map(a=>`<span class="chip b">${a}</span>`).join('')}</div>`:''}
 ${sec('Key partners',r[0],'g')}${sec('Key adversaries',r[1],'r')}${sec('Top trade partners',r[2],'y')}
 <h4>Nuclear status</h4><div class="${nk?'nuke':''}" style="font-size:13px">${nk?`☢ Nuclear-armed · ~${nk[0].toLocaleString()} warheads (est.) · max range ~${nk[1].toLocaleString()} km`:'No nuclear weapons'}</div>
 ${ci.languages?`<h4>Languages · Currency</h4><div style="font-size:13px">${ci.languages}${ci.currency?' · '+ci.currency:''}</div>`:''}
 <h4>Latest headlines</h4><div class="news" id="news">Loading…</div><p class="src">Leaders: Wikidata · Economy: World Bank (${ci.gdp_yr||'latest'}) · Relations, bases & hotspots: curated estimates.</p>`;
 if(!mob())openDrawer('cp');else tab('cp');setMode(mode);news(ci.name)}
function setMode(md){mode=md;hl={};range=null;let arcs=[],pts=[];
 $$('#filters button[data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===md));
 if(sel&&md){const i=sel.iso,o=sel.ll,r=(G.rel[i]||[]).map(list),A=(t,c,ca)=>{const d=ll3(t);if(d){arcs.push({startLat:o[0],startLng:o[1],endLat:d[0],endLng:d[1],c:[c,c+'55']});hl[t]=ca}};
  if(md==='partners')(r[0]||[]).forEach(t=>A(t,'#2ecc71','rgba(46,204,113,.3)'));
  if(md==='adversaries')(r[1]||[]).forEach(t=>A(t,'#ff3b30','rgba(255,59,48,.3)'));
  if(md==='trade')(r[2]||[]).forEach(t=>A(t,'#f2d200','rgba(242,210,0,.25)'));
  if(md==='conflicts')hotsOf(i).forEach(h=>{arcs.push({startLat:o[0],startLng:o[1],endLat:h[1],endLng:h[2],c:[LV[h[3]],LV[h[3]]+'55']});list(h[4]).forEach(t=>t!==i&&(hl[t]='rgba(255,59,48,.3)'))});
  if(md==='bases')(G.bases[i]||[]).forEach(b=>{arcs.push({startLat:o[0],startLng:o[1],endLat:b[1],endLng:b[2],c:['#f2f3f0','#f2f3f055']});pts.push({n:b[0],lat:b[1],lng:b[2]})});
  if(md==='nuclear'&&G.nuclear[i])range=[o,G.nuclear[i][1]];
  if(md!=='bases'&&arcs.length){flying=Date.now()+900;W.pointOfView({altitude:2.2},800)}}
 extra=pts;labels();W.arcsData(arcs);W.polygonCapColor(cap)}
async function news(q){const n=$('#news'),g=`https://news.google.com/search?q=${encodeURIComponent(q)}`;if(!n)return;
 try{const ac=new AbortController();setTimeout(()=>ac.abort(),8000);
  const j=await (await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent('"'+q.trim().replace(/\s+/g,' ')+'" sourcelang:english')}&mode=artlist&maxrecords=6&sort=datedesc&format=json&timespan=3d`,{signal:ac.signal})).json();
  if(!j.articles||!j.articles.length)throw 0;
  n.innerHTML=j.articles.map(a=>`<a href="${a.url}" target="_blank" rel="noopener">${a.title}<br><small>${a.domain}</small></a>`).join('')+`<a href="${g}" target="_blank" rel="noopener"><small>More on Google News →</small></a>`}
 catch(e){n.innerHTML=`<a href="${g}" target="_blank" rel="noopener">Open latest ${q} news →</a>`}}
W.pointOfView({lat:44,lng:34,altitude:1.15});labels();go(0,true);setTimeout(()=>ml(W.pointOfView()),1500);
// liquid-glass dock: spring-driven bubble with drag (same feel as Crypto Monitor)
const dock=$('#dock'),bub=$('#bubble'),tbs=$$('.tb');let bx=0,bv=0,btgt=0,bw=0,sc=1,scT=1,drag=null,active=0;
const slotX=i=>tbs[i].offsetLeft,size=()=>{bw=tbs[0].offsetWidth;bub.style.width=bw+'px'};
function step(){const k=drag?.5:.16,d=drag?.55:.72;bv=(bv+(btgt-bx)*k)*d;bx+=bv;sc+=(scT-sc)*.25;const stretch=1+Math.min(Math.abs(bv)/40,.25);
 bub.style.transform=`translateX(${bx}px) scale(${stretch*sc},${sc/Math.sqrt(stretch)})`;requestAnimationFrame(step)}
function sel_(i){active=i;btgt=slotX(i);tbs.forEach((b,j)=>b.classList.toggle('on',j===i));const t=tbs[i].dataset.t;$('#soon').classList.toggle('hide',t==='globe');$('#soont').textContent=t}
const near_=x=>{let b=0,bd=1e9;tbs.forEach((t,i)=>{const d=Math.abs(slotX(i)-x);if(d<bd){bd=d;b=i}});return b};
const rub=x=>{const mn=slotX(0),mx=slotX(tbs.length-1);return x<mn?mn-(mn-x)*.3:x>mx?mx+(x-mx)*.3:x};
dock.addEventListener('pointerdown',e=>{dock.setPointerCapture(e.pointerId);const r=dock.getBoundingClientRect();drag={l:r.left};scT=1.08;dock.classList.add('drag');btgt=rub(e.clientX-r.left-bw/2);try{navigator.vibrate&&navigator.vibrate(5)}catch(_){}});
dock.addEventListener('pointermove',e=>{if(drag)btgt=rub(e.clientX-drag.l-bw/2)});
const end=()=>{if(!drag)return;drag=null;scT=1;dock.classList.remove('drag');sel_(near_(btgt))};
dock.addEventListener('pointerup',end);dock.addEventListener('pointercancel',end);
size();bx=btgt=slotX(0);step();addEventListener('resize',()=>{size();btgt=slotX(active)});
window.__gev={W,go,selectCountry:n=>selectCountry(feats.find(f=>f.c.name===n))};
})();
