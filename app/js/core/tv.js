/* ---------- TV e comando ---------- */
const IS_TV =
  /Android TV|\bAFT|BRAVIA|SmartTV|SMART-TV|GoogleTV|Tizen|Web0S|WebOS|HbbTV|Leanback|\bTV\b.*Android|Android.*\bTV\b/i.test(
    navigator.userAgent
  );
function applyTV() {
  document.documentElement.classList.toggle('tv', !!(S.prefs.tv ?? IS_TV));
}
function topLayer() {
  if ($('#profiles').classList.contains('open')) return $('#profiles');
  if ($('#upd').classList.contains('open')) return $('#upd');
  if (drawer.classList.contains('open')) return $('.dpanel');
  if ($('#detail').classList.contains('open')) return $('#detail');
  return document.body;
}
function focusables() {
  const top = topLayer();
  return [...top.querySelectorAll('button, a[href], input, select, [tabindex]:not([tabindex="-1"])')].filter(el => {
    if (el.disabled || el.closest('#player') || el.closest('.hdots')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}
function moveFocus(dir) {
  const list = focusables();
  if (!list.length) return;
  const cur = list.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) {
    const first =
      list.find(el => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.top < innerHeight && !el.closest('#nav');
      }) || list[0];
    first.focus({ preventScroll: true });
    first.scrollIntoView({ block: 'center', inline: 'nearest' });
    return;
  }
  const a = cur.getBoundingClientRect(),
    ax = a.left + a.width / 2,
    ay = a.top + a.height / 2;
  let best = null,
    bs = Infinity;
  for (const el of list) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect(),
      dx = r.left + r.width / 2 - ax,
      dy = r.top + r.height / 2 - ay;
    let main, cross;
    if (dir === 'left') {
      if (r.right > a.left + 2) continue;
      main = -dx;
      cross = Math.abs(dy);
    } else if (dir === 'right') {
      if (r.left < a.right - 2) continue;
      main = dx;
      cross = Math.abs(dy);
    } else if (dir === 'up') {
      if (r.bottom > a.top + 2) continue;
      main = -dy;
      cross = Math.abs(dx);
    } else {
      if (r.top < a.bottom - 2) continue;
      main = dy;
      cross = Math.abs(dx);
    }
    const sc = main + cross * 2.5;
    if (sc < bs) {
      bs = sc;
      best = el;
    }
  }
  if (best) {
    best.focus({ preventScroll: true });
    best.scrollIntoView({ block: best.closest('#nav') ? 'nearest' : 'center', inline: 'center', behavior: 'smooth' });
  }
}
