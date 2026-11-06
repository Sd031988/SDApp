/* SD Engine: deterministic, data-only game-creator blueprint. No runtime/editor mutations. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SDGameCreatorBlueprint = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_DESCRIPTION = 2000;
  const MAX_OBJECTS = 256;
  const TYPES = Object.freeze(['terrain', 'building', 'road', 'vegetation', 'vehicle', 'character', 'enemy']);
  const RULES = [
    { type: 'building', words: /\b(?:building|buildings|house|houses|city|town|stadt|haus|häuser|gebäude)\b/i, count: 12 },
    { type: 'road', words: /\b(?:road|roads|street|streets|straße|straßen|verkehr)\b/i, count: 8 },
    { type: 'vegetation', words: /\b(?:forest|trees|jungle|wald|bäume|palmen|vegetation)\b/i, count: 24 },
    { type: 'vehicle', words: /\b(?:car|cars|vehicle|vehicles|auto|autos|fahrzeuge|fahrzeug)\b/i, count: 4 },
    { type: 'enemy', words: /\b(?:enemy|enemies|gegner|feinde|bots)\b/i, count: 8 },
    { type: 'character', words: /\b(?:player|character|spieler|charakter|figur)\b/i, count: 1 }
  ];
  function compile(description, options) {
    if (typeof description !== 'string' || !description.trim() || description.length > MAX_DESCRIPTION)
      throw new RangeError('Description must contain 1–2000 characters');
    if (options != null && (typeof options !== 'object' || Array.isArray(options)))
      throw new TypeError('Options must be an object');
    const width = options && options.worldSize != null ? options.worldSize : 640;
    if (!Number.isInteger(width) || width < 64 || width > 4096)
      throw new RangeError('worldSize must be an integer between 64 and 4096');
    const objects = [{ id: 'terrain-001', type: 'terrain', asset: null, position: [0, 0, 0] }];
    const requests = [];
    for (const rule of RULES) {
      if (!rule.words.test(description)) continue;
      requests.push({ type: rule.type, count: rule.count, status: 'asset-required' });
      for (let i = 0; i < rule.count && objects.length < MAX_OBJECTS; i++) {
        // Explicit placeholders: no fake GLB files or fabricated playable assets.
        objects.push({ id: rule.type + '-' + String(i + 1).padStart(3, '0'),
          type: rule.type, asset: null, position: null });
      }
    }
    return {
      schema: 'sd-game-creator-blueprint/v1',
      description: description.trim(),
      world: { width, depth: width, units: 'meters' },
      objects,
      assetRequests: requests,
      state: 'planning-only',
      warnings: ['No 3D assets have been generated or loaded.', 'Review and assign licensed GLB assets before scene import.']
    };
  }
  function validate(blueprint) {
    if (!blueprint || blueprint.schema !== 'sd-game-creator-blueprint/v1' ||
        !Array.isArray(blueprint.objects) || blueprint.objects.length > MAX_OBJECTS)
      return false;
    const ids = new Set();
    return blueprint.objects.every(o => o && typeof o.id === 'string' &&
      /^[a-z]+-[0-9]{3}$/.test(o.id) && !ids.has(o.id) &&
      (ids.add(o.id), TYPES.includes(o.type)) &&
      (o.asset === null || (typeof o.asset === 'string' &&
        /^[a-zA-Z0-9_./-]+\.glb$/.test(o.asset) &&
        !o.asset.startsWith('/') && !o.asset.split('/').includes('..'))) &&
      (o.position === null || (Array.isArray(o.position) && o.position.length === 3 &&
        o.position.every(Number.isFinite))));
  }
  return Object.freeze({ compile, validate, TYPES });
});
