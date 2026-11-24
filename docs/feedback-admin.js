/* SD Hub – Verwaltung der Rückmeldungen (Admin).
   Spricht nur mit dem Feedback-Server aus data-api (fest in der HTML-Datei, nie aus der Adresse),
   meldet sich mit dem Firebase-Konto an und schickt das ID-Token als Bearer. Der Server prüft das
   Admin-Recht (Custom Claim feedbackAdmin) selbst; diese Seite vertraut nur seiner Antwort.
   Alle Inhalte werden als Text eingesetzt, nie als HTML. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const main = $('feedbackAdmin');
  const api = (main.dataset.api || '').replace(/\/+$/, '');
  const ERLAUBT = /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w./-]*)?$/i;
  const RECHT = {none: 'Nur intern (nicht veröffentlichen)', anonymous: 'Darf anonym veröffentlicht werden', name: 'Darf mit Vornamen veröffentlicht werden'};
  const SPRACHE = {de: 'Deutsch', fa: 'Dari', ar: 'Arabisch', en: 'Englisch'};
  const FRAGEN = ['Welchen Bereich hast du benutzt?', 'Was hat dir geholfen?', 'Was war schwierig?', 'Was fehlt dir?', 'Würdest du uns weiterempfehlen? Warum?'];

  if (!api || !ERLAUBT.test(api)) { $('faNichtVerbunden').hidden = false; return; }

  function auth() {
    return new Promise(ok => {
      if (window.SD_AUTH) return ok(window.SD_AUTH);
      window.addEventListener('sd-auth-ready', () => ok(window.SD_AUTH), {once: true});
    });
  }
  async function anfrage(pfad, body) {
    const A = await auth(), user = A.user;
    if (!user) throw new Error('Nicht angemeldet');
    const token = await user.getIdToken(true);
    const r = await fetch(api + pfad, {
      method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: Object.assign({Authorization: 'Bearer ' + token}, body ? {'Content-Type': 'application/json'} : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    let j = {}; try { j = await r.json(); } catch (e) { /* leer */ }
    if (r.status === 403) throw new Error('Keine Berechtigung. Dieses Konto ist nicht als Admin freigeschaltet.');
    if (!r.ok) throw new Error('Der Server hat die Anfrage abgelehnt (' + r.status + ').');
    return j;
  }
  const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
  const status = t => { $('faStatus').textContent = t; };

  function karte(item) {
    const k = el('article', null, $('faListe'), 'karte'); k.dataset.id = item.id;
    el('h2', (SPRACHE[item.language] || item.language || '') + ' · ' + (item.createdAt ? new Date(item.createdAt).toLocaleString('de-DE') : ''), k);
    el('p', RECHT[item.permission] || 'Unbekannte Einwilligung', k, 'leise');
    const dl = el('dl', null, k);
    (item.answers || []).forEach((a, i) => { if (!a) return; el('dt', FRAGEN[i] || 'Antwort ' + (i + 1), dl); el('dd', a, dl); });
    const darf = (item.permission === 'anonymous' || item.permission === 'name') && item.quote;
    if (darf) { el('dt', 'Zur Veröffentlichung freigegebener Satz' + (item.permission === 'name' && item.firstName ? ' (Vorname: ' + item.firstName + ')' : ''), dl); el('dd', item.quote, dl); }
    const reihe = el('div', null, k, 'reihe');
    if (darf) {
      const b = el('button', 'Veröffentlichen', reihe); b.type = 'button';
      b.onclick = () => aktion(b, '/admin/approve', item.id, 'Veröffentlicht.');
    }
    const w = el('button', 'Löschen', reihe, 'gefahr'); w.type = 'button';
    w.onclick = () => {
      if (!w.dataset.sicher) { w.dataset.sicher = '1'; w.textContent = 'Wirklich endgültig löschen?'; return; }
      aktion(w, '/admin/remove', item.id, 'Gelöscht.');
    };
  }
  async function aktion(knopf, pfad, id, ok) {
    knopf.disabled = true;
    try { await anfrage(pfad, {id}); status(ok); await laden(); }
    catch (e) { status(e.message); knopf.disabled = false; }
  }
  async function laden() {
    $('faListe').replaceChildren(); status('Lade …');
    try {
      const j = await anfrage('/admin/pending');
      const items = Array.isArray(j.items) ? j.items : [];
      items.forEach(karte);
      status(items.length ? items.length + ' Rückmeldung(en) warten auf Prüfung.' : 'Keine wartenden Rückmeldungen.');
    } catch (e) { status(e.message); }
  }
  function zeigen(user) {
    $('faLogin').hidden = !!user; $('faBereich').hidden = !user;
    if (user) laden();
  }
  $('faLoginForm').addEventListener('submit', async e => {
    e.preventDefault(); $('faLoginFehler').textContent = '';
    const A = await auth();
    try { await A.signIn($('faEmail').value.trim(), $('faPasswort').value); $('faPasswort').value = ''; }
    catch (x) { $('faLoginFehler').textContent = A.friendlyError ? A.friendlyError(x) : 'Anmeldung fehlgeschlagen.'; }
  });
  $('faNeuLaden').onclick = laden;
  $('faAbmelden').onclick = async () => { const A = await auth(); await A.signOutNow(); };
  auth().then(A => A.onChange(zeigen));
})();
