/* dica de boas-vindas: duas paragens a explicar o ecrã inicial, só na primeira vez de cada perfil */
(function () {
  const KEY = 'vinovim.dica1';
  let done = false;
  try {
    done = !!localStorage.getItem(KEY);
  } catch (e) {}
  if (done) return;

  const wide = () => matchMedia('(min-width: 821px)').matches;
  const steps = () => [
    {
      sel: '#hero .hbtns',
      t: 'Começa a ver já',
      p: 'Carrega em Ver agora para abrir o filme ou a série. Com o + guardas na tua lista para ver mais tarde.'
    },
    {
      sel: wide() ? '#nav .nv[data-v="library"]' : '#nav .nv[data-v="library"]',
      t: 'A tua lista fica aqui',
      p: 'Tudo o que guardares aparece nesta página, em qualquer dispositivo onde entres com a tua conta.'
    }
  ];

  function ready() {
    return (
      !document.getElementById('vvIntro')?.matches(':not(.out)') &&
      !document.getElementById('profiles')?.classList.contains('open') &&
      !document.documentElement.classList.contains('vvgate') &&
      !document.documentElement.classList.contains('vvpre')
    );
  }

  function run() {
    if (document.getElementById('vvDica') || location.hash.replace('#', '') !== 'home') return;
    let i = 0;
    const prevOv = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const root = document.createElement('div');
    root.id = 'vvDica';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Dica de boas-vindas');
    root.innerHTML = '<div class="vd-ring"></div><div class="vd-box"><h3></h3><p></p><div class="vd-foot"><small></small><button type="button"></button></div></div>';
    document.body.appendChild(root);
    const ring = root.querySelector('.vd-ring'),
      box = root.querySelector('.vd-box'),
      btn = root.querySelector('button');
    const close = () => {
      try {
        localStorage.setItem(KEY, '1');
      } catch (e) {}
      root.remove();
      document.documentElement.style.overflow = prevOv;
      removeEventListener('hashchange', close);
      removeEventListener('keydown', onKey, true);
      removeEventListener('resize', place);
    };
    const onKey = e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    function place() {
      const list = steps(),
        s = list[i],
        el = document.querySelector(s.sel);
      if (!el || !el.offsetWidth) return i < list.length - 1 ? (i++, place()) : close();
      const r = el.getBoundingClientRect(),
        pad = 8;
      Object.assign(ring.style, {
        left: r.left - pad + 'px',
        top: r.top - pad + 'px',
        width: r.width + pad * 2 + 'px',
        height: r.height + pad * 2 + 'px'
      });
      box.querySelector('h3').textContent = s.t;
      box.querySelector('p').textContent = s.p;
      box.querySelector('small').textContent = i + 1 + ' de ' + list.length;
      btn.textContent = i < list.length - 1 ? 'Seguinte' : 'Percebi';
      const bw = Math.min(320, innerWidth - 28);
      let left = Math.max(14, Math.min(r.left, innerWidth - bw - 14));
      const below = r.bottom + 18 + 170 < innerHeight;
      box.classList.toggle('up', !below);
      box.style.left = left + 'px';
      box.style.top = below ? r.bottom + 18 + 'px' : 'auto';
      box.style.bottom = below ? 'auto' : innerHeight - r.top + 18 + 'px';
      box.style.setProperty('--ax', Math.max(18, Math.min(r.left + r.width / 2 - left - 7, bw - 32)) + 'px');
    }
    btn.onclick = () => (i < steps().length - 1 ? (i++, place()) : close());
    addEventListener('keydown', onKey, true);
    addEventListener('resize', place);
    addEventListener('hashchange', close);
    place();
    btn.focus({ preventScroll: true });
  }

  hooks.on('hero:shown', () => {
    let tries = 0;
    const t = setInterval(() => {
      if (++tries > 40 || location.hash.replace('#', '') !== 'home') return clearInterval(t);
      if (ready()) {
        clearInterval(t);
        setTimeout(run, 700);
      }
    }, 400);
  });
})();
