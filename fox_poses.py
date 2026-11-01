"""Bake a short waking performance from the fox's original ink and paper."""
from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import map_coordinates, distance_transform_edt, gaussian_filter

root = Path(__file__).parent
original = Image.open(root / 'dist/assets/original.jpeg').convert('RGB')
# This patch includes the shoulder, which stays attached to the sleeping body.
left, top, size = 498, 898, 248
paper = original.crop((left, top, left+size, top+size))
head = [(519,1098),(512,1088),(512,1081),(518,1083),(524,1090),(536,1087),
        (550,1089),(552,1078),(556,1061),(540,1071),(532,1078),(535,1069),
        (542,1057),(551,1047),(541,1048),(538,1044),(550,1042),(563,1043),
        (562,1023),(558,1006),(562,1006),(575,1012),(590,1023),(598,1030),
        (603,1015),(609,999),(611,986),(614,981),(619,981),(627,987),
        (639,996),(650,1010),(655,1024),(660,1044),(662,1055),(671,1062),
        (681,1061),(694,1055),(717,1039),(745,1026),(746,1120),(683,1122),
        (666,1128),(649,1137),(631,1139),(596,1141),(558,1141),(539,1138),
        (527,1130),(519,1119),(516,1109)]
mask = Image.new('L',paper.size)
ImageDraw.Draw(mask).polygon([(x-left,y-top) for x,y in head],fill=255)
alpha = np.asarray(mask.filter(ImageFilter.GaussianBlur(.7)))/255
pixels=np.asarray(paper,dtype=float)
yy,xx=np.indices(alpha.shape,dtype=float)
# Clone moss from immediately below the chin. It only appears where the head lifts.
gx,gy=xx+left, yy+top
donor_x=552 + .27*(gx-550)
donor_y=1152 + .19*(gy-1010) + 4*np.sin(gx*.021)
clone=np.stack([map_coordinates(np.asarray(original)[:,:,k],[donor_y,donor_x],order=1) for k in range(3)],axis=-1)
repair=np.asarray(mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.2)))/255
# Feather only the exposed head area; the right-hand shoulder never detaches.
repair*=np.clip((739-gx)/30,0,1)
clean=pixels*(1-repair[:,:,None])+clone*repair[:,:,None]
# Extend ink colours just outside the matte before filtering the moving silhouette.
_,idx=distance_transform_edt(alpha<.5,return_indices=True)
fur=pixels[tuple(idx)]
def smooth(v):
    v=np.clip(v,0,1)
    return v*v*(3-2*v)
def sample(values,x,y):
    return map_coordinates(values,[y,x],order=1,mode='nearest')
def make_frame(t):
    rise=smooth((t-.25)/1.7)*(1-smooth((t-5.1)/1.85))
    turn=smooth((t-2.05)/.75)-1.9*smooth((t-3.24)/.97)+.9*smooth((t-4.65)/.76)
    eye=smooth((t-.55)/.75)*(1-smooth((t-5.15)/.9))
    eye*=1-.96*math.exp(-((t-3.05)/.11)**2)
    # The nose and ears rotate up together, with an eased bend into the shoulder.
    angle=rise*(.285+.046*turn)
    def shift(x,y):
        w=smooth((738-x)/97)
        dx,dy=x-704,y-1094
        return (w*((math.cos(angle)-1)*dx-math.sin(angle)*dy+turn*(x-704)*.095),
                w*(math.sin(angle)*dx+(math.cos(angle)-1)*dy-13*rise))
    sx,sy=gx.copy(),gy.copy()
    for _ in range(9):
        dx,dy=shift(sx,sy)
        sx,sy=gx-dx,gy-dy
    a=sample(alpha,sx-left,sy-top)
    a[(sx<left)|(sy<top)|(sx>=left+size)|(sy>=top+size)]=0
    face=Image.fromarray(fur.astype('uint8')).resize((size*3,size*3),Image.Resampling.BICUBIC)
    if eye>.02:
        draw=ImageDraw.Draw(face)
        def coords(points): return [((x-left)*3,(y-top)*3) for x,y in points]
        # The original closed ink stroke forms the lower eyelid.
        draw.polygon(coords([(559,1094),(562,1093-3*eye),(566,1092-3*eye),
                             (574,1090),(570,1094),(565,1096),(561,1096)]),fill=(79,63,44))
        px=564+turn*2
        draw.ellipse(coords([(px-1.4,1092-2.8*eye),(px+1.4,1093.2)]),fill=(43,37,29))
        if eye>.55: draw.ellipse(coords([(px-.8,1090),(px+.2,1091)]),fill=(221,195,143))
    face=np.asarray(face.resize((size,size),Image.Resampling.LANCZOS))
    rgb=np.stack([sample(face[:,:,k],sx-left,sy-top) for k in range(3)],axis=-1)
    out=clean*(1-a[:,:,None])+rgb*a[:,:,None]
    # Crossfade only the transition out of the exact original sleeping pose.
    mix=smooth(rise/.18)
    return Image.fromarray(np.uint8(np.clip(pixels*(1-mix)+out*mix,0,255)))
atlas=Image.new('RGB',(size*8,size*8))
for i in range(64):
    atlas.paste(make_frame(i*7.2/63),((i%8)*size,(i//8)*size))
atlas.save(root/'dist/assets/fox-poses.webp',quality=93,method=5)
