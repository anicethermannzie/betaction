async page => {
 const results=[];
 for(const [name,label] of [['match-details','Details'],['match-commentary','Commentary'],['match-insights','AI Insights'],['match-lineups','Lineups']]) {
   await page.getByRole('tab',{name:label,exact:true}).click();
   await page.waitForTimeout(14000);
   for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
     await page.setViewportSize({width,height});
     await page.screenshot({path:`docs/audit/screenshots/${name}-${size}.png`,fullPage:true});
     results.push({name,size,...await page.evaluate(()=>({url:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,text:document.querySelector('main').innerText}))});
   }
 }
 return results;
}
