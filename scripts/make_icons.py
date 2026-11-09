# Gera os ícones do Vinovim (corre na compilação).
# O logótipo é um “V” em fita: a haste da esquerda passa à frente da da direita,
# com um gradiente magenta → âmbar sobre fundo escuro.
import os
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

TOP, BOTTOM = (255, 45, 117), (255, 176, 66)
TOP_BACK, BOTTOM_BACK = (200, 25, 95), (225, 120, 40)
BG = (12, 9, 17)
K = 4  # sobreamostragem para as bordas ficarem suaves


def vgrad(n, a, b):
    g = Image.linear_gradient('L').resize((n, n))
    return Image.composite(Image.new('RGB', (n, n), b), Image.new('RGB', (n, n), a), g).convert('RGBA')


def stroke(n, p, q, w):
    m = Image.new('L', (n, n), 0)
    d = ImageDraw.Draw(m)
    d.line([p, q], fill=255, width=w)
    for x, y in (p, q):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)
    return m


def mark(size, scale):
    """Só o “V”, com fundo transparente."""
    n = size * K
    u = n * scale
    o = (n - u) / 2
    P = lambda x, y: (o + x * u, o + y * u)
    w = int(0.2 * u)
    left = stroke(n, P(0.22, 0.16), P(0.5, 0.84), w)
    right = stroke(n, P(0.78, 0.16), P(0.5, 0.84), w)
    layer = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    layer.paste(vgrad(n, TOP_BACK, BOTTOM_BACK), (0, 0), right)
    # sombra da haste da frente sobre a de trás
    shadow = left.filter(ImageFilter.GaussianBlur(n * 0.018))
    shadow = ImageChops.multiply(ImageChops.offset(shadow, int(n * 0.012), 0), right)
    layer.paste(Image.new('RGBA', (n, n), (40, 0, 20, 255)), (0, 0), shadow.point(lambda v: int(v * 0.55)))
    layer.paste(vgrad(n, TOP, BOTTOM), (0, 0), left)
    return layer.resize((size, size), Image.LANCZOS)


def background(size):
    bg = Image.new('RGBA', (size, size), BG + (255,))
    glow = Image.new('L', (size, size), 0)
    ImageDraw.Draw(glow).ellipse([size * 0.12, size * 0.1, size * 0.88, size * 0.9], fill=90)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.14))
    bg.paste(Image.new('RGBA', (size, size), (95, 22, 60, 255)), (0, 0), glow)
    return bg


def app_icon(size, scale=0.64, radius=0.23):
    """Ícone completo com cantos arredondados (Windows, PWA, ecrã de arranque)."""
    full = background(size)
    full.alpha_composite(mark(size, scale))
    m = Image.new('L', (size * K, size * K), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size * K - 1, size * K - 1], radius=int(size * K * radius), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(full, (0, 0), m.resize((size, size), Image.LANCZOS))
    return out


os.makedirs('www/icons', exist_ok=True)
os.makedirs('assets', exist_ok=True)

big = app_icon(1024)
big.resize((192, 192), Image.LANCZOS).save('www/icons/icon-192.png')
big.resize((512, 512), Image.LANCZOS).save('www/icons/icon-512.png')

# ícone “maskable” e adaptativo do Android: o sistema recorta a forma, por isso o V fica mais pequeno
maskable = background(1024)
maskable.alpha_composite(mark(1024, 0.5))
maskable.resize((512, 512), Image.LANCZOS).save('www/icons/maskable-512.png')
big.save('assets/icon-only.png')
background(1024).convert('RGB').save('assets/icon-background.png')
mark(1024, 0.5).save('assets/icon-foreground.png')

# ecrã de arranque
for name in ('splash.png', 'splash-dark.png'):
    sp = Image.new('RGBA', (2732, 2732), BG + (255,))
    s = big.resize((420, 420), Image.LANCZOS)
    sp.paste(s, (1156, 1156), s)
    sp.save('assets/' + name)

# faixa para o Android TV (320x180)
banner = Image.new('RGBA', (320, 180), BG + (255,))
small = app_icon(92)
banner.paste(small, (30, 44), small)
draw = ImageDraw.Draw(banner)
try:
    font = ImageFont.truetype('DejaVuSans-Bold.ttf', 40)
except Exception:
    font = ImageFont.load_default()
draw.text((138, 68), 'Vinovim', fill='white', font=font)
banner.convert('RGB').save('assets/tv-banner.png')
print('icones gerados')
