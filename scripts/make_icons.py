# Gera os ícones e imagens do Vinovim (corre na compilação).
# Identidade de 2026: fundo em gradiente violeta → rosa → coral, com o “V” em fita a branco
# (a haste da esquerda passa à frente da da direita, que fica translúcida).
# O nome “vinovim” vem de scripts/marca-nome.png: só a forma das letras (a Poppins Bold já desenhada, para não
# depender da fonte); as cores da marca (violeta → rosa → coral) são postas aqui.
import os
from PIL import Image, ImageChops, ImageDraw, ImageFilter

VIOLETA, ROSA, CORAL = (139, 92, 255), (255, 77, 148), (255, 106, 106)
BG = (12, 10, 18)  # fundo escuro da app
K = 4  # sobreamostragem para as bordas ficarem suaves
AQUI = os.path.dirname(os.path.abspath(__file__))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(n):
    """Gradiente na diagonal: violeta (canto de cima à esquerda) → rosa → coral (canto de baixo à direita)."""
    small = 256
    g = Image.new('RGB', (small, small))
    px = g.load()
    for y in range(small):
        for x in range(small):
            t = (x + y) / (2 * (small - 1))
            px[x, y] = lerp(VIOLETA, ROSA, t / 0.5) if t < 0.5 else lerp(ROSA, CORAL, (t - 0.5) / 0.5)
    return g.resize((n, n), Image.BICUBIC).convert('RGBA')


def stroke(n, p, q, w):
    m = Image.new('L', (n, n), 0)
    d = ImageDraw.Draw(m)
    d.line([p, q], fill=255, width=w)
    for x, y in (p, q):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)
    return m


def mark(size, scale):
    """O “V” branco, com fundo transparente."""
    n = size * K
    u = n * scale
    o = (n - u) / 2
    P = lambda x, y: (o + x * u, o + y * u)
    w = int(0.2 * u)
    left = stroke(n, P(0.22, 0.16), P(0.5, 0.84), w)
    right = stroke(n, P(0.78, 0.16), P(0.5, 0.84), w)
    layer = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    layer.paste(Image.new('RGBA', (n, n), (255, 255, 255, 158)), (0, 0), right)
    # sombra suave da haste da frente sobre a de trás
    shadow = left.filter(ImageFilter.GaussianBlur(n * 0.016))
    shadow = ImageChops.multiply(ImageChops.offset(shadow, int(n * 0.012), 0), right)
    layer.paste(Image.new('RGBA', (n, n), (90, 16, 64, 255)), (0, 0), shadow.point(lambda v: int(v * 0.45)))
    layer.paste(Image.new('RGBA', (n, n), (255, 255, 255, 255)), (0, 0), left)
    return layer.resize((size, size), Image.LANCZOS)


def rounded(img, radius):
    size = img.width
    m = Image.new('L', (size * K, size * K), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size * K - 1, size * K - 1], radius=int(size * K * radius), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), m.resize((size, size), Image.LANCZOS))
    return out


def app_icon(size, scale=0.64, radius=0.23):
    """Ícone completo com cantos arredondados (Windows, site, ecrã de arranque)."""
    full = gradient(size)
    full.alpha_composite(mark(size, scale))
    return rounded(full, radius)


def badge(size, glyph):
    """Ícones pequenos e redondos para o Rich Presence do Discord (a ver, em pausa, a navegar)."""
    n = size * K
    img = gradient(n)
    d = ImageDraw.Draw(img)
    c = n / 2
    if glyph == 'play':
        d.polygon([(c - n * 0.13, c - n * 0.2), (c - n * 0.13, c + n * 0.2), (c + n * 0.21, c)], fill='white')
    elif glyph == 'pause':
        for x in (c - n * 0.15, c + n * 0.05):
            d.rounded_rectangle([x, c - n * 0.19, x + n * 0.1, c + n * 0.19], radius=n * 0.03, fill='white')
    elif glyph == 'browse':
        r = n * 0.14
        d.ellipse([c - r - n * 0.05, c - r - n * 0.05, c + r - n * 0.05, c + r - n * 0.05], outline='white', width=int(n * 0.06))
        d.line([(c + n * 0.06, c + n * 0.06), (c + n * 0.19, c + n * 0.19)], fill='white', width=int(n * 0.07))
    m = Image.new('L', (n, n), 0)
    ImageDraw.Draw(m).ellipse([0, 0, n - 1, n - 1], fill=255)
    out = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    out.paste(img, (0, 0), m)
    return out.resize((size, size), Image.LANCZOS)


os.makedirs('www/icons', exist_ok=True)
os.makedirs('assets', exist_ok=True)

big = app_icon(1024)
big.resize((192, 192), Image.LANCZOS).save('www/icons/icon-192.png')
big.resize((512, 512), Image.LANCZOS).save('www/icons/icon-512.png')

# ícone “maskable” e adaptativo do Android: o sistema recorta a forma, por isso o V fica mais pequeno
maskable = gradient(1024)
maskable.alpha_composite(mark(1024, 0.5))
maskable.resize((512, 512), Image.LANCZOS).save('www/icons/maskable-512.png')
big.save('assets/icon-only.png')
gradient(1024).convert('RGB').save('assets/icon-background.png')
mark(1024, 0.5).save('assets/icon-foreground.png')

# Discord: logótipo e os ícones pequenos de estado (o site serve-os em /icons/)
big.resize((512, 512), Image.LANCZOS).save('www/icons/rpc-logo.png')
for g in ('play', 'pause', 'browse'):
    badge(256, g).save('www/icons/rpc-' + g + '.png')

# ecrã de arranque: o ícone ao centro, sobre o fundo escuro da app
for name in ('splash.png', 'splash-dark.png'):
    sp = Image.new('RGBA', (2732, 2732), BG + (255,))
    s = big.resize((420, 420), Image.LANCZOS)
    sp.paste(s, (1156, 1156), s)
    sp.save('assets/' + name)

# faixa para o Android TV (320x180): ícone e o nome com as cores da marca
banner = Image.new('RGBA', (320, 180), BG + (255,))
small = app_icon(84)
banner.paste(small, (26, 48), small)
forma = Image.open(os.path.join(AQUI, 'marca-nome.png')).convert('L')  # branco = letra
forma = forma.resize((170, round(170 * forma.height / forma.width)), Image.LANCZOS)
nome = Image.new('RGBA', forma.size)
pinta = ImageDraw.Draw(nome)
for x in range(forma.width):
    t = x / (forma.width - 1)
    cor = lerp(VIOLETA, ROSA, t / 0.6) if t < 0.6 else lerp(ROSA, CORAL, (t - 0.6) / 0.4)
    pinta.line([(x, 0), (x, forma.height)], fill=cor + (255,))
nome.putalpha(forma)
banner.alpha_composite(nome, (126, 90 - nome.height // 2 + 3))
banner.convert('RGB').save('assets/tv-banner.png')
print('ícones gerados')
