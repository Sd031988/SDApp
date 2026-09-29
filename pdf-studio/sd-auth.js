// SD Suite – Konto & Cloud-Synchronisierung (Firebase Auth + Google Drive)
// Dieses Modul stellt ein eigenes Nutzerkonto pro Person bereit: Login/Registrierung
// per E-Mail/Passwort ODER per Google-Konto, sowie Hilfsfunktionen, um Daten pro
// Nutzer in der Cloud zu speichern:
//   - Kleine JSON-Daten (Profil/Einstellungen) -> Firestore
//   - Dateien (Scans, PDFs, Fotos) -> die EIGENE Google Drive des Nutzers (nicht
//     unser gemeinsames Firebase-Kontingent), sobald er sich mit Google anmeldet
//     und Drive-Zugriff erlaubt.
//
// Einbindung: <script type="module" src="./sd-auth.js"></script>
// Nach dem Laden ist window.SD_AUTH verfügbar (siehe API unten). Andere,
// nicht-module Skripte können auf das Event "sd-auth-ready" warten:
//   window.addEventListener('sd-auth-ready', () => { ... window.SD_AUTH ... });

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile, GoogleAuthProvider, signInWithCredential
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getStorage, ref, uploadString, uploadBytes, getBlob, listAll, deleteObject, getMetadata
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6oWe7zveRGwkJbbtJ_BFR3bywxqwxRJQ",
  authDomain: "sd-suite-2de37.firebaseapp.com",
  projectId: "sd-suite-2de37",
  storageBucket: "sd-suite-2de37.firebasestorage.app",
  messagingSenderId: "817526531018",
  appId: "1:817526531018:web:204a5ad4b55c8cd20c2533"
};

// Google-OAuth-Client (Google Cloud Console, Projekt "SD Suite"). Diese ID ist
// KEIN Geheimnis - sie darf öffentlich im Code stehen.
const GOOGLE_CLIENT_ID = '817526531018-glm761p9cf9fm6vq6eaaacfu8pdfht35.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FOLDER_NAME = 'SD Suite Dateien';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;
const listeners = [];

// Nutzer OHNE Google-Anmeldung (nur E-Mail/Passwort) speichern ihre Dateien in
// unserem gemeinsamen Firebase-Kontingent (5 GB insgesamt für alle Nutzer
// zusammen). Damit ein einzelnes Konto das nicht allein aufbraucht, gilt hier
// bewusst ein kleines Limit - wer mehr Platz möchte, meldet sich stattdessen
// mit Google an und bekommt dort seine eigene, viel größere Google Drive.
const MAX_USER_BYTES = 10 * 1024 * 1024; // 10 MB pro Nutzer (nur ohne Google-Anmeldung)

function estimateDataUrlBytes(dataUrl) {
  const idx = dataUrl.indexOf(',');
  const b64 = idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
  return Math.ceil(b64.length * 3 / 4);
}

async function getFirebaseFolderUsageBytes(folderRef) {
  const res = await listAll(folderRef);
  let total = 0;
  for (const item of res.items) {
    try {
      const meta = await getMetadata(item);
      total += meta.size || 0;
    } catch (e) { /* Datei evtl. inzwischen gelöscht - ignorieren */ }
  }
  for (const prefix of res.prefixes) {
    total += await getFirebaseFolderUsageBytes(prefix);
  }
  return total;
}

async function getFirebaseUserUsageBytes() {
  if (!currentUser) return 0;
  try {
    return await getFirebaseFolderUsageBytes(ref(storage, 'users/' + currentUser.uid));
  } catch (e) {
    return 0; // z.B. wenn der Nutzer noch gar keine Dateien hat
  }
}

// ---------------- Google Identity Services (Anmeldung + Drive-Zugriff) ----------------
let gisReadyPromise = null;
function loadGis() {
  if (gisReadyPromise) return gisReadyPromise;
  gisReadyPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google-Anmeldedienst konnte nicht geladen werden.'));
    document.head.appendChild(s);
  });
  return gisReadyPromise;
}

let tokenClient = null;
let driveAccessToken = null;
let driveTokenExpiry = 0; // ms epoch

function requestGoogleToken(promptMode) {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp && resp.access_token) {
        driveAccessToken = resp.access_token;
        driveTokenExpiry = Date.now() + (Number(resp.expires_in || 3600) * 1000);
        resolve(resp.access_token);
      } else {
        reject(new Error((resp && resp.error) || 'Google-Anmeldung wurde nicht abgeschlossen.'));
      }
    };
    tokenClient.error_callback = (err) => {
      reject(new Error((err && err.type) || 'Google-Anmeldung wurde abgebrochen.'));
    };
    tokenClient.requestAccessToken({ prompt: promptMode === undefined ? '' : promptMode });
  });
}

// Meldet den Nutzer über sein Google-Konto an (Firebase-Identität) UND holt im
// selben Schritt die Erlaubnis, in seine eigene Google Drive zu schreiben.
async function signInWithGoogle() {
  await loadGis();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile ' + DRIVE_SCOPE,
      callback: () => {},
    });
  }
  const accessToken = await requestGoogleToken('consent');
  // Mit dem Google-Access-Token bei Firebase anmelden, damit wir wie gewohnt
  // ein Firebase-Nutzerkonto (uid, E-Mail) für Profil/Einstellungen haben.
  const credential = GoogleAuthProvider.credential(null, accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

// Liefert ein gültiges Drive-Zugriffstoken, holt bei Bedarf (Ablauf nach ca.
// 1 Stunde) im Hintergrund ein neues - falls das nicht stillschweigend klappt,
// muss der Nutzer die Verbindung einmal neu bestätigen (Pop-up).
async function ensureDriveToken() {
  if (driveAccessToken && Date.now() < driveTokenExpiry - 30000) return driveAccessToken;
  await loadGis();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile ' + DRIVE_SCOPE,
      callback: () => {},
    });
  }
  try {
    return await requestGoogleToken('');
  } catch (e) {
    throw new Error('Die Verbindung zu deiner Google Drive ist abgelaufen. Bitte klicke auf "Google Drive erneut verbinden".');
  }
}

// ---------------- Google Drive: kleine Hilfsfunktionen ----------------
let appFolderIdCache = null;

async function driveFetch(url, options) {
  const token = await ensureDriveToken();
  const res = await fetch(url, {
    ...options,
    headers: { ...(options && options.headers), Authorization: 'Bearer ' + token },
  });
  if (!res.ok) {
    let msg = 'Google Drive: Fehler ' + res.status;
    try { const j = await res.json(); if (j && j.error && j.error.message) msg = j.error.message; } catch (e) {}
    throw new Error(msg);
  }
  return res;
}

async function findOrCreateAppFolder() {
  if (appFolderIdCache) return appFolderIdCache;
  const q = encodeURIComponent(`name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const listRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`);
  const listJson = await listRes.json();
  if (listJson.files && listJson.files.length) {
    appFolderIdCache = listJson.files[0].id;
    return appFolderIdCache;
  }
  const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const createJson = await createRes.json();
  appFolderIdCache = createJson.id;
  return appFolderIdCache;
}

async function findDriveFileByPath(path) {
  const q = encodeURIComponent(`appProperties has { key='sdPath' and value='${path.replace(/'/g, "\\'")}' } and trashed=false`);
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,appProperties)`);
  const json = await res.json();
  return (json.files && json.files[0]) || null;
}

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [, 'application/octet-stream'])[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function driveUploadMultipart(path, blob, existingFileId, folderId) {
  const metadata = { name: path.split('/').pop() || path, appProperties: { sdPath: path } };
  if (!existingFileId) metadata.parents = [folderId];
  const boundary = 'sdsuite-' + Math.random().toString(36).slice(2);
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeader = `--${boundary}\r\nContent-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;
  const body = new Blob([metaPart, mediaHeader, blob, closing]);
  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`;
  const res = await driveFetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  return res.json();
}

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
  get hasDriveAccess() { return !!driveAccessToken; },
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
  async signInWithGoogle() { return await signInWithGoogle(); },
  async connectGoogleDrive() {
    await loadGis();
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile ' + DRIVE_SCOPE,
        callback: () => {},
      });
    }
    return await requestGoogleToken('consent');
  },
  async signOutNow() {
    driveAccessToken = null; driveTokenExpiry = 0; appFolderIdCache = null;
    await signOut(auth);
  },
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

  // ---- Cloud-Speicher: Dateien/Bilder ----
  // Mit Google angemeldet -> eigene Google Drive des Nutzers (praktisch unbegrenzt).
  // Nur mit E-Mail/Passwort angemeldet -> unser gemeinsamer Firebase-Speicher (klein begrenzt).
  async saveFile(path, blobOrDataUrl) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    if (driveAccessToken) {
      const blob = (typeof blobOrDataUrl === 'string' && blobOrDataUrl.startsWith('data:'))
        ? dataUrlToBlob(blobOrDataUrl) : blobOrDataUrl;
      const folderId = await findOrCreateAppFolder();
      const existing = await findDriveFileByPath(path);
      const json = await driveUploadMultipart(path, blob, existing && existing.id, folderId);
      return json.id;
    }
    const isDataUrl = typeof blobOrDataUrl === 'string' && blobOrDataUrl.startsWith('data:');
    const newBytes = isDataUrl ? estimateDataUrlBytes(blobOrDataUrl) : (blobOrDataUrl.size || 0);
    const used = await getFirebaseUserUsageBytes();
    if (used + newBytes > MAX_USER_BYTES) {
      const usedMb = (used / (1024 * 1024)).toFixed(1);
      const maxMb = (MAX_USER_BYTES / (1024 * 1024)).toFixed(0);
      throw new Error(
        'Dein Cloud-Speicher ist voll (' + usedMb + ' von ' + maxMb + ' MB genutzt). ' +
        'Melde dich stattdessen mit Google an, um deine eigene, viel größere Google Drive zu nutzen ' +
        '- oder lösche alte Dateien in deinem Konto, um Platz zu schaffen.'
      );
    }
    const fileRef = ref(storage, 'users/' + currentUser.uid + '/' + path);
    if (isDataUrl) { await uploadString(fileRef, blobOrDataUrl, 'data_url'); }
    else { await uploadBytes(fileRef, blobOrDataUrl); }
    return fileRef.fullPath;
  },
  async loadFileAsDataUrl(path) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    if (driveAccessToken) {
      const file = await findDriveFileByPath(path);
      if (!file) throw new Error('Datei nicht gefunden: ' + path);
      const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
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
    if (driveAccessToken) {
      const folderId = await findOrCreateAppFolder();
      const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed=false`)}&fields=files(id,name,size,appProperties)&pageSize=1000`);
      const json = await res.json();
      const prefix = folderPath ? folderPath.replace(/\/$/, '') + '/' : '';
      return (json.files || [])
        .map(f => (f.appProperties && f.appProperties.sdPath) || f.name)
        .filter(p => !prefix || p.startsWith(prefix));
    }
    const folderRef = ref(storage, 'users/' + currentUser.uid + '/' + folderPath);
    const res = await listAll(folderRef);
    return res.items.map(it => it.fullPath);
  },
  async deleteFile(path) {
    if (!currentUser) throw new Error('Nicht angemeldet');
    if (driveAccessToken) {
      const file = await findDriveFileByPath(path);
      if (!file) return;
      await driveFetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, { method: 'DELETE' });
      return;
    }
    const fileRef = ref(storage, 'users/' + currentUser.uid + '/' + path);
    await deleteObject(fileRef);
  },
  // ---- Speicherplatz-Info ----
  async getUsage() {
    if (!currentUser) return { usedBytes: 0, usedMb: 0 };
    if (driveAccessToken) {
      try {
        const folderId = await findOrCreateAppFolder();
        const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed=false`)}&fields=files(size)&pageSize=1000`);
        const json = await res.json();
        const used = (json.files || []).reduce((sum, f) => sum + (Number(f.size) || 0), 0);
        return { usedBytes: used, usedMb: +(used / (1024 * 1024)).toFixed(1), isOwnDrive: true };
      } catch (e) {
        return { usedBytes: 0, usedMb: 0, isOwnDrive: true };
      }
    }
    const used = await getFirebaseUserUsageBytes();
    return {
      usedBytes: used,
      maxBytes: MAX_USER_BYTES,
      usedMb: +(used / (1024 * 1024)).toFixed(1),
      maxMb: MAX_USER_BYTES / (1024 * 1024),
      isOwnDrive: false,
    };
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
    .sd-auth-box .sd-google { width:100%; padding:11px; border:1px solid #d0d5dd; border-radius:8px; background:#fff;
      color:#222; font-weight:600; font-size:0.92rem; cursor:pointer; margin-top:4px; display:flex; align-items:center;
      justify-content:center; gap:8px; }
    .sd-auth-box .sd-google:hover { background:#f5f6f8; }
    .sd-auth-box .sd-divider { display:flex; align-items:center; gap:10px; margin:16px 0; color:#999; font-size:0.75rem; }
    .sd-auth-box .sd-divider::before, .sd-auth-box .sd-divider::after { content:''; flex:1; height:1px; background:#e5e5e5; }
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
      border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.15); padding:8px; min-width:220px; z-index:100001; display:none; }
    #sdAuthUserMenu.open { display:block; }
    #sdAuthUserMenu .sd-um-email { padding:8px 10px; font-size:0.8rem; color:#666; border-bottom:1px solid #eee; margin-bottom:6px; word-break:break-all; }
    #sdAuthUserMenu button { display:block; width:100%; text-align:left; padding:8px 10px; border:none; background:none;
      border-radius:6px; cursor:pointer; font-size:0.85rem; }
    #sdAuthUserMenu button:hover { background:#f5f6f8; }
  `;
  document.head.appendChild(style);
}

const GOOGLE_G_SVG = `<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/><path fill="#FBBC05" d="M3.95 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.71V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l2.99-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z"/></svg>`;

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
          Meldest du dich mit <strong>Google</strong> an, werden deine Dateien in deiner <strong>eigenen
          Google Drive</strong> gespeichert (in einem eigenen Ordner "${DRIVE_FOLDER_NAME}") – nicht auf
          unseren Servern, und ohne festes Limit von uns. Bei Anmeldung per E-Mail/Passwort speichern wir
          deine Dateien stattdessen in unserem eigenen, kleinen Kontingent bei
          <strong>Google (Firebase)</strong> (bis 10&nbsp;MB pro Konto). Details dazu in unserer
          <a href="../datenschutz.html" target="_blank" rel="noopener" style="color:#3366ff;">Datenschutzerklärung</a>.
        </p>
        <button class="sd-primary" id="sdAuthConsentContinue">Trotzdem anmelden</button>
        <button class="sd-link" id="sdAuthConsentCancel">Ohne Anmeldung weiter nutzen</button>
      </div>

      <div id="sdAuthFormStep" style="display:none;">
        <h3 id="sdAuthTitle">Willkommen</h3>
        <p class="sub">Melde dich an, um deine Dokumente geräteübergreifend zu nutzen.</p>
        <div class="sd-err" id="sdAuthErr"></div>

        <button class="sd-google" id="sdAuthGoogleBtn">${GOOGLE_G_SVG} Mit Google anmelden</button>
        <p style="font-size:0.72rem;color:#888;text-align:center;margin:8px 0 0;">
          Speichert deine Dateien in deiner eigenen Google Drive.
        </p>

        <div class="sd-divider">oder mit E-Mail</div>

        <div class="sd-auth-tabs">
          <button id="sdAuthTabLogin" class="active">Anmelden</button>
          <button id="sdAuthTabSignup">Registrieren</button>
        </div>
        <input type="text" id="sdAuthName" placeholder="Dein Name" style="display:none;">
        <input type="email" id="sdAuthEmail" placeholder="E-Mail-Adresse" autocomplete="username">
        <input type="password" id="sdAuthPassword" placeholder="Passwort" autocomplete="current-password">
        <button class="sd-primary" id="sdAuthSubmit">Anmelden</button>
        <button class="sd-link" id="sdAuthForgot">Passwort vergessen?</button>
        <p style="font-size:0.72rem;color:#888;text-align:center;margin:14px 0 0;line-height:1.4;">
          Mit Anmeldung/Registrierung akzeptierst du unsere
          <a href="../datenschutz.html" target="_blank" rel="noopener" style="color:#3366ff;">Datenschutzerklärung</a>.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const els = {
    backdrop, close: backdrop.querySelector('#sdAuthClose'),
    consentStep: backdrop.querySelector('#sdAuthConsentStep'), formStep: backdrop.querySelector('#sdAuthFormStep'),
    consentContinue: backdrop.querySelector('#sdAuthConsentContinue'), consentCancel: backdrop.querySelector('#sdAuthConsentCancel'),
    googleBtn: backdrop.querySelector('#sdAuthGoogleBtn'),
    tabLogin: backdrop.querySelector('#sdAuthTabLogin'), tabSignup: backdrop.querySelector('#sdAuthTabSignup'),
    title: backdrop.querySelector('#sdAuthTitle'),
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

  els.googleBtn.onclick = async () => {
    els.err.style.color = '#c0392b'; els.err.textContent = '';
    els.googleBtn.disabled = true;
    const oldLabel = els.googleBtn.innerHTML;
    els.googleBtn.innerHTML = 'Bitte warten...';
    try {
      await SD_AUTH.signInWithGoogle();
      backdrop.classList.remove('open');
    } catch (e) {
      els.err.textContent = friendlyError(e);
    } finally {
      els.googleBtn.disabled = false;
      els.googleBtn.innerHTML = oldLabel;
    }
  };

  let mode = 'login';
  function setMode(m) {
    mode = m;
    els.err.textContent = '';
    if (m === 'login') {
      els.tabLogin.classList.add('active'); els.tabSignup.classList.remove('active');
      els.name.style.display = 'none';
      els.submit.textContent = 'Anmelden';
      els.forgot.style.display = 'block';
    } else {
      els.tabSignup.classList.add('active'); els.tabLogin.classList.remove('active');
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

    // Nutzer-Menü (Logout / Google Drive erneut verbinden) bei eingeloggtem Zustand
    const menu = document.createElement('div');
    menu.id = 'sdAuthUserMenu';
    menu.innerHTML = `<div class="sd-um-email" id="sdAuthUmEmail"></div>
      <button id="sdAuthUmReconnect" style="display:none;">🔄 Google Drive erneut verbinden</button>
      <button id="sdAuthUmLogout">🚪 Abmelden</button>`;
    (host.parentElement || document.body).style.position = (host.parentElement || document.body).style.position || 'relative';
    document.body.appendChild(menu);
    menu.querySelector('#sdAuthUmLogout').onclick = async () => {
      await SD_AUTH.signOutNow();
      menu.classList.remove('open');
    };
    menu.querySelector('#sdAuthUmReconnect').onclick = async () => {
      try { await SD_AUTH.connectGoogleDrive(); } catch (e) { alert(friendlyError(e)); }
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
      const reconnectBtn = menu.querySelector('#sdAuthUmReconnect');
      reconnectBtn.style.display = SD_AUTH.hasDriveAccess ? 'none' : 'block';
      const r = btn.getBoundingClientRect();
      menu.style.top = (r.bottom + window.scrollY + 6) + 'px';
      menu.style.left = Math.max(10, r.right - 220) + 'px';
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
