const {chromium,devices}=require('playwright');const {install}=require('./fakefb.js');
async function run(url,label){const b=await chromium.launch();const c=await b.newContext({...devices["iPhone 13"],timezoneId:"Asia/Qatar"});await install(c);
 await c.addInitScript(()=>{localStorage.setItem("rq-gift","n");localStorage.setItem("rq-nocp","1");
   // 40 other players already answered today (fake data) so the stats queries have something to return
   if(!localStorage.getItem("__seed")){localStorage.setItem("__seed","1");}});
 const p=await c.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>typeof st!=="undefined"&&window.RQGroups&&window.RQGroups.enabled);
 await p.evaluate(()=>{const db={};for(let u=0;u<40;u++)ids.forEach((qi,k)=>{db["answers/"+today+"__"+qi+"__u"+u]={uid:"u"+u,day:today,qi,s:50+k,r:0.1}});localStorage.setItem("__fakedb",JSON.stringify(db));window.__gd=[]});
 for(let k=0;k<3;k++){await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(3000);await p.click("#nx");await p.waitForTimeout(300);}
 await p.waitForTimeout(3500);await p.evaluate(()=>{landOn=false;intro=true;render()});await p.waitForTimeout(3500);
 const q=await p.evaluate(()=>window.__gd.filter(x=>x.startsWith("answers")));
 const docsRead=await p.evaluate(()=>{return window.__gd.filter(x=>x.startsWith("answers")).length});
 console.log(label.padEnd(10),"answer queries in one full game + results + Home:",q.length,"| errors:",errs.length);await b.close();return q.length;}
(async()=>{const a=await run("https://www.roughly.gg/","live (old)");const n=await run("http://127.0.0.1:8772/index.html","new");
 console.log("Each query reads every answer for that question, so reads per player fall by about",(a/n).toFixed(1)+"x");})();
