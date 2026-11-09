# Passos mecânicos da reorganização: marca, separar o núcleo do index.html e o CSS dos módulos.
import re, glob, os
def files_for_brand():
    fs=[f for f in glob.glob('app/**/*',recursive=True)+glob.glob('desktop/*')+glob.glob('mobile/*')+glob.glob('server/**/*.js',recursive=True) if re.search(r'\.(js|html|py)$',f)]
    return fs
pat=re.compile(r"(?<![A-Za-z0-9.'\"/_:@#-])vinovim(?![A-Za-z0-9.'\"/_:@-])")
for f in files_for_brand():
    t=open(f,encoding='utf-8').read(); n=len(pat.findall(t))
    if n: open(f,'w',encoding='utf-8').write(pat.sub('Vinovim',t))
os.chdir('app')
os.makedirs('css',exist_ok=True); os.makedirs('js/core',exist_ok=True); os.makedirs('js/features',exist_ok=True)
L=open('index.html',encoding='utf-8').read().split('\n')
def rng(a,b): return '\n'.join(L[a-1:b])+'\n'
parts=[('base',526,682),('vistas',683,983),('detalhe',984,1117),('leitor',1118,1334),('eventos',1335,1414),('sistema',1415,1513),('perfis',1514,1558),('tv',1559,1594),('arranque',1595,1634)]
for n,a,b in parts: open(f'js/core/{n}.js','w',encoding='utf-8').write(rng(a,b))
open('css/base.css','w',encoding='utf-8').write(rng(30,456))
tags='\n'.join(f'<script src="js/core/{n}.js"></script>' for n,_,_ in parts)
new=L[:28]+['<link rel="stylesheet" href="css/base.css">']+L[457:524]+[tags]+L[1635:]
open('index.html','w',encoding='utf-8').write('\n'.join(new))
lp='js/core/leitor.js'; t=open(lp,encoding='utf-8').read()
t=t.replace("$('#pBack').onclick = uiBack;","$('#pBack').onclick = () => uiBack();"); open(lp,'w',encoding='utf-8').write(t)
M=[('01-conta','conta'),('02-perfis-e-temas','perfis-e-temas'),('03-listas-e-avatares','listas-e-avatares'),('04-windows-e-wrapped','windows-e-resumo-anual'),('05-estilo-netflix','estilo-netflix'),('06-menus-e-separadores','navegacao'),('07-entrada','entrada'),('08-cinema-em-casa','cinema-em-casa')]
for old,nw in M:
    t=open(f'js/{old}.js',encoding='utf-8').read()
    m=re.search(r"\n[ \t]*document\.head\.insertAdjacentHTML\('beforeend', `<style>(.*?)</style>`\);[ \t]*\n",t,re.S)
    if m: body=m.group(1); t=t[:m.start()]+'\n'+t[m.end():]
    else:
        m=re.search(r"\nconst css = document\.createElement\('style'\);\ncss\.textContent = `(.*?)`;\n(.*?)document\.head\.appendChild\(css\);\n",t,re.S)
        body=m.group(1); between=m.group(2); t=t[:m.start()]+'\n'+between+t[m.end():]
    open(f'css/{nw}.css','w',encoding='utf-8').write(body.strip('\n')+'\n')
    open(f'js/features/{nw}.js','w',encoding='utf-8').write(t)
    os.remove(f'js/{old}.js')
os.rename('js/09-primeiro-perfil.js','js/features/primeiro-perfil.js')
h=open('index.html',encoding='utf-8').read()
for old,nw in M: h=h.replace(f'<script src="js/{old}.js"></script>',f'<script src="js/features/{nw}.js"></script>')
h=h.replace('<script src="js/09-primeiro-perfil.js"></script>','<script src="js/features/primeiro-perfil.js"></script>')
small=re.findall(r'<style>(\.t10row.*?|\.ucard.*?)</style>\n',h)
for s in small: h=h.replace(f'<style>{s}</style>\n','')
open('css/base.css','a',encoding='utf-8').write('\n'.join(small)+'\n')
links='\n'.join(f'<link rel="stylesheet" href="css/{nw}.css">' for _,nw in M)
h=h.replace('</head>',links+'\n</head>',1)
open('index.html','w',encoding='utf-8').write(h)
