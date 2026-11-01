import {test,expect} from '@playwright/test';
test('Pibo loads real WebGL scene, cares for cat, and grants one gift per day',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/kids/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#fallback')).toHaveCount(0,{timeout:30000});
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.locator('[data-room="kitchen"]').click();
  await expect(page.locator('#roomTitle')).toContainText('Küche');
  await page.locator('[data-food="2"]').click();
  await expect(page.locator('[data-food="2"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-act="feed"]').click();
  await expect(page.locator('#careStatus')).toBeVisible();
  await page.locator('[data-pibo-tab="extras"]').click();
  await page.locator('#surprise').click();
  const stars=await page.locator('#starsCount').innerText();
  await page.locator('#surprise').click();
  await expect(page.locator('#starsCount')).toHaveText(stars);
  await expect(page.locator('#say')).toContainText('morgen');
  await page.locator('[data-room="living"]').click();
  await page.locator('[data-pibo-tab="style"]').click();
  await page.locator('#outfit').click();
  await page.locator('[data-outfit="10"]').click();
  await expect(page.locator('#say')).toContainText('Super-Pibo');
  await page.locator('[data-pibo-tab="games"]').click();
  await page.locator('#minigame').click();
  await expect(page.locator('#gameHud')).toBeVisible();
  await page.locator('#minigame').click();
  await expect(page.locator('#gameHud')).toBeHidden();
  await page.reload();
  await expect(page.locator('#fallback')).toHaveCount(0,{timeout:30000});
  await expect(page.locator('#starsCount')).toHaveText(stars);
  expect(errors).toEqual([]);
});

test('Pibo cat remains visible above care controls on desktop and small phones',async({page,isMobile})=>{
  await page.goto('/kids/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage canvas')).toBeVisible({timeout:30000});
  await expect(page.locator('#piboActionTabs [data-pibo-tab="care"]')).toHaveAttribute('aria-pressed','true');
  const width=isMobile?390:1280;
  await page.setViewportSize({width,height:844});
  await page.locator('[data-act="feed"]').click();
  await expect(page.locator('#roomTitle')).toContainText('Küche');
  const before=await page.evaluate(()=>{
    const stage=document.querySelector('#stage').getBoundingClientRect();
    const feed=document.querySelector('[data-act="feed"]').getBoundingClientRect();
    return {stageBottom:stage.bottom,stageTop:stage.top,feedTop:feed.top,screen:innerWidth,
      doc:document.documentElement.scrollWidth,canvas:!!document.querySelector('#stage canvas')};
  });
  expect(before.canvas).toBe(true);
  expect(before.doc).toBeLessThanOrEqual(width+3);
  await page.locator('[data-act="wash"]').click();
  await expect(page.locator('#roomTitle')).toContainText('Badezimmer');
  if(isMobile){
    const box=await page.locator('#stage').boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(-4);
    expect(box.y+box.height).toBeLessThanOrEqual(844);
  }
  await page.locator('[data-pibo-tab="extras"]').click();
  await expect(page.locator('#catVoice')).toBeVisible();
  await page.locator('#catVoice').click();
  await expect(page.locator('#say')).toContainText('echte Katze');
  await page.locator('[data-pibo-tab="games"]').click();
  await expect(page.locator('#minigame')).toBeVisible();
  await expect(page.locator('#scrub')).toBeHidden();
  await page.locator('[data-pibo-tab="care"]').click();
  await expect(page.locator('#scrub')).toBeVisible();
  await expect(page.locator('#minigame')).toBeHidden();
});


test('Pibo interactive hands-on care: food-to-mouth, soap/rinse/dry, toilet and bedroom light',async({page,isMobile})=>{
  await page.goto('/kids/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage canvas')).toBeVisible({timeout:30000});
  await page.setViewportSize({width:isMobile?390:1280,height:844});
  await page.locator('[data-room="kitchen"]').click();
  await expect(page.locator('#foodShelf')).toBeVisible();
  // Disable native HTML drag only in this test to explicitly exercise the
  // custom touch-like pointer interaction that is also used by mobile devices.
  await page.evaluate(()=>document.querySelectorAll('[data-food]').forEach(b=>b.draggable=false));
  const source=await page.locator('[data-food="0"]').boundingBox();
  const destination=await page.evaluate(()=>{
    const r=document.querySelector('#stage').getBoundingClientRect();
    return {x:r.left+r.width*.5,y:r.top+r.height*.43};
  });
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
  await page.mouse.down();
  await page.mouse.move(destination.x,destination.y,{steps:18});
  await expect(page.locator('#piboMouthTarget')).toBeVisible();
  await page.mouse.up();
  await expect(page.locator('#piboMouthTarget')).toBeHidden();
  await expect(page.locator('#say')).toContainText('Lieblingsessen');
  await expect(page.locator('#sceneEffect')).toContainText('Direkt in Pibos Mund');
  await expect(page.locator('#careStatus')).toBeVisible();

  await page.locator('[data-act="wash"]').click();
  for(let n=0;n<3;n++)await page.locator('#scrub').click();
  await expect(page.locator('#careLabel')).toContainText('abspülen');
  await page.locator('#rinse').click();
  await expect(page.locator('#say')).toContainText('Seife ist weg');
  await page.locator('#dry').click();
  await expect(page.locator('#say')).toContainText('Alles trocken');

  await page.locator('#potty').click();
  await expect(page.locator('#roomTitle')).toContainText('Toilette');
  await page.waitForTimeout(2200);
  await page.locator('#flush').click();
  await expect(page.locator('#say')).toContainText('gespült');
  await page.locator('[data-act="sleep"]').click();
  await expect(page.locator('#roomTitle')).toContainText('Schlafzimmer');
  await expect(page.locator('#sleepStars')).toBeVisible();
  await page.locator('#lamp').click();
  await expect(page.locator('#sleepStars')).toBeHidden();
  await expect(page.locator('#say')).toContainText('Guten Morgen');
  const docWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(docWidth).toBeLessThanOrEqual((isMobile?390:1280)+3);
});


test('Pibo original garden is a playable sixth 3D room on PC and phone',async({page,isMobile})=>{
 const width=isMobile?390:1280;
 await page.setViewportSize({width,height:844});
 await page.goto('/kids/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#stage canvas')).toBeVisible({timeout:30000});
 await page.locator('[data-room="garden"]').click();
 await expect(page.locator('#roomTitle')).toContainText('Garten');
 await expect(page.locator('#say')).toContainText('Schmetterlinge');
 await page.locator('[data-pibo-tab="games"]').click();
 await expect(page.locator('#gardenPlay')).toBeVisible();
 await page.locator('#gardenPlay').click();
 await expect(page.locator('#sceneEffect')).toContainText('Garten');
 const widthActual=await page.evaluate(()=>document.documentElement.scrollWidth);
 expect(widthActual).toBeLessThanOrEqual(width+3);
 // Tap in open 3D scene: should never crash or navigate away.
 const b=await page.locator('#stage canvas').boundingBox();
 await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
 await expect(page.locator('#stage canvas')).toBeVisible();
 await page.locator('[data-room="living"]').click();
 await expect(page.locator('#roomTitle')).toContainText('Wohnzimmer');
 await page.locator('[data-room="garden"]').click();
 await expect(page.locator('#roomTitle')).toContainText('Garten');
});
