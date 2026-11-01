import {test,expect} from '@playwright/test';

test('Kids games portal shows ten real playable entries and filters',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/kids/games/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.game')).toHaveCount(10);
 await expect(page.locator('.game a[href*="play.html?game="]')).toHaveCount(8);
 await page.getByRole('button',{name:'3D',exact:true}).click();
 await expect(page.locator('.game')).toHaveCount(2);
 await page.getByRole('button',{name:'Minispiele'}).click();
 await expect(page.locator('.game')).toHaveCount(8);
 await page.getByRole('button',{name:'Alle',exact:true}).click();
 await expect(page.locator('.game')).toHaveCount(10);
 expect(errors).toEqual([]);
});

for(const name of ['obby','pet','garden','city','kart','treasure','fashion','learn']){
 test('Mini-game '+name+' launches, draws and uses local progress storage',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/kids/games/play.html?game='+name);
  await expect.poll(()=>page.evaluate(()=>window.__sdMiniReady?.id),{timeout:10000}).toBe(name);
  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#title')).not.toHaveText('🎮 SD Kids');
  const data=await page.evaluate(()=>localStorage.getItem('sd-kids-games-v1'));
  expect(data).toContain('"'+name+'"');
  if(name==='pet'){
   await page.getByRole('button',{name:'🍎 Füttern'}).click();
   await expect(page.locator('#message')).toContainText('Lecker');
  } else if(name==='garden'){
   const c=page.locator('canvas');const rect=await c.boundingBox();
   await c.click({position:{x:rect.width*239/800,y:rect.height*195/600}});
   await expect(page.locator('#message')).toContainText('Samen gepflanzt');
   await page.getByRole('button',{name:'💧 Gießen'}).click();
   await c.click({position:{x:rect.width*239/800,y:rect.height*195/600}});
   await page.getByRole('button',{name:'🧺 Ernten'}).click();
   await c.click({position:{x:rect.width*239/800,y:rect.height*195/600}});
   await expect(page.locator('#score')).toContainText('5 Spielsterne');
  } else if(name==='city'){
   await page.getByRole('button',{name:/Feuerwehr/}).click();
   await page.getByRole('button',{name:/Alarm annehmen/}).click();
   await expect(page.locator('#message')).toContainText('Aufgabe erledigt');
  } else if(name==='fashion'){
   await page.getByRole('button',{name:/Auf den Laufsteg/}).click();
   await expect(page.locator('#score')).toContainText('8 Spielsterne');
  } else if(name==='learn'){
   await page.getByRole('button',{name:'1. klein'}).click();
   await expect(page.locator('#score')).toContainText('4 Spielsterne');
   await expect(page.locator('#progress')).toContainText('Aufgabe 2');
  } else if(name==='treasure'){
   await page.keyboard.press('ArrowRight');
   await expect(page.locator('#message')).toContainText('Insel erkundet');
  } else if(name==='obby'){
   await expect(page.locator('#progress')).toContainText('Level 1');
   await page.locator('#jump').click();
   await expect(page.locator('#stage')).toBeVisible();
  } else if(name==='kart'){
   await page.keyboard.down('ArrowUp');await page.waitForTimeout(150);await page.keyboard.up('ArrowUp');
   await expect(page.locator('#stage')).toBeVisible();
  }
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.__sdMiniReady?.id)).toBe(name);
  expect(errors).toEqual([]);
 });
}

test('Kids minis share only their own local virtual stars',async({page})=>{
 await page.goto('/kids/games/play.html?game=fashion');
 await page.getByRole('button',{name:/Auf den Laufsteg/}).click();
 await expect(page.locator('#score')).toContainText('8 Spielsterne');
 await page.goto('/kids/games/play.html?game=learn');
 await expect(page.locator('#score')).toContainText('8 Spielsterne');
 await page.getByRole('button',{name:'1. klein'}).click();
 await page.goto('/kids/games/play.html?game=fashion');
 await expect(page.locator('#score')).toContainText('12 Spielsterne');
});


test('Professional games portal: search, favorites, sorting, achievements and backup',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/kids/games/');
 await expect(page.locator('.game')).toHaveCount(10);
 await page.locator('#gameSearch').fill('garden');
 await expect(page.locator('.game')).toHaveCount(1);
 await expect(page.locator('.game h3')).toHaveText('SD Garden World');
 await page.locator('.favorite').click();
 await expect(page.locator('.favorite')).toHaveAttribute('aria-pressed','true');
 await page.locator('#gameSearch').fill('');
 await page.getByRole('button',{name:'♡ Favoriten'}).click();
 await expect(page.locator('.game')).toHaveCount(1);
 await expect(page.locator('.game h3')).toHaveText('SD Garden World');
 await page.getByRole('button',{name:'Alle',exact:true}).click();
 await page.locator('#sortGames').selectOption('favorite');
 await expect(page.locator('.game').first().locator('h3')).toHaveText('SD Garden World');
 await expect(page.locator('.achievement')).toHaveCount(8);
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportSave').click()]);
 expect(download.suggestedFilename()).toBe('sd-kids-spielstand.json');
 await page.evaluate(()=>{window.confirm=()=>true});
 const backup=await page.evaluate(async()=>{
  const settings=localStorage.getItem('sd-kids-ui-v1');
  const games=localStorage.getItem('sd-kids-games-v1');
  return JSON.stringify({format:'sd-kids-games-backup',version:1,
   settings:JSON.parse(settings),games:games?JSON.parse(games):{games:{}}});
 });
 await page.locator('#backupFile').setInputFiles({
  name:'sd-kids-spielstand.json',mimeType:'application/json',buffer:Buffer.from(backup)
 });
 await expect(page.locator('#backupStatus')).toContainText('geladen');
 expect(errors).toEqual([]);
});

test('Mini-games support pause, reduced motion and persisted sound preferences',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/kids/games/play.html?game=obby');
 await expect.poll(()=>page.evaluate(()=>window.__sdMiniReady?.version)).toBe(2);
 await page.locator('#pause').click();
 await expect(page.locator('#pauseShade')).toBeVisible();
 await expect(page.locator('#pause')).toHaveAttribute('aria-pressed','true');
 await page.locator('#resume').click();
 await expect(page.locator('#pauseShade')).toBeHidden();
 await page.locator('#motion').click();
 await expect(page.locator('#motion')).toHaveAttribute('aria-pressed','true');
 await page.locator('#sound').click();
 await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
 await page.reload();
 await expect(page.locator('#motion')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#saveIndicator')).toContainText('gespeichert');
 expect(errors).toEqual([]);
});

test('The eight SD Kids mini-games remain playable offline after first installation',async({page,context})=>{
 await page.goto('/kids/games/');
 await expect(page.locator('.game')).toHaveCount(10);
 await page.waitForFunction(async()=>{
  if(!('serviceWorker' in navigator))return false;
  const reg=await navigator.serviceWorker.ready;
  return Boolean(reg.active&&navigator.serviceWorker.controller);
 },undefined,{timeout:25000});
 await context.setOffline(true);
 try{
  await page.goto('/kids/games/play.html?game=pet',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__sdMiniReady?.id),{timeout:10000}).toBe('pet');
  await page.getByRole('button',{name:'🍎 Füttern'}).click();
  await expect(page.locator('#message')).toContainText('Lecker');
 }finally{await context.setOffline(false)}
});
