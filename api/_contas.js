// Vinovim — contas: encontrar, criar e juntar a conta antiga à nova
//
// A 17/11/2026 as contas passaram do Vercel Blob para o Upstash Redis, com o Blob em pausa até OLD_BACK.
// Quem entrou nesse período com um email que já tinha conta ficou com uma conta nova no Redis.
// Quando o Blob voltar a responder, a conta antiga com o mesmo email junta-se à nova:
//  • a palavra-passe antiga passa a valer também para a conta nova;
//  • os dados antigos (perfis, listas, progresso) vão para a app na próxima sincronização,
//    que os junta aos que já tem e confirma com "absorbed".
import crypto from 'node:crypto';
import { STORE, readJSON, writeJSON, readOld, listJSON, OldStoreError, sha } from './_lib.js';

const RETRY = 6 * 3600 * 1000; // enquanto o Blob não responde, tenta no máximo de 6 em 6 horas
const userPath = s => 'users/' + s + '.json';
const ownerPath = uid => 'owner/' + uid + '.json';

/* liga a conta (Redis) à conta antiga com o mesmo email, se o Blob já responder */
async function reconcile(s, rec) {
  if (STORE !== 'redis' || rec.checked) return rec;
  if (rec.tried && Date.now() - rec.tried < RETRY) return rec;
  let old;
  try {
    old = await readOld(userPath(s));
  } catch (e) {
    rec.tried = Date.now();
    await writeJSON(userPath(s), rec);
    return rec;
  }
  if (old && old.uid && old.uid !== rec.uid) {
    rec.old = [...new Set([...(rec.old || []), old.uid])];
    if (!rec.hash && old.hash) Object.assign(rec, { salt: old.salt, hash: old.hash });
  }
  rec.checked = true;
  delete rec.tried;
  await writeJSON(userPath(s), rec);
  return rec;
}

/* procura a conta pelo email: { s, rec, oldOk } — rec é null se não existe;
   oldOk é false quando não deu para confirmar no armazenamento antigo */
export async function findUser(email) {
  const s = sha(email);
  try {
    const rec = await readJSON(userPath(s), true);
    return { s, rec: rec && (await reconcile(s, rec)), oldOk: true };
  } catch (e) {
    if (!(e instanceof OldStoreError)) throw e;
    return { s, rec: null, oldOk: false };
  }
}

/* cria a conta; se não deu para ver o armazenamento antigo, fica marcada para ser juntada mais tarde */
export async function createUser(s, fields, oldOk) {
  const rec = Object.assign({ uid: crypto.randomBytes(12).toString('hex'), created: Date.now() }, fields);
  if (STORE === 'redis') rec.checked = !!oldOk;
  await writeJSON(userPath(s), rec);
  await setOwner(rec.uid, s);
  return rec;
}

export const saveUser = (s, rec) => writeJSON(userPath(s), rec);

/* índice uid → email (em hash), para a sincronização saber de que conta se trata */
export async function setOwner(uid, s) {
  if (STORE === 'redis') await writeJSON(ownerPath(uid), { s });
}
async function ownerOf(uid) {
  const o = await readJSON(ownerPath(uid));
  if (o) return o.s || null;
  // contas criadas antes deste índice: procura entre todas (são poucas) e guarda o resultado
  const hit = (await listJSON('users/')).find(x => x.value && x.value.uid === uid);
  const s = hit ? hit.path.slice('users/'.length, -'.json'.length) : null;
  await writeJSON(ownerPath(uid), { s });
  return s;
}

/* dados de contas antigas que a app ainda tem de juntar a esta: [{ uid, data }] */
export async function oldData(uid) {
  if (STORE !== 'redis') return [];
  const s = await ownerOf(uid);
  if (!s) return [];
  let rec = await readJSON(userPath(s));
  if (!rec || rec.uid !== uid) return [];
  rec = await reconcile(s, rec);
  const out = [],
    empty = [];
  for (const o of rec.old || []) {
    if ((rec.absorbed || []).includes(o)) continue;
    let d;
    try {
      d = await readJSON('data/' + o + '.json', true);
    } catch (e) {
      if (e instanceof OldStoreError) continue; // o Blob voltou a falhar: fica para a próxima
      throw e;
    }
    if (d && d.data) out.push({ uid: o, data: d.data });
    else empty.push(o);
  }
  if (empty.length) await absorb(s, rec, empty);
  return out;
}

/* a app confirmou que já juntou estes dados antigos */
export async function absorbed(uid, list) {
  if (STORE !== 'redis' || !Array.isArray(list) || !list.length) return;
  const s = await ownerOf(uid);
  const rec = s && (await readJSON(userPath(s)));
  if (rec && rec.uid === uid) await absorb(s, rec, list);
}
async function absorb(s, rec, list) {
  const ok = list.filter(u => (rec.old || []).includes(u) && !(rec.absorbed || []).includes(u));
  if (!ok.length) return;
  rec.absorbed = [...(rec.absorbed || []), ...ok];
  await writeJSON(userPath(s), rec);
}
