const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'game-creator-preview.html'),'utf8');
test('preview is opt-in and loads the isolated blueprint compiler',()=>{
 assert.match(html,/src="\.\/game-creator-blueprint\.js"/);
 assert.match(html,/SDGameCreatorBlueprint\.compile\(input\.value\)/);
 assert.match(html,/SDGameCreatorBlueprint\.validate\(next\)/);
});
test('preview does not load playable engine or mutate persistent storage',()=>{
 assert.doesNotMatch(html,/<script[^>]+src="[^"]*(?:sd-engine|havok|babylon)/i);
 assert.doesNotMatch(html,/\b(?:localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest)\b/);
});
test('JSON export is explicitly user-triggered and starts disabled',()=>{
 assert.match(html,/id="exportieren"[^>]*disabled/);
 assert.match(html,/exportButton\.addEventListener\('click'/);
 assert.match(html,/URL\.revokeObjectURL/);
});
