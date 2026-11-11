"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),A=require(path.join(root,"mein-sd-hub/akademie-i18n.js")),D=require(path.join(root,"mein-sd-hub/data.js"));
test("Akademie-Bedienung und alle Katalogtexte sind in sieben Sprachen vollständig",()=>{
 assert.deepEqual(A.languages,["de","en","fa","ar","ur","uk","ti"]);
 const keys=Object.keys(A.dictionaries.de);
 for(const lang of A.languages){assert.deepEqual(Object.keys(A.dictionaries[lang]),keys);for(const key of keys)assert.ok(typeof A.dictionaries[lang][key]==="string"&&A.dictionaries[lang][key].trim(),lang+" "+key)}
 for(const c of D.academy)for(const value of [c.name,c.summary,c.stufe,c.bereich,...c.voraussetzungen])assert.ok(keys.includes(value),c.id+" "+value);
 for(const label of ["Prüfen","Nächste Frage","Lektion abschließen","← Alle Kurse","Teilnahmebestätigung","Lösung zeigen","Die Lerninhalte sind auf Deutsch."])assert.ok(keys.includes(label),label);
 assert.match(fs.readFileSync(path.join(root,"mein-sd-hub/akademie-i18n.js"),"utf8"),/Maschinell.*nicht von Muttersprachlern/);
});
test("Dynamische Bedienung übersetzt Vorlagen, lässt deutsche Lerninhalte unverändert",()=>{
 const previous=globalThis.SD_LANG;
 try{for(const lang of A.languages){globalThis.SD_LANG=lang;assert.equal(A.t("Prüfen"),A.dictionaries[lang]["Prüfen"]);assert.equal(A.t("Unveränderter deutscher Lerntext."),"Unveränderter deutscher Lerntext.");assert.ok(A.t("3 / 8 Lektionen").includes("3"));assert.ok(A.t("Nächste Lektion: Ein deutscher Titel →").includes("Ein deutscher Titel"))}}finally{globalThis.SD_LANG=previous}
});
