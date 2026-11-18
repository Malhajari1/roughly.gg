const {chromium}=require('playwright');const {install}=require('./fakefb.js');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();await install(ctx);const p=await ctx.newPage();
await p.goto("https://www.roughly.gg/");await p.waitForFunction(()=>typeof Q!=="undefined");
const d=await p.evaluate(()=>({Q,HINTS,SKIP,FRESH_FROM,LATE_FROM,START,ROT_START,today,UNITS,KINDS,
  sched:(function(){var o=[];for(var x=START;x<ROT_START+400;x++)o.push([x,pick(x)]);return o})()}));
fs.writeFileSync(require("path").join(__dirname,"bank.json"),JSON.stringify(d,null,1));console.log(d.Q.length,"questions",d.HINTS.length,"hints, today",d.today, "skip",Object.keys(d.SKIP));await b.close();})();
