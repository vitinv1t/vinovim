# Gera os ícones do vinovim (corre na compilação)
import os
from PIL import Image, ImageDraw, ImageFont
A, B = (224, 49, 91), (245, 194, 107)
def grad(S):
    h = Image.linear_gradient('L').rotate(45, expand=True).resize((S, S))
    return Image.composite(Image.new('RGB', (S, S), B), Image.new('RGB', (S, S), A), h)
def mark(img, S, scale, off):
    d = ImageDraw.Draw(img); sc = S / 48 * scale; P = lambda x, y: (off + x * sc, off + y * sc); w = int(5 * sc)
    d.line([P(14, 13), P(24, 35), P(34, 13)], fill='white', width=w, joint='curve')
    for x, y in [(14, 13), (24, 35), (34, 13)]:
        cx, cy = P(x, y); r = w / 2; d.ellipse([cx - r, cy - r, cx + r, cy + r], fill='white')
    cx, cy = P(24, 13); r = 3 * sc; d.ellipse([cx - r, cy - r, cx + r, cy + r], fill='white')
def rounded(S):
    m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .22), fill=255)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0)); out.paste(grad(S), (0, 0), m); mark(out, S, 1, 0); return out
os.makedirs('www/icons', exist_ok=True); os.makedirs('assets', exist_ok=True)
big = rounded(1024)
big.resize((192, 192), Image.LANCZOS).save('www/icons/icon-192.png')
big.resize((512, 512), Image.LANCZOS).save('www/icons/icon-512.png')
mk = grad(1024).convert('RGBA'); mark(mk, 1024, .6, 1024 * .2); mk.resize((512, 512), Image.LANCZOS).save('www/icons/maskable-512.png')
big.save('assets/icon-only.png')
grad(1024).save('assets/icon-background.png')
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)); mark(fg, 1024, .6, 1024 * .2); fg.save('assets/icon-foreground.png')
for n in ('splash.png', 'splash-dark.png'):
    sp = Image.new('RGBA', (2732, 2732), (9, 8, 13, 255)); s = big.resize((420, 420), Image.LANCZOS); sp.paste(s, (1156, 1156), s); sp.save('assets/' + n)
# banner para o Android TV (320x180)
bn = Image.new('RGBA', (320, 180), (9, 8, 13, 255)); sm = big.resize((92, 92), Image.LANCZOS); bn.paste(sm, (30, 44), sm)
dr = ImageDraw.Draw(bn)
try: fnt = ImageFont.truetype('DejaVuSans-Bold.ttf', 40)
except Exception: fnt = ImageFont.load_default()
dr.text((138, 68), 'vinovim', fill='white', font=fnt)
bn.convert('RGB').save('assets/tv-banner.png')
print('icones gerados')
