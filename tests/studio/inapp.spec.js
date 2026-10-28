const {test,expect}=require('@playwright/test');
const instagram='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 389.0.0.29.84';
const threads='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 389.0.0.29.84';
for(const [name,ua,scheme] of [['instagram',instagram,'instagram://extbrowser/'],['threads',threads,'barcelona://extbrowser/']]){
 test(`${name} in-app browser shows the light landing, enters on tap and offers the external browser`,async({browser})=>{
  const context=await browser.newContext({userAgent:ua,viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();const tried=[];page.on('request',r=>{if(!r.url().startsWith('http'))tried.push(r.url());});
  await page.goto('/');
  // 앱 안에서도 랜딩(휴대폰 입구)부터 보이고, 노트북·휴대폰 iframe 두 개는 띄우지 않는다
  await expect(page).toHaveURL(new RegExp(`entrance=closed&inapp=${name}`));
  await expect(page.locator('#entrance')).toBeVisible();
  expect(await page.locator('iframe').count()).toBe(0);
  const bar=page.locator('.inapp-bar');await expect(bar).toBeVisible();
  await bar.getByRole('button',{name:/Safari로 전체 보기/}).click();
  await expect(bar.locator('.inapp-help')).toBeVisible();
  expect(tried.some(url=>url.startsWith(scheme))).toBe(true);
  await bar.getByRole('button',{name:'닫기'}).click();await expect(bar).toHaveCount(0);
  // 휴대폰을 눌러야 작업실로 들어간다(자동으로 넘기지 않음)
  await page.locator('#entrance[data-ready="true"]').waitFor();await page.locator('#enter').click();
  await expect(page.locator('#entrance')).toBeHidden();await expect(page.locator('#phone-home')).toBeVisible();
  await context.close();
 });
}
test('ordinary browsers keep the device entrance',async({page})=>{
 await page.goto('/');await expect(page).toHaveURL(/device-unlock\.html/);
 await expect(page.locator('.inapp-bar')).toHaveCount(0);
});
