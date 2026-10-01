async page => {
  const results = [];
  const routes = [['landing','/'], ['matches','/matches'], ['predictions','/predictions'], ['picks','/picks'], ['login','/login'], ['register','/register'], ['league','/leagues/39'], ['billing-cancel','/billing/cancel'], ['billing-success','/billing/success'], ['not-found','/audit-page-not-found'], ['profile-guard','/profile']];
  for (const [name, route] of routes) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:3000' + route);
    await page.waitForTimeout(14000);
    for (const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
      await page.setViewportSize({width,height});
      await page.screenshot({path:`docs/audit/screenshots/${name}-${size}.png`,fullPage:true});
      const details = await page.evaluate(() => ({
        url: location.pathname + location.search,
        title: document.title,
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        text: document.body.innerText,
        headings: [...document.querySelectorAll('h1,h2,h3')].map(e=>({tag:e.tagName,text:e.textContent})),
        unnamedButtons: [...document.querySelectorAll('button')].filter(e=> !e.textContent.trim()&&!e.getAttribute('aria-label')&&!e.getAttribute('title')).map(e=>e.outerHTML.slice(0,250)),
        brokenImages: [...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>({alt:e.alt,src:e.getAttribute('src')})),
        fonts: getComputedStyle(document.body).fontFamily
      }));
      results.push({name,size,...details});
    }
    console.log(JSON.stringify(results.splice(0)));
  }
}
