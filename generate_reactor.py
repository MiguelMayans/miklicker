from PIL import Image, ImageDraw
import math

SIZE = 128
img = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
d = ImageDraw.Draw(img)

cx, cy = SIZE // 2, SIZE // 2

# Helper: radial gradient
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

# 1. Outer dark shell
shell = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
shell_d = ImageDraw.Draw(shell)
shell_d.ellipse([8, 8, SIZE-8, SIZE-8], fill=(35, 38, 45, 255), outline=(55, 58, 65, 255), width=2)
img = Image.alpha_composite(img, shell)

# 2. First metallic ring (outer glow)
ring1 = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
ring1_d = ImageDraw.Draw(ring1)
ring1_d.ellipse([16, 16, SIZE-16, SIZE-16], outline=(6, 182, 212, 180), width=3)
img = Image.alpha_composite(img, ring1)

# 3. Second ring (inner mechanical)
ring2 = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
ring2_d = ImageDraw.Draw(ring2)
ring2_d.ellipse([22, 22, SIZE-22, SIZE-22], outline=(120, 125, 135, 255), width=2)
img = Image.alpha_composite(img, ring2)

# 4. Main energy orb (cyan radial gradient)
orb_size = 72
orb = radial_gradient(orb_size, (6, 182, 212, 255), (2, 80, 100, 200))
orb_pos = (SIZE - orb_size) // 2
img.paste(orb, (orb_pos, orb_pos), orb)

# 5. Bright core
orb2 = radial_gradient(44, (200, 255, 255, 255), (6, 182, 212, 180))
orb2_pos = (SIZE - 44) // 2
img.paste(orb2, (orb2_pos, orb2_pos), orb2)

# 6. Inner bright spot (white-cyan highlight)
orb3 = radial_gradient(20, (255, 255, 255, 220), (200, 255, 255, 0))
orb3_pos = (SIZE - 20) // 2 - 4
img.paste(orb3, (orb3_pos, orb3_pos), orb3)

# 7. Decorative energy arcs (cyan lines)
arc = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
arc_d = ImageDraw.Draw(arc)
# Top arc
arc_d.arc([18, 18, SIZE-18, SIZE-18], start=200, end=250, fill=(6, 182, 212, 200), width=2)
# Bottom arc
arc_d.arc([18, 18, SIZE-18, SIZE-18], start=20, end=70, fill=(6, 182, 212, 200), width=2)
img = Image.alpha_composite(img, arc)

# 8. Small bolts around the ring
bolts = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
bolts_d = ImageDraw.Draw(bolts)
bolt_positions = []
for angle_deg in [0, 45, 90, 135, 180, 225, 270, 315]:
    angle = math.radians(angle_deg)
    r = (SIZE // 2) - 12
    bx = int(cx + r * math.cos(angle))
    by = int(cy + r * math.sin(angle))
    bolts_d.ellipse([bx-2, by-2, bx+2, by+2], fill=(180, 185, 195, 255))
img = Image.alpha_composite(img, bolts)

# 9. Soft outer glow (cyan aura) — composite onto same size canvas
glow = radial_gradient(SIZE + 24, (6, 182, 212, 40), (6, 182, 212, 0))
glow_canvas = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
glow_canvas.paste(glow, (-12, -12), glow)
img = Image.alpha_composite(glow_canvas, img)

img.save('public/sprites/generator.png')
print('Reactor sprite regenerated with modern design!')
