from pathlib import Path
import json
out=Path('analysis'); rows=[]
base='reference/FW_ Laatste versie plannen/'
floors={0:'BA_BUCKINX_P_N_NIVEAU 0  .pdf',1:'BA_BUCKINX_P_N_NIVEAU  1 .pdf',2:'BA_BUCKINX_P_N_NIVEAU  2 .pdf'}
values=[('0.1',171.44,147.46,3,[12.0]),('0.2',142.22,125.60,2,[12.0]),('0.3',142.22,125.60,2,[12.0]),('0.4',171.44,147.46,3,[12.0]),('1.1',118.54,102.69,2,[12.6]),('1.2',107.61,94.10,2,[12.0]),('1.3',107.61,94.10,2,[12.0]),('1.4',118.54,102.69,2,[12.6]),('2.1',189.96,171.94,3,[20.37,20.37]),('2.2',189.96,171.94,3,[20.37,20.37])]
basement=[(48.98,42.9),(42.94,39.09),(47.18,42.9),(35.85,33.12),(24.12,21.43),(24.12,21.43),(24.12,21.43),(24.12,21.43),(24.12,21.43),(35.89,28.72)]
for (ident,gross,net,beds,terr),annex in zip(values,basement):
 floor=int(ident[0]); source=base+floors[floor]
 rows.append({'id':ident,'floor':floor,'grossAreaM2':gross,'netAreaM2':net,'areaBasis':'As stated in floor-plan Oppervlaktes schedule; these totals appear to include terrace areas. Not certified internal living area. Basement allocation excluded.','bedrooms':beds,'bathrooms':1,'separateWc':1,'terraceAreasM2':terr,'terraceAreaM2':round(sum(terr),2),'coveredTerrace':True if floor==0 else None,'privateGardenAreaM2':None,'price':None,'availability':None,'orientation':None,'basementAllocatedGrossM2':annex[0],'basementAllocatedNetM2':annex[1],'source':source,'page':1,'evidence':{'areas':f'Lower-left Oppervlaktes box: Bruto opp. app. {ident}: {gross:.2f}m²; Netto opp. app. {ident}: {net:.2f}m² (decimal commas in original).','bedrooms':f'Unit {ident} color zone labels slaapk. 1 through slaapk. {beds}.','bathrooms':'One badk. room and one separate wc label in unit color zone.','terraces':'Terras/overd. terras labels and printed areas in unit color zone; two distinct terraces per penthouse.','basement':base+'BA_BUCKINX_P_N_NIVEAU -1 .pdf; Oppervlaktes box.'}})
(out/'apartment-schedule.json').write_text(json.dumps({'schemaVersion':1,'verifiedBy':'PDF text extraction plus visual inspection of all three furnished level drawings','drawingDate':'2026-07-24','units':rows},indent=2))
inventory=json.loads((out/'inventory.json').read_text())
assert len(inventory)==32 and sum('pages'in x for x in inventory)==23 and len(rows)==10
assert all(x['pages']==1 for x in inventory if 'pages'in x)
print('Validated 32 sources (23 single-page PDFs, 9 DWG headers), 10 units.')
print('DWG headers:',set(x['dwg_header'] for x in inventory if 'dwg_header'in x))
