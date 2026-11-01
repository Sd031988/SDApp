// SD Hub Kids official first-party game catalog. Do not label a concept "playable".
export const catalog = Object.freeze([
 {id:'pibo',name:'Pibo 3D',emoji:'🐱',genre:'Haustier',tag:'3D',href:'../index.html',description:'Pflege Pibo, gestalte seine Zimmer und spiele mit ihm.',accent:'#efb88b',ready:true},
 {id:'blockworld',name:'SD BlockWorld',emoji:'🧱',genre:'Kreativwelt',tag:'3D + Online',href:'../blockworld/',description:'Baue deine eigene Welt, sammle Kristalle und spiele optional gemeinsam.',accent:'#71bef0',ready:true},
 {id:'obby',name:'SD Obby Tower',emoji:'🏁',genre:'Jump & Run',tag:'2D Mini',href:'./play.html?game=obby',description:'Springe durch drei Level, nutze Checkpoints und erreiche das Ziel.',accent:'#aa92ed',ready:true},
 {id:'pet',name:'SD Pet Island',emoji:'🐶',genre:'Haustier',tag:'2D Mini',href:'./play.html?game=pet',description:'Pflege deine Insel-Tiere und sammle Herzen.',accent:'#f9ba82',ready:true},
 {id:'garden',name:'SD Garden World',emoji:'🌻',genre:'Garten',tag:'2D Mini',href:'./play.html?game=garden',description:'Säe, gieße und ernte deinen eigenen kleinen Garten.',accent:'#6cdaa3',ready:true},
 {id:'city',name:'SD City Life',emoji:'🏙️',genre:'Rollenspiel',tag:'2D Mini',href:'./play.html?game=city',description:'Hilf als Feuerwehr, Ärztin, Lieferdienst oder Lehrkraft.',accent:'#77b9f5',ready:true},
 {id:'kart',name:'SD Kart Rush',emoji:'🏎️',genre:'Rennen',tag:'2D Mini',href:'./play.html?game=kart',description:'Fahre mit deinem Kart durch Checkpoints und schaffe Runden.',accent:'#f9a66d',ready:true},
 {id:'treasure',name:'SD Treasure Quest',emoji:'🏝️',genre:'Abenteuer',tag:'2D Mini',href:'./play.html?game=treasure',description:'Erkunde eine Schatzinsel, sammle Schlüssel und öffne Truhen.',accent:'#e8cd76',ready:true},
 {id:'fashion',name:'SD Fashion Studio',emoji:'👗',genre:'Gestalten',tag:'2D Mini',href:'./play.html?game=fashion',description:'Kombiniere Outfits und zeige deinen Stil auf dem Laufsteg.',accent:'#ef9ccf',ready:true},
 {id:'learn',name:'SD Lern-Abenteuer',emoji:'🧩',genre:'Lernen',tag:'2D Mini',href:'./play.html?game=learn',description:'Löse Deutsch-, Rechen- und Logikrätsel für Sterne.',accent:'#97b0fb',ready:true},
]);
export const miniIds=Object.freeze(catalog.filter(item=>item.id!=='pibo'&&item.id!=='blockworld').map(item=>item.id));
export function findGame(id){return catalog.find(item=>item.id===id)||null}
export const categories=Object.freeze(['Alle','3D','Haustier','Kreativwelt','Jump & Run','Garten','Rollenspiel','Rennen','Abenteuer','Gestalten','Lernen']);
