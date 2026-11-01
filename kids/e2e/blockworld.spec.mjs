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
