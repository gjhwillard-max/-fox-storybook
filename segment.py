"""Original-pixel cutouts; deterministic nearest-neighbour hidden texture only.
Run with Python, Pillow, NumPy, SciPy. No models, network or paid services.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy.ndimage import distance_transform_edt
import json, shutil
ROOT=Path(__file__).parent
src=ROOT/'dist/assets/original.jpeg'
im=Image.open(src).convert('RGB'); a=np.array(im); w,h=im.size
# Hand-placed contours include a small original-paper collar to retain pencil edges.
polys={
'great-mushroom':[(332,324),(348,291),(402,253),(459,210),(501,161),(563,114),(603,92),(637,92),(676,111),(708,146),(735,193),(751,246),(765,308),(788,372),(801,411),(800,447),(784,464),(746,477),(687,477),(619,472),(557,464),(535,519),(518,568),(507,621),(507,716),(519,780),(544,852),(567,921),(591,974),(566,1039),(526,1058),(480,1083),(430,1114),(372,1137),(319,1146),(313,1087),(315,981),(317,884),(325,789),(345,679),(367,578),(399,510),(446,452),(485,440),(436,420),(390,390),(360,365)],
'foreground-mushroom':[(0,924),(49,906),(92,890),(139,872),(184,863),(209,866),(229,888),(248,934),(266,995),(281,1043),(304,1074),(332,1116),(353,1165),(364,1192),(359,1214),(345,1233),(301,1234),(270,1236),(216,1238),(175,1227),(144,1217),(153,1254),(171,1294),(179,1338),(0,1338)],
'fox':[(515,1096),(532,1089),(548,1088),(552,1070),(562,1055),(555,1041),(569,1045),(565,1016),(587,1036),(599,1033),(605,1005),(615,985),(633,992),(648,1018),(658,1048),(663,1064),(678,1062),(710,1043),(751,1026),(790,1017),(825,1025),(846,1041),(859,1064),(872,1102),(881,1156),(886,1211),(894,1270),(911,1264),(925,1247),(932,1275),(928,1307),(914,1327),(892,1336),(857,1337),(821,1330),(798,1316),(781,1294),(778,1264),(784,1236),(752,1242),(715,1247),(680,1243),(649,1250),(633,1268),(618,1256),(605,1232),(601,1200),(608,1170),(629,1145),(601,1143),(570,1142),(542,1138),(527,1129),(519,1117)],
'ear':[(598,1058),(601,1035),(607,1005),(615,985),(633,992),(648,1018),(658,1048),(660,1067),(638,1077),(618,1065)]}
def mask(points):
 m=Image.new('L',(w,h)); ImageDraw.Draw(m).polygon(points,fill=255); return np.array(m)>0
ms={k:mask(v) for k,v in polys.items()}
# Ear is nested in the fox, never in the forest.
ms['ear'] &= ms['fox']
def fill(image,m):
 _,idx=distance_transform_edt(m,return_indices=True)
 out=image.copy(); out[m]=image[tuple(idx[:,m])]; return out
union=ms['fox']|ms['great-mushroom']|ms['foreground-mushroom']
base=fill(a,union); Image.fromarray(base).save(ROOT/'dist/assets/forest.png')
for name,m in ms.items():
 rgb=fill(a,ms['ear']) if name=='fox' else a
 rgb=rgb.copy(); rgb[~m]=0
 rgba=np.dstack((rgb,m.astype('uint8')*255)); Image.fromarray(rgba).save(ROOT/f'dist/assets/{name}.png')
 Image.fromarray(m.astype('uint8')*255).save(ROOT/f'dist/assets/{name}-mask.png')
recomposed=Image.fromarray(base).convert('RGBA')
for n in ['great-mushroom','foreground-mushroom','fox','ear']:
 recomposed=Image.alpha_composite(recomposed,Image.open(ROOT/f'dist/assets/{n}.png'))
diff=np.abs(np.array(recomposed.convert('RGB')).astype(int)-a.astype(int))
report={'dimensions':[w,h],'maximum_channel_error':int(diff.max()),'changed_pixels':int(np.any(diff,axis=2).sum()),'method':'binary original-pixel masks; nearest-neighbour extension exclusively under cutouts'}
assert report['changed_pixels']==0,report
(ROOT/'preservation-check.json').write_text(json.dumps(report,indent=2))
(ROOT/'contours.json').write_text(json.dumps(polys,indent=2))
print(report)
