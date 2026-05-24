from PIL import Image, ImageDraw
import math

SIZE = 64

def new_img():
    return Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))

def radial_gradient(size, center_color, edge_color):
    grad = Image.new('RGBA', (size, size), (0,0,0,0))
    pixels = grad.load()
    cx = size // 2
    for y in range(size):
        for x in range(size):
            dist = math.sqrt((x - cx)**2 + (y - cx)**2) / (size // 2)
            if dist > 1:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                r = int(center_color[0] * (1 - dist) + edge_color[0] * dist)
                g = int(center_color[1] * (1 - dist) + edge_color[1] * dist)
                b = int(center_color[2] * (1 - dist) + edge_color[2] * dist)
                a = int(center_color[3] * (1 - dist) + edge_color[3] * dist)
                pixels[x, y] = (r, g, b, a)
    return grad

# 1. DYSON SPHERE
img = new_img()
d = ImageDraw.Draw(img)
d.ellipse([8, 8, SIZE-8, SIZE-8], outline=(200, 170, 70, 255), width=2)
for angle in [0, 45, 90, 135]:
    rad = math.radians(angle)
    x1 = int(32 + 20 * math.cos(rad))
    y1 = int(32 + 20 * math.sin(rad))
    x2 = int(32 + 24 * math.cos(rad))
    y2 = int(32 + 24 * math.sin(rad))
    d.line([(x1, y1), (x2, y2)], fill=(220, 190, 90, 255), width=2)
d.ellipse([18, 18, SIZE-18, SIZE-18], fill=(255, 220, 100, 200))
d.ellipse([28, 28, 36, 36], fill=(255, 255, 220, 255))
img.save('public/sprites/dyson_sphere.png')

# 2. ANTIMATTER
img = new_img()
d = ImageDraw.Draw(img)
d.rectangle([12, 16, SIZE-12, SIZE-16], fill=(60, 65, 75, 255), outline=(100, 110, 130, 255), width=2)
for y in [22, 32, 42]:
    d.ellipse([8, y-3, SIZE-8, y+3], outline=(6, 182, 212, 220), width=1)
orb = radial_gradient(28, (255, 80, 80, 220), (180, 40, 40, 0))
img.paste(orb, (18, 18), orb)
for x in [14, 20, 26, 32, 38, 44, 50]:
    d.rectangle([x, 16, x+2, 18], fill=(255, 180, 0, 255))
img.save('public/sprites/antimatter.png')

# 3. WORMHOLE
img = new_img()
d = ImageDraw.Draw(img)
d.ellipse([8, 8, SIZE-8, SIZE-8], outline=(140, 100, 220, 255), width=3)
d.ellipse([16, 16, SIZE-16, SIZE-16], outline=(180, 130, 255, 255), width=2)
d.ellipse([22, 22, SIZE-22, SIZE-22], fill=(10, 10, 15, 255))
for i in range(4):
    angle = i * 90
    rad = math.radians(angle)
    x1 = int(32 + 10 * math.cos(rad))
    y1 = int(32 + 10 * math.sin(rad))
    x2 = int(32 + 26 * math.cos(rad + 0.4))
    y2 = int(32 + 26 * math.sin(rad + 0.4))
    d.line([(x1, y1), (x2, y2)], fill=(200, 160, 255, 200), width=2)
img.save('public/sprites/wormhole.png')

# 4. TIME CRYSTAL
img = new_img()
d = ImageDraw.Draw(img)
pts1 = [(32, 8), (44, 20), (40, 36), (24, 36), (20, 20)]
pts2 = [(32, 36), (40, 36), (44, 52), (32, 58), (20, 52), (24, 36)]
d.polygon(pts1, fill=(180, 220, 255, 220), outline=(220, 240, 255, 255))
d.polygon(pts2, fill=(140, 190, 230, 220), outline=(200, 230, 255, 255))
for r in [12, 18, 24]:
    d.ellipse([32-r, 48-r, 32+r, 48+r], outline=(6, 182, 212, 120 - r*3), width=1)
img.save('public/sprites/time_crystal.png')

# 5. UNIVERSAL COMPUTER
img = new_img()
d = ImageDraw.Draw(img)
d.rectangle([14, 14, SIZE-14, SIZE-14], fill=(40, 42, 50, 255), outline=(80, 85, 95, 255), width=2)
for y in [20, 28, 36, 44]:
    d.line([(16, y), (48, y)], fill=(6, 182, 212, 180), width=1)
for pos in [(18, 18), (30, 26), (42, 34), (24, 42), (38, 46)]:
    d.ellipse([pos[0]-2, pos[1]-2, pos[0]+2, pos[1]+2], fill=(6, 182, 212, 255))
d.ellipse([26, 26, 38, 38], fill=(255, 255, 255, 200), outline=(6, 182, 212, 255), width=2)
img.save('public/sprites/universal_computer.png')

print('Done')
