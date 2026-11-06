const assert=require('node:assert/strict');
const core=require('../../studio/ki-werkstatt-core.js');
const cases=[
 ['app.js','const text = `\n\x60\x60\x60\ninside\n\x60\x60\x60\n`;\n','`'.repeat(4)],
 ['style.css','body { color: red; }\n','`'.repeat(3)],
 ['app.js','const x = 1;\n','~'.repeat(3)]
];
for(const [path,content,fence] of cases){
 const parsed=core.parse('### Datei: '+path+'\n'+fence+'\n'+content+fence+'\n',path,{});
 assert.deepEqual(parsed.errors,[]);
 assert.equal(parsed.files.length,1);
 assert.equal(parsed.files[0].path,path);
 assert.equal(parsed.files[0].content,content);
}
console.log('3 fence round-trip cases passed');
