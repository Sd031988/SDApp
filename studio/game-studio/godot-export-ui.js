/* Offline Godot export interface. No remote requests, no writes to SD projects. */
(function () {
  'use strict';
  const Core = window.SDGameCore;
  const Project = window.SDGameProject;
  const Exporter = window.SDGameGodotExport;
  const $ = id => document.getElementById(id);
  const chosen = $('file');
  let scene = null;
  const message = (text, error) => {
    $('status').textContent = text;
    $('status').dataset.kind = error ? 'error' : 'info';
  };
  function render(data) {
    scene = data;
    $('details').hidden = false;
    $('download').disabled = false;
    $('sceneTitle').textContent = data.name;
    $('sceneObjects').textContent = String(data.objects.length);
    $('sceneTerrain').textContent = data.ground === 'sand' ? 'Wüste' : data.ground === 'snow' ? 'Schnee' : 'Wiese';
    $('sceneModels').textContent = String(data.version === 2 ? data.assets.length : 0);
    $('sceneVersion').textContent = 'Projektversion ' + data.version;
    message('Szene überprüft. Jetzt kann ein Godot-4-Projekt exportiert werden.', false);
  }
  $('fileButton').addEventListener('click', () => chosen.click());
  chosen.addEventListener('change', async () => {
    const file = chosen.files && chosen.files[0];
    chosen.value = '';
    if (!file) return;
    scene = null;
    $('details').hidden = true;
    $('download').disabled = true;
    if (file.size > 12000000) {
      message('Datei zu groß (maximal 12 MB).', true);
      return;
    }
    try {
      message('Szene wird geprüft …', false);
      render(Project.parse(await file.text()));
    } catch(error) {
      message('Import fehlgeschlagen: ' + error.message, true);
    }
  });
  $('demo').addEventListener('click', () => render(Core.fresh()));
  $('download').addEventListener('click', () => {
    if (!scene) return;
    const button = $('download');
    button.disabled = true;
    try {
      const archive = Exporter.build(scene);
      const blob = new Blob([archive.bytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SD-Game-Studio-Godot4.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      message('Godot-ZIP erstellt: ' + archive.objects + ' Objekte, ' + archive.models + ' Modelle. Entpacke das ZIP und importiere project.godot in Godot 4.', false);
    } catch(error) {
      message('Export fehlgeschlagen: ' + error.message, true);
    } finally {
      button.disabled = false;
    }
  });
  document.body.dataset.ready = 'true';
})();
