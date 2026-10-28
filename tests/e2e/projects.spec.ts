import {test,expect} from '@playwright/test';
test('project navigation offers learning, assistance and the private catalogue',async({page})=>{
  await page.goto('/projekte');
  await expect(page.getByRole('heading',{name:'Deine Projekte.'})).toBeVisible();
  await expect(page.locator('a[href="/assistenz"]')).toHaveCount(1);
  await expect(page.locator('.project-hub__project')).toHaveCount(3);
  await expect(page.getByRole('link',{name:'Komponentenliste',exact:true})).toHaveAttribute('href','/assistenz/components');
  await page.getByRole('link',{name:'WerkTag SHK Lernbuddy',exact:true}).click();
  await expect(page.getByRole('link',{name:'Projekte',exact:true})).toBeVisible();
});
test('catalogue card opens its independent destination and returns to projects',async({page})=>{
  await page.route('**/assistenz/components',route=>route.fulfill({contentType:'text/html',body:'<h1>Komponentenliste</h1><a href="/projekte">Projekte</a>'}));
  await page.goto('/projekte');
  await page.getByRole('link',{name:'Komponentenliste',exact:true}).click();
  await expect(page).toHaveURL(/\/assistenz\/components$/);
  await expect(page.getByRole('heading',{name:'Komponentenliste'})).toBeVisible();
  await page.getByRole('link',{name:'Projekte',exact:true}).click();
  await expect(page.locator('.project-hub__project')).toHaveCount(3);
});
for (const width of [320, 390, 768, 1024, 1440]) test(`project selection fits ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/projekte');
  await expect(page.getByRole('heading',{name:'Deine Projekte.'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await expect(page.getByRole('link',{name:'Komponentenliste',exact:true})).toBeVisible();
});
