/* SD Code-Studio – JPEG XL + kompatible Bild-Fallbacks.
 * Reines Hilfsmodul: keine Uploads, keine Projekt-/Speicheränderungen. */
(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document) root.SDImageAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const MIME = Object.freeze({
    jxl: 'image/jxl', avif: 'image/avif', webp: 'image/webp',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png'
  });
  function fail(message) { throw new Error(message); }
  function fileName(value, allowed) {
    const name = typeof value === 'string' ? value : value && value.name;
    if (typeof name !== 'string' || !name || name.length > 180 ||
        /[/\\?#\u0000-\u001f\u007f]/.test(name) || name === '.' || name === '..')
      fail('Bitte eine gültige lokale Bilddatei auswählen.');
    const ext = name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) fail('Nicht unterstütztes Bildformat: ' + name);
    return { name, ext };
  }
  function folderParts(value) {
    let dir = value == null ? 'assets' : String(value).trim().replace(/\\/g, '/');
    if (dir.startsWith('./')) dir = dir.slice(2);
    if (/^(\/|[a-z][a-z0-9+.-]*:)/i.test(dir) || /[?#\u0000-\u001f\u007f]/.test(dir))
      fail('Der Bildordner muss ein relativer Projektpfad sein.');
    dir = dir.replace(/\/$/, '');
    if (dir.length > 160 || (dir && dir.split('/').some(x => !x || x === '.' || x === '..')))
      fail('Ungültiger Bildordner. Verwende z. B. assets/bilder.');
    return dir ? dir.split('/') : [];
  }
  function imagePath(folder, value, allowed) {
    const f = fileName(value, allowed);
    return [...folderParts(folder), f.name].map(encodeURIComponent).join('/');
  }
  function escapeAttribute(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
  }
  function picture(options) {
    if (!options || typeof options !== 'object') fail('Bildoptionen fehlen.');
    const xl = imagePath(options.folder, options.jxl, ['jxl']);
    const fallback = imagePath(options.folder, options.fallback, ['jpg', 'jpeg', 'png']);
    const alt = typeof options.alt === 'string' ? options.alt.trim() : '';
    if (!alt || alt.length > 300) fail('Bitte einen kurzen Alternativtext für das Bild eingeben.');
    const lines = ['<picture>', '  <source srcset="' + escapeAttribute(xl) + '" type="image/jxl">'];
    if (options.modern) {
      const modern = fileName(options.modern, ['webp', 'avif']);
      const path = imagePath(options.folder, modern.name, ['webp', 'avif']);
      lines.push('  <source srcset="' + escapeAttribute(path) + '" type="' + MIME[modern.ext] + '">');
    }
    lines.push('  <img src="' + escapeAttribute(fallback) + '" alt="' +
      escapeAttribute(alt) + '" loading="lazy" decoding="async">');
    lines.push('</picture>');
    return lines.join('\n');
  }
  return Object.freeze({ MIME, fileName, imagePath, escapeAttribute, picture });
});