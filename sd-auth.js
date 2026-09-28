// SD Suite – Konto & Cloud-Synchronisierung (Firebase)
// Dieses Modul stellt ein eigenes Nutzerkonto pro Person bereit: Login/Registrierung
// per E-Mail/Passwort, sowie einfache Hilfsfunktionen, um Daten pro Nutzer in der
// Cloud zu speichern (Firestore für kleine Daten/JSON, Storage für Dateien).
//
// Einbindung: <script type="module" src="./sd-auth.js"></script>
// Nach dem Laden ist window.SD_AUTH verfügbar (siehe API unten). Andere,
// nicht-module Skripte können auf das Event "sd-auth-ready" warten:
//   window.addEventListener('sd-auth-ready', () => { ... window.SD_AUTH ... });

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getStorage, ref, uploadString, uploadBytes, getDownloadURL, listAll, getBlob, deleteObject
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6oWe7zveRGwkJbbtJ_BFR3bywxqwxRJQ",
  authDomain: "sd-suite-2de37.firebaseapp.com",
  projectId: "sd-suite-2de37",
  storageBucket: "sd-suite-2de37.firebasestorage.app",
  messagingSenderId: "817526531018",
  appId: "1:817526531018:web:204a5ad4b55c8cd20c2533"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;
const listeners = [];

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  listeners.forEach(cb => { try { cb(user); } catch (e) { console.error(e); } });
  renderAccountButton();
});

function friendlyError(err) {
  const code = err && err.code || '';
  const map = {
    'auth/email-already-in-use': 'Diese E-Mail-Adresse ist bereits registriert.',
    'auth/invalid-email': 'Bitte gib eine gültige E-Mail-Adresse ein.',
    'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    'auth/user-not-found': 'Kein Konto mit dieser E-Mail-Adresse gefunden.',
    'auth/wrong-password': 'Falsches Passwort.',
    'auth/invalid-credential': 'E-Mail-Adresse oder Passwort ist falsch.',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  };
  return map[code] || ('Fehler: ' + (err && err.message ? err.message : String(err)));
}

// ---------------- Öffentliche API ----------------
const SD_AUTH = {
  get user() { return currentUser; },
  onChange(cb) { listeners.push(cb); if (currentUser !== undefined) cb(currentUser); },

  async signUp(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try { await updateProfile(cred.user, { displayName }); } catch (e) { /* ignore */ }
    }
    return cred.user;
  },
  async signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },
  async signOutNow() { await signOut(auth); },
  async resetPassword(email) { await sendPasswordResetEmail(auth, email); },
  friendlyError,

  // ---- Cloud-Speicher: kleine JSON-Daten (Firestore), z.B. Profil/Einstellungen/Lebenslauf ----
  async saveJSON(path, data) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    const ref_ = doc(db, 'users', currentUser.uid, ...path.split('/'));
    await setDoc(ref_, { ...data, _updatedAt: Date.now() });
  },
  async loadJSON(path) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    const ref_ = doc(db, 'users', currentUser.uid, ...path.split('/'));
    const snap = await getDoc(ref_);
    return snap.exists() ? snap.data() : null;
  },

  // ---- Cloud-Speicher: Dateien/Bilder (Firebase Storage), z.B. Scan-Seiten, Fotos ----
  async saveFile(path, blobOrDataUrl) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    const fileRef = ref(storage, 'users/' + currentUser.uid + '/' + path);
    if (typeof blobOrDataUrl === 'string' && blobOrDataUrl.startsWith('data:')) {
      await uploadString(fileRef, blobOrDataUrl, 'data_url');
    } else {
      await uploadBytes(fileRef, blobOrDataUrl);
    }
    return fileRef.fullPath;
  },
  async loadFileAsDataUrl(path) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    const fileRef = ref(storage, 'users/' + currentUser.uid + '/' + path);
    const blob = await getBlob(fileRef);
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
  async listFiles(folderPath) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    const folderRef = ref(storage, 'users/' + currentUser.uid + '/' + folderPath);
    const res = await listAll(folderRef);
    return res.items.map(it => it.fullPath);
  },
  async deleteFile(path) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    const fileRef = ref(storage, 'users/' + currentUser.uid + '/' + path);
    await deleteObject(fileRef);
  },

  openLoginModal() { if (modalCtrl) modalCtrl.open('login'); },
};

window.SD_AUTH = SD_AUTH;
window.dispatchEvent(new CustomEvent('sd-auth-ready'));

// ---------------- Konto-Button + Login/Registrierungs-Modal (UI) ----------------
function injectStyles() {
  if (document.getElementById('sd-auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'sd-auth-styles';
  style.textContent = `
    #sdAuthBtn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:8px;
      border:1px solid #d0d5dd; background:#fff; color:#222; font-size:0.85rem; font-weight:600; cursor:pointer; }
    #sdAuthBtn:hover { background:#f5f6f8; }
    .sd-auth-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:none;
      align-items:center; justify-content:center; z-index:100000; }
    .sd-auth-backdrop.open { display:flex; }
    .sd-auth-box { background:#fff; border-radius:14px; padding:26px; width:min(380px,92vw);
      box-shadow:0 20px 60px rgba(0,0,0,0.3); font-family:system-ui,-apple-system,sans-serif; }
    .sd-auth-box h3 { margin:0 0 4px; font-size:1.15rem; }
    .sd-auth-box p.sub { margin:0 0 16px; color:#666; font-size:0.82rem; }
    .sd-auth-box input { width:100%; box-sizing:border-box; padding:10px 12px; margin-bottom:10px;
      border:1px solid #d0d5dd; border-radius:8px; font-size:0.9rem; }
    .sd-auth-box .sd-primary { width:100%; padding:11px; border:none; border-radius:8px; background:#3366ff;
      color:#fff; font-weight:600; font-size:0.92rem; cursor:pointer; margin-top:4px; }
    .sd-auth-box .sd-primary:hover { background:#2851d8; }
    .sd-auth-box .sd-link { background:none; border:none; color:#3366ff; font-size:0.8rem; cursor:pointer;
      padding:0; margin-top:12px; display:block; text-align:center; width:100%; }
    .sd-auth-box .sd-err { color:#c0392b; font-size:0.8rem; margin:-4px 0 10px; min-height:1em; }
    .sd-auth-box .sd-close { position:absolute; top:14px; right:14px; background:none; border:none;
      font-size:1.1rem; cursor:pointer; color:#888; }
    .sd-auth-box { position:relative; }
    .sd-auth-tabs { display:flex; gap:6px; margin-bottom:16px; }
    .sd-auth-tabs button { flex:1; padding:8px; border-radius:7px; border:1px solid #d0d5dd; background:#fafafa;
      cursor:pointer; font-size:0.82rem; font-weight:600; color:#555; }
    .sd-auth-tabs button.active { background:#3366ff; color:#fff; border-color:#3366ff; }
    #sdAuthUserMenu { position:absolute; top:52px; right:10px; background:#fff; border:1px solid #e0e0e0;
      border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.15); padding:8px; min-width:200px; z-index:100001; display:none; }
    #sdAuthUserMenu.open { display:block; }
    #sdAuthUserMenu .sd-um-email { padding:8px 10px; font-size:0.8rem; color:#666; border-bottom:1px solid #eee; margin-bottom:6px; word-break:break-all; }
    #sdAuthUserMenu button { display:block; width:100%; text-align:left; padding:8px 10px; border:none; background:none;
      border-radius:6px; cursor:pointer; font-size:0.85rem; }
    #sdAuthUserMenu button:hover { background:#f5f6f8; }
  `;
  document.head.appendChild(style);
}

function buildModal() {
  if (document.getElementById('sdAuthBackdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'sd-auth-backdrop';
  backdrop.id = 'sdAuthBackdrop';
  backdrop.innerHTML = `
    <div class="sd-auth-box">
      <button class="sd-close" id="sdAuthClose">✕</button>

      <div id="sdAuthConsentStep">
        <h3>Bevor du dich anmeldest</h3>
        <p class="sub">
          Du kannst diese App auch <strong>ohne Anmeldung</strong> vollständig nutzen – alles bleibt dann
          ausschließlich auf diesem Gerät, nichts wird irgendwohin übertragen.
        </p>
        <p class="sub">
          Meldest du dich stattdessen an, um deine Angaben zu speichern und von mehreren Geräten zu nutzen,
          werden deine Inhalte bei unserem Cloud-Dienstleister <strong>Google (Firebase)</strong> gespeichert –
          nicht bei uns auf einem eigenen Server. Details dazu in unserer
          <a href="datenschutz.html" target="_blank" rel="noopener" style="color:#3366ff;">Datenschutzerklärung</a>.
        </p>
        <button class="sd-primary" id="sdAuthConsentContinue">Trotzdem anmelden</button>
        <button class="sd-link" id="sdAuthConsentCancel">Ohne Anmeldung weiter nutzen</button>
      </div>

      <div id="sdAuthFormStep" style="display:none;">
        <div class="sd-auth-tabs">
          <button id="sdAuthTabLogin" class="active">Anmelden</button>
          <button id="sdAuthTabSignup">Registrieren</button>
        </div>
        <h3 id="sdAuthTitle">Willkommen zurück</h3>
        <p class="sub" id="sdAuthSub">Melde dich an, um deine Dokumente geräteübergreifend zu nutzen.</p>
        <div class="sd-err" id="sdAuthErr"></div>
        <input type="text" id="sdAuthName" placeholder="Dein Name" style="display:none;">
        <input type="email" id="sdAuthEmail" placeholder="E-Mail-Adresse" autocomplete="username">
        <input type="password" id="sdAuthPassword" placeholder="Passwort" autocomplete="current-password">
        <button class="sd-primary" id="sdAuthSubmit">Anmelden</button>
        <button class="sd-link" id="sdAuthForgot">Passwort vergessen?</button>
        <p style="font-size:0.72rem;color:#888;text-align:center;margin:14px 0 0;line-height:1.4;">
          Mit Anmeldung/Registrierung akzeptierst du unsere
          <a href="datenschutz.html" target="_blank" rel="noopener" style="color:#3366ff;">Datenschutzerklärung</a>.
          Deine Inhalte werden dabei bei unserem Cloud-Dienstleister (Google Firebase) gespeichert.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const els = {
    backdrop, close: backdrop.querySelector('#sdAuthClose'),
    consentStep: backdrop.querySelector('#sdAuthConsentStep'), formStep: backdrop.querySelector('#sdAuthFormStep'),
    consentContinue: backdrop.querySelector('#sdAuthConsentContinue'), consentCancel: backdrop.querySelector('#sdAuthConsentCancel'),
    tabLogin: backdrop.querySelector('#sdAuthTabLogin'), tabSignup: backdrop.querySelector('#sdAuthTabSignup'),
    title: backdrop.querySelector('#sdAuthTitle'), sub: backdrop.querySelector('#sdAuthSub'),
    err: backdrop.querySelector('#sdAuthErr'), name: backdrop.querySelector('#sdAuthName'),
    email: backdrop.querySelector('#sdAuthEmail'), password: backdrop.querySelector('#sdAuthPassword'),
    submit: backdrop.querySelector('#sdAuthSubmit'), forgot: backdrop.querySelector('#sdAuthForgot'),
  };

  function showForm() {
    els.consentStep.style.display = 'none';
    els.formStep.style.display = 'block';
  }
  els.consentContinue.onclick = () => {
    try { localStorage.setItem('sdAuthConsentOk', '1'); } catch (e) {}
    showForm();
  };
  els.consentCancel.onclick = () => { backdrop.classList.remove('open'); };

  let mode = 'login';
  function setMode(m) {
    mode = m;
    els.err.textContent = '';
    if (m === 'login') {
      els.tabLogin.classList.add('active'); els.tabSignup.classList.remove('active');
      els.title.textContent = 'Willkommen zurück';
      els.sub.textContent = 'Melde dich an, um deine Dokumente geräteübergreifend zu nutzen.';
      els.name.style.display = 'none';
      els.submit.textContent = 'Anmelden';
      els.forgot.style.display = 'block';
    } else {
      els.tabSignup.classList.add('active'); els.tabLogin.classList.remove('active');
      els.title.textContent = 'Konto erstellen';
      els.sub.textContent = 'Kostenlos registrieren – deine Daten sind nur für dich sichtbar.';
      els.name.style.display = 'block';
      els.submit.textContent = 'Registrieren';
      els.forgot.style.display = 'none';
    }
  }
  els.tabLogin.onclick = () => setMode('login');
  els.tabSignup.onclick = () => setMode('signup');
  els.close.onclick = () => backdrop.classList.remove('open');
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.classList.remove('open'); };

  els.forgot.onclick = async () => {
    const email = els.email.value.trim();
    if (!email) { els.err.textContent = 'Bitte zuerst deine E-Mail-Adresse eingeben.'; return; }
    try {
      await SD_AUTH.resetPassword(email);
      els.err.style.color = '#2e7d32';
      els.err.textContent = 'E-Mail zum Zurücksetzen wurde verschickt.';
    } catch (e) {
      els.err.style.color = '#c0392b';
      els.err.textContent = friendlyError(e);
    }
  };

  els.submit.onclick = async () => {
    const email = els.email.value.trim();
    const password = els.password.value;
    els.err.style.color = '#c0392b';
    els.err.textContent = '';
    if (!email || !password) { els.err.textContent = 'Bitte E-Mail-Adresse und Passwort eingeben.'; return; }
    els.submit.disabled = true;
    const oldLabel = els.submit.textContent;
    els.submit.textContent = 'Bitte warten...';
    try {
      if (mode === 'login') {
        await SD_AUTH.signIn(email, password);
      } else {
        await SD_AUTH.signUp(email, password, els.name.value.trim());
      }
      backdrop.classList.remove('open');
      els.email.value = ''; els.password.value = ''; els.name.value = '';
    } catch (e) {
      els.err.textContent = friendlyError(e);
    } finally {
      els.submit.disabled = false;
      els.submit.textContent = oldLabel;
    }
  };

  return {
    open: (m) => {
      setMode(m || 'login');
      let consented = false;
      try { consented = localStorage.getItem('sdAuthConsentOk') === '1'; } catch (e) {}
      if (consented) { showForm(); } else { els.consentStep.style.display = 'block'; els.formStep.style.display = 'none'; }
      backdrop.classList.add('open');
    }
  };
}

let modalCtrl = null;
function renderAccountButton() {
  injectStyles();
  let btn = document.getElementById('sdAuthBtn');
  if (!btn) {
    const host = document.querySelector('#sdAuthHost') || document.querySelector('.topbar-right') || document.body;
    btn = document.createElement('button');
    btn.id = 'sdAuthBtn';
    host.insertBefore(btn, host.firstChild);
    modalCtrl = buildModal();

    // Nutzer-Menü (Logout) bei eingeloggtem Zustand
    const menu = document.createElement('div');
    menu.id = 'sdAuthUserMenu';
    menu.innerHTML = `<div class="sd-um-email" id="sdAuthUmEmail"></div>
      <button id="sdAuthUmLogout">🚪 Abmelden</button>`;
    (host.parentElement || document.body).style.position = (host.parentElement || document.body).style.position || 'relative';
    document.body.appendChild(menu);
    menu.querySelector('#sdAuthUmLogout').onclick = async () => {
      await SD_AUTH.signOutNow();
      menu.classList.remove('open');
    };
    document.addEventListener('click', (e) => {
      if (e.target === btn) return;
      if (!menu.contains(e.target)) menu.classList.remove('open');
    });
  }

  if (currentUser) {
    btn.textContent = '👤 ' + (currentUser.displayName || currentUser.email.split('@')[0]);
    btn.onclick = () => {
      const menu = document.getElementById('sdAuthUserMenu');
      document.getElementById('sdAuthUmEmail').textContent = currentUser.email;
      const r = btn.getBoundingClientRect();
      menu.style.top = (r.bottom + window.scrollY + 6) + 'px';
      menu.style.left = Math.max(10, r.right - 200) + 'px';
      menu.style.right = 'auto';
      menu.classList.toggle('open');
    };
  } else {
    btn.textContent = '👤 Anmelden';
    btn.onclick = () => modalCtrl && modalCtrl.open('login');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderAccountButton);
} else {
  renderAccountButton();
}
