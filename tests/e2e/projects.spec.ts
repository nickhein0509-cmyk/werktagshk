import {test,expect} from '@playwright/test';
test('project navigation keeps learning and personal assistance separate',async({page})=>{
  await page.goto('/projekte');
  await expect(page.getByRole('heading',{name:'Deine Projekte.'})).toBeVisible();
  await expect(page.locator('a[href="/assistenz"]')).toHaveCount(1);
  await expect(page.locator('.project-hub__project')).toHaveCount(2);
  await page.getByRole('link',{name:'WerkTag SHK Lernbuddy',exact:true}).click();
  await expect(page.getByRole('link',{name:'Projekte',exact:true})).toBeVisible();
});
test('project selection fits a narrow phone',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto('/projekte');
  await expect(page.getByRole('heading',{name:'Deine Projekte.'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
