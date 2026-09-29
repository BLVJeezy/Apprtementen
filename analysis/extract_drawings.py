from pathlib import Path
from pypdf import PdfReader
import hashlib,json,subprocess
from PIL import Image,ImageOps,ImageDraw
root=Path('reference/FW_ Laatste versie plannen'); out=Path('analysis'); (out/'text').mkdir(exist_ok=True); (out/'renders').mkdir(exist_ok=True)
rows=[]; thumbs=[]
for i,p in enumerate(sorted(root.iterdir())):
 r={'id':i,'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 if p.suffix=='.pdf':
  pdf=PdfReader(p); r['pages']=len(pdf.pages); r['page_sizes_points']=[[float(x.mediabox.width),float(x.mediabox.height)] for x in pdf.pages]
  (out/'text'/f'{p.stem}.txt').write_text('\n\n'.join(x.extract_text() or '' for x in pdf.pages))
  prefix=out/'renders'/f'{i:02d}'
  subprocess.run(['pdftoppm','-scale-to','1800','-png','-singlefile',str(p),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  im=Image.open(str(prefix)+'.png').convert('RGB'); im.thumbnail((600,420)); tile=Image.new('RGB',(620,465),'white'); tile.paste(im,((620-im.width)//2,30)); ImageDraw.Draw(tile).text((10,5),f'{i}: {p.stem}',fill='black'); thumbs.append(tile)
 else:r['dwg_header']=p.read_bytes()[:6].decode('ascii','replace');r['geometry_status']='unparsed; header inspection only'
 rows.append(r)
(out/'inventory.json').write_text(json.dumps(rows,indent=2))
for j in range(0,len(thumbs),6):
 sheet=Image.new('RGB',(1860,930),'#dddddd')
 for k,t in enumerate(thumbs[j:j+6]):sheet.paste(t,((k%3)*620,(k//3)*465))
 sheet.save(out/f'contact-{j//6+1}.jpg')
