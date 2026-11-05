#!/usr/bin/env node
/* Explicit game-creator regression suite entrypoint.
 * Run from repository root: node studio/game-studio/engine/test-game-creator.cjs
 * Node 22+; no npm install, network, browser or persistent writes.
 */
'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const root = __dirname;
const files = [
  'game-creator-blueprint.test.cjs',
  'game-creator-preview.test.cjs',
  'game-creator-handoff.test.cjs',
  'game-creator-editor-compat.test.cjs',
  'game-creator-transaction.test.cjs',
  'game-quality-gates.test.cjs'
];
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile())
    throw new Error('Missing required creator test: ' + file);
}
const result = spawnSync(process.execPath, ['--test', ...files.map(file => path.join(root, file))], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
  timeout: 120000
});
if (result.error) throw result.error;
process.exitCode = result.status === null ? 1 : result.status;
