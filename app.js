(async()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],G=window.GEV;
const C=await (await fetch('data/countries.json')).json();
const topo=await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')).json();
const feats=topojson.feature(topo,topo.objects.countries).features.filter(f=>f.properties.name!=='Antarctica');
const by3={};for(const k in C)by3[C[k].iso3]=k;
const info=f=>C[f.id]||Object.values(C).find(c=>c.name===f.properties.name)||{name:f.properties.name};
feats.forEach(f=>{f.c=info(f);f.iso=f.c.iso3});
const featBy3={};feats.forEach(f=>f.iso&&(featBy3[f.iso]=f));
const OV={RUS:[61,95],USA:[39,-98],CAN:[58,-100],FRA:[46.6,2.4],NOR:[62,10],FJI:[-17.8,178],NZL:[-41.5,173],IDN:[-2,118],CHL:[-33,-71],JPN:[36.5,138.5],GBR:[53,-1.8],ISR:[31.3,35],PSE:[31.5,34.8]};
function centroid(f){if(OV[f.iso])return OV[f.iso];let best=null,ba=0;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 for(const p of polys){const r=p[0];let a=0;for(let i=0;i<r.length-1;i++)a+=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];a=Math.abs(a);if(a>ba){ba=a;best=r}}
 let x=0,y=0;best.forEach(q=>{x+=q[0];y+=q[1]});return[y/best.length,x/best.length]}
feats.forEach(f=>f.ll=centroid(f));
const ll3=i=>featBy3[i]?featBy3[i].ll:null,list=s=>(s||'').split(' ').filter(Boolean);
const memb=iso=>Object.keys(G.alliances).filter(a=>list(G.alliances[a]).includes(iso));
const hotsOf=iso=>G.hot.filter(h=>list(h[4]).includes(iso));
const LV=['','#9aa0a6','#f2d200','#ff3b30'],LN=['','Tension','Development','Escalation'],KIND=['','Tension','Armed conflict','War'];
const flag=i=>(C[by3[i]]||{}).flag||'';
const coord=(a,b)=>`${Math.abs(a).toFixed(2)}°${a>=0?'N':'S'} ${Math.abs(b).toFixed(2)}°${b>=0?'E':'W'}`;
const heat={};G.hot.forEach(h=>list(h[4]).forEach(i=>heat[i]=Math.max(heat[i]||0,h[3])));
let hover=null,sel=null,mode=null,range=null,hl={};
const dist=(a,b)=>{const r=Math.PI/180,d=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 12742*Math.asin(Math.sqrt(d))};
function cap(f){if(f===sel)return'rgba(242,210,0,.55)';if(f===hover)return'rgba(150,150,150,.75)';
 if(range&&dist(range[0],f.ll)<=range[1])return'rgba(255,59,48,.35)';
 if(sel&&mode&&hl[f.iso])return hl[f.iso];const h=heat[f.iso];return h===3?'rgba(110,60,55,.85)':'rgba(58,58,58,.88)'}
const el=$('#globe'),W=Globe()(el).backgroundColor('rgba(0,0,0,0)').showGraticules(true)
 .atmosphereColor('#8a8f96').atmosphereAltitude(.13)
 .polygonsData(feats).polygonCapColor(cap).polygonSideColor(()=>'rgba(0,0,0,.4)').polygonStrokeColor(()=>'rgba(235,235,230,.55)')
 .polygonAltitude(f=>f===sel?.025:f===hover?.014:.005).polygonsTransitionDuration(250)
 .onPolygonHover(f=>{hover=f;el.style.cursor=f?'pointer':'';W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude());tip(f&&f.c.name);if(f)status(f.c.name,f.ll);else if(sel)status(sel.c.name,sel.ll)})
 .onPolygonClick(f=>selectCountry(f))
 .pointsData(G.hot).pointLat(h=>h[1]).pointLng(h=>h[2]).pointColor(h=>LV[h[3]]).pointAltitude(.012).pointRadius(h=>.3+h[3]*.1).pointsMerge(false)
 .onPointClick(h=>showHot(h)).onPointHover(h=>tip(h&&h[0]))
 .ringsData(G.hot.filter(h=>h[3]>1).map(h=>({lat:h[1],lng:h[2],c:h[3]==3?'255,59,48':'242,210,0',r:1.5+h[3],p:2000-h[3]*300})))
 .ringColor(d=>t=>`rgba(${d.c},${1-t})`).ringMaxRadius(d=>d.r).ringPropagationSpeed(1.4).ringRepeatPeriod(d=>d.p)
 .arcColor(a=>a.c).arcStroke(.55).arcDashLength(.45).arcDashGap(.12).arcDashAnimateTime(2200).arcAltitudeAutoScale(.4)
 .labelLat(d=>d[1]).labelLng(d=>d[2]).labelText(d=>d[0]).labelSize(.5).labelDotRadius(.3).labelColor(()=>'#f2f3f0').labelResolution(2);
const m=W.globeMaterial();m.color&&m.color.set('#141414');m.emissive&&m.emissive.set('#060606');m.shininess=4;
const ctl=W.controls();ctl.autoRotate=true;ctl.autoRotateSpeed=.35;W.pointOfView({lat:30,lng:40,altitude:innerWidth<760?2.9:2.3});
addEventListener('resize',()=>W.width(innerWidth).height(innerHeight));
document.addEventListener('mousemove',e=>{const t=$('#tip');t.style.left=e.clientX+14+'px';t.style.top=e.clientY+14+'px'});
function tip(s){const t=$('#tip');t.style.display=s?'block':'none';t.textContent=s||''}
function status(n,ll){$('#stc').textContent=n.toUpperCase();$('#stx').textContent=coord(ll[0],ll[1])}
$('#tour').onclick=()=>{ctl.autoRotate=!ctl.autoRotate;$('#tour').textContent=ctl.autoRotate?'❚❚ PAUSE LIVE TOUR':'▶ RESUME LIVE TOUR'};
const fmt=(n,p='')=>n==null?'—':p+(n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n).toLocaleString():(+n).toFixed(1));
const chip=(i,c)=>{const f=featBy3[i],n=f?f.c.name:(C[by3[i]]||{}).name||i;return`<span class="chip ${c}" data-i="${i}">${flag(i)} ${n}</span>`};
// right rail: latest events
const order=G.hot.map((h,i)=>({h,i})).sort((a,b)=>b.h[3]-a.h[3]);
$('#ev').innerHTML=order.map(({h,i})=>`<div class="rep" data-h="${i}"><div class="rtop"><span class="rn">${list(h[4]).slice(0,3).map(x=>`<span class="fl">${flag(x)}</span>`).join('')}${h[0]}</span><span class="cat c${h[3]}">${LN[h[3]].toUpperCase()}</span></div><p>${h[5]}</p><small>${KIND[h[3]]} · ${coord(h[1],h[2])}</small></div>`).join('');
$('#ev').onclick=e=>{const d=e.target.closest('.rep');if(d)showHot(G.hot[d.dataset.h])};
$('#tkin').innerHTML=order.map(({h})=>`<span><i>${LN[h[3]].toUpperCase()}</i>${h[0]} — ${h[5]}</span>`).join('');
$('#cl').innerHTML=feats.map(f=>`<option value="${f.c.name}">`).sort().join('');
$('#q').onchange=e=>{const f=feats.find(f=>f.c.name.toLowerCase()===e.target.value.toLowerCase());if(f){selectCountry(f);e.target.value='';e.target.blur()}};
$$('.rt').forEach(t=>t.onclick=()=>tab(t.dataset.t));
function tab(t){$$('.rt').forEach(x=>x.classList.toggle('on',x.dataset.t===t));$('#ev').classList.toggle('hide',t!=='ev');$('#cp').classList.toggle('hide',t!=='cp');$('#right').scrollTop=0}
document.body.onclick=e=>{const c=e.target.closest('.chip[data-i]');if(c&&featBy3[c.dataset.i])selectCountry(featBy3[c.dataset.i]);if(e.target.closest('[data-reset]'))reset()};
$$('#filters button').forEach(b=>b.onclick=()=>setMode(mode===b.dataset.m?null:b.dataset.m));
$('#filters').classList.add('off');
function fly(lat,lng,alt){ctl.autoRotate=false;$('#tour').textContent='▶ RESUME LIVE TOUR';const mob=innerWidth<760;W.pointOfView({lat:lat-(mob?14:0),lng,altitude:(alt||1.8)+(mob?.8:0)},900)}
function reset(){sel=null;setMode(null);$('#filters').classList.add('off');W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude());W.labelsData([]);tab('ev')}
addEventListener('keydown',e=>e.key==='Escape'&&reset());
function tracker(h){const t=h[0].split(/[ –&(]/)[0];$('#tracker').innerHTML=`<div class="ctop"><span class="tag red">● Tracking</span><a data-reset>CONFLICT PROFILE →</a></div>
 <div class="hl">Live picture of the ${h[0].replace(t,`<span>${t}</span>`)}</div><div class="upd">${KIND[h[3]].toUpperCase()} · ${coord(h[1],h[2])}</div>
 <h4>Involved</h4><div class="chips">${list(h[4]).map(i=>chip(i,'')).join('')}</div><h4>● Situation</h4>
 <div class="tu"><div class="th">OVERVIEW<em style="color:${LV[h[3]]}">▲ ${LN[h[3]].toUpperCase()}</em></div>${h[5]}</div>
 ${G.hot.filter(x=>x!==h&&x[3]===3).map(x=>`<div class="tu" style="cursor:pointer" data-hh="${G.hot.indexOf(x)}"><div class="th">${x[0].toUpperCase()}<em style="color:${LV[3]}">▲ WAR</em></div>${x[5]}</div>`).join('')}
 <h4>Latest headlines</h4><div class="news" id="news2">Loading…</div>`;
 $$('#tracker [data-hh]').forEach(d=>d.onclick=()=>showHot(G.hot[d.dataset.hh]));news(h[0].replace(/[()&–]/g,' '),'#news2')}
function showHot(h){reset();fly(h[1],h[2],1.5);W.labelsData([h]);status(h[0],[h[1],h[2]]);tracker(h);
 if(innerWidth<1100){$('#cp').innerHTML=`<div class="cph"><div><span class="cat c${h[3]}">${LN[h[3]].toUpperCase()}</span><h2>${h[0]}</h2></div></div><p style="color:#c9cbc6">${h[5]}</p><h4>Involved</h4><div class="chips">${list(h[4]).map(i=>chip(i,'')).join('')}</div><h4>Latest headlines</h4><div class="news" id="news">Loading…</div>`;tab('cp');news(h[0].replace(/[()&–]/g,' '),'#news')}}
function selectCountry(f){sel=f;const c=f.c,i=f.iso,r=(G.rel[i]||[]).map(list),nk=G.nuclear[i],hs=hotsOf(i),al=memb(i);
 fly(f.ll[0],f.ll[1]);W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude());W.labelsData(hs);status(c.name,f.ll);$('#filters').classList.remove('off');
 const st=(k,v)=>`<div class="st"><small>${k}</small><b>${v||'—'}</b></div>`,sec=(t,a,cl)=>a&&a.length?`<h4>${t}</h4><div class="chips">${a.map(x=>chip(x,cl)).join('')}</div>`:'';
 $('#cp').innerHTML=`<div class="cph"><span class="flag">${c.flag||'🏳️'}</span><div><h2>${c.name}</h2><div class="sub">${[c.subregion||c.region,c.capital&&'Capital: '+c.capital].filter(Boolean).join(' · ')}</div></div></div>
 <div class="grid">${st('Head of state',c.hos)}${st('Head of government',c.hog)}${st('Population',fmt(c.pop))}${st('GDP',fmt(c.gdp,'$'))}${st('GDP per capita',c.gdppc&&'$'+Math.round(c.gdppc).toLocaleString())}${st('Military spend',c.milgdp&&c.milgdp.toFixed(1)+'% GDP')}</div>
 ${c.gov?`<h4>Government</h4><div style="font-size:13px">${c.gov}</div>`:''}
 ${hs.length?`<h4>Armed conflict & flashpoints</h4><div class="chips">${hs.map(h=>`<span class="chip" style="color:${LV[h[3]]}">● ${h[0]}</span>`).join('')}</div>`:''}
 ${al.length?`<h4>Orgs & alliances</h4><div class="chips">${al.map(a=>`<span class="chip b">${a}</span>`).join('')}</div>`:''}
 ${sec('Key partners',r[0],'g')}${sec('Key adversaries',r[1],'r')}${sec('Top trade partners',r[2],'y')}
 <h4>Nuclear status</h4><div class="${nk?'nuke':''}" style="font-size:13px">${nk?`☢ Nuclear-armed · ~${nk[0].toLocaleString()} warheads (est.) · max range ~${nk[1].toLocaleString()} km`:'No nuclear weapons'}</div>
 ${c.languages?`<h4>Languages · Currency</h4><div style="font-size:13px">${c.languages}${c.currency?' · '+c.currency:''}</div>`:''}
 <h4>Latest headlines</h4><div class="news" id="news">Loading…</div>
 <p class="src">Leaders: Wikidata · Economy: World Bank (${c.gdp_yr||'latest'}) · Relations, bases & hotspots: curated estimates.</p>`;
 tab('cp');if(hs[0])tracker(hs[0]);setMode(mode);news(c.name,'#news')}
function setMode(md){mode=md;hl={};range=null;let arcs=[],pts=[];
 $$('#filters button').forEach(b=>b.classList.toggle('on',b.dataset.m===md));
 if(sel&&md){const i=sel.iso,o=sel.ll,r=(G.rel[i]||[]).map(list),A=(t,c,ca)=>{const d=ll3(t);if(d){arcs.push({startLat:o[0],startLng:o[1],endLat:d[0],endLng:d[1],c:[c,c+'55']});hl[t]=ca}};
  if(md==='partners')(r[0]||[]).forEach(t=>A(t,'#2ecc71','rgba(46,204,113,.45)'));
  if(md==='adversaries')(r[1]||[]).forEach(t=>A(t,'#ff3b30','rgba(255,59,48,.45)'));
  if(md==='trade')(r[2]||[]).forEach(t=>A(t,'#f2d200','rgba(242,210,0,.4)'));
  if(md==='conflicts')hotsOf(i).forEach(h=>{arcs.push({startLat:o[0],startLng:o[1],endLat:h[1],endLng:h[2],c:[LV[h[3]],LV[h[3]]+'55']});list(h[4]).forEach(t=>t!==i&&(hl[t]='rgba(255,59,48,.4)'))});
  if(md==='bases')(G.bases[i]||[]).forEach(b=>{arcs.push({startLat:o[0],startLng:o[1],endLat:b[1],endLng:b[2],c:['#f2f3f0','#f2f3f055']});pts.push(b)});
  if(md==='nuclear'&&G.nuclear[i])range=[o,G.nuclear[i][1]]}
 W.arcsData(arcs);if(md==='bases')W.labelsData(pts);else if(sel)W.labelsData(hotsOf(sel.iso));W.polygonCapColor(cap)}
async function news(q,sel){const n=$(sel),g=`https://news.google.com/search?q=${encodeURIComponent(q)}`;if(!n)return;
 try{const ac=new AbortController();setTimeout(()=>ac.abort(),8000);
  const j=await (await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent('"'+q.trim().replace(/\s+/g,' ')+'" sourcelang:english')}&mode=artlist&maxrecords=6&sort=datedesc&format=json&timespan=3d`,{signal:ac.signal})).json();
  if(!j.articles||!j.articles.length)throw 0;
  n.innerHTML=j.articles.map(a=>`<a href="${a.url}" target="_blank" rel="noopener">${a.title}<br><small>${a.domain}</small></a>`).join('')+`<a href="${g}" target="_blank" rel="noopener"><small>More on Google News →</small></a>`}
 catch(e){n.innerHTML=`<a href="${g}" target="_blank" rel="noopener">Open latest ${q} news →</a>`}}
tracker(order[0].h);
// liquid-glass dock
const dock=$('#dock'),bub=$('#bubble'),tbs=$$('.tb');
function place(b){bub.style.width=b.offsetWidth+'px';bub.style.transform=`translateX(${b.offsetLeft}px)`}
tbs.forEach(b=>b.onclick=()=>{tbs.forEach(x=>x.classList.toggle('on',x===b));place(b);dock.classList.add('press');setTimeout(()=>dock.classList.remove('press'),250);
 const t=b.dataset.t;$('#soon').classList.toggle('hide',t==='globe');$('#soont').textContent=t});
place(tbs[0]);addEventListener('resize',()=>place($('.tb.on')));
})();
