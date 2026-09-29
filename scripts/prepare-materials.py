#!/usr/bin/env python3
"""Extract a wall material swatch from the original elevation, without synthesis."""
from pathlib import Path
import hashlib,json
import pymupdf as fitz
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'reference/FW_ Laatste versie plannen/BA_BUCKINX_G_N_LINKER ZIJGEVEL.pdf'
OUT=ROOT/'public/assets/materials'
CLIP=(520,710,780,795)

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 with fitz.open(SOURCE) as doc:
  page=doc[0]
  # Large uninterrupted ground-floor wall left of the narrow vertical window.
  clip=fitz.Rect(CLIP)
  pix=page.get_pixmap(matrix=fitz.Matrix(512/clip.width,512/clip.width),clip=clip,alpha=False)
  image=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
  image.save(OUT/'source-brick.webp','WEBP',quality=95,method=6)
 meta={'id':'source-brick','url':'/assets/materials/source-brick.webp','source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'page':1,'clipPdfPoints':list(CLIP),'width':image.width,'height':image.height,'method':'Direct raster crop from unbroken ground-floor brick wall on left elevation; no recoloring, retouching, synthesis or geometry modification.','limitation':'Architectural drawing material swatch, not a calibrated photograph or guaranteed construction finish. Repetition is approximate; original crop edges are preserved.','suggestedRepeatMetres':{'width':4.59,'height':1.5},'repeatScaleBasis':'PDF elevation marked 1:50; 260 by 85 PDF points at that scale.'}
 (OUT/'provenance.json').write_text(json.dumps(meta,indent=2)+'\n')
 print(f'Created {image.width} x {image.height} source brick swatch')
if __name__=='__main__':main()
