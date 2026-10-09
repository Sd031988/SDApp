(() => {
  "use strict";

  const el = (id) => document.getElementById(id);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  const ui = {
    cam: el("cam"),
    stage: el("stage"),
    overlay: el("overlay"),
    count: el("pageCount"),
    hint: el("liveHint"),
    shutter: el("btnShutter"),
    torch: el("btnTorch"),
    btnPages: el("btnPages"),
    lastPreview: el("lastPreview"),
    pagesBadge: el("pagesBadge"),
    review: el("reviewScreen"),
    reviewStage: el("reviewStage"),
    reviewCanvas: el("reviewCanvas"),
    handles: Array.from(document.querySelectorAll(".handle")),
    loupe: el("loupe"),
    strip: el("filterStrip"),
    pagesSheet: el("pagesSheet"),
    grid: el("pageGrid"),
    busy: el("busy"),
    busyBar: el("busyBar"),
    busyText: el("busyText"),
    toast: el("toast"),
    importBtn: el("btnImport"),
    importBig: el("btnImportBig"),
    photoBig: el("btnPhotoBig"),
    fileInput: el("fileInput"),
    photoInput: el("photoInput"),
    noCam: el("noCam"),
    noCamText: el("noCamText"),
    docName: el("docName"),
    newDoc: el("btnNewDoc"),
    textSheet: el("textSheet"),
    textOut: el("textOut"),
    textNote: el("textNote"),
    modeBar: el("modeBar"),
    codeHint: el("codeHint"),
    libBtn: el("btnLibrary"),
    libSheet: el("libSheet"),
    libList: el("libList"),
    libSearch: el("libSearch"),
    libNote: el("libNote"),
    codeHistBtn: el("btnCodeHistory"),
    codeSheet: el("codeSheet"),
    codeType: el("codeType"),
    codeValue: el("codeValue"),
    codeNote: el("codeNote"),
    codeOpen: el("btnCodeOpen"),
    codeHistSheet: el("codeHistSheet"),
    codeList: el("codeList"),
    cardSheet: el("cardSheet"),
    cardImg: el("cardImg"),
    cardForm: el("cardForm"),
    cardNote: el("cardNote")
  };

  const state = {
    pages: [],
    stream: null,
    track: null,
    torchOn: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    det: { quad: null, hist: [], locked: false, sharpMax: 20 },
    work: null,
    lastDetect: 0,
    editing: null,
    preview: null,
    view: null,
    raf: 0,
    gestures: new Map(),
    pinchStart: 0,
    drag: null,
    tesseract: null,
    hintShown: false,
    importQueue: [],
    docName: "",
    persistWarned: false,
    docId: "",
    docCreated: 0,
    mode: "doc",
    libFilter: "all"
  };

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  let toastTimer = null;
  function toast(msg, ms = 2200) {
    ui.toast.textContent = msg;
    ui.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (ui.toast.hidden = true), ms);
  }

  function busy(text, ratio) {
    ui.busy.hidden = false;
    ui.busyText.textContent = text || "Wird verarbeitet";
    if (ratio == null) {
      ui.busyBar.classList.add("is-indeterminate");
      ui.busyBar.firstElementChild.style.width = "35%";
    } else {
      ui.busyBar.classList.remove("is-indeterminate");
      ui.busyBar.firstElementChild.style.width = Math.round(clamp(ratio, 0, 1) * 100) + "%";
    }
  }

  const busyHide = () => (ui.busy.hidden = true);

  const boxCache = new WeakMap();

  const clampBox = (rgba, w, h) => {
    const hit = boxCache.get(rgba);
    if (hit && hit.w === w && hit.h === h) return hit.canvas;
    const o = document.createElement("canvas");
    o.width = w;
    o.height = h;
    const ctx = o.getContext("2d");
    ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
    boxCache.set(rgba, { w, h, canvas: o });
    return o;
  };

  const loadImage = (src) =>
    new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Bild nicht lesbar"));
      i.src = src;
    });

  // ---------- Speicher (IndexedDB) ----------
  // v1: "pages" + "meta" (nur EIN Dokument). v2: "docs" + "docpages" = Ablage mit
  // beliebig vielen Dokumenten und Visitenkarten, "codes" = QR-/Barcode-Verlauf.
  // Die v1-Seiten werden beim ersten Start einmalig in die Ablage übernommen.
  const DB_NAME = "dokumentenscanner";
  const DB_VERSION = 2;
  let dbPromise = null;
  let saveTimer = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((res, rej) => {
      if (!("indexedDB" in window)) return rej(new Error("kein Speicher"));
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("pages")) db.createObjectStore("pages", { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
        if (!db.objectStoreNames.contains("docs")) db.createObjectStore("docs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("docpages")) {
          db.createObjectStore("docpages", { keyPath: "key" }).createIndex("docId", "docId");
        }
        if (!db.objectStoreNames.contains("codes")) db.createObjectStore("codes", { keyPath: "id" });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    dbPromise.catch(() => (dbPromise = null));
    return dbPromise;
  }

  // Fuehrt fn(transaction) aus; liefert das Ergebnis einer zurueckgegebenen Anfrage.
  async function dbRun(stores, mode, fn) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const t = db.transaction(stores, mode);
      let out;
      try {
        out = fn(t);
      } catch (e) {
        try { t.abort(); } catch (e2) {}
        rej(e);
        return;
      }
      t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error("abgebrochen"));
    });
  }

  function storedPage(p, order, docId) {
    return {
      key: docId + ":" + p.id, docId,
      id: p.id, src: p.src, w: p.w, h: p.h, filter: p.filter, thumb: p.thumb,
      text: p.text == null ? null : p.text, words: p.words || null,
      ocrW: p.ocrW || 0, ocrH: p.ocrH || 0, order
    };
  }

  function plainPage(stored) {
    const copy = Object.assign({}, stored);
    delete copy.order;
    delete copy.key;
    delete copy.docId;
    return copy;
  }

  // Suchtext fuer die Ablage (erkannter Text, gekuerzt)
  function searchText(pages) {
    return pages.map((p) => String(p.text || "")).join(" ").replace(/\s+/g, " ").trim().slice(0, 4000);
  }

  // Schreibt ein Dokument samt Seiten; ersetzt vorhandene Seiten dieses Dokuments.
  // Ohne Seiten wird das Dokument aus der Ablage entfernt.
  function putDocTx(t, record, pages) {
    const docs = t.objectStore("docs");
    const dp = t.objectStore("docpages");
    const cur = dp.index("docId").openKeyCursor(IDBKeyRange.only(record.id));
    cur.onsuccess = () => {
      const c = cur.result;
      if (c) {
        dp.delete(c.primaryKey);
        c.continue();
        return;
      }
      if (!pages.length) {
        docs.delete(record.id);
        return;
      }
      docs.put(record);
      pages.forEach((p, i) => dp.put(storedPage(p, i, record.id)));
    };
  }

  function putDoc(record, pages) {
    return dbRun(["docs", "docpages"], "readwrite", (t) => putDocTx(t, record, pages));
  }

  function deleteDoc(id) {
    return dbRun(["docs", "docpages"], "readwrite", (t) => putDocTx(t, { id }, []));
  }

  function getDoc(id) {
    return dbRun(["docs"], "readonly", (t) => t.objectStore("docs").get(id));
  }

  async function getDocPages(id) {
    const list = await dbRun(["docpages"], "readonly", (t) => t.objectStore("docpages").index("docId").getAll(IDBKeyRange.only(id)));
    return (list || []).sort((a, b) => a.order - b.order).map(plainPage);
  }

  function getAllDocs() {
    return dbRun(["docs"], "readonly", (t) => t.objectStore("docs").getAll());
  }

  function workingRecord() {
    return {
      id: state.docId,
      kind: "doc",
      name: String(state.docName || "").trim() || defaultDocName(),
      created: state.docCreated || Date.now(),
      updated: Date.now(),
      pageCount: state.pages.length,
      thumb: state.pages.length ? state.pages[0].thumb || "" : "",
      text: searchText(state.pages)
    };
  }

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeAll, 250);
  }

  // Ausstehende Speicherung sofort ausfuehren (vor Dokumentwechsel)
  async function flush() {
    clearTimeout(saveTimer);
    await writeAll();
  }

  async function writeAll() {
    if (!state.docId) return;
    const record = workingRecord();
    const pages = state.pages.slice();
    try {
      await dbRun(["docs", "docpages", "meta"], "readwrite", (t) => {
        putDocTx(t, record, pages);
        t.objectStore("meta").put(record.id, "currentDocId");
      });
    } catch (e) {
      if (!state.persistWarned) {
        state.persistWarned = true;
        toast("Speichern auf dem Gerät nicht möglich. Seiten bleiben nur bis zum Schließen.", 5000);
      }
    }
  }

  // Einmalig: Seiten aus Version 1 als Dokument in die Ablage uebernehmen
  async function migrateV1() {
    const done = await dbRun(["meta"], "readonly", (t) => t.objectStore("meta").get("migratedV2"));
    if (done) return;
    let pagesReq = null;
    let nameReq = null;
    await dbRun(["pages", "meta"], "readonly", (t) => {
      pagesReq = t.objectStore("pages").getAll();
      nameReq = t.objectStore("meta").get("docName");
    });
    const name = nameReq.result;
    const list = (pagesReq.result || []).sort((x, y) => x.order - y.order).map(plainPage);
    const id = newId();
    const now = Date.now();
    await dbRun(["docs", "docpages", "meta", "pages"], "readwrite", (t) => {
      if (list.length) {
        putDocTx(t, {
          id, kind: "doc",
          name: typeof name === "string" && name.trim() ? name.trim() : defaultDocName(),
          created: now, updated: now, pageCount: list.length,
          thumb: list[0].thumb || "", text: searchText(list)
        }, list);
        t.objectStore("meta").put(id, "currentDocId");
      }
      t.objectStore("pages").clear();
      t.objectStore("meta").put(true, "migratedV2");
    });
  }

  function startNewDocState() {
    state.docId = newId();
    state.docCreated = Date.now();
    state.docName = defaultDocName();
    state.pages = [];
  }

  async function loadDocIntoState(id) {
    const rec = await getDoc(id);
    if (!rec || rec.kind !== "doc") return false;
    const pages = await getDocPages(id);
    state.docId = rec.id;
    state.docCreated = rec.created || Date.now();
    state.docName = rec.name || defaultDocName();
    state.pages = pages;
    return true;
  }

  async function restore() {
    // Seiten, die vor dem Laden schon aufgenommen wurden, nicht verlieren
    const early = state.pages.slice();
    try {
      await migrateV1();
      const cur = await dbRun(["meta"], "readonly", (t) => t.objectStore("meta").get("currentDocId"));
      if (cur && (await loadDocIntoState(cur))) {
        if (early.length) {
          state.pages = state.pages.concat(early);
          persist();
        }
      }
    } catch (e) {}
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  }

  function defaultDocName() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `Scan ${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  function fileBase() {
    const raw = String(state.docName || "").trim() || defaultDocName();
    return raw.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").slice(0, 80) || "scan";
  }

  const indexOfPage = (page) => state.pages.findIndex((p) => p.id === page.id);

  const toDataUrl = (rgba, w, h, q) => clampBox(rgba, w, h).toDataURL("image/jpeg", q == null ? 0.92 : q);

  const insetQuad = (w, h, m) => [
    w * m, h * m, w * (1 - m), h * m, w * (1 - m), h * (1 - m), w * m, h * (1 - m)
  ];

  function detectFromRGBA(rgba, w, h, workWidth) {
    const src = clampBox(rgba, w, h);
    const sw = Math.min(workWidth || 420, w);
    const sh = Math.max(1, Math.round((h / w) * sw));
    const c = document.createElement("canvas");
    c.width = sw;
    c.height = sh;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, sw, sh);
    const d = ctx.getImageData(0, 0, sw, sh);
    const g = Vision.luma(d.data, sw, sh);
    const q = Vision.detectQuad(g, sw, sh);
    if (!q) return null;
    const kx = w / sw, ky = h / sh;
    const out = new Float32Array(8);
    for (let i = 0; i < 4; i++) {
      out[i * 2] = q[i * 2] * kx;
      out[i * 2 + 1] = q[i * 2 + 1] * ky;
    }
    return Vision.refineQuad(rgba, w, h, out, Math.round(3 * Math.max(kx, ky) + 2));
  }

  function coverMap(vw, vh, sw, sh) {
    const va = vw / vh, sa = sw / sh;
    if (va > sa) {
      const s = sh / vh;
      return { s, ox: (sw - vw * s) / 2, oy: 0 };
    }
    const s = sw / vw;
    return { s, ox: 0, oy: (sh - vh * s) / 2 };
  }

  function applyStageTransform() {
    ui.stage.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom})`;
  }

  function showNoCamera(reason) {
    ui.noCamText.textContent = reason;
    ui.noCam.hidden = false;
  }

  async function startCamera() {
    if (state.stream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showNoCamera(window.isSecureContext
        ? "Dieser Browser gibt keine Kamera frei. Fotos oder Bilder kannst du trotzdem importieren."
        : "Die Kamera geht nur über HTTPS oder localhost. Fotos oder Bilder kannst du trotzdem importieren.");
      return;
    }
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 2560 },
          height: { ideal: 1440 }
        },
        audio: false
      });
      state.track = state.stream.getVideoTracks()[0];
      ui.cam.srcObject = state.stream;
      await ui.cam.play();
      try {
        const caps = state.track.getCapabilities ? state.track.getCapabilities() : {};
        if (caps.torch) ui.torch.hidden = false;
      } catch (e) {}
      ui.noCam.hidden = true;
      state.lastDetect = 0;
      loop();
    } catch (e) {
      state.stream = null;
      const denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      showNoCamera(denied
        ? "Der Kamerazugriff wurde nicht erlaubt. Fotos oder Bilder kannst du trotzdem importieren."
        : "Keine Kamera gefunden. Fotos oder Bilder vom Gerät importieren und wie einen Scan bearbeiten.");
    }
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
      state.stream = null;
      state.track = null;
    }
    cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function loop() {
    state.raf = requestAnimationFrame(loop);
    const v = ui.cam;
    if (!v.videoWidth) return;
    const now = performance.now();
    if (state.mode === "code") {
      tickCode(now);
      drawCodeOverlay();
      return;
    }
    if (now - state.lastDetect > 110 && !state.editing) {
      state.lastDetect = now;
      runDetection();
    }
    drawOverlay();
  }

  function runDetection() {
    const v = ui.cam;
    const w = 360;
    const h = Math.max(1, Math.round((v.videoHeight / v.videoWidth) * w));
    if (!state.work) {
      state.work = document.createElement("canvas");
      state.work.width = w;
      state.work.height = h;
    }
    if (state.work.height !== h) {
      state.work.height = h;
    }
    const ctx = state.work.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h);
    const g = Vision.luma(d.data, w, h);
    const q = Vision.detectQuad(g, w, h);
    const det = state.det;
    det.sharpMax = Math.max(20, det.sharpMax * 0.98, Vision.varianceOfLaplacian(g, w, h, q));
    if (!q) {
      det.quad = null;
      det.hist.length = 0;
      det.locked = false;
      return;
    }
    det.quad = q;
    det.hist.push(q);
    if (det.hist.length > 8) det.hist.shift();
    const dev = Vision.deviation(det.hist);
    const still = det.hist.length >= 5 && dev.avg < 2.2 && dev.max < 6;
    const sharp = Vision.varianceOfLaplacian(g, w, h, q) > Math.max(80, det.sharpMax * 0.12);
    det.locked = still && sharp;
  }

  function quadToScreen(q) {
    const stageW = ui.stage.clientWidth;
    const stageH = ui.stage.clientHeight;
    const m = coverMap(ui.cam.videoWidth, ui.cam.videoHeight, stageW, stageH);
    const kx = (ui.cam.videoWidth / state.work.width) * m.s;
    const ky = (ui.cam.videoHeight / state.work.height) * m.s;
    const out = new Float32Array(8);
    for (let i = 0; i < 4; i++) {
      out[i * 2] = q[i * 2] * kx + m.ox;
      out[i * 2 + 1] = q[i * 2 + 1] * ky + m.oy;
    }
    return out;
  }

  function drawOverlay() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const sw = ui.stage.clientWidth;
    const sh = ui.stage.clientHeight;
    if (!sw || !sh) return;
    const cv = ui.overlay;
    if (cv.width !== Math.round(sw * dpr) || cv.height !== Math.round(sh * dpr)) {
      cv.width = Math.round(sw * dpr);
      cv.height = Math.round(sh * dpr);
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sw, sh);

    const q = state.det.quad;
    const locked = state.det.locked;
    if (q) {
      const s = quadToScreen(q);
      const strength = locked ? 1 : 0.35;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const grid = 7;
      for (let i = 1; i < grid; i++) {
        const t = i / grid;
        ctx.beginPath();
        for (let e = 0; e < 4; e++) {
          const a = e * 2, b = ((e + 1) % 4) * 2;
          const px = s[a] + (s[b] - s[a]) * t;
          const py = s[a + 1] + (s[b + 1] - s[a + 1]) * t;
          const nx = s[b] + (s[a] - s[b]) * t;
          const ny = s[b + 1] + (s[a + 1] - s[b + 1]) * t;
          ctx.moveTo(px, py);
          ctx.lineTo(nx, ny);
        }
        ctx.strokeStyle = `rgba(47,224,138,${0.1 * strength + 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(s[0], s[1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(s[i * 2], s[i * 2 + 1]);
      ctx.closePath();
      ctx.shadowColor = locked ? "rgba(47,224,138,0.95)" : "rgba(47,224,138,0.28)";
      ctx.shadowBlur = locked ? 26 : 8;
      ctx.strokeStyle = locked ? "rgba(70,255,170,0.98)" : "rgba(47,224,138,0.55)";
      ctx.lineWidth = locked ? 3.5 : 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (locked) {
        ctx.strokeStyle = "rgba(47,224,138,0.22)";
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.strokeStyle = "rgba(120,255,200,0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1.5;
      const cx = sw / 2, cy = sh / 2, w = sw * 0.62, h = sh * 0.7;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
    }

    if (!state.hintShown && state.pages.length === 0) ui.hint.hidden = locked || !q;
    else ui.hint.hidden = true;
  }

  ui.torch.addEventListener("click", async () => {
    if (!state.track) return;
    try {
      state.torchOn = !state.torchOn;
      await state.track.applyConstraints({ advanced: [{ torch: state.torchOn }] });
      ui.torch.classList.toggle("accent", state.torchOn);
    } catch (e) {
      state.torchOn = false;
      toast("Licht nicht steuerbar");
    }
  });

  ui.stage.addEventListener("pointerdown", (e) => {
    ui.stage.setPointerCapture(e.pointerId);
    state.gestures.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (state.gestures.size === 2) {
      const p = [...state.gestures.values()];
      state.pinchStart = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      state.pinchZoom = state.zoom;
    }
  });

  ui.stage.addEventListener("pointermove", (e) => {
    const g = state.gestures.get(e.pointerId);
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    g.x = e.clientX;
    g.y = e.clientY;
    if (state.gestures.size === 2) {
      const p = [...state.gestures.values()];
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      state.zoom = clamp((state.pinchZoom || 1) * (d / (state.pinchStart || d)), 1, 4);
      applyStageTransform();
    } else if (state.zoom > 1.001) {
      state.panX += dx;
      state.panY += dy;
      applyStageTransform();
    }
  });

  const endGesture = (e) => {
    state.gestures.delete(e.pointerId);
    if (state.gestures.size < 2) state.pinchStart = 0;
  };
  ui.stage.addEventListener("pointerup", endGesture);
  ui.stage.addEventListener("pointercancel", endGesture);

  ui.stage.addEventListener("dblclick", () => {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    applyStageTransform();
  });

  ui.shutter.addEventListener("click", () => (state.stream ? capture() : ui.photoInput.click()));

  function setScreen(name) {
    el("cameraScreen").classList.toggle("is-active", name === "camera");
    ui.review.classList.toggle("is-active", name === "review");
  }

  async function capture() {
    const v = ui.cam;
    if (!v.videoWidth) return;
    const max = 3000;
    const k = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.round(v.videoWidth * k);
    const h = Math.round(v.videoHeight * k);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h);
    const found = detectFromRGBA(d.data, w, h, 420);
    setScreen("review");
    openReview({ rgba: d.data, w, h }, found || insetQuad(w, h, 0.06), null, !!found);
  }

  function rectify(quad, maxDim) {
    const size = Vision.outputSize(quad, maxDim);
    const rgba = Vision.warp(state.editing.base.rgba, state.editing.base.w, state.editing.base.h, quad, size.w, size.h);
    if (!rgba) return null;
    return { rgba, w: size.w, h: size.h };
  }

  function rectOf(view) {
    return [0, 0, view.w, 0, view.w, view.h, 0, view.h];
  }

  function openReview(base, quad, pageId, trim) {
    state.editing = { base, quad: Float32Array.from(quad), pageId, filter: "original", trim: !!trim };
    if (pageId != null) {
      const p = state.pages.find((x) => x.id === pageId);
      if (p) state.editing.filter = p.filter;
    }
    state.drag = null;
    ui.loupe.hidden = true;
    setScreen("review");
    rebuild();
  }

  function rebuild() {
    const e = state.editing;
    const view = rectify(e.quad, 1100);
    state.view = view;
    state.preview = { base: view, map: null, quad: Float32Array.from(e.quad) };
    renderFilterStrip();
    layout();
  }

  function layout() {
    const e = state.editing;
    const view = state.view;
    if (!view) return;
    const rect = ui.reviewStage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = ui.reviewCanvas;
    cv.width = Math.max(1, Math.round(rect.width * dpr));
    cv.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const s = Math.min(rect.width / view.w, rect.height / view.h);
    const dw = view.w * s;
    const dh = view.h * s;
    const dx = (rect.width - dw) / 2;
    const dy = (rect.height - dh) / 2;
    state.preview.map = { s, dx, dy };

    const filtered = applyPreviewFilter(view, e.filter);
    const src = clampBox(filtered.rgba, filtered.w, filtered.h);
    ctx.drawImage(src, dx, dy, dw, dh);

    ctx.strokeStyle = "rgba(47,224,138,0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
    positionHandles();
  }

  function baseToRect(q) {
    const view = state.preview.base;
    const H = Vision.homography(rectOf(view), state.preview.quad);
    if (!H) return null;
    return Vision.invert3(H);
  }

  function rectToBase(p) {
    const view = state.preview.base;
    const H = Vision.homography(rectOf(view), state.preview.quad);
    if (!H) return null;
    return Vision.applyH(H, p[0], p[1]);
  }

  function handlePoints() {
    const e = state.editing;
    const b2r = baseToRect();
    if (!b2r) return null;
    const pts = [];
    for (let i = 0; i < 4; i++) {
      const p = Vision.applyH(b2r, e.quad[i * 2], e.quad[i * 2 + 1]);
      pts.push(p);
    }
    return pts;
  }

  function positionHandles() {
    const pts = handlePoints();
    const map = state.preview.map;
    ui.handles.forEach((h, i) => {
      if (!pts) { h.hidden = true; return; }
      const p = pts[i];
      const x = map.dx + p[0] * map.s;
      const y = map.dy + p[1] * map.s;
      h.hidden = false;
      h.style.left = x + "px";
      h.style.top = y + "px";
    });
  }

  function overlayQuadInDisplay() {
    const pts = handlePoints();
    if (!pts) return null;
    const map = state.preview.map;
    return pts.map((p) => [map.dx + p[0] * map.s, map.dy + p[1] * map.s]);
  }

  function drawCropOutline() {
    const view = state.view;
    const rect = ui.reviewStage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = ui.reviewCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const filtered = applyPreviewFilter(view, state.editing.filter);
    const src = clampBox(filtered.rgba, filtered.w, filtered.h);
    const map = state.preview.map;
    ctx.drawImage(src, map.dx, map.dy, view.w * map.s, view.h * map.s);
    const pts = overlayQuadInDisplay();
    if (!pts) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.strokeStyle = "rgba(47,224,138,0.95)";
    ctx.shadowColor = "rgba(47,224,138,0.8)";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  let filterCache = { view: null, out: {} };

  function applyPreviewFilter(view, id) {
    if (filterCache.view !== view) filterCache = { view, out: {} };
    const hit = filterCache.out[id];
    if (hit) return hit;
    const max = 900;
    const k = Math.min(1, max / Math.max(view.w, view.h));
    const w = Math.max(1, Math.round(view.w * k));
    const h = Math.max(1, Math.round(view.h * k));
    const small = clampBox(view.rgba, view.w, view.h);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(small, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h);
    const out = { rgba: Vision.applyFilter(d.data, w, h, id, {}), w, h };
    filterCache.out[id] = out;
    return out;
  }

  function renderFilterStrip() {
    ui.strip.innerHTML = "";
    const view = state.view;
    for (const f of Vision.FILTERS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "filter" + (state.editing.filter === f.id ? " is-active" : "");
      b.dataset.id = f.id;
      const c = document.createElement("canvas");
      const cw = 52, ch = 72;
      c.width = cw * 2;
      c.height = ch * 2;
      const k = Math.max(cw / view.w, ch / view.h);
      const dw = view.w * k;
      const dh = view.h * k;
      const filtered = applyPreviewFilter(view, f.id);
      const src = clampBox(filtered.rgba, filtered.w, filtered.h);
      c.getContext("2d").drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      b.appendChild(c);
      b.appendChild(document.createTextNode(f.label));
      b.title = f.hint || f.label;
      b.addEventListener("click", () => {
        state.editing.filter = f.id;
        renderFilterStrip();
        layout();
      });
      ui.strip.appendChild(b);
    }
  }

  let dragHandle = null;

  ui.handles.forEach((h) => {
    h.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      h.setPointerCapture(ev.pointerId);
      dragHandle = { i: +h.dataset.i, node: h, pid: ev.pointerId };
      h.classList.add("is-active");
      showLoupe();
    });
    h.addEventListener("pointermove", (ev) => {
      if (!dragHandle || dragHandle.pid !== ev.pointerId) return;
      const rect = ui.reviewStage.getBoundingClientRect();
      const map = state.preview.map;
      const rp = [(ev.clientX - rect.left - map.dx) / map.s, (ev.clientY - rect.top - map.dy) / map.s];
      const bp = rectToBase(rp);
      if (!bp) return;
      const q = state.editing.quad;
      q[dragHandle.i * 2] = clamp(bp[0], -0.02 * state.editing.base.w, 1.02 * state.editing.base.w);
      q[dragHandle.i * 2 + 1] = clamp(bp[1], -0.02 * state.editing.base.h, 1.02 * state.editing.base.h);
      positionHandles();
      drawCropOutline();
      showLoupe();
    });
    const finish = (ev) => {
      if (!dragHandle || dragHandle.pid !== ev.pointerId) return;
      dragHandle.node.classList.remove("is-active");
      ui.loupe.hidden = true;
      dragHandle = null;
      rebuild();
    };
    h.addEventListener("pointerup", finish);
    h.addEventListener("pointercancel", finish);
  });

  function showLoupe() {
    if (!dragHandle) return;
    const e = state.editing;
    const i = dragHandle.i;
    const cx = e.quad[i * 2];
    const cy = e.quad[i * 2 + 1];
    const src = clampBox(e.base.rgba, e.base.w, e.base.h);
    const size = 128;
    const scale = 3;
    const half = size / 2 / scale;
    const c = ui.loupe;
    if (!c.width) {
      c.width = size * 2;
      c.height = size * 2;
    }
    const ctx = c.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, cx - half, cy - half, half * 2, half * 2, 0, 0, size * 2, size * 2);
    ctx.strokeStyle = "rgba(47,224,138,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size - 8, size);
    ctx.lineTo(size, size - 8);
    ctx.moveTo(size - 22, size);
    ctx.lineTo(size, size - 22);
    ctx.stroke();

    const rect = ui.reviewStage.getBoundingClientRect();
    const node = dragHandle.node;
    const lx = clamp(parseFloat(node.style.left) - size / 2, 8, rect.width - size - 8);
    const ly = clamp(parseFloat(node.style.top) - size / 2 - 26, 8, rect.height - size - 8);
    c.style.left = lx + "px";
    c.style.top = ly + "px";
    c.hidden = false;
  }

  el("btnAuto").addEventListener("click", () => {
    const b = state.editing.base;
    const q = detectFromRGBA(b.rgba, b.w, b.h, 460);
    state.editing.quad = Float32Array.from(q || insetQuad(b.w, b.h, 0.06));
    state.editing.trim = !!q;
    rebuild();
    toast(q ? "Kanten neu erkannt" : "Keine Kanten gefunden, bitte Ecken ziehen");
  });

  el("btnRotate").addEventListener("click", () => {
    const b = state.editing.base;
    state.editing.quad = Vision.rotateQuad(state.editing.quad, 90, b.w, b.h);
    rebuild();
  });

  async function afterReview() {
    if (state.importQueue.length && (await openNextImport())) return;
    setScreen("camera");
    startCamera();
  }

  el("btnReviewBack").addEventListener("click", () => {
    state.editing = null;
    state.view = null;
    state.preview = null;
    ui.loupe.hidden = true;
    afterReview();
  });

  el("btnAccept").addEventListener("click", async () => {
    const e = state.editing;
    if (!e) return;
    busy("Seite wird übernommen", 0.3);
    const quad = e.trim ? Vision.shrinkQuad(e.quad, 0.008) : e.quad;
    const size = Vision.outputSize(quad, 2400);
    const rgba = Vision.warp(e.base.rgba, e.base.w, e.base.h, quad, size.w, size.h);
    busyHide();
    if (!rgba) { toast("Zuschneiden fehlgeschlagen"); return; }
    const out = Vision.applyFilter(rgba, size.w, size.h, e.filter, {});
    const src = toDataUrl(out, size.w, size.h, 0.92);
    const thumb = await makeThumb(src);
    if (e.pageId != null) {
      const p = state.pages.find((x) => x.id === e.pageId);
      if (p) {
        p.src = src;
        p.w = size.w;
        p.h = size.h;
        p.filter = e.filter;
        p.thumb = thumb;
        p.text = null;
        p.words = null;
      }
    } else if (state.mode === "card") {
      const page = { id: newId(), src, w: size.w, h: size.h, filter: e.filter, thumb, text: null };
      state.editing = null;
      state.view = null;
      state.preview = null;
      await afterReview();
      await createCard(page);
      return;
    } else {
      state.pages.push({
        id: newId(),
        src,
        w: size.w,
        h: size.h,
        filter: e.filter,
        thumb,
        text: null
      });
    }
    state.hintShown = true;
    ui.hint.hidden = true;
    state.editing = null;
    state.view = null;
    state.preview = null;
    renderCounts();
    persist();
    afterReview();
  });

  function makeThumb(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const k = 300 / Math.max(img.width, img.height);
        const w = Math.max(1, Math.round(img.width * k));
        const h = Math.max(1, Math.round(img.height * k));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => res(src);
      img.src = src;
    });
  }

  function renderCounts() {
    const n = state.pages.length;
    ui.count.textContent = n === 1 ? "1 Seite" : n + " Seiten";
    ui.pagesBadge.hidden = n === 0;
    ui.pagesBadge.textContent = String(n);
    if (n) {
      ui.lastPreview.src = state.pages[n - 1].thumb || state.pages[n - 1].src;
    } else {
      ui.lastPreview.removeAttribute("src");
    }
  }

  function updateSheetButtons() {
    const empty = !state.pages.length;
    ["btnMakePdf", "btnSharePdf", "btnPrint", "btnOcr", "btnKi"].forEach((id) => (el(id).disabled = empty));
  }

  function openSheet() {
    renderGrid();
    ui.docName.value = state.docName || defaultDocName();
    ui.pagesSheet.hidden = false;
    updateSheetButtons();
  }

  ui.docName.addEventListener("input", () => {
    state.docName = ui.docName.value;
    persist();
  });

  // "Neu": neues leeres Dokument beginnen. Das bisherige bleibt in der Ablage.
  async function beginNewDocument() {
    const hadPages = state.pages.length > 0;
    await flush();
    startNewDocState();
    ui.docName.value = state.docName;
    renderGrid();
    renderCounts();
    updateSheetButtons();
    await writeAll();
    toast(hadPages ? "Neues Dokument. Das bisherige liegt in der Ablage." : "Neues Dokument", 2600);
  }

  ui.newDoc.addEventListener("click", beginNewDocument);

  const closeSheet = () => (ui.pagesSheet.hidden = true);

  ui.btnPages.addEventListener("click", openSheet);
  el("btnSheetClose").addEventListener("click", closeSheet);
  ui.pagesSheet.addEventListener("click", (e) => {
    if (e.target === ui.pagesSheet) closeSheet();
  });

  function updateIndices() {
    [...ui.grid.children].forEach((cell, i) => {
      if (!cell.dataset || cell.dataset.i == null) return;
      cell.dataset.i = String(i);
      const num = cell.querySelector(".cell-num");
      if (num) num.textContent = String(i + 1);
    });
  }

  function renderGrid() {
    ui.grid.innerHTML = "";
    if (!state.pages.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Noch keine Seiten";
      ui.grid.appendChild(p);
      return;
    }
    state.pages.forEach((page, i) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.i = String(i);
      const img = document.createElement("img");
      img.src = page.thumb || page.src;
      img.alt = "Seite " + (i + 1);
      const num = document.createElement("span");
      num.className = "cell-num";
      num.textContent = String(i + 1);
      const del = document.createElement("button");
      del.className = "cell-btn del";
      del.type = "button";
      del.textContent = "✕";
      del.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const k = indexOfPage(page);
        if (k < 0) return;
        state.pages.splice(k, 1);
        renderGrid();
        renderCounts();
        updateSheetButtons();
        persist();
      });
      const rot = document.createElement("button");
      rot.className = "cell-btn rot";
      rot.type = "button";
      rot.textContent = "↻";
      rot.title = "Seite drehen";
      rot.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        await rotatePage(page);
      });
      const one = document.createElement("button");
      one.className = "cell-btn img";
      one.type = "button";
      one.textContent = "↓";
      one.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        await savePageImage(page);
      });
      cell.appendChild(img);
      cell.appendChild(num);
      cell.appendChild(del);
      cell.appendChild(rot);
      cell.appendChild(one);
      ui.grid.appendChild(cell);
    });
  }

  ui.grid.addEventListener("pointerdown", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell || e.target.closest(".cell-btn")) return;
    cell.setPointerCapture(e.pointerId);
    state.drag = { i: +cell.dataset.i, cell, x: e.clientX, y: e.clientY, on: false, pid: e.pointerId };
  });

  ui.grid.addEventListener("pointermove", (e) => {
    const d = state.drag;
    if (!d || d.pid !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.hypot(dx, dy) < 12) return;
      d.on = true;
      d.cell.classList.add("is-dragging");
      return;
    }
    d.cell.style.transform = `translate(${dx}px, ${dy}px)`;
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const target = over && over.closest ? over.closest(".cell") : null;
    if (!target || target === d.cell) return;
    const to = +target.dataset.i;
    const from = d.i;
    if (Number.isNaN(to) || to === from) return;
    const before = d.cell.getBoundingClientRect();
    const moved = state.pages.splice(from, 1)[0];
    state.pages.splice(to, 0, moved);
    const after = d.cell.getBoundingClientRect();
    if (from < to) target.after(d.cell);
    else target.before(d.cell);
    updateIndices();
    d.i = to;
    d.x += after.left - before.left;
    d.y += after.top - before.top;
  });

  const endDrag = (e) => {
    const d = state.drag;
    if (!d || d.pid !== e.pointerId) return;
    d.cell.classList.remove("is-dragging");
    d.cell.style.transform = "";
    const moved = d.on;
    state.drag = null;
    if (moved) {
      state.suppressClick = true;
      setTimeout(() => (state.suppressClick = false), 50);
      renderGrid();
      renderCounts();
      persist();
    }
  };
  ui.grid.addEventListener("pointerup", endDrag);
  ui.grid.addEventListener("pointercancel", endDrag);

  ui.grid.addEventListener("click", (e) => {
    if (state.suppressClick) return;
    const cell = e.target.closest(".cell");
    if (!cell || e.target.closest(".cell-btn")) return;
    editPage(state.pages[+cell.dataset.i]);
  });

  async function editPage(page) {
    if (!page) return;
    closeSheet();
    busy("Seite wird geladen", 0.2);
    try {
      const img = await loadImage(page.src);
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      busyHide();
      stopCamera();
      openReview({ rgba: d.data, w: c.width, h: c.height }, insetQuad(c.width, c.height, 0), page.id, false);
    } catch (e) {
      busyHide();
      toast("Seite nicht lesbar");
    }
  }

  async function pageDataUrl(page, maxDim) {
    const img = await loadImage(page.src);
    const k = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k));
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    return { url: c.toDataURL("image/jpeg", 0.9), w, h };
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function savePageImage(page) {
    const n = indexOfPage(page) + 1;
    const { url } = await pageDataUrl(page, 2600);
    const res = await fetch(url);
    download(await res.blob(), `${fileBase()} - Seite ${n}.jpg`);
    toast("Seite gespeichert");
  }

  async function rotatePage(page) {
    busy("Seite wird gedreht");
    try {
      const img = await loadImage(page.src);
      const c = document.createElement("canvas");
      c.width = img.naturalHeight;
      c.height = img.naturalWidth;
      const ctx = c.getContext("2d");
      ctx.translate(c.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      page.src = c.toDataURL("image/jpeg", 0.92);
      page.w = c.width;
      page.h = c.height;
      page.thumb = await makeThumb(page.src);
      page.text = null;
      page.words = null;
      busyHide();
      renderGrid();
      renderCounts();
      persist();
    } catch (e) {
      busyHide();
      toast("Drehen fehlgeschlagen");
    }
  }

  function addTextLayer(doc, page, geom) {
    const words = page.words && page.words.length ? page.words : null;
    if (!words && !page.text) return;
    doc.setFont("helvetica", "normal");
    if (!words) {
      doc.setFontSize(9);
      doc.text(String(page.text), geom.dx + 1, geom.dy + 4, {
        renderingMode: "invisible",
        maxWidth: Math.max(10, geom.dw - 2),
        lineHeightFactor: 1.2
      });
      return;
    }
    const ow = page.ocrW || geom.ow;
    const oh = page.ocrH || geom.oh;
    const sx = geom.dw / Math.max(1, ow);
    const sy = geom.dh / Math.max(1, oh);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const x = geom.dx + w.x0 * sx;
      const y = geom.dy + w.y1 * sy;
      const boxW = Math.max(0.2, (w.x1 - w.x0) * sx);
      const boxH = Math.max(0.2, (w.y1 - w.y0) * sy);
      const fs = Math.max(1, Math.min(200, (boxH * 72) / 25.4));
      doc.setFontSize(fs);
      const natural = doc.getTextWidth(w.text);
      const hs = natural > 0.01 ? Math.max(0.2, Math.min(4, boxW / natural)) : 1;
      doc.text(w.text, x, y, { renderingMode: "invisible", horizontalScale: hs });
    }
  }

  async function buildPdf() {
    if (!state.pages.length) return null;
    const { jsPDF } = window.jspdf;
    let doc = null;
    for (let i = 0; i < state.pages.length; i++) {
      const { url, w, h } = await pageDataUrl(state.pages[i], 2200);
      const landscape = w > h;
      if (!doc) doc = new jsPDF({ unit: "mm", format: "a4", orientation: landscape ? "landscape" : "portrait" });
      else doc.addPage("a4", landscape ? "landscape" : "portrait");
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const m = 7;
      const s = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h);
      const geom = { dx: (pw - w * s) / 2, dy: (ph - h * s) / 2, dw: w * s, dh: h * s, ow: w, oh: h };
      doc.addImage(url, "JPEG", geom.dx, geom.dy, geom.dw, geom.dh, undefined, "FAST");
      addTextLayer(doc, state.pages[i], geom);
      busy(`PDF Seite ${i + 1} von ${state.pages.length}`, (i + 1) / (state.pages.length + 1));
    }
    return doc.output("blob");
  }

  el("btnMakePdf").addEventListener("click", async () => {
    busy("PDF wird erstellt");
    try {
      const blob = await buildPdf();
      busyHide();
      if (!blob) return;
      download(blob, `${fileBase()}.pdf`);
      toast("PDF gespeichert");
    } catch (e) {
      busyHide();
      toast("PDF fehlgeschlagen");
    }
  });

  el("btnSharePdf").addEventListener("click", async () => {
    busy("PDF wird erstellt");
    try {
      const blob = await buildPdf();
      busyHide();
      if (!blob) return;
      const file = new File([blob], `${fileBase()}.pdf`, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileBase() });
      } else {
        download(blob, file.name);
        toast("PDF gespeichert (Teilen nicht verfügbar)");
      }
    } catch (e) {
      busyHide();
      if (e && e.name !== "AbortError") toast("Teilen fehlgeschlagen");
    }
  });

  el("btnPrint").addEventListener("click", async () => {
    busy("Druckansicht wird vorbereitet");
    try {
      const imgs = [];
      for (let i = 0; i < state.pages.length; i++) {
        const { url } = await pageDataUrl(state.pages[i], 1800);
        imgs.push(url);
        busy(`Seite ${i + 1} von ${state.pages.length}`, i / state.pages.length);
      }
      busyHide();
      if (!imgs.length) return;
      const w = window.open("", "_blank");
      if (!w) { toast("Popup blockiert"); return; }
      const html =
        "<!doctype html><html><head><meta charset='utf-8'><title>" + fileBase().replace(/[<>&]/g, "") + "</title><style>@page{margin:8mm}body{margin:0}img{width:100%;page-break-after:always;display:block}@media screen{img{max-width:100%;margin-bottom:8px}}</style></head><body>" +
        imgs.map((u) => `<img src="${u}">`).join("") +
        "</body></html>";
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 900);
    } catch (e) {
      busyHide();
      toast("Drucken fehlgeschlagen");
    }
  });

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => res();
      s.onerror = () => rej(new Error("Laden fehlgeschlagen: " + src));
      document.head.appendChild(s);
    });
  }

  function corePath() {
    const ok =
      typeof WebAssembly !== "undefined" &&
      WebAssembly.validate &&
      WebAssembly.validate(
        new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])
      );
    return ok ? "vendor/tesseract-core-simd-lstm.wasm.js" : "vendor/tesseract-core.wasm.js";
  }

  async function getOcr() {
    if (state.tesseract) return state.tesseract;
    await loadScript("vendor/tesseract.min.js");
    const worker = await window.Tesseract.createWorker("deu+eng", 1, {
      workerPath: "vendor/tesseract-worker.min.js",
      corePath: corePath(),
      langPath: "vendor/tessdata",
      gzip: true,
      logger: () => {}
    });
    state.tesseract = worker;
    return worker;
  }

  function collectOcrWords(data) {
    const out = [];
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      const kids = [];
      if (Array.isArray(node.blocks)) kids.push.apply(kids, node.blocks);
      if (Array.isArray(node.paragraphs)) kids.push.apply(kids, node.paragraphs);
      if (Array.isArray(node.lines)) kids.push.apply(kids, node.lines);
      if (Array.isArray(node.words)) kids.push.apply(kids, node.words);
      if (kids.length) {
        for (let i = 0; i < kids.length; i++) visit(kids[i]);
        return;
      }
      const b = node.bbox;
      const t = String(node.text == null ? "" : node.text).replace(/\s+/g, " ").trim();
      if (!t || !b || !(b.x1 > b.x0) || !(b.y1 > b.y0)) return;
      out.push({ text: t, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
    };
    visit(data);
    return out;
  }

  // Texterkennung fuer alle Seiten ohne Text. Liefert die Zahl der Seiten mit
  // Wortpositionen, oder null wenn die Erkennung nicht laeuft.
  async function runOcr() {
    if (!state.pages.length) return null;
    let worker;
    busy("Sprachdaten werden vorbereitet");
    try {
      worker = await getOcr();
    } catch (e) {
      busyHide();
      toast("Texterkennung nicht verfügbar");
      return null;
    }
    let withWords = 0;
    try {
      for (let i = 0; i < state.pages.length; i++) {
        const page = state.pages[i];
        if (page.text != null && page.words) {
          if (page.words.length) withWords++;
          continue;
        }
        busy(`Text wird erkannt ${i + 1} von ${state.pages.length}`, i / state.pages.length);
        const img = await pageDataUrl(page, 2000);
        const res = await worker.recognize(img.url, {}, { text: true, blocks: true });
        const data = (res && res.data) || {};
        page.text = String(data.text == null ? "" : data.text).trim();
        page.words = collectOcrWords(data);
        page.ocrW = img.w;
        page.ocrH = img.h;
        if (page.words.length) withWords++;
      }
      busyHide();
      persist();
      return withWords;
    } catch (e) {
      busyHide();
      toast("Texterkennung fehlgeschlagen");
      return null;
    }
  }

  el("btnOcr").addEventListener("click", async () => {
    const withWords = await runOcr();
    if (withWords != null) showText(withWords);
  });

  // KI-Hilfe (SD Lotse lokal oder Online-KI, siehe ../sd-ki.js)
  function openKi(text, onTake) {
    if (!window.sdKi || !window.sdKi.dokumentDialog) {
      toast("KI nicht verfügbar. Sie braucht beim ersten Mal eine Internetverbindung.", 4000);
      return;
    }
    window.sdKi.dokumentDialog({ text, ocr: true, uebersetzen: true, uebernehmen: onTake });
  }

  el("btnKi").addEventListener("click", async () => {
    const withWords = await runOcr();
    if (withWords == null) return;
    const text = allText();
    openKi(text, (t) => {
      showText(withWords);
      ui.textOut.value = t;
    });
  });

  el("btnTextKi").addEventListener("click", () => {
    openKi(ui.textOut.value, (t) => (ui.textOut.value = t));
  });

  function allText() {
    if (state.pages.length === 1) return String(state.pages[0].text || "").trim();
    return state.pages
      .map((p, i) => `--- Seite ${i + 1} ---\n${String(p.text || "").trim() || "(kein Text erkannt)"}`)
      .join("\n\n");
  }

  function showText(withWords) {
    ui.textOut.value = allText();
    ui.textNote.textContent = withWords
      ? "Der Text liegt jetzt auch unsichtbar im PDF. Das PDF ist dadurch durchsuchbar."
      : "Es wurde kein Text erkannt.";
    closeSheet();
    ui.textSheet.hidden = false;
  }

  el("btnTextClose").addEventListener("click", () => {
    ui.textSheet.hidden = true;
    openSheet();
  });

  el("btnCopyText").addEventListener("click", async () => {
    const t = ui.textOut.value;
    try {
      await navigator.clipboard.writeText(t);
      toast("Text kopiert");
    } catch (e) {
      ui.textOut.focus();
      ui.textOut.select();
      try {
        document.execCommand("copy");
        toast("Text kopiert");
      } catch (e2) {
        toast("Kopieren nicht möglich, Text ist markiert");
      }
    }
  });

  el("btnSaveText").addEventListener("click", () => {
    const blob = new Blob([ui.textOut.value], { type: "text/plain;charset=utf-8" });
    download(blob, `${fileBase()}.txt`);
    toast("Textdatei gespeichert");
  });

  // =====================================================================
  // Scan-Art: Dokument / QR-Barcode / Visitenkarte
  // =====================================================================
  const MODE_KEY = "sdScanModus";

  function anySheetOpen() {
    return [ui.pagesSheet, ui.textSheet, ui.libSheet, ui.codeSheet, ui.codeHistSheet, ui.cardSheet].some((x) => !x.hidden);
  }

  function setMode(mode) {
    if (!["doc", "code", "card"].includes(mode)) mode = "doc";
    state.mode = mode;
    try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
    document.body.classList.toggle("mode-code", mode === "code");
    document.body.classList.toggle("mode-card", mode === "card");
    ui.modeBar.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    ui.codeHistBtn.hidden = mode !== "code";
    ui.codeHint.hidden = mode !== "code";
    ui.hint.textContent = mode === "card" ? "Karte ruhig halten" : "Blatt ruhig halten";
    ui.hint.hidden = true;
    state.det.quad = null;
    state.det.hist.length = 0;
    state.det.locked = false;
    code.box = null;
    code.paused = false;
  }

  function initMode() {
    let saved = "doc";
    try { saved = localStorage.getItem(MODE_KEY) || "doc"; } catch (e) {}
    setMode(saved);
  }

  ui.modeBar.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (b) setMode(b.dataset.mode);
  });

  // =====================================================================
  // QR-Codes und Barcodes
  // Chrome/Edge/Android: eingebauter BarcodeDetector (QR + viele Barcodes).
  // Sonst (z. B. iPhone/Firefox): jsQR aus vendor/ – kann nur QR-Codes.
  // =====================================================================
  const code = { detector: null, tried: false, formats: [], busy: false, last: 0, box: null, paused: false, canvas: null, current: null };

  async function getDetector() {
    if (code.tried) return code.detector;
    code.tried = true;
    try {
      if ("BarcodeDetector" in window) {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats && formats.length) {
          code.formats = formats;
          code.detector = new window.BarcodeDetector({ formats });
        }
      }
    } catch (e) {
      code.detector = null;
    }
    return code.detector;
  }

  async function getJsQR() {
    if (!window.jsQR) await loadScript("vendor/jsQR.js");
    return window.jsQR;
  }

  // src: Video, Canvas oder Bild. sw/sh: Pixelgroesse der Quelle.
  // maxDim/canvas: nur fuer jsQR (Arbeitsgroesse und eigene Zeichenflaeche)
  async function decodeSource(src, sw, sh, maxDim, canvas) {
    const det = await getDetector();
    if (det) {
      try {
        const found = await det.detect(src);
        if (!found || !found.length) return null;
        const b = found[0];
        return { text: String(b.rawValue || ""), format: b.format || "", points: (b.cornerPoints || []).map((p) => [p.x, p.y]) };
      } catch (e) {
        // weiter mit jsQR
      }
    }
    const jsQR = await getJsQR();
    const k = Math.min(1, (maxDim || 900) / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * k));
    const h = Math.max(1, Math.round(sh * k));
    if (!canvas && !code.canvas) code.canvas = document.createElement("canvas");
    const c = canvas || code.canvas;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h);
    const r = jsQR(d.data, w, h, { inversionAttempts: "attemptBoth" });
    if (!r || !r.data) return null;
    const L = r.location;
    const pts = [L.topLeftCorner, L.topRightCorner, L.bottomRightCorner, L.bottomLeftCorner].map((p) => [p.x / k, p.y / k]);
    return { text: String(r.data), format: "qr_code", points: pts };
  }

  function tickCode(now) {
    if (code.busy || code.paused || anySheetOpen() || now - code.last < 220) return;
    const v = ui.cam;
    if (!v.videoWidth) return;
    code.last = now;
    code.busy = true;
    decodeSource(v, v.videoWidth, v.videoHeight)
      .then((hit) => {
        code.busy = false;
        if (!hit || !hit.text || code.paused || state.mode !== "code") {
          code.box = null;
          return;
        }
        code.box = hit.points;
        onCodeFound(hit);
      })
      .catch(() => {
        code.busy = false;
      });
  }

  function drawCodeOverlay() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const sw = ui.stage.clientWidth;
    const sh = ui.stage.clientHeight;
    if (!sw || !sh) return;
    const cv = ui.overlay;
    if (cv.width !== Math.round(sw * dpr) || cv.height !== Math.round(sh * dpr)) {
      cv.width = Math.round(sw * dpr);
      cv.height = Math.round(sh * dpr);
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sw, sh);
    // Sucher-Ecken
    const size = Math.min(sw, sh) * 0.62;
    const x = (sw - size) / 2;
    const y = (sh - size) / 2 - sh * 0.04;
    const L = size * 0.16;
    ctx.strokeStyle = "rgba(47,224,138,0.9)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    [[x, y, 1, 1], [x + size, y, -1, 1], [x + size, y + size, -1, -1], [x, y + size, 1, -1]].forEach(([cx, cy, dx, dy]) => {
      ctx.moveTo(cx + dx * L, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * L);
    });
    ctx.stroke();
    // Gefundener Code
    const pts = code.box;
    if (pts && pts.length >= 4 && ui.cam.videoWidth) {
      const m = coverMap(ui.cam.videoWidth, ui.cam.videoHeight, sw, sh);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const sx = pts[i][0] * m.s + m.ox;
        const sy = pts[i][1] * m.s + m.oy;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(47,224,138,0.18)";
      ctx.fill();
      ctx.strokeStyle = "rgba(70,255,170,0.98)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  const FORMAT_NAMES = {
    qr_code: "QR-Code", ean_13: "EAN-13", ean_8: "EAN-8", upc_a: "UPC-A", upc_e: "UPC-E",
    code_128: "Code 128", code_39: "Code 39", code_93: "Code 93", codabar: "Codabar", itf: "ITF",
    data_matrix: "Data Matrix", aztec: "Aztec", pdf417: "PDF417"
  };

  function formatName(f) {
    return FORMAT_NAMES[f] || String(f || "Code").replace(/_/g, " ").toUpperCase();
  }

  // Was steckt im Code? Liefert Art + ggf. Link
  function interpretCode(text) {
    const t = String(text).trim();
    if (/^https?:\/\/\S+$/i.test(t)) {
      let host = "";
      try { host = new URL(t).host; } catch (e) {}
      return { kind: "link", url: t, label: "Link öffnen", note: host ? "Öffnet die Seite " + host + " in einem neuen Tab. Nur öffnen, wenn du der Quelle vertraust." : "" };
    }
    if (/^mailto:/i.test(t)) return { kind: "mail", url: t, label: "E-Mail schreiben", note: "" };
    if (/^tel:/i.test(t)) return { kind: "tel", url: t, label: "Anrufen", note: "" };
    if (/^(sms|smsto):/i.test(t)) return { kind: "sms", url: t.replace(/^smsto:/i, "sms:"), label: "SMS schreiben", note: "" };
    if (/^BEGIN:VCARD/i.test(t)) return { kind: "vcard", label: "Als Kontakt speichern", note: "Der Code enthält einen Kontakt." };
    if (/^WIFI:/i.test(t)) {
      const get = (k) => {
        const m = t.match(new RegExp("[:;]" + k + ":((?:\\\\.|[^;])*)", "i"));
        return m ? m[1].replace(/\\(.)/g, "$1") : "";
      };
      const ssid = get("S");
      const pass = get("P");
      return { kind: "wifi", label: "Passwort kopieren", copyText: pass, note: "WLAN: " + (ssid || "(ohne Namen)") + (pass ? " · Passwort: " + pass : " · ohne Passwort") };
    }
    return { kind: "text", label: "Öffnen", note: "" };
  }

  async function saveCodeToHistory(hit) {
    try {
      const list = await dbRun(["codes"], "readonly", (t) => t.objectStore("codes").getAll());
      list.sort((a, b) => b.time - a.time);
      const last = list[0];
      // Gleicher Code direkt hintereinander: nur Zeit aktualisieren
      const rec = last && last.text === hit.text
        ? Object.assign({}, last, { time: Date.now() })
        : { id: newId(), text: hit.text, format: hit.format, time: Date.now() };
      await dbRun(["codes"], "readwrite", (t) => t.objectStore("codes").put(rec));
    } catch (e) {}
  }

  function onCodeFound(hit) {
    code.paused = true;
    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch (e) {}
    }
    saveCodeToHistory(hit);
    showCode(hit);
  }

  function showCode(hit) {
    code.current = hit;
    const info = interpretCode(hit.text);
    ui.codeType.textContent = formatName(hit.format);
    ui.codeValue.textContent = hit.text;
    ui.codeNote.textContent = info.note || "";
    const canAct = info.kind !== "text";
    ui.codeOpen.hidden = !canAct;
    ui.codeOpen.textContent = info.label;
    ui.codeSheet.querySelector(".sheet-actions").classList.toggle("two", !canAct);
    ui.codeSheet.querySelector(".sheet-actions").classList.toggle("three", canAct);
    ui.codeSheet.hidden = false;
  }

  function closeCodeSheet() {
    ui.codeSheet.hidden = true;
    code.box = null;
    code.current = null;
    // kurze Pause, damit derselbe Code nicht sofort wieder aufgeht
    setTimeout(() => (code.paused = false), 700);
  }

  el("btnCodeNext").addEventListener("click", closeCodeSheet);
  ui.codeSheet.addEventListener("click", (e) => {
    if (e.target === ui.codeSheet) closeCodeSheet();
  });

  ui.codeOpen.addEventListener("click", async () => {
    const hit = code.current;
    if (!hit) return;
    const info = interpretCode(hit.text);
    if (info.kind === "vcard") {
      download(new Blob([hit.text], { type: "text/vcard;charset=utf-8" }), "Kontakt.vcf");
      toast("Kontakt gespeichert");
      return;
    }
    if (info.kind === "wifi") {
      await copyText(info.copyText || "");
      return;
    }
    if (info.url) {
      const w = window.open(info.url, "_blank", "noopener,noreferrer");
      if (!w && info.kind === "link") toast("Popup blockiert");
    }
  });

  async function copyText(t, okMsg) {
    try {
      await navigator.clipboard.writeText(t);
      toast(okMsg || "Kopiert");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast(okMsg || "Kopiert");
      } catch (e2) {
        toast("Kopieren nicht möglich");
      }
      ta.remove();
    }
  }

  el("btnCodeCopy").addEventListener("click", () => code.current && copyText(code.current.text));

  el("btnCodeShare").addEventListener("click", async () => {
    if (!code.current) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: code.current.text });
      } catch (e) {
        if (e && e.name !== "AbortError") toast("Teilen fehlgeschlagen");
      }
    } else {
      copyText(code.current.text, "Teilen nicht verfügbar – Inhalt kopiert");
    }
  });

  async function decodeCodeFromFile(file) {
    busy("Code wird gesucht");
    try {
      const img = await decodeImage(file);
      const iw = img.width || img.naturalWidth;
      const ih = img.height || img.naturalHeight;
      const k = Math.min(1, 2000 / Math.max(iw, ih));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(iw * k));
      c.height = Math.max(1, Math.round(ih * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      if (img.close) img.close();
      // Mehrere Arbeitsgroessen: kleine Codes brauchen viele Pixel, verrauschte Fotos weniger
      let hit = null;
      const work = document.createElement("canvas");
      for (const dim of [1400, 900, 600]) {
        hit = await decodeSource(c, c.width, c.height, dim, work);
        if ((hit && hit.text) || code.detector) break;
      }
      busyHide();
      if (!hit || !hit.text) {
        toast(code.detector ? "Kein Code im Bild gefunden" : "Kein QR-Code im Bild gefunden (Barcodes nur in Chrome/Edge)", 3500);
        return;
      }
      code.paused = true;
      saveCodeToHistory(hit);
      showCode(hit);
    } catch (e) {
      busyHide();
      toast("Bild nicht lesbar");
    }
  }

  // ---------- Code-Verlauf ----------
  async function renderCodeHistory() {
    let list = [];
    try {
      list = await dbRun(["codes"], "readonly", (t) => t.objectStore("codes").getAll());
    } catch (e) {}
    list.sort((a, b) => b.time - a.time);
    ui.codeList.innerHTML = "";
    el("btnCodeClear").disabled = !list.length;
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Noch keine Codes gescannt";
      ui.codeList.appendChild(p);
      return;
    }
    list.forEach((rec) => {
      const row = document.createElement("div");
      row.className = "lib-item";
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      const icon = document.createElement("div");
      icon.className = "lib-thumb code";
      icon.textContent = rec.format === "qr_code" ? "QR" : "|||";
      const main = document.createElement("div");
      main.className = "lib-main";
      const name = document.createElement("div");
      name.className = "lib-name";
      name.textContent = rec.text;
      const meta = document.createElement("div");
      meta.className = "lib-meta";
      meta.textContent = formatName(rec.format) + " · " + fmtDate(rec.time);
      main.append(name, meta);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "lib-del";
      del.textContent = "✕";
      del.setAttribute("aria-label", "Eintrag löschen");
      del.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        await dbRun(["codes"], "readwrite", (t) => t.objectStore("codes").delete(rec.id));
        renderCodeHistory();
      });
      row.append(icon, main, del);
      const open = () => {
        ui.codeHistSheet.hidden = true;
        code.paused = true;
        showCode({ text: rec.text, format: rec.format });
      };
      row.addEventListener("click", open);
      row.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") open();
      });
      ui.codeList.appendChild(row);
    });
  }

  function openCodeHistory() {
    ui.codeSheet.hidden = true;
    code.paused = true;
    ui.codeHistSheet.hidden = false;
    renderCodeHistory();
  }

  ui.codeHistBtn.addEventListener("click", openCodeHistory);
  el("btnCodeHist2").addEventListener("click", openCodeHistory);
  el("btnCodeHistClose").addEventListener("click", () => {
    ui.codeHistSheet.hidden = true;
    setTimeout(() => (code.paused = false), 500);
  });
  ui.codeHistSheet.addEventListener("click", (e) => {
    if (e.target === ui.codeHistSheet) el("btnCodeHistClose").click();
  });
  el("btnCodeClear").addEventListener("click", async () => {
    if (!window.confirm("Den ganzen Code-Verlauf löschen?")) return;
    await dbRun(["codes"], "readwrite", (t) => t.objectStore("codes").clear());
    renderCodeHistory();
  });

  function fmtDate(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // =====================================================================
  // Ablage: alle Dokumente und Visitenkarten
  // =====================================================================
  async function renderLibrary() {
    let docs = [];
    try {
      docs = await getAllDocs();
    } catch (e) {
      ui.libList.innerHTML = '<p class="empty">Ablage nicht verfügbar (Browser-Speicher gesperrt).</p>';
      return;
    }
    // Das offene Dokument mit aktuellem Stand zeigen
    if (state.pages.length) {
      const cur = workingRecord();
      docs = docs.filter((d) => d.id !== cur.id).concat([cur]);
    }
    const q = ui.libSearch.value.trim().toLowerCase();
    const shown = docs
      .filter((d) => state.libFilter === "all" || d.kind === state.libFilter)
      .filter((d) => {
        if (!q) return true;
        const c = d.contact || {};
        const hay = [d.name, d.text, c.name, c.company, c.email, c.phone, c.mobile, c.city].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => b.updated - a.updated);

    ui.libList.innerHTML = "";
    if (!shown.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = docs.length ? "Nichts gefunden" : "Noch nichts gespeichert. Gescannte Dokumente und Visitenkarten landen automatisch hier.";
      ui.libList.appendChild(p);
    }
    shown.forEach((d) => {
      const row = document.createElement("div");
      row.className = "lib-item" + (d.id === state.docId ? " is-current" : "");
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      let thumb;
      if (d.thumb) {
        thumb = document.createElement("img");
        thumb.src = d.thumb;
        thumb.alt = "";
      } else {
        thumb = document.createElement("div");
        thumb.textContent = d.kind === "card" ? "@" : "?";
      }
      thumb.className = "lib-thumb" + (d.kind === "card" ? " card" : "");
      const main = document.createElement("div");
      main.className = "lib-main";
      const name = document.createElement("div");
      name.className = "lib-name";
      name.textContent = d.name;
      const meta = document.createElement("div");
      meta.className = "lib-meta";
      const tag = document.createElement("span");
      tag.className = "lib-tag";
      tag.textContent = d.kind === "card" ? "Visitenkarte" : d.id === state.docId ? "Offen" : "Dokument";
      const extra = d.kind === "card"
        ? [d.contact && d.contact.company, fmtDate(d.updated)].filter(Boolean).join(" · ")
        : (d.pageCount === 1 ? "1 Seite" : d.pageCount + " Seiten") + " · " + fmtDate(d.updated);
      meta.append(tag, document.createTextNode(" · " + extra));
      main.append(name, meta);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "lib-del";
      del.textContent = "✕";
      del.setAttribute("aria-label", d.name + " löschen");
      del.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        if (!window.confirm(`„${d.name}“ endgültig löschen?`)) return;
        await removeFromLibrary(d);
      });
      row.append(thumb, main, del);
      const open = () => openFromLibrary(d);
      row.addEventListener("click", open);
      row.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") open();
      });
      ui.libList.appendChild(row);
    });
    showStorageInfo();
  }

  async function showStorageInfo() {
    ui.libNote.textContent = "Alles bleibt nur in diesem Browser auf diesem Gerät.";
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        if (e && e.usage != null) {
          const mb = (e.usage / 1048576).toLocaleString("de-DE", { maximumFractionDigits: 1 });
          ui.libNote.textContent = `Alles bleibt nur in diesem Browser auf diesem Gerät · belegt: ${mb} MB`;
        }
      }
    } catch (e) {}
  }

  async function removeFromLibrary(d) {
    try {
      if (d.id === state.docId) {
        clearTimeout(saveTimer);
        startNewDocState();
        renderCounts();
      }
      await deleteDoc(d.id);
      if (!state.pages.length) await writeAll();
      toast("Gelöscht");
    } catch (e) {
      toast("Löschen fehlgeschlagen");
    }
    renderLibrary();
  }

  async function openFromLibrary(d) {
    if (d.kind === "card") {
      ui.libSheet.hidden = true;
      await openCardById(d.id);
      return;
    }
    if (d.id !== state.docId) {
      busy("Dokument wird geöffnet");
      try {
        await flush();
        const ok = await loadDocIntoState(d.id);
        await writeAll();
        busyHide();
        if (!ok) {
          toast("Dokument nicht gefunden");
          return;
        }
      } catch (e) {
        busyHide();
        toast("Öffnen fehlgeschlagen");
        return;
      }
    }
    ui.libSheet.hidden = true;
    setMode("doc");
    renderCounts();
    openSheet();
  }

  function openLibrary() {
    ui.libSearch.value = "";
    ui.libSheet.hidden = false;
    renderLibrary();
  }

  ui.libBtn.addEventListener("click", openLibrary);
  el("btnLibClose").addEventListener("click", () => (ui.libSheet.hidden = true));
  ui.libSheet.addEventListener("click", (e) => {
    if (e.target === ui.libSheet) ui.libSheet.hidden = true;
  });
  el("btnLibNew").addEventListener("click", async () => {
    ui.libSheet.hidden = true;
    setMode("doc");
    await beginNewDocument();
  });
  ui.libSearch.addEventListener("input", renderLibrary);
  ui.libSheet.querySelectorAll(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      state.libFilter = chip.dataset.filter;
      ui.libSheet.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      renderLibrary();
    })
  );

  // =====================================================================
  // Visitenkarten
  // =====================================================================
  const CARD_FIELDS = [
    ["name", "Name", "text", true],
    ["title", "Position", "text"],
    ["company", "Firma", "text"],
    ["phone", "Telefon", "tel"],
    ["mobile", "Mobil", "tel"],
    ["email", "E-Mail", "email", true],
    ["web", "Webseite", "url", true],
    ["street", "Straße", "text", true],
    ["zip", "PLZ", "text"],
    ["city", "Ort", "text"]
  ];

  const card = { record: null, page: null, saveTimer: null };

  // Ohne KI: Regeln fuer die typischen Angaben einer Visitenkarte
  function parseCard(text) {
    const out = {};
    CARD_FIELDS.forEach(([k]) => (out[k] = ""));
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").replace(/^[|•·\-–\s]+|[|•·\s]+$/g, "").trim())
      .filter((l) => l.length > 1);
    const used = new Set();

    const mail = String(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (mail) out.email = mail[0];

    for (let i = 0; i < lines.length && !out.web; i++) {
      const m = lines[i].match(/\b((?:https?:\/\/)?(?:www\.)[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?)/i) ||
        lines[i].match(/\b(https?:\/\/[^\s]+)/i);
      if (m && !/@/.test(m[1])) out.web = m[1];
    }

    lines.forEach((l, i) => {
      if (out.email && l.includes(out.email)) used.add(i);
      if (out.web && l.includes(out.web)) used.add(i);
    });

    // Telefonnummern (Fax wird uebersprungen)
    lines.forEach((l, i) => {
      const nums = l.match(/(\+?\d[\d\s()/.\-]{5,}\d)/g);
      if (!nums) return;
      const label = l.toLowerCase();
      if (/\bfax\b/.test(label)) {
        used.add(i);
        return;
      }
      nums.forEach((n) => {
        const digits = n.replace(/\D/g, "");
        if (digits.length < 6 || digits.length > 16) return;
        if (/^\d{5}$/.test(n.trim())) return;
        const isMobile = /mobil|handy|mobile|cell/.test(label) || /^(\+?49|0049|0)?1[5-7]\d/.test(digits);
        const nice = n.replace(/\s+/g, " ").trim();
        if (isMobile && !out.mobile) out.mobile = nice;
        else if (!out.phone) out.phone = nice;
        else if (!out.mobile) out.mobile = nice;
        used.add(i);
      });
    });

    // Adresse: Zeile mit PLZ + Ort, Strasse davor oder davor in derselben Zeile
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/(?:^|[,\s])(?:D-|A-|CH-)?(\d{4,5})\s+([A-ZÄÖÜ][\wÄÖÜäöüß.\- ]{1,40})$/);
      if (!m) continue;
      out.zip = m[1];
      out.city = m[2].trim();
      used.add(i);
      const before = lines[i].slice(0, m.index).replace(/[,\s]+$/, "").trim();
      const streetRe = /(str\.?|straße|strasse|weg|platz|allee|gasse|ring|damm|ufer|chaussee)\b|\s\d+\s?[a-z]?$/i;
      if (before && streetRe.test(before)) out.street = before;
      else if (i > 0 && streetRe.test(lines[i - 1]) && !used.has(i - 1)) {
        out.street = lines[i - 1];
        used.add(i - 1);
      }
      break;
    }

    // Firma: Rechtsform oder Domain
    const companyRe = /\b(gmbh|ag|ug|kg|ohg|gbr|e\.\s?k\.|e\.\s?v\.|mbh|ltd|inc|llc|s\.a\.|sarl|b\.v\.|co\.)\b/i;
    lines.forEach((l, i) => {
      if (!out.company && !used.has(i) && companyRe.test(l)) {
        out.company = l;
        used.add(i);
      }
    });

    // Position: typische Berufsbezeichnungen
    const titleRe = /(geschäftsführ|inhaber|leiter|manager|berater|beraterin|direktor|consultant|engineer|ingenieur|entwickler|developer|vertrieb|sales|assistent|referent|meister|dipl\.|dr\.|ceo|cto|cfo|founder|gründer|head of|partner|steuerberater|rechtsanwalt|architekt|designer|makler)/i;
    lines.forEach((l, i) => {
      if (!out.title && !used.has(i) && titleRe.test(l) && !/\d{3,}/.test(l)) {
        out.title = l;
        used.add(i);
      }
    });

    // Name: 2-4 Woerter, gross geschrieben, ohne Ziffern
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;
      const l = lines[i];
      const words = l.split(" ");
      if (words.length < 2 || words.length > 4 || /\d|@|:/.test(l)) continue;
      if (!words.every((w) => /^[A-ZÄÖÜ][\wÄÖÜäöüßéèáàçñ'.\-]*$/.test(w) || /^(von|van|de|der|zu|di|da|el|al)$/i.test(w))) continue;
      out.name = l;
      used.add(i);
      break;
    }

    if (!out.company && out.web) {
      const host = out.web.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/.]/)[0];
      if (host) out.company = host.charAt(0).toUpperCase() + host.slice(1);
    }
    return out;
  }

  function cardTitle(c) {
    return (c && (c.name || c.company)) || "Visitenkarte";
  }

  async function createCard(page) {
    busy("Text auf der Karte wird erkannt");
    let text = "";
    let ocrOk = true;
    try {
      const worker = await getOcr();
      const img = await pageDataUrl(page, 2000);
      const res = await worker.recognize(img.url);
      text = String((res && res.data && res.data.text) || "").trim();
    } catch (e) {
      ocrOk = false;
    }
    page.text = text;
    const contact = parseCard(text);
    const now = Date.now();
    const record = { id: newId(), kind: "card", name: cardTitle(contact), created: now, updated: now, pageCount: 1, thumb: page.thumb, text, contact };
    try {
      await putDoc(record, [page]);
    } catch (e) {
      toast("Speichern auf dem Gerät nicht möglich", 3500);
    }
    busyHide();
    openCardSheet(record, page);
    if (!ocrOk) ui.cardNote.textContent = "Texterkennung nicht verfügbar – bitte die Felder selbst ausfüllen.";
    else if (!text) ui.cardNote.textContent = "Kein Text erkannt. Felder selbst ausfüllen oder die Karte nochmal schärfer aufnehmen.";
  }

  async function openCardById(id) {
    try {
      const rec = await getDoc(id);
      const pages = await getDocPages(id);
      if (!rec) {
        toast("Visitenkarte nicht gefunden");
        return;
      }
      openCardSheet(rec, pages[0] || null);
    } catch (e) {
      toast("Öffnen fehlgeschlagen");
    }
  }

  function openCardSheet(record, page) {
    card.record = record;
    card.page = page;
    record.contact = record.contact || {};
    if (page) ui.cardImg.src = page.src;
    else ui.cardImg.removeAttribute("src");
    ui.cardImg.hidden = !page;
    ui.cardForm.innerHTML = "";
    CARD_FIELDS.forEach(([key, label, type, wide]) => {
      const lab = document.createElement("label");
      if (wide) lab.className = "wide";
      lab.textContent = label;
      const input = document.createElement("input");
      input.type = type;
      input.value = record.contact[key] || "";
      input.dataset.key = key;
      input.autocomplete = "off";
      input.addEventListener("input", () => {
        record.contact[key] = input.value.trim();
        scheduleCardSave();
      });
      lab.appendChild(input);
      ui.cardForm.appendChild(lab);
    });
    ui.cardNote.textContent = record.text
      ? "Felder wurden automatisch erkannt – bitte kurz prüfen."
      : "";
    ui.cardSheet.hidden = false;
  }

  function scheduleCardSave() {
    clearTimeout(card.saveTimer);
    card.saveTimer = setTimeout(saveCard, 300);
  }

  async function saveCard() {
    clearTimeout(card.saveTimer);
    const r = card.record;
    if (!r) return;
    r.name = cardTitle(r.contact);
    r.updated = Date.now();
    try {
      await dbRun(["docs"], "readwrite", (t) => t.objectStore("docs").put(r));
    } catch (e) {}
  }

  function fillCardForm(contact) {
    ui.cardForm.querySelectorAll("input").forEach((inp) => (inp.value = contact[inp.dataset.key] || ""));
  }

  async function closeCardSheet() {
    await saveCard();
    ui.cardSheet.hidden = true;
    card.record = null;
    card.page = null;
  }

  el("btnCardClose").addEventListener("click", closeCardSheet);
  ui.cardSheet.addEventListener("click", (e) => {
    if (e.target === ui.cardSheet) closeCardSheet();
  });

  el("btnCardDelete").addEventListener("click", async () => {
    const r = card.record;
    if (!r || !window.confirm(`Visitenkarte „${r.name}“ löschen?`)) return;
    clearTimeout(card.saveTimer);
    try {
      await deleteDoc(r.id);
      toast("Visitenkarte gelöscht");
    } catch (e) {
      toast("Löschen fehlgeschlagen");
    }
    ui.cardSheet.hidden = true;
    card.record = null;
  });

  // ---------- vCard ----------
  function vEsc(s) {
    return String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => "\\" + m);
  }

  function buildVcard(c) {
    const name = String(c.name || "").trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const last = parts.length > 1 ? parts[parts.length - 1] : name;
    const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${vEsc(last)};${vEsc(first)};;;`, `FN:${vEsc(name || c.company || "Kontakt")}`];
    if (c.company) lines.push(`ORG:${vEsc(c.company)}`);
    if (c.title) lines.push(`TITLE:${vEsc(c.title)}`);
    if (c.phone) lines.push(`TEL;TYPE=WORK,VOICE:${vEsc(c.phone)}`);
    if (c.mobile) lines.push(`TEL;TYPE=CELL:${vEsc(c.mobile)}`);
    if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${vEsc(c.email)}`);
    if (c.web) lines.push(`URL:${vEsc(/^https?:\/\//i.test(c.web) ? c.web : "https://" + c.web)}`);
    if (c.street || c.zip || c.city) lines.push(`ADR;TYPE=WORK:;;${vEsc(c.street)};${vEsc(c.city)};;${vEsc(c.zip)};`);
    lines.push("END:VCARD");
    return lines.join("\r\n") + "\r\n";
  }

  function vcardFileName(c) {
    return (cardTitle(c).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").trim() || "Kontakt") + ".vcf";
  }

  el("btnCardVcf").addEventListener("click", async () => {
    const r = card.record;
    if (!r) return;
    await saveCard();
    download(new Blob([buildVcard(r.contact)], { type: "text/vcard;charset=utf-8" }), vcardFileName(r.contact));
    toast("Kontaktdatei gespeichert – öffnen, um sie ins Adressbuch zu übernehmen", 3500);
  });

  el("btnCardShare").addEventListener("click", async () => {
    const r = card.record;
    if (!r) return;
    await saveCard();
    const file = new File([buildVcard(r.contact)], vcardFileName(r.contact), { type: "text/vcard" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: cardTitle(r.contact) });
      } else {
        download(file, file.name);
        toast("Teilen nicht verfügbar – Kontaktdatei gespeichert", 3000);
      }
    } catch (e) {
      if (e && e.name !== "AbortError") toast("Teilen fehlgeschlagen");
    }
  });

  // ---------- Visitenkarte mit KI ausfuellen ----------
  function parseJsonObject(text) {
    const s = String(text || "");
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a < 0 || b <= a) return null;
    try {
      const o = JSON.parse(s.slice(a, b + 1));
      return o && typeof o === "object" ? o : null;
    } catch (e) {
      return null;
    }
  }

  el("btnCardKi").addEventListener("click", () => {
    const r = card.record;
    if (!r) return;
    if (!r.text) {
      toast("Kein erkannter Text – die KI hat nichts zum Auswerten", 3000);
      return;
    }
    const ki = window.sdKi;
    if (!ki || !ki.baueAuswahl || !ki.schreibe) {
      toast("KI nicht verfügbar. Sie braucht beim ersten Mal eine Internetverbindung.", 4000);
      return;
    }
    const o = document.createElement("div");
    o.className = "sdki-overlay";
    o.innerHTML =
      '<div class="sdki-box" role="dialog" aria-modal="true">' +
      "<h2>Visitenkarte mit KI ausfüllen</h2>" +
      '<div data-wahl></div>' +
      '<p class="sdki-klein" data-privat></p>' +
      '<div class="sdki-fehler" data-fehler hidden style="color:#b3261e;font-size:.85rem"></div>' +
      '<div class="sdki-knoepfe"><button type="button" class="sdki-btn prim" data-los>Auswerten</button>' +
      '<button type="button" class="sdki-btn" data-zu>Abbrechen</button></div></div>';
    document.body.appendChild(o);
    ki.baueAuswahl(o.querySelector("[data-wahl]"), { geminiKeyFeld: true });
    const privat = o.querySelector("[data-privat]");
    const zeigePrivat = () => {
      privat.textContent = ki.anbieter() === "lotse"
        ? "SD Lotse arbeitet lokal – der Kartentext verlässt dein Gerät nicht."
        : "Der erkannte Kartentext wird zur Auswertung an den gewählten Online-Dienst gesendet.";
    };
    zeigePrivat();
    document.addEventListener("sd-ki-anbieter", zeigePrivat);
    const zu = () => {
      document.removeEventListener("sd-ki-anbieter", zeigePrivat);
      try { ki.lotseStopp(); } catch (e) {}
      o.remove();
    };
    o.querySelector("[data-zu]").addEventListener("click", zu);
    const los = o.querySelector("[data-los]");
    const fehler = o.querySelector("[data-fehler]");
    los.addEventListener("click", async () => {
      los.disabled = true;
      los.textContent = "Wird ausgewertet …";
      fehler.hidden = true;
      const prompt =
        "Hier ist der per automatischer Texterkennung (OCR) gelesene Text einer Visitenkarte. " +
        "Ordne die Angaben zu und antworte NUR mit einem JSON-Objekt (ohne Codeblock) mit genau diesen Schlüsseln: " +
        "name, title, company, phone, mobile, email, web, street, zip, city. " +
        "Fehlende Angaben als leerer String. Erfinde nichts; korrigiere nur offensichtliche Erkennungsfehler.\n\n---\n" +
        String(r.text).slice(0, 3000) + "\n---";
      try {
        const antwort = await ki.schreibe(prompt, { maxTokens: 500 });
        const data = parseJsonObject(antwort);
        if (!data) throw new Error("Die KI hat keine verwertbare Antwort geliefert. Bitte nochmal versuchen.");
        let changed = 0;
        CARD_FIELDS.forEach(([k]) => {
          const v = data[k] == null ? "" : String(data[k]).trim();
          if (v && v !== r.contact[k]) {
            r.contact[k] = v;
            changed++;
          }
        });
        fillCardForm(r.contact);
        await saveCard();
        ui.cardNote.textContent = changed
          ? `Die KI hat ${changed} Feld${changed === 1 ? "" : "er"} ausgefüllt oder verbessert – bitte prüfen.`
          : "Die KI hat nichts geändert.";
        zu();
      } catch (e) {
        fehler.textContent = (e && e.message) || String(e);
        fehler.hidden = false;
        los.disabled = false;
        los.textContent = "Auswerten";
      }
    });
  });

  function decodeImage(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => decodeViaImg(file));
    }
    return decodeViaImg(file);
  }

  function decodeViaImg(file) {
    const url = URL.createObjectURL(file);
    return loadImage(url).finally(() => setTimeout(() => URL.revokeObjectURL(url), 1000));
  }

  async function openNextImport() {
    while (state.importQueue.length) {
      const file = state.importQueue.shift();
      busy("Bild wird geladen");
      try {
        const img = await decodeImage(file);
        const iw = img.width || img.naturalWidth;
        const ih = img.height || img.naturalHeight;
        if (!iw || !ih) throw new Error("leer");
        const k = Math.min(1, 3000 / Math.max(iw, ih));
        const w = Math.max(1, Math.round(iw * k));
        const h = Math.max(1, Math.round(ih * k));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        if (img.close) img.close();
        const d = ctx.getImageData(0, 0, w, h);
        const found = detectFromRGBA(d.data, w, h, 420);
        busyHide();
        stopCamera();
        openReview({ rgba: d.data, w, h }, found || insetQuad(w, h, 0), null, !!found);
        const left = state.importQueue.length;
        toast(found ? "Blatt erkannt" + (left ? ` · noch ${left}` : "") : "Ganzes Bild übernommen, Ecken bei Bedarf ziehen" + (left ? ` · noch ${left}` : ""), 2600);
        return true;
      } catch (e) {
        busyHide();
        toast("Bild nicht lesbar: " + String(file.name || "").slice(0, 40), 3000);
      }
    }
    return false;
  }

  const pickImages = () => ui.fileInput.click();
  ui.importBtn.addEventListener("click", pickImages);
  ui.importBig.addEventListener("click", pickImages);
  ui.photoBig.addEventListener("click", () => ui.photoInput.click());

  const onFilesChosen = async (input) => {
    const files = Array.from(input.files || []).filter((f) => !f.type || f.type.startsWith("image/"));
    input.value = "";
    if (!files.length) {
      toast("Bitte Bilddateien wählen (JPG, PNG, WebP)");
      return;
    }
    if (state.mode === "code") {
      await decodeCodeFromFile(files[0]);
      return;
    }
    if (state.mode === "card" && files.length > 1) {
      toast("Visitenkarten bitte einzeln importieren – die erste wird geöffnet", 3000);
      files.length = 1;
    }
    state.importQueue.push.apply(state.importQueue, files);
    if (!state.editing) await openNextImport();
  };
  ui.fileInput.addEventListener("change", () => onFilesChosen(ui.fileInput));
  ui.photoInput.addEventListener("change", () => onFilesChosen(ui.photoInput));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCamera();
    else if (!ui.review.classList.contains("is-active") && !anySheetOpen()) startCamera();
  });
  window.addEventListener("pagehide", stopCamera);
  window.addEventListener("resize", () => {
    if (state.editing && state.view) layout();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  startNewDocState();
  initMode();
  renderCounts();
  startCamera();
  restore().then(() => {
    renderCounts();
    if (!ui.pagesSheet.hidden) {
      ui.docName.value = state.docName;
      renderGrid();
      updateSheetButtons();
    }
  });
})();
