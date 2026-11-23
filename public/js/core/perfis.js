/* ---------- perfis ----------
   “Quem está a ver?”, criar e editar perfis, foto, perfil infantil e PIN.
   Numa conta nova a app cria sozinha um perfil provisório (“Eu”) para ter onde
   guardar dados; esse perfil nunca aparece e desaparece quando a pessoa cria o seu. */
const curProfile = () => S.profiles.find(p => p.id === S.activeProfile) || S.profiles[0];
const isKids = () => !!(curProfile() || {}).kids;

function avatar(p, size = 40) {
  const style = `--pc:${PCOLORS[(p.color || 0) % PCOLORS.length]};width:${size}px;height:${size}px`;
  if (p.photo) return `<span class="pav vvav" style="${style}"><img src="${esc(p.photo)}" alt=""></span>`;
  if (p.emoji)
    return `<span class="pav vvav emo" style="${style};font-size:${Math.round(size * 0.56)}px">${esc(p.emoji)}</span>`;
  const initial = ((p.name || '?').trim()[0] || '?').toUpperCase();
  return `<span class="pav" style="${style};font-size:${Math.round(size * 0.42)}px">${esc(initial)}</span>`;
}
function updateProfBtn() {
  const b = $('#profBtn');
  if (b) b.innerHTML = avatar(curProfile(), 34) + '<span>' + esc(curProfile().name) + '</span>';
}
function applyKids() {
  document.documentElement.classList.toggle('kids', isKids());
}

/* --- perfil provisório --- */
const isEmptyData = d =>
  !d || ['library', 'progress', 'watched', 'lists'].every(k => !d[k] || !Object.keys(d[k]).length);
const isPlaceholder = (p, data = S.pdata[p && p.id]) =>
  !!p && p.id === 'p1' && p.name === 'Eu' && !p.pin && !p.photo && !p.kids && isEmptyData(data);
const realProfiles = () => S.profiles.filter(p => !isPlaceholder(p));
// assim que existe um perfil a sério, o provisório sai
function dropPlaceholder() {
  const extra = S.profiles.filter(p => isPlaceholder(p));
  if (!extra.length || extra.length === S.profiles.length) return false;
  S.profiles = S.profiles.filter(p => !extra.includes(p));
  extra.forEach(p => delete S.pdata[p.id]);
  if (!S.pdata[S.activeProfile]) S.activeProfile = S.profiles[0].id;
  return true;
}
// ao entrar numa conta que já tem perfis, o perfil da conta ganha ao provisório deste aparelho
hooks.on('sync:remote', remote => {
  const theirs = (remote.profiles || []).find(p => p.id === 'p1'),
    mine = S.profiles.find(p => p.id === 'p1');
  if (theirs && mine && isPlaceholder(mine) && !isPlaceholder(theirs, (remote.pdata || {}).p1))
    Object.assign(mine, theirs);
});
hooks.on('sync:merged', () => {
  dropPlaceholder();
  const el = $('#profiles');
  if (!el.classList.contains('open') || el.querySelector('.pedit, input')) return;
  const shown = [...el.querySelectorAll('[data-prof]')].map(b => b.dataset.prof).join();
  if (
    shown !==
    realProfiles()
      .map(p => p.id)
      .join()
  )
    showProfiles(!!el.dataset.manage);
});

/* --- PIN --- */
async function hashPin(pin) {
  const txt = 'vinovim-pin:' + pin;
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return [...new Uint8Array(b)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  }
  // sem crypto.subtle (páginas sem HTTPS): FNV-1a, só para não guardar o PIN em claro
  let h = 2166136261 >>> 0,
    o = '';
  for (let r = 0; r < 4; r++) {
    for (const c of txt + r) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    o += h.toString(16).padStart(8, '0');
  }
  return 'f' + o.slice(1);
}
function askPin(prof, onOk, title) {
  openModal(
    `<h3 style="text-align:center">${esc(title || 'PIN de ' + prof.name)}</h3><p class="m" style="text-align:center">Escreve o PIN de 4 números.</p>
    <div class="vvpin">${[0, 1, 2, 3].map(i => `<input inputmode="numeric" maxlength="1" type="password" data-i="${i}">`).join('')}</div>
    <p id="vvPinErr" style="color:#ff8fa8;text-align:center;min-height:20px;margin:0"></p><button class="btn gho" data-close-modal style="width:100%">Cancelar</button>`,
    m => {
      const ins = [...m.querySelectorAll('.vvpin input')];
      const check = async () => {
        const pin = ins.map(i => i.value).join('');
        if (pin.length < 4) return;
        if ((await hashPin(pin)) === prof.pin) {
          closeModal();
          onOk();
        } else {
          m.querySelector('#vvPinErr').textContent = 'PIN errado';
          ins.forEach(i => (i.value = ''));
          ins[0].focus();
        }
      };
      ins.forEach((inp, i) => {
        inp.oninput = () => {
          inp.value = inp.value.replace(/\D/g, '').slice(-1);
          if (inp.value && ins[i + 1]) ins[i + 1].focus();
          check();
        };
        inp.onkeydown = e => {
          if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus();
        };
      });
      setTimeout(() => ins[0].focus(), 60);
    }
  );
}
const adultWithPin = () => S.profiles.find(p => p.pin && !p.kids);
let adultPinOk = false;

/* --- escolher, mostrar e editar --- */
// o PIN é pedido sempre, mesmo para voltar a entrar no perfil que já está ativo
function switchProfile(id, pinOk = false) {
  const p = S.profiles.find(x => x.id === id);
  if (!p || !S.pdata[id]) return;
  if (p.pin && !pinOk) return askPin(p, () => switchProfile(id, true));
  adultPinOk = false;
  S.activeProfile = id;
  save();
  updateProfBtn();
  applyKids();
  $('#profiles').classList.remove('open');
  toast('Olá, ' + p.name + '!');
  hooks.emit('profile:switch', p);
  if (window.__vvReady !== false) route();
}

function showProfiles(manage) {
  // num perfil infantil, gerir perfis pede o PIN de um adulto
  if (manage && isKids() && adultWithPin() && !adultPinOk)
    return askPin(
      adultWithPin(),
      () => {
        adultPinOk = true;
        showProfiles(true);
      },
      'PIN de um adulto'
    );
  const el = $('#profiles'),
    list = realProfiles(),
    first = !list.length;
  const tile = p =>
    `<button class="pcard ${p.id === S.activeProfile ? 'on' : ''}" data-prof="${p.id}">${avatar(p, 104)}<b>${esc(p.name)}${p.pin ? ' <span class="vvlock" title="Tem PIN">🔒</span>' : ''}</b>${p.kids ? '<span class="kidtag">Crianças</span>' : ''}${manage ? '<small>Editar</small>' : ''}</button>`;
  el.dataset.manage = manage ? '1' : '';
  el.innerHTML = `<div class="pwrap"><h2>${manage ? 'Gerir perfis' : 'Quem está a ver?'}</h2>
    ${first && !manage ? '<p class="vvFirst">Cria o teu perfil para começar.</p>' : ''}
    <div class="plist">${list.map(tile).join('')}
    ${list.length < 6 ? `<button class="pcard" data-prof-add><span class="pav" style="--pc:#3a3446;width:104px;height:104px">${I.plus}</span><b>Adicionar</b></button>` : ''}</div>
    <div class="pact">${manage ? '<button class="btn pri" data-prof-done>Concluído</button>' : first ? '' : '<button class="btn gho" data-prof-manage>Gerir perfis</button>'}</div></div>`;
  el.classList.add('open');
  setTimeout(() => el.querySelector(first ? '[data-prof-add]' : '.pcard.on, .pcard')?.focus(), 50);
}

async function photoFrom(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = no;
      i.src = url;
    });
    // recorta ao centro num quadrado de 192 px
    const n = 192,
      c = document.createElement('canvas');
    c.width = c.height = n;
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, n, n);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function editProfile(id) {
  const old = id ? S.profiles.find(x => x.id === id) : null;
  const draft = old
    ? { ...old }
    : { id: 'p' + Date.now().toString(36), name: '', color: realProfiles().length % PCOLORS.length };
  let removePin = false;
  const el = $('#profiles');
  const canDelete = old && realProfiles().length > 1;
  el.innerHTML = `<div class="pwrap"><h2>${old ? 'Editar perfil' : 'Novo perfil'}</h2><div class="pedit">
    <span id="pAvatar">${avatar(draft, 112)}</span>
    <input class="inp" id="pname" maxlength="18" placeholder="Nome" value="${esc(draft.name)}">
    <div class="swatches" id="pcol">${PCOLORS.map((c, i) => `<button class="sw ${i === draft.color ? 'on' : ''}" data-pc="${i}" style="background:${c}"></button>`).join('')}</div>
    <div class="vvavs"><button type="button" class="wide" data-photo>📷 Escolher foto</button><button type="button" class="wide" data-initial>Só a inicial</button></div>
    <input type="file" accept="image/*" id="pPhoto" hidden>
    <div style="width:min(420px,100%);text-align:left;margin-top:8px">
      <div class="srow"><div class="tx"><b>Perfil infantil</b><small>Só animação e filmes para a família, sem addons</small></div><button class="tg ${draft.kids ? 'on' : ''}" id="pKids" type="button"></button></div>
      <div class="srow"><div class="tx"><b>PIN do perfil</b><small>${old && old.pin ? 'Este perfil tem PIN. Escreve outro para o mudar.' : 'Pede 4 números para entrar neste perfil'}</small></div><input class="inp" id="pPin" inputmode="numeric" maxlength="4" placeholder="${old && old.pin ? '••••' : 'Sem PIN'}" style="width:110px;text-align:center"></div>
      ${old && old.pin ? '<button class="btn sm gho" id="pPinDel" type="button">Remover PIN</button>' : ''}
    </div></div>
    <div class="pact"><button class="btn pri" id="psave">Guardar</button><button class="btn gho" data-prof-manage>Cancelar</button>${canDelete ? '<button class="btn gho" id="pdel" style="color:#ff8fa8">Apagar perfil</button>' : ''}</div></div>`;

  const repaint = () => ($('#pAvatar').innerHTML = avatar(draft, 112));
  $('#pcol').onclick = e => {
    const b = e.target.closest('[data-pc]');
    if (!b) return;
    draft.color = +b.dataset.pc;
    [...$('#pcol').children].forEach(x => x.classList.toggle('on', x === b));
    repaint();
  };
  $('#pname').oninput = e => {
    draft.name = e.target.value;
    repaint();
  };
  $('#pname').onkeydown = e => {
    if (e.key === 'Enter') $('#psave').click();
  };
  el.querySelector('[data-photo]').onclick = () => $('#pPhoto').click();
  el.querySelector('[data-initial]').onclick = () => {
    delete draft.photo;
    delete draft.emoji;
    repaint();
  };
  $('#pPhoto').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      draft.photo = await photoFrom(f);
      delete draft.emoji;
      repaint();
    } catch (err) {
      toast('Não foi possível usar essa imagem');
    }
  };
  $('#pKids').onclick = function () {
    draft.kids = !draft.kids;
    this.classList.toggle('on', draft.kids);
  };
  if ($('#pPinDel'))
    $('#pPinDel').onclick = function () {
      removePin = true;
      this.textContent = 'O PIN vai ser removido';
    };
  setTimeout(() => $('#pname').focus(), 50);

  $('#psave').onclick = async () => {
    const name = $('#pname').value.trim(),
      pin = $('#pPin').value.trim();
    if (!name) return toast('Escreve um nome para o perfil');
    if (pin && !/^\d{4}$/.test(pin)) return toast('O PIN tem de ter 4 números');
    const prof = { ...draft, name, kids: !!draft.kids, upd: Date.now() };
    if (pin) prof.pin = await hashPin(pin);
    else if (removePin) delete prof.pin;
    if (old) {
      for (const k of ['photo', 'emoji', 'pin']) if (!(k in prof)) delete old[k];
      Object.assign(old, prof);
    } else {
      S.profiles.push(prof);
      S.pdata[prof.id] = emptyPData();
    }
    const wasFirst = dropPlaceholder();
    save();
    updateProfBtn();
    applyKids();
    hooks.emit('profile:saved', prof);
    // ao criar o primeiro perfil volta logo ao “Quem está a ver?”
    showProfiles(!(wasFirst && document.documentElement.classList.contains('vvgate')));
  };
  const del = $('#pdel');
  if (del)
    del.onclick = function () {
      if (!this.dataset.c) {
        this.dataset.c = 1;
        this.textContent = 'Carrega outra vez para apagar';
        return;
      }
      S.profiles = S.profiles.filter(x => x.id !== id);
      delete S.pdata[id];
      S.tomb = { ...S.tomb, ['profile:' + id]: Date.now() };
      if (S.activeProfile === id) S.activeProfile = S.profiles[0].id;
      save();
      updateProfBtn();
      applyKids();
      showProfiles(true);
    };
}
