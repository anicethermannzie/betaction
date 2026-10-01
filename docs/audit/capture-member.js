async page => {
  const results = [];
  for (const [name,route] of [['dashboard','/'],['profile','/profile'],['member-matches','/matches'],['member-picks','/picks']]) {
    await page.goto('http://localhost:3000'+route);
    await page.waitForTimeout(14000);
    for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
      await page.setViewportSize({width,height});
      await page.screenshot({path:`docs/audit/screenshots/${name}-${size}.png`,fullPage:true,mask:[page.locator('p').filter({hasText:/^[^\s@]+@[^\s@]+\.[^\s@]+$/})]});
      results.push({name,size,...await page.evaluate(()=>({url:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,text:document.body.innerText.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[email redacted]'),links:[...document.querySelectorAll('main a[href]')].map(e=>({text:e.textContent,href:e.getAttribute('href')}))}))});
    }
  }
  return results;
}
