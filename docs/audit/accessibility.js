async page => {
 const results=[];
 for(const route of ['/login','/matches','/predictions/1640509','/picks']) {
   await page.goto('http://localhost:3000'+route);
   await page.waitForTimeout(2000);
   await page.setViewportSize({width:390,height:844});
   await page.addScriptTag({path:'frontend/node_modules/axe-core/axe.min.js'});
   const axe=await page.evaluate(async()=>{
     const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
     return {version:window.axe.version,violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html})).slice(0,12),totalNodes:v.nodes.length})),incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};
   });
   const widths=[];
   for(const width of [320,390,768,1440]) {
     await page.setViewportSize({width,height:844});
     widths.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector('main').getBoundingClientRect().width,truncated:[...document.querySelectorAll('main button span')].filter(e=>e.scrollWidth>e.clientWidth+2).slice(0,8).map(e=>({text:e.textContent,width:e.clientWidth,contentWidth:e.scrollWidth}))})));
   }
   results.push({route,axe,widths});
 }
 return results;
}
