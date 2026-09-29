"""Register elevation frames to source-plan facade depths; read-only PDF inputs."""
from pathlib import Path
import json, hashlib
import pymupdf as fitz
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1]; REF=ROOT/'reference/FW_ Laatste versie plannen'; S=50*.0254/72
model=json.loads((ROOT/'public/models/architecture.json').read_text()); raw=[]
for name in ['BA_BUCKINX_P_N_NIVEAU 0  .pdf','BA_BUCKINX_P_N_NIVEAU  1 .pdf','BA_BUCKINX_P_N_NIVEAU  2 .pdf']:
 polys=[]
 for d in fitz.open(REF/name)[0].get_drawings():
  if not d['fill'] or any(abs(v-.533333)>.002 for v in d['fill']):continue
  pts=[]
  for it in d['items']:
   if it[0]=='re':pts.extend([(it[1].x0,it[1].y0),(it[1].x1,it[1].y0),(it[1].x1,it[1].y1),(it[1].x0,it[1].y1)])
   elif it[0]=='l':pts.extend([(it[1].x,it[1].y),(it[2].x,it[2].y)])
  if len(pts)>2:
   p=Polygon([((x-58.32)*S,(y-425.52)*S) for x,y in pts]).buffer(0)
   if not p.is_empty:polys.append(p)
 raw.append(unary_union(polys))
roof=model['floors'][2]['roofEvidence']['bounds']; cx=(roof[0]+roof[2])/2;cz=(roof[1]+roof[3])/2
out=[]
for face,name,reverse,alongX in [('front','VOORGEVEL',False,True),('rear','ACHTERGEVEL',True,True),('left','LINKER ZIJGEVEL',False,False),('right','RECHTER ZIJGEVEL',True,False)]:
 path=REF/('BA_BUCKINX_G_N_'+name+'.pdf');ds=fitz.open(path)[0].get_drawings()
 blue=[d['rect'] for d in ds if d['fill'] and abs(d['fill'][0]-.651)<.002 and abs(d['fill'][2]-.941)<.002]
 grey=[d['rect'] for d in ds if d['fill'] and all(abs(v-1/3)<.002 for v in d['fill']) and d['rect'].width>15 and d['rect'].height>25 and any(d['rect'].contains(b) for b in blue)]
 outer=[r for r in grey if not any(q!=r and q.contains(r) and q.get_area()>r.get_area()+1 for q in grey)]
 band=next(d['rect'] for d in ds if d['fill'] and all(abs(v-1/3)<.002 for v in d['fill']) and d['rect'].width>500 and 39<d['rect'].height<41)
 center=(band.x0+band.x1)/2; ground=1077.36 if alongX else 830.64
 for r in outer:
  low=(ground-r.y1)*S;high=(ground-r.y0)*S; railing=.94<(high-low)<1.06
  level=min(2,max(0,round(low/2.85) if railing else int((low+.10)/2.85)))
  axis=(cx if alongX else cz)+((r.x0+r.x1)/2-center)*S*(-1 if reverse else 1)
  line=LineString([(axis,-2),(axis,20)]) if alongX else LineString([(-2,axis),(42,axis)])
  footprint=unary_union([Polygon(p['outer'],p['holes']) for p in model['floors'][level]['slabPolygons']]) if railing else raw[level]
  cut=footprint.intersection(line)
  if cut.is_empty:continue
  bounds=cut.bounds;depth=(bounds[3] if face=='front' else bounds[1]) if alongX else (bounds[0] if face=='left' else bounds[2])
  # Frame subdivisions come from enclosing nested source glazing rectangles.
  splits=[]
  for q in grey:
   if r.contains(q) and q!=r and q.height>r.height*.65:
    for edge in [q.x0,q.x1]:
     v=(edge-(r.x0+r.x1)/2)*S*(-1 if reverse else 1)
     if abs(v)<r.width*S/2-.14 and all(abs(v-u)>.12 for u in splits):splits.append(v)
  out.append({'face':face,'level':level,'axis':round(axis,5),'depth':round(depth,5),'width':round(r.width*S,5),'bottom':round(low,5),'top':round(high,5),'railing':railing,'divisions':sorted(round(v,5) for v in splits),'sourceRect':list(r),'source':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(ROOT/'public/models/facades.json').write_text(json.dumps({'elements':out,'method':'Elevation grey enclosing frames with blue glazing fills; orthographic registration by roof center, 1:50 scale, +89.81 datum. Depth from source plan facade union; railings from slab perimeter. Composite glazing missing a qualifying enclosing rectangle remains omitted.'},separators=(',',':')))
print('Extracted',len(out),'elements;',sum(x['railing'] for x in out),'railings')
# Exposed horizontal roof areas: source lower footprint minus the storey above.
for i in range(2):
 lower=unary_union([Polygon(p['outer'],p['holes']) for p in model['floors'][i]['slabPolygons']])
 upper=unary_union([Polygon(p['outer'],p['holes']) for p in model['floors'][i+1]['slabPolygons']])
 diff=lower.difference(upper)
 parts=[diff] if diff.geom_type=='Polygon' else list(diff.geoms)
 model['floors'][i]['exposedRoofPolygons']=[{'outer':list(p.exterior.coords),'holes':[list(r.coords) for r in p.interiors]} for p in parts if p.geom_type=='Polygon' and p.area>.01]
model['floors'][2]['roofThickness']=.8
model['floors'][2]['roofBaseElevation']=8
model['floors'][2]['roofBottomElevation']=8
(ROOT/'public/models/architecture.json').write_text(json.dumps(model,separators=(',',':')))
