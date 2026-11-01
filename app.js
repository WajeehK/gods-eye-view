(async()=>{
const $=s=>document.querySelector(s),G=window.GEV;
const C=await (await fetch('data/countries.json')).json();
const topo=await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')).json();
const feats=topojson.feature(topo,topo.objects.countries).features.filter(f=>f.properties.name!=='Antarctica');
const by3={};for(const k in C)by3[C[k].iso3]=k;
const info=f=>C[f.id]||Object.values(C).find(c=>c.name===f.properties.name)||{name:f.properties.name};
feats.forEach(f=>{f.c=info(f);f.iso=f.c.iso3});
const featBy3={};feats.forEach(f=>f.iso&&(featBy3[f.iso]=f));
const OV={RUS:[61,95],USA:[39,-98],CAN:[58,-100],FRA:[46.6,2.4],NOR:[62,10],FJI:[-17.8,178],NZL:[-41.5,173],IDN:[-2,118],CHL:[-33,-71],JPN:[36.5,138.5],GBR:[53,-1.8],ISR:[31.3,35],PSE:[31.5,34.8],USA2:0};
function centroid(f){if(OV[f.iso])return OV[f.iso];let best=null,ba=0;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 for(const p of polys){const r=p[0];let a=0;for(let i=0;i<r.length-1;i++)a+=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];a=Math.abs(a);if(a>ba){ba=a;best=r}}
 let x=0,y=0;best.forEach(q=>{x+=q[0];y+=q[1]});return[y/best.length,x/best.length]}
feats.forEach(f=>f.ll=centroid(f));
const ll3=i=>featBy3[i]?featBy3[i].ll:null;
const list=s=>(s||'').split(' ').filter(Boolean);
const memb=iso=>Object.keys(G.alliances).filter(a=>list(G.alliances[a]).includes(iso));
const hotsOf=iso=>G.hot.filter(h=>list(h[4]).includes(iso));
const LV=['','#f5d90a','#ff9f1a','#ff3b3b'],LN=['','Tension','Conflict','War'];
const heat={};G.hot.forEach(h=>list(h[4]).forEach(i=>heat[i]=Math.max(heat[i]||0,h[3])));
let hover=null,sel=null,mode=null,range=null;
const dist=(a,b)=>{const r=Math.PI/180,d=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 12742*Math.asin(Math.sqrt(d))};
function cap(f){if(f===sel)return'rgba(76,201,240,.55)';if(f===hover)return'rgba(76,201,240,.32)';
 if(range&&dist(range[0],f.ll)<=range[1])return'rgba(249,115,22,.30)';
 if(sel&&mode&&hl[f.iso])return hl[f.iso];const h=heat[f.iso];return h?['','rgba(245,217,10,.10)','rgba(255,159,26,.14)','rgba(255,59,59,.18)'][h]:'rgba(20,30,48,.35)'}
let hl={};
const el=$('#globe'),W=Globe()(el)
 .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-night.jpg')
 .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-topology.png')
 .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe@2/example/img/night-sky.png')
 .atmosphereColor('#4cc9f0').atmosphereAltitude(.2)
 .polygonsData(feats).polygonCapColor(cap).polygonSideColor(()=>'rgba(76,201,240,.06)').polygonStrokeColor(()=>'rgba(140,200,255,.35)')
 .polygonAltitude(f=>f===sel?.03:f===hover?.018:.006).polygonsTransitionDuration(250)
 .onPolygonHover(f=>{hover=f;el.style.cursor=f?'pointer':'';W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude());tip(f&&f.c.name)})
 .onPolygonClick(f=>selectCountry(f))
 .pointsData(G.hot).pointLat(h=>h[1]).pointLng(h=>h[2]).pointColor(h=>LV[h[3]]).pointAltitude(.02).pointRadius(h=>.35+h[3]*.12).pointsMerge(false)
 .onPointClick(h=>showHot(h)).onPointHover(h=>tip(h&&h[0]))
 .ringsData(G.hot.map(h=>({lat:h[1],lng:h[2],c:LV[h[3]],r:2+h[3]*1.3,p:1800-h[3]*300})))
 .ringColor(d=>t=>d.c+Math.round((1-t)*200).toString(16).padStart(2,'0')).ringMaxRadius(d=>d.r).ringPropagationSpeed(d=>d.sp||1.5).ringRepeatPeriod(d=>d.p)
 .arcColor(a=>a.c).arcStroke(.6).arcDashLength(.5).arcDashGap(.15).arcDashAnimateTime(2200).arcAltitudeAutoScale(.4)
 .labelLat(d=>d[1]).labelLng(d=>d[2]).labelText(d=>d[0]).labelSize(.5).labelDotRadius(.35).labelColor(()=>'#fff').labelResolution(2);
const ctl=W.controls();ctl.autoRotate=true;ctl.autoRotateSpeed=.35;W.pointOfView({lat:30,lng:20,altitude:innerWidth<760?2.9:2.2});
addEventListener('resize',()=>W.width(innerWidth).height(innerHeight));
document.addEventListener('mousemove',e=>{const t=$('#tip');t.style.left=e.clientX+14+'px';t.style.top=e.clientY+14+'px'});
function tip(s){const t=$('#tip');t.style.display=s?'block':'none';t.textContent=s||''}
const fmt=(n,p='')=>n==null?'—':p+(n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n).toLocaleString():(+n).toFixed(1));
const chip=(i,c)=>{const f=featBy3[i],n=f?f.c.name:(Object.values(C).find(x=>x.iso3===i)||{}).name||i;return`<span class="chip ${c}" data-i="${i}">${(C[by3[i]]||{}).flag||''} ${n}</span>`};
// hotspot feed
$('#flist').innerHTML=G.hot.map((h,i)=>({h,i})).sort((a,b)=>b.h[3]-a.h[3]).map(({h,i})=>`<div class="hs" data-h="${i}" style="border-color:${LV[h[3]]}"><b>${h[0]}</b><small>${LN[h[3]]} · ${h[5]}</small></div>`).join('');
$('#flist').onclick=e=>{const d=e.target.closest('.hs');if(d){showHot(G.hot[d.dataset.h]);$('#feed').classList.remove('open')}};
$('#feedbtn').onclick=()=>$('#feed').classList.toggle('open');
$('#cl').innerHTML=feats.map(f=>`<option value="${f.c.name}">`).sort().join('');
$('#q').onchange=e=>{const f=feats.find(f=>f.c.name.toLowerCase()===e.target.value.toLowerCase());if(f){selectCountry(f);e.target.value='';e.target.blur()}};
$('#x').onclick=()=>close();
$('#pc').onclick=e=>{const c=e.target.closest('.chip');if(c&&featBy3[c.dataset.i])selectCountry(featBy3[c.dataset.i])};
document.querySelectorAll('#filters button').forEach(b=>b.onclick=()=>setMode(mode===b.dataset.m?null:b.dataset.m));
function fly(lat,lng,alt){ctl.autoRotate=false;const mob=innerWidth<760;W.pointOfView({lat:lat-(mob?12:0),lng:lng+(mob?0:12),altitude:(alt||1.7)+(mob?.8:0)},900)}
function close(){sel=null;setMode(null);$('#panel').classList.add('hide');$('#filters').classList.add('hide');W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude());W.labelsData([])}
function showHot(h){close();fly(h[1],h[2],1.4);W.labelsData([h]);
 $('#pc').innerHTML=`<div class="sub" style="color:${LV[h[3]]};font-weight:700;letter-spacing:.1em">● ${LN[h[3]].toUpperCase()}</div><h2>${h[0]}</h2><p>${h[5]}</p><h4>Involved</h4><div class="chips">${list(h[4]).map(i=>chip(i,'')).join('')}</div><h4>Latest headlines</h4><div class="news" id="news">Loading…</div>`;
 $('#panel').classList.remove('hide');news(h[0].replace(/[()&]/g,' '))}
function selectCountry(f){sel=f;const c=f.c,i=f.iso,r=(G.rel[i]||[]).map(list),nk=G.nuclear[i],hs=hotsOf(i),al=memb(i);
 fly(f.ll[0],f.ll[1]);W.polygonCapColor(cap).polygonAltitude(W.polygonAltitude());W.labelsData(hs);
 $('#fname').textContent=(c.flag||'')+' '+c.name;$('#filters').classList.remove('hide');
 const st=(k,v)=>`<div class="st"><small>${k}</small><b>${v||'—'}</b></div>`;
 $('#pc').innerHTML=`<div class="flag">${c.flag||'🏳️'}</div><h2>${c.name}</h2><div class="sub">${[c.subregion||c.region,c.capital&&'Capital: '+c.capital].filter(Boolean).join(' · ')}</div>
 <div class="grid">${st('Head of state',c.hos)}${st('Head of government',c.hog)}${st('Population',fmt(c.pop))}${st('GDP',fmt(c.gdp,'$'))}${st('GDP per capita',c.gdppc&&'$'+Math.round(c.gdppc).toLocaleString())}${st('Military spend',c.milgdp&&c.milgdp.toFixed(1)+'% GDP')}</div>
 ${c.gov?`<h4>Government</h4><div>${c.gov}</div>`:''}
 ${hs.length?`<h4>Conflicts & flashpoints</h4><div class="chips">${hs.map(h=>`<span class="chip" style="color:${LV[h[3]]}">● ${h[0]}</span>`).join('')}</div>`:''}
 ${al.length?`<h4>Alliances & blocs</h4><div class="chips">${al.map(a=>`<span class="chip b">${a}</span>`).join('')}</div>`:''}
 ${r[0]&&r[0].length?`<h4>Key partners</h4><div class="chips">${r[0].map(x=>chip(x,'g')).join('')}</div>`:''}
 ${r[1]&&r[1].length?`<h4>Adversaries</h4><div class="chips">${r[1].map(x=>chip(x,'r')).join('')}</div>`:''}
 ${r[2]&&r[2].length?`<h4>Top trade partners</h4><div class="chips">${r[2].map(x=>chip(x,'y')).join('')}</div>`:''}
 <h4>Nuclear status</h4><div class="${nk?'nuke':''}">${nk?`☢ Nuclear-armed · ~${nk[0].toLocaleString()} warheads (est.) · max delivery range ~${nk[1].toLocaleString()} km`:'No nuclear weapons'}</div>
 ${c.languages?`<h4>Languages · Currency</h4><div>${c.languages}${c.currency?' · '+c.currency:''}</div>`:''}
 <h4>Latest headlines</h4><div class="news" id="news">Loading…</div>
 <p style="color:#5d6b7c;font-size:11px;margin-top:16px">Leaders: Wikidata · Economy: World Bank (${c.gdp_yr||'latest'}) · Relations, bases & hotspots: curated estimates.</p>`;
 $('#panel').classList.remove('hide');$('#panel').scrollTop=0;setMode(mode);news(c.name)}
function setMode(m){mode=m;hl={};range=null;let arcs=[],pts=[];
 document.querySelectorAll('#filters button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
 if(sel&&m){const i=sel.iso,o=sel.ll,r=(G.rel[i]||[]).map(list),A=(t,c)=>{const d=ll3(t);if(d){arcs.push({startLat:o[0],startLng:o[1],endLat:d[0],endLng:d[1],c:[c,c+'55']});hl[t]=c+'55'}};
  if(m==='partners')(r[0]||[]).forEach(t=>A(t,'#22c55e'));
  if(m==='adversaries')(r[1]||[]).forEach(t=>A(t,'#ef4444'));
  if(m==='trade')(r[2]||[]).forEach(t=>A(t,'#eab308'));
  if(m==='conflicts')hotsOf(i).forEach(h=>{arcs.push({startLat:o[0],startLng:o[1],endLat:h[1],endLng:h[2],c:[LV[h[3]],LV[h[3]]+'55']});list(h[4]).forEach(t=>t!==i&&(hl[t]='rgba(255,59,59,.3)'))});
  if(m==='bases')(G.bases[i]||[]).forEach(b=>{arcs.push({startLat:o[0],startLng:o[1],endLat:b[1],endLng:b[2],c:['#4cc9f0','#4cc9f055']});pts.push(b)});
  if(m==='nuclear'&&G.nuclear[i])range=[o,G.nuclear[i][1]];
  if(m!=='nuclear'&&!arcs.length)tip(null);}
 W.arcsData(arcs);if(m==='bases')W.labelsData(pts);else if(sel)W.labelsData(hotsOf(sel.iso));W.polygonCapColor(cap)}
async function news(q){const n=$('#news'),g=`https://news.google.com/search?q=${encodeURIComponent(q)}`;
 try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),8000);
  const r=await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent('"'+q.trim()+'" sourcelang:english')}&mode=artlist&maxrecords=6&sort=datedesc&format=json&timespan=3d`,{signal:ctl.signal});
  const j=await r.json();if(!j.articles||!j.articles.length)throw 0;
  n.innerHTML=j.articles.map(a=>`<a href="${a.url}" target="_blank" rel="noopener">${a.title}<br><small>${a.domain}</small></a>`).join('')+`<a href="${g}" target="_blank" rel="noopener"><small>More on Google News →</small></a>`}
 catch(e){if(n)n.innerHTML=`<a href="${g}" target="_blank" rel="noopener">Open latest ${q} news →</a>`}}
})();
