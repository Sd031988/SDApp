import {test,expect} from '@playwright/test';

test('BlockWorld starts, builds, customizes and persists across reloads',async({page})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/kids/blockworld/',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__blockWorldReady||false),{timeout:30000}).toBe(true);
 await expect(page.locator('#blockCanvas')).toBeVisible();
 await expect(page.locator('#tokens')).toHaveText('0');
 await page.locator('[data-travel="build"]').click();
 await expect(page.locator('#buildControls')).toBeVisible();
 await page.locator('[data-color="pink"]').click();
 await page.locator('#place').click();
 await expect(page.locator('#builds')).toHaveText('1');
 await page.locator('#nickname').fill('Alex');
 await page.locator('#nickname').press('Tab');
 await page.locator('[data-outfit="mint"]').click();
 await page.locator('#save').click();
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>window.__blockWorldReady||false),{timeout:30000}).toBe(true);
 await expect(page.locator('#builds')).toHaveText('1');
 await expect(page.locator('#nickname')).toHaveValue('Alex');
 await expect(page.locator('[data-outfit="mint"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-travel="village"]').click();
 await page.keyboard.down('w');await page.waitForTimeout(250);await page.keyboard.up('w');
 await expect(page.locator('#blockCanvas')).toBeVisible();
 expect(errors).toEqual([]);
});

test('BlockWorld supports jump, builder level, removal and responsive layout',async({page,isMobile})=>{
 await page.goto('/kids/blockworld/',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__blockWorldReady||false),{timeout:30000}).toBe(true);
 await page.locator('[data-travel="build"]').click();
 await page.locator('#up').click();
 await expect(page.locator('#level')).toHaveText('2');
 await page.locator('#place').click();
 await expect(page.locator('#builds')).toHaveText('1');
 await page.locator('#jump').click();
 await page.locator('#eraseMode').click();
 await expect(page.locator('#eraseMode')).toHaveAttribute('aria-pressed','true');
 await page.locator('#mode').click();
 await expect(page.locator('#buildControls')).toBeHidden();
 await expect(page.locator('.pad button')).toHaveCount(4);
 await expect(page.locator('#world')).toBeVisible();
});

test('optional shared Render room displays peer avatars and shared blocks without chat',async({page})=>{
 const requests=[];
 await page.route('https://sd-maschinen-kenner.onrender.com/hub/blockworld/**',async route=>{
  const method=route.request().url().split('/').pop();
  requests.push(method);
  const payload=method==='join'?{
   ok:true,token:'test-token',id:'1122334455667788',room:'dorf',
   players:[{id:'aabbccddeeff0011',x:6,z:4,y:0,heading:0,color:'pink'}],
   blocks:[{x:10,z:6,level:0,color:'yellow'}]
  }:method==='sync'?{
   ok:true,players:[{id:'aabbccddeeff0011',x:5,z:4,y:0,heading:0,color:'pink'}],
   blocks:[{x:10,z:6,level:0,color:'yellow'}]
  }:{ok:true};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 });
 await page.goto('/kids/blockworld/',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__blockWorldReady||false),{timeout:30000}).toBe(true);
 await expect(page.locator('#onlineLeave')).toBeDisabled();
 await page.locator('#onlineRoom').selectOption('dorf');
 await page.locator('#onlineJoin').click();
 await expect(page.locator('#onlineLeave')).toBeEnabled();
 await expect(page.locator('#onlinePlayers')).toHaveText('1');
 await expect.poll(()=>page.evaluate(()=>window.__blockWorldOnlineVisible?.blocks),{timeout:10000}).toBe(1);
 await expect(page.locator('#onlineStatus')).toContainText('Verbunden');
 await page.locator('#onlineLeave').click();
 await expect(page.locator('#onlinePlayers')).toHaveText('0');
 await expect(page.locator('#onlineLeave')).toBeDisabled();
 expect(requests).toContain('join');
});
