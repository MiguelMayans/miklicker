from PIL import Image, ImageDraw
import os

SIZE = 64
os.makedirs('public/sprites', exist_ok=True)

def new_img():
    return Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))

def put_pixel(d, x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        d.point((x, y), fill=color)

def rect(d, x, y, w, h, color):
    d.rectangle([x, y, x+w-1, y+h-1], fill=color)

def outline_rect(d, x, y, w, h, color):
    d.rectangle([x, y, x+w-1, y+h-1], outline=color)

# ============================================================
# 1. REACTOR — Núcleo de Fusión (hexágono glow ámbar)
# ============================================================
img = new_img()
d = ImageDraw.Draw(img)
# Outer metal ring
d.polygon([(32,8),(52,18),(52,42),(32,52),(12,42),(12,18)], outline=(30,30,35,255), width=3)
d.polygon([(32,8),(52,18),(52,42),(32,52),(12,42),(12,18)], outline=(60,60,65,255), width=1)
# Inner glow core
d.polygon([(32,14),(46,22),(46,38),(32,46),(18,38),(18,22)], fill=(255,180,60,255))
# Bright center
d.polygon([(32,20),(40,25),(40,35),(32,40),(24,35),(24,25)], fill=(255,230,150,255))
# Corner bolts
for bx,by in [(20,12),(44,12),(52,30),(44,48),(20,48),(12,30)]:
    d.ellipse([bx-2,by-2,bx+2,by+2], fill=(200,200,200,255))
img.save('public/sprites/generator.png')

# ============================================================
# 2. SOLAR PANEL — Panel con luz estelar dorada
# ============================================================
img = new_img()
d = ImageDraw.Draw(img)
# Panel body (angled)
rect(d, 16, 22, 32, 20, (45,45,50,255))
outline_rect(d, 16, 22, 32, 20, (70,70,75,255))
# Grid cells
for i in range(4):
    for j in range(3):
        cx = 18 + i*7
        cy = 24 + j*6
        rect(d, cx, cy, 6, 5, (255,210,80,255))
        outline_rect(d, cx, cy, 6, 5, (220,170,50,255))
# Stand
rect(d, 30, 42, 4, 16, (80,80,85,255))
rect(d, 22, 56, 20, 4, (80,80,85,255))
# Sun rays behind
for sx,sy,sw,sh in [(8,8,4,4),(52,6,4,4),(10,14,3,3),(50,12,3,3)]:
    rect(d, sx, sy, sw, sh, (255,200,80,200))
img.save('public/sprites/solar_panel.png')

# ============================================================
# 3. LUNAR MINE — Taladro en superficie lunar
# ============================================================
img = new_img()
d = ImageDraw.Draw(img)
# Moon surface
rect(d, 8, 48, 48, 8, (140,130,120,255))
# Drill tower
rect(d, 28, 16, 8, 32, (180,70,60,255))
outline_rect(d, 28, 16, 8, 32, (220,90,70,255))
# Drill bit (triangle)
d.polygon([(32,8),(38,18),(26,18)], fill=(200,200,200,255))
# Drill head spinning effect
rect(d, 26, 18, 12, 4, (160,60,50,255))
# Craters on surface
for cx,cy,cr in [(14,50,3),(42,52,2),(24,54,2)]:
    d.ellipse([cx-cr,cy-cr,cx+cr,cy+cr], fill=(120,110,100,255))
# Warning light
rect(d, 30, 12, 4, 4, (255,60,60,255))
img.save('public/sprites/lunar_mine.png')

# ============================================================
# 4. HYDRO FARM — Tubos bioluminiscentes
# ============================================================
img = new_img()
d = ImageDraw.Draw(img)
# Base container
rect(d, 14, 44, 36, 10, (60,80,70,255))
outline_rect(d, 14, 44, 36, 10, (90,120,100,255))
# Three vertical tubes
for tx in [20, 32, 44]:
    rect(d, tx-3, 12, 6, 32, (30,50,40,255))
    outline_rect(d, tx-3, 12, 6, 32, (60,100,80,255))
    # Glow liquid inside
    rect(d, tx-2, 16, 4, 20, (100,255,180,255))
    # Bubbles
    d.ellipse([tx-1, 18, tx+1, 20], fill=(220,255,240,255))
    d.ellipse([tx-1, 26, tx+1, 28], fill=(220,255,240,255))
# Connecting tubes
rect(d, 20, 38, 24, 3, (80,80,80,255))
img.save('public/sprites/hydro_farm.png')

# ============================================================
# 5. DRONE FACTORY — Hangar con drones
# ============================================================
img = new_img()
d = ImageDraw.Draw(img)
# Factory building
rect(d, 12, 24, 40, 28, (70,60,90,255))
outline_rect(d, 12, 24, 40, 28, (110,90,140,255))
# Door/hangar opening
rect(d, 22, 36, 20, 12, (20,20,25,255))
# Roof antenna
rect(d, 30, 12, 4, 12, (180,180,180,255))
d.ellipse([28, 8, 36, 16], fill=(255,80,80,255))
# Small drone exiting
rect(d, 26, 30, 8, 4, (180,160,220,255))
outline_rect(d, 26, 30, 8, 4, (220,200,255,255))
# Drone propellers
rect(d, 24, 28, 4, 2, (200,200,200,255))
rect(d, 32, 28, 4, 2, (200,200,200,255))
# Side windows
rect(d, 16, 28, 4, 4, (255,230,120,255))
rect(d, 44, 28, 4, 4, (255,230,120,255))
img.save('public/sprites/drone_factory.png')

# ============================================================
# 6. CURSOR — Mano robótica mecánica
# ============================================================
img = new_img()
d = ImageDraw.Draw(img)
# Arm/base
rect(d, 28, 36, 8, 16, (120,120,125,255))
outline_rect(d, 28, 36, 8, 16, (180,180,185,255))
# Hand body
rect(d, 22, 20, 20, 18, (160,160,165,255))
outline_rect(d, 22, 20, 20, 18, (200,200,205,255))
# Finger pointing up-right
rect(d, 34, 12, 6, 12, (200,200,205,255))
outline_rect(d, 34, 12, 6, 12, (240,240,245,255))
# Finger tip glow
rect(d, 35, 8, 4, 4, (80,150,255,255))
# Knuckle joints
rect(d, 24, 26, 4, 4, (100,100,105,255))
rect(d, 36, 26, 4, 4, (100,100,105,255))
# Wrist ring
rect(d, 26, 34, 12, 3, (80,150,255,255))
img.save('public/sprites/cursor.png')

print('All 6 sprites regenerated successfully!')
