#!/usr/bin/env python3
"""Render faithful, reproducible WebP crops from the supplied architectural PDFs.
Requires PyMuPDF and Pillow. Source files are opened read-only. No retouching,
geometry synthesis, recoloring or furnishings are added. Clips use PDF points.
"""
from pathlib import Path
import hashlib
import json
import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'reference' / 'FW_ Laatste versie plannen'
OUT = ROOT / 'public' / 'assets'
SPECS = [
 ('elevation-front','BA_BUCKINX_G_N_VOORGEVEL.pdf',(20,540,2370,1250),'Front elevation'),
 ('elevation-rear','BA_BUCKINX_G_N_ACHTERGEVEL.pdf',(20,540,2370,1250),'Rear elevation'),
 ('elevation-left','BA_BUCKINX_G_N_LINKER ZIJGEVEL.pdf',(215,295,1410,1010),'Left elevation'),
 ('elevation-right','BA_BUCKINX_G_N_RECHTER ZIJGEVEL.pdf',(10,300,1480,1040),'Right elevation and garage approach'),
 ('plan-ground','BA_BUCKINX_P_N_NIVEAU 0  .pdf',(10,350,2370,1440),'Furnished ground floor plan — four apartments'),
 ('plan-first','BA_BUCKINX_P_N_NIVEAU  1 .pdf',(10,380,2370,1460),'Furnished first floor plan — four apartments'),
 ('plan-second','BA_BUCKINX_P_N_NIVEAU  2 .pdf',(10,420,2370,1450),'Furnished second floor plan — two apartments'),
 ('plan-basement','BA_BUCKINX_P_N_NIVEAU -1 .pdf',(10,170,2370,1450),'Basement parking and storage plan'),
 ('site-plan','BA_BUCKINX_I_N_INPLANTING.pdf',(15,15,1655,1125),'Site layout'),
]

# Each crop retains the complete colored unit and its terraces, plus a narrow
# context margin. Rectangles are viewport crops, never legal/unit boundaries.
UNIT_CROPS = {
 '0.1': ('plan-ground', (45,410,650,1405)),
 '0.2': ('plan-ground', (620,410,1210,1320)),
 '0.3': ('plan-ground', (1180,410,1770,1320)),
 '0.4': ('plan-ground', (1735,410,2335,1405)),
 '1.1': ('plan-first', (45,700,650,1405)),
 '1.2': ('plan-first', (615,600,1210,1310)),
 '1.3': ('plan-first', (1170,600,1765,1310)),
 '1.4': ('plan-first', (1735,700,2335,1405)),
 '2.1': ('plan-second', (150,610,1200,1310)),
 '2.2': ('plan-second', (1170,610,2225,1310)),
}
BASE_SPECS = {spec[0]: spec for spec in SPECS}
for unit,(floor,clip) in UNIT_CROPS.items():
 SPECS.append((f'apartment-{unit}',BASE_SPECS[floor][1],clip,f'Apartment {unit} — furnished source-plan detail'))

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 manifest={'method':'Direct PDF rendering with rectangular sheet-margin crops; original linework, furniture, colors and annotations preserved. No unit-boundary segmentation or generated geometry.','assets':[]}
 for slug,filename,coords,title in SPECS:
  source=SOURCE / filename
  with fitz.open(source) as document:
   page=document[0]; clip=fitz.Rect(coords); assert page.rect.contains(clip)
   scale=(1800 if slug.startswith('apartment-') else 2800) / max(clip.width,clip.height)
   pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),clip=clip,alpha=False)
   im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
   target=OUT / f'{slug}.webp'; im.save(target,'WEBP',quality=93,method=6)
   thumb=im.copy();thumb.thumbnail((1100,1100));thumb.save(OUT / f'{slug}-small.webp','WEBP',quality=88,method=6)
   pins=[]
   for block in page.get_text('dict')['blocks']:
    for line in block.get('lines',[]):
     for span in line['spans']:
      if span['text'].startswith('app.: '):
       x0,y0,x1,y1=span['bbox']
       if not clip.contains(fitz.Point((x0+x1)/2,(y0+y1)/2)): continue
       pins.append({'unit':span['text'].replace('app.: ','').strip(),'x':round(((x0+x1)/2-clip.x0)/clip.width,5),'y':round(((y0+y1)/2-clip.y0)/clip.height,5),'meaning':'Source apartment label center, not a unit boundary'})
   manifest['assets'].append({'unitLabelPins':pins,'id':slug,'title':title,'url':f'/assets/{slug}.webp','smallUrl':f'/assets/{slug}-small.webp','source':str(source.relative_to(ROOT)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'page':1,'clipPdfPoints':list(coords),'width':im.width,'height':im.height,'bytes':target.stat().st_size,'geometry':'unaltered source drawing','viewType':'apartment-context-crop' if slug.startswith('apartment-') else 'complete-drawing','limitation':'Rectangular detail view, not an apartment boundary. Neighboring or common areas may be visible; the original apartment number and source color identify the selected home.' if slug.startswith('apartment-') else None})
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(f'Rendered {len(SPECS)} source drawings in two responsive sizes.')

if __name__=='__main__': main()
