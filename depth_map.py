"""Build the scene's depth (red), wind (green), and fox (blue) fields."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).parent
size = (500, 539)
depth, wind, fox = [Image.new("L", size) for _ in range(3)]
for y in range(size[1]):
    d = 25 + int(90 * (y / 538) ** 1.8)
    ImageDraw.Draw(depth).line((0,y,499,y), fill=d)

def shape(points, distance, breeze, animal=0):
    for channel, value in zip((depth, wind, fox), (distance, breeze, animal)):
        ImageDraw.Draw(channel).polygon(points, fill=value)

# Coordinates trace the original at a 500 px working width; paint back to front.
shape([(0,0),(140,0),(137,94),(145,169),(169,192),(154,233),(103,230),(115,299),(128,377),(0,393)], 117, 8)
shape([(358,0),(430,0),(433,68),(419,156),(424,209),(405,232),(378,251),(323,274),(336,227),(351,184),(358,134)], 109, 7)
shape([(133,186),(146,171),(158,188),(170,180),(169,207),(191,223),(212,230),(218,245),(241,229),(249,259),(272,251),(282,270),(303,269),(327,244),(349,256),(362,241),(373,268),(348,308),(302,339),(250,349),(176,314)], 126, 186)
shape([(391,65),(403,59),(448,60),(455,69),(445,91),(435,100),(451,129),(456,172),(456,218),(420,222),(421,202),(436,155),(437,128),(431,108),(413,124),(395,125)], 136, 108)
shape([(462,0),(500,0),(500,358),(467,379),(435,403),(415,423),(366,418),(341,394),(297,374),(247,368),(213,341),(205,309),(231,321),(254,342),(285,340),(318,328),(344,304),(365,271),(375,255),(409,257),(441,231),(455,199),(460,147)], 160, 14)
shape([(25,281),(40,243),(62,201),(76,190),(99,198),(147,225),(161,262),(144,286),(105,290),(129,361),(118,386),(102,375),(91,301),(37,296)], 151, 104)
for x,y,r in [(288,242,7),(298,244,8),(308,220,8),(17,320,11),(45,324,12)]:
    shape([(x-1,y),(x+1,y),(x+4,y+20),(x+1,y+21)], 148, 145)
    for channel,value in ((depth,151),(wind,220)):
        ImageDraw.Draw(channel).ellipse((x-r,y-r*.7,x+r,y+r*.7),fill=value)
contours = json.loads((root/"contours.json").read_text())
def trace(name, d, w, a=0):
    shape([(round(x*500/1320),round(y*539/1422)) for x,y in contours[name]],d,w,a)
trace("great-mushroom",178,94)
shape([(0,470),(42,449),(74,436),(111,438),(145,424),(178,419),(190,399),(209,397),(219,380),(243,375),(257,393),(284,399),(303,416),(343,414),(357,401),(372,419),(393,410),(414,418),(435,397),(456,404),(475,386),(499,370),(499,460),(376,460),(350,480),(246,476),(165,481),(0,509)],185,184)
trace("foreground-mushroom",225,146)
for x,y,dx in [(160,433,4),(188,465,10),(222,303,3),(437,404,-6),(445,385,-6)]:
    shape([(x-4,y+60),(x-2,y+13),(x-9,y+7),(x-5,y-6),(x+dx+4,y-17),(x+9,y+3),(x+4,y+12),(x,y+15)],208,220)
trace("fox",211,0,255)
shape([(0,508),(93,504),(135,492),(170,498),(195,500),(221,509),(281,507),(313,506),(350,503),(378,502),(368,513),(390,515),(373,528),(378,538),(0,538)],244,184)
Image.merge("RGB", (depth.filter(ImageFilter.GaussianBlur(8)),
                    wind.filter(ImageFilter.GaussianBlur(3)),
                    fox.filter(ImageFilter.GaussianBlur(2)))).save(root/"dist/assets/relief.png",optimize=True)
