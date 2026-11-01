import json,urllib.request,urllib.parse
UA={'User-Agent':'GodsEyeView/1.0 (static build)'}
def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=120))
out={}
rc=get('https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json')
for c in rc:
    if not c.get('ccn3'):continue
    out[c['ccn3']]={'name':c['name']['common'],'iso3':c['cca3'],'capital':(c.get('capital') or [''])[0],'flag':c.get('flag',''),
      'region':c.get('region',''),'subregion':c.get('subregion',''),'area':c.get('area'),
      'currency':', '.join(v.get('name','') for v in (c.get('currencies') or {}).values()),'languages':', '.join((c.get('languages') or {}).values())}
by3={v['iso3']:k for k,v in out.items()}
for ind,key in [('NY.GDP.MKTP.CD','gdp'),('NY.GDP.PCAP.CD','gdppc'),('MS.MIL.XPND.GD.ZS','milgdp'),('SP.POP.TOTL','pop')]:
    try:
        d=get(f'https://api.worldbank.org/v2/country/all/indicator/{ind}?format=json&mrnev=1&per_page=400')[1]
        for r in d:
            k=by3.get(r['countryiso3code'])
            if k and r['value'] is not None: out[k][key]=r['value']; out[k][key+'_yr']=r['date']
    except Exception as e: print('wb',ind,e)
q='''SELECT ?num (SAMPLE(?hosL) AS ?hos) (SAMPLE(?hogL) AS ?hog) (GROUP_CONCAT(DISTINCT ?govL;separator=", ") AS ?gov) WHERE {
 ?c wdt:P31 wd:Q3624078; wdt:P299 ?num.
 OPTIONAL{?c p:P35 ?s. ?s ps:P35 ?h. FILTER NOT EXISTS{?s pq:P582 ?e} ?h rdfs:label ?hosL FILTER(lang(?hosL)="en")}
 OPTIONAL{?c p:P6 ?t. ?t ps:P6 ?g. FILTER NOT EXISTS{?t pq:P582 ?e2} ?g rdfs:label ?hogL FILTER(lang(?hogL)="en")}
 OPTIONAL{?c wdt:P122 ?gv. ?gv rdfs:label ?govL FILTER(lang(?govL)="en")}
} GROUP BY ?num'''
try:
    d=get('https://query.wikidata.org/sparql?format=json&query='+urllib.parse.quote(q))
    for b in d['results']['bindings']:
        k=b['num']['value']
        if k in out:
            for f in ('hos','hog','gov'):
                if f in b and b[f]['value']: out[k][f]=b[f]['value']
except Exception as e: print('wd',e)
json.dump(out,open('data/countries.json','w'),separators=(',',':'))
print(len(out),sum('hos' in v for v in out.values()),sum('gdp' in v for v in out.values()))
for k in ('840','643','804','156','826'): print(out[k]['name'],out[k].get('hos'),'|',out[k].get('hog'),'|',out[k].get('gov'),out[k].get('gdp'))
