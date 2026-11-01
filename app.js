(async()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],G=window.GEV,mob=()=>innerWidth<900;
const C=await (await fetch('data/countries.json?v=3')).json();
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
let hover=null,sel=null,mode=null,range=null,hl={},extra=[],showNames=true,target=null;
function cap(f){if(f===sel)return'rgba(242,210,0,.22)';if(f===hover)return'rgba(255,255,255,.10)';
 if(range&&dist(range[0],f.ll)<=range[1])return'rgba(255,59,48,.25)';if(sel&&mode&&hl[f.iso])return hl[f.iso];
 return heat[f.iso]===3?'rgba(255,59,48,.035)':'rgba(0,0,0,0)'}
const names=feats.filter(f=>f.area>2).map(f=>({n:f.c.name.toUpperCase(),lat:f.ll[0],lng:f.ll[1],nm:1}));
const el=$('#globe'),W=Globe({animateIn:false})(el).backgroundColor('#000')
 .globeImageUrl('img/earth-grey.jpg').bumpImageUrl('img/topo.png').showAtmosphere(true).atmosphereColor('#cfd3d8').atmosphereAltitude(.1)
 .polygonsData(feats).polygonCapColor(cap).polygonSideColor(()=>'rgba(0,0,0,0)').polygonStrokeColor(()=>'rgba(255,255,255,.55)')
 .polygonAltitude(f=>f===sel?.008:.003).polygonsTransitionDuration(200)
 .onPolygonHover(f=>{hover=f;el.style.cursor=f?'pointer':'';W.polygonCapColor(cap);tip(f&&f.c.name)})
 .onPolygonClick((f,e,c)=>selectCountry(f,c))
 .pointsData(G.hot).pointLat(h=>h[1]).pointLng(h=>h[2]).pointColor(h=>LV[h[3]]).pointAltitude(.006).pointRadius(h=>.22+h[3]*.07).pointsMerge(false)
 .onPointClick(h=>go(G.hot.indexOf(h))).onPointHover(h=>tip(h&&h[0]))
 .ringsData(G.hot.filter(h=>h[3]>1).map(h=>({lat:h[1],lng:h[2],c:h[3]==3?'255,59,48':'242,210,0',r:.8+h[3]*.6,p:2200-h[3]*300})))
 .ringColor(d=>t=>`rgba(${d.c},${1-t})`).ringMaxRadius(d=>d.r).ringPropagationSpeed(.9).ringRepeatPeriod(d=>d.p)
 .arcColor(a=>a.c).arcStroke(.5).arcDashLength(.45).arcDashGap(.12).arcDashAnimateTime(2200).arcAltitudeAutoScale(.35)
 .labelLat(d=>d.lat).labelLng(d=>d.lng).labelText(d=>d.n).labelSize(d=>d.nm?.32:.42).labelDotRadius(d=>d.nm?0:.2).labelColor(d=>d.nm?'rgba(220,222,225,.62)':'#f2d200').labelResolution(2).labelAltitude(.004)
 .onZoom(p=>{const s=p.altitude<1.5;if(s!==showNames){showNames=s;labels()}});
const m=W.globeMaterial();m.bumpScale=12;m.shininess=2;
function labels(){W.labelsData((showNames?names:[]).concat(extra))}
const ctl=W.controls();ctl.autoRotate=false;ctl.autoRotateSpeed=.3;ctl.zoomSpeed=.8;
addEventListener('resize',()=>{W.width(innerWidth).height(innerHeight);place(cur,true)});
document.addEventListener('mousemove',e=>{const t=$('#tip');t.style.left=e.clientX+14+'px';t.style.top=e.clientY+14+'px'});
function tip(s){const t=$('#tip');t.style.display=s&&!('ontouchstart'in window)?'block':'none';t.textContent=s||''}
// reticle follows target each frame
const ret=$('#ret');(function loop(){if(target){const p=W.pointOfView(),vis=dist([p.lat,p.lng],target.ll)<7200,s=W.getScreenCoords(target.ll[0],target.ll[1],.006);
 if(vis&&s){ret.classList.remove('hide');ret.style.transform=`translate(${s.x}px,${s.y}px)`}else ret.classList.add('hide')}requestAnimationFrame(loop)})();
function aim(ll,tag){target={ll};$('#rco').textContent=coord(ll[0],ll[1]);$('#rtag').textContent=tag}
function fly(lat,lng,alt){const off=mob()?9:0,lo=mob()?0:-14;W.pointOfView({lat:lat-off,lng:lng+lo,altitude:alt||(mob()?1.15:1.05)},1100)}
const fmt=(n,p='')=>n==null?'—':p+(n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n).toLocaleString():(+n).toFixed(1));
const chip=(i,c)=>`<span class="chip ${c}" data-i="${i}">${flag(i)} ${(featBy3[i]||{c:C[by3[i]]||{name:i}}).c.name}</span>`;
// tracked conflicts carousel
const T=G.hot.map((h,i)=>({h,i})).sort((a,b)=>b.h[3]-a.h[3]).map(o=>o.i);let cur=0;
$('#pager').innerHTML=T.slice(0,10).map((_,k)=>`<i data-k="${k}"></i>`).join('');
const near=h=>{const inv=list(h[4]).filter(i=>featBy3[i]);inv.sort((a,b)=>dist(featBy3[a].ll,[h[1],h[2]])-dist(featBy3[b].ll,[h[1],h[2]]));return inv[0]?featBy3[inv[0]].c.name:h[0]};
function card(h){const parts=h[0].split(/\s+(?=[&(])|(?<=war|crisis)$/);const nm=h[0];
 return`<div class="hl">Live picture of the <span>${nm}</span></div><div class="upd">STATUS · ${KIND[h[3]].toUpperCase()} · ONGOING</div><div class="upd2">${coord(h[1],h[2])}</div>
 <div class="tu"><div class="th">${list(h[4]).map(flag).join(' ')}<em class="c${h[3]}">▲ ${LN[h[3]].toUpperCase()}</em><em><a href="https://news.google.com/search?q=${encodeURIComponent(nm)}" target="_blank" rel="noopener" style="color:var(--mu);text-decoration:none">SOURCE ↗</a></em></div>${h[5]}</div>`}
function go(k,quiet){cur=((k%T.length)+T.length)%T.length;const h=G.hot[T[cur]];const b=$('#cbody');b.classList.add('sw');
 setTimeout(()=>{b.innerHTML=card(h);b.classList.remove('sw')},quiet?0:180);$('#cidx').textContent=`${String(cur+1).padStart(2,'0')} / ${T.length}`;
 $$('#pager i').forEach((x,j)=>x.classList.toggle('on',j===Math.min(cur,9)));
 if(!sel){aim([h[1],h[2]],near(h));extra=[];labels();fly(h[1],h[2])}}
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
function clearSel(){sel=null;setMode(null);$('#filters').classList.add('hide');W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude())}
function selectCountry(f,c){stopTour();sel=f;const ci=f.c,i=f.iso,r=(G.rel[i]||[]).map(list),nk=G.nuclear[i],hs=hotsOf(i),al=memb(i);
 const ll=c?[c.lat,c.lng]:f.ll;aim(ll,ci.name);fly(f.ll[0],f.ll[1],mob()?1.4:1.25);W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude());$('#filters').classList.remove('hide');
 if(hs[0]){const k=T.indexOf(G.hot.indexOf(hs[0]));if(k!==cur)go(k,true)}
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
  if(md!=='bases'&&arcs.length)W.pointOfView({altitude:2.2},800)}
 extra=pts;labels();W.arcsData(arcs);W.polygonCapColor(cap)}
async function news(q){const n=$('#news'),g=`https://news.google.com/search?q=${encodeURIComponent(q)}`;if(!n)return;
 try{const ac=new AbortController();setTimeout(()=>ac.abort(),8000);
  const j=await (await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent('"'+q.trim().replace(/\s+/g,' ')+'" sourcelang:english')}&mode=artlist&maxrecords=6&sort=datedesc&format=json&timespan=3d`,{signal:ac.signal})).json();
  if(!j.articles||!j.articles.length)throw 0;
  n.innerHTML=j.articles.map(a=>`<a href="${a.url}" target="_blank" rel="noopener">${a.title}<br><small>${a.domain}</small></a>`).join('')+`<a href="${g}" target="_blank" rel="noopener"><small>More on Google News →</small></a>`}
 catch(e){n.innerHTML=`<a href="${g}" target="_blank" rel="noopener">Open latest ${q} news →</a>`}}
W.pointOfView({lat:44,lng:34,altitude:1.15});labels();go(0,true);
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
