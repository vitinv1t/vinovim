/* manutenção ao vivo: quem está no início ou a escolher um título sai logo para a página de manutenção;
   quem está a ver um filme ou série acaba de ver e só sai quando fechar o leitor */
(function () {
  if (location.protocol === 'file:') return;
  let pendente = false,
    indo = false,
    busy = false;
  const aVer = () => {
    const p = document.getElementById('player');
    return !!(p && p.classList.contains('open'));
  };
  const sair = () => {
    if (indo) return;
    indo = true;
    location.replace('/manutencao');
  };
  const decide = () => {
    if (!pendente) return;
    if (aVer()) return;
    sair();
  };
  async function ver() {
    if (busy || indo || document.hidden) return;
    busy = true;
    try {
      const r = await fetch('/api/estado', { cache: 'no-store', credentials: 'same-origin' });
      if (r.status === 503) {
        pendente = true;
        window.__vvManut = true;
      } else if (r.ok) {
        const j = await r.json();
        if (j && j.manutencao === true && !j.admin) {
          pendente = true;
          window.__vvManut = true;
        } else {
          pendente = false;
          window.__vvManut = false;
        }
      }
    } catch (e) {
      /* sem rede: não muda nada */
    }
    busy = false;
    decide();
  }
  hooks.on('player:closed', () => setTimeout(decide, 400));
  document.addEventListener('visibilitychange', () => !document.hidden && ver());
  addEventListener('focus', ver);
  addEventListener('online', ver);
  setInterval(ver, 4000);
  setTimeout(ver, 1500);
})();
