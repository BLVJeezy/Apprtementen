"""Extract filled source PDF paths, preserving paint-order opening masks.
No manually drawn or inferred plan geometry. Requires pymupdf and shapely.
"""
from pathlib import Path
import json,hashlib
import pymupdf as fitz
from shapely.geometry import Polygon, GeometryCollection, box, Point
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1]
S=50*.0254/72; OX=58.32; OY=425.52
SPECS=[(0,'BA_BUCKINX_P_N_NIVEAU 0  .pdf','ground',(10,350,2370,1440)),(1,'BA_BUCKINX_P_N_NIVEAU  1 .pdf','first',(10,380,2370,1460)),(2,'BA_BUCKINX_P_N_NIVEAU  2 .pdf','second',(10,420,2370,1450))]
def xy(p):return [round((p[0]-OX)*S,5),round((p[1]-OY)*S,5)]
def polygons(g):
 if g.is_empty:return []
 if g.geom_type=='Polygon':return [g]
 return [p for q in getattr(g,'geoms',[]) for p in polygons(q)]
def encode(g):return [{'outer':[xy(p) for p in list(q.exterior.coords)[:-1]],'holes':[[xy(p) for p in list(r.coords)[:-1]] for r in q.interiors]} for q in polygons(g) if q.area*S*S>.0001]
def path(d):
 rings=[];pts=[]
 for it in d['items']:
  if it[0]=='re':
   r=it[1];rings.append(Polygon([(r.x0,r.y0),(r.x1,r.y0),(r.x1,r.y1),(r.x0,r.y1)]));continue
  if it[0]!='l':return None # curves omitted, not reconstructed by guessed segments
  a,b=it[1:]
  if pts and abs(pts[-1][0]-a.x)+abs(pts[-1][1]-a.y)>.02:
   if len(pts)>2:rings.append(Polygon(pts))
   pts=[]
  if not pts:pts.append((a.x,a.y))
  pts.append((b.x,b.y))
 if len(pts)>2:rings.append(Polygon(pts))
 if not rings:return None
 g=unary_union([r if r.is_valid else r.buffer(0) for r in rings]);return g
floors=[]
for level,name,slug,clip in SPECS:
 p=ROOT/'reference/FW_ Laatste versie plannen'/name;page=fitz.open(p)[0]
 walls=GeometryCollection();facade=GeometryCollection();surfaces=[];omitted=0
 for d in page.get_drawings():
  c=d['fill']
  if c is None:continue
  g=path(d)
  if g is None:omitted+=1;continue
  if not g.is_valid:g=g.buffer(0)
  c=tuple(round(v,3) for v in c)
  if c==(1.,.8,.6):walls=walls.union(g)
  elif not walls.is_empty and walls.intersects(g):walls=walls.difference(g)
  if c==(.533,.533,.533):facade=facade.union(g)
  elif not facade.is_empty and facade.intersects(g):facade=facade.difference(g)
  if c in [( .933,.933,.933),(.898,1.,.898),(1.,.667,1.),(.6,1.,1.),(.8,1.,1.),(1.,1.,.8)] and g.area*S*S>.5:
   surfaces.append({'color':list(c),'polygons':encode(g)})
 rooms=[]
 for b in page.get_text('dict')['blocks']:
  for ln in b.get('lines',[]):
   txt=''.join(s['text'] for s in ln['spans']).strip()
   if any(txt.startswith(t) for t in ['slaapk.','leefr.','badk.','hall','nachthal','berg.','terras','overd.','traphal','wc']):
    r=fitz.Rect(ln['bbox']);x,z=xy(((r.x0+r.x1)/2,(r.y0+r.y1)/2));rooms.append({'label':txt,'x':x,'z':z})
 living=sorted([r for r in rooms if r['label'].startswith('leefr.')],key=lambda r:r['x'])
 units=[{'id':f'{level}.{i+1}','x':r['x'],'z':r['z']} for i,r in enumerate(living)]
 floor={'level':level,'elevation':level*2.85,'wallHeight':2.5,'bounds':[0,0,40,17], 'wallPolygons':encode(walls),'facadePolygons':encode(facade),'floorPolygons':surfaces,'rooms':rooms,'units':units,'floorImage':{'url':f'/assets/plan-{slug}.webp','bounds':xy(clip[:2])+xy(clip[2:])},'source':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'omittedCurvedFilledPaths':omitted}
 slab = unary_union([Polygon(poly['outer'], poly['holes']) for surface in surfaces for poly in surface['polygons']] + [Polygon(poly['outer'], poly['holes']) for poly in floor['wallPolygons'] + floor['facadePolygons']])
 # All inputs here are already in world metres; use dedicated encoder.
 slab = slab.simplify(.002, preserve_topology=True)
 floor['slabPolygons'] = [{'outer':[[round(x,5),round(z,5)] for x,z in list(q.exterior.coords)[:-1]],'holes':[[[round(x,5),round(z,5)] for x,z in list(r.coords)[:-1]] for r in q.interiors]} for q in polygons(slab)]
 floor['bounds'] = [round(v,5) for v in slab.bounds]
 # Only source surface polygons containing interior room labels are ceilings.
 interior_points=[Point(r['x'],r['z']) for r in rooms if not r['label'].startswith(('terras','overd.'))]
 terrace_points=[Point(r['x'],r['z']) for r in rooms if r['label'].startswith(('terras','overd.'))]
 interior_surfaces=[]
 for surface in surfaces:
  for poly in surface['polygons']:
   pg=Polygon(poly['outer'],poly['holes'])
   if any(pg.covers(pt) for pt in interior_points) and not any(pg.covers(pt) for pt in terrace_points): interior_surfaces.append(pg)
 ceiling=unary_union(interior_surfaces+[Polygon(p['outer'],p['holes']) for p in floor['wallPolygons']+floor['facadePolygons']]).simplify(.002,preserve_topology=True)
 floor['ceilingPolygons']=[{'outer':[[round(x,5),round(z,5)] for x,z in list(q.exterior.coords)[:-1]],'holes':[[[round(x,5),round(z,5)] for x,z in list(r.coords)[:-1]] for r in q.interiors]} for q in polygons(ceiling)]
 floor['ceilingHeight']=2.5
 floor['ceilingNote']='Source colored floor regions containing interior room labels, excluding every region with a terrace label, unioned with wall footprints. Plane at source2.50m clear room height; no roof or slab build-up inferred.'
 floor['roofPolygons'] = None
 floor['roofNote'] = 'Roof outline and overhang not reconstructed: source floor surfaces do not establish a complete roof footprint.'
 floors.append(floor);print(level,len(floor['wallPolygons']),len(floor['facadePolygons']),len(surfaces),len(rooms),units)
# Roof outline is constrained by three orthographic elevation vector bands.
def roof_band(filename):
 pg=fitz.open(ROOT/'reference/FW_ Laatste versie plannen'/filename)[0]
 candidates=[d for d in pg.get_drawings() if d['fill'] and all(abs(v-1/3)<.001 for v in d['fill']) and d['rect'].width>500 and 39<d['rect'].height<41]
 assert len(candidates)==1, (filename,len(candidates))
 return candidates[0]['rect']
front=roof_band('BA_BUCKINX_G_N_VOORGEVEL.pdf')
left=roof_band('BA_BUCKINX_G_N_LINKER ZIJGEVEL.pdf')
right=roof_band('BA_BUCKINX_G_N_RECHTER ZIJGEVEL.pdf')
assert abs(left.width-right.width)*S<.001
main=unary_union([Polygon(p['outer'],p['holes']) for p in floors[2]['facadePolygons']])
x0,z0,x1,z1=main.bounds
cx=(x0+x1)/2;cz=(z0+z1)/2;rw=front.width*S;rd=left.width*S
roofbounds=[round(cx-rw/2,5),round(cz-rd/2,5),round(cx+rw/2,5),round(cz+rd/2,5)]
a,b,c,d=roofbounds
floors[2]['roofPolygons']=[{'outer':[[a,b],[c,b],[c,d],[a,d]],'holes':[]}]
floors[2]['roofTopElevation']=8.8
floors[2]['roofThickness']=round(front.height*S,5)
floors[2]['roofBottomElevation']=round(8.8-front.height*S,5)
floors[2]['roofBaseElevation']=floors[2]['roofBottomElevation']
floors[2]['roofNote']='Verified rectangular roof band from front and both side elevations, registered to centered top-storey main wall. Front width and side depth establish ~0.60m overhang on all four sides. Top +98.61 relative to ground +89.81. Cap is external roof-band envelope; internal roof build-up not reconstructed.'
floors[2]['roofEvidence']={'frontPdfRect':list(front),'leftPdfRect':list(left),'rightPdfRect':list(right),'mainWallBounds':list(main.bounds),'bounds':roofbounds,'widthM':round(rw,5),'depthM':round(rd,5)}
result={'schemaVersion':1,'units':'metres','method':'Source PDF filled linear paths; orange masonry and grey facade reconstructed in exact paint order with later filled paths subtracted. Curved filled paths are omitted. 1:50 scale; shared original page coordinates registered at [58.32,425.52] PDF points. No guessed plan geometry.','verticalBasis':'Section AA/BB 250cm internal height; source floor elevations89.81,92.66,95.51. Openings are full-height voids in this cutaway; sill/lintel heights and window glass are not inferred.','floors':floors}
out=ROOT/'public/models/architecture.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,separators=(',',':')))
assert [len(f['units']) for f in floors]==[4,4,2]
assert all(len(f['wallPolygons'])>30 for f in floors)
