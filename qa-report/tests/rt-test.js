const {chromium,devices}=require('playwright');const {install}=require('./fakefb.js');
const U="http://127.0.0.1:8772/rt.html";let fails=0;const ok=(c,m,d)=>{console.log((c?"PASS ":"FAIL ")+m+(d!==undefined?" :: "+JSON.stringify(d):""));if(!c)fails++;};
const srv=p=>fetch("http://127.0.0.1:8772"+p).then(r=>r.json?r.json():r.text());
let B;async function ctx(){const c=await B.newContext({...devices["iPhone 13"],timezoneId:"Asia/Qatar"});await install(c);await c.addInitScript(()=>{localStorage.setItem("rq-gift","n");localStorage.setItem("rq-nocp","1")});return c;}
async function load(p){await p.goto(U);await p.waitForFunction(()=>typeof st!=="undefined"&&window.RQGroups&&window.RQGroups.enabled);await p.waitForTimeout(300);}
async function answer(p,n=3,g="1000"){for(let k=0;k<n;k++){await p.waitForSelector("#in");await p.fill("#in","");await p.type("#in",g);await p.click("#go");await p.waitForTimeout(700);await p.click("#nx");await p.waitForTimeout(300);}}
(async()=>{B=await chromium.launch();await fetch("http://127.0.0.1:8772/__reset");
const c1=await ctx();const p=await c1.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error")errs.push(m.text())});
await load(p);const T=await p.evaluate(()=>today);
await answer(p,3);await p.waitForTimeout(1500);
let L=await srv("/__log");const s=L.DB.s&&L.DB.s[T];
ok(L.log.filter(x=>x.startsWith("PATCH")).length===1,"one write for the finished game",L.log);
ok(s&&s.n===1&&s.sum>0&&Object.keys(s.q).length===3,"day node has 1 player, own average and 3 questions",s&&{n:s.n,sum:s.sum,q:Object.keys(s.q)});
const hist=L.DB.p&&Object.values(L.DB.p)[0].h[T];ok(!!hist,"player's history entry written",hist);
ok(L.log.filter(x=>x.startsWith("GET s/")).length<=2,"stats fetched at most twice in the whole game (cache)",L.log.filter(x=>x.startsWith("GET")));
const view=await p.evaluate(()=>({chart:(document.getElementById("cbox")||{}).innerText}));ok(/players|player/i.test(view.chart),"results chart renders from the day node",view.chart.slice(0,120));
// reload: no second write
await p.reload();await p.waitForTimeout(1500);L=await srv("/__log");ok(L.log.filter(x=>x.startsWith("PATCH")).length===1,"reload does not write again");
// lost local flag (storage wipe of the marker) -> server refuses, client recognises it as already counted
await p.evaluate(d=>{localStorage.removeItem("rq-sg-"+d)},T);const r=await p.evaluate(d=>window.RQGroups.submitGame(d),T);L=await srv("/__log");
ok(r===true&&L.DB.s[T].n===1,"retry after a lost local flag: refused by the rules, counted once",{ret:r,n:L.DB.s[T].n,last:L.log.slice(-3)});
// 20 parallel submissions
await p.evaluate(d=>{localStorage.removeItem("rq-sg-"+d)},T);await p.evaluate(d=>Promise.all(Array.from({length:20},()=>window.RQGroups.submitGame(d))),T);L=await srv("/__log");
ok(L.DB.s[T].n===1,"20 simultaneous submissions from one player: still 1",{n:L.DB.s[T].n});
// forged writes straight to the API
const uid=Object.keys(L.DB.p)[0];
const forge=async(P,tok)=>fetch("http://127.0.0.1:8772/rtdb/.json?auth="+(tok||"tok-"+uid),{method:"PATCH",body:JSON.stringify(P)}).then(r=>r.status);
ok(await forge({["s/"+T+"/n"]:{".sv":{"increment":50}}})===401,"forged +50 to the player count refused");
ok(await forge({["s/"+T+"/n"]:{".sv":{"increment":1}},["p/x2/h/"+T]:{a:90,sb:"b18",q:{}}},"tok-x1")===401,"writing someone else's history refused");
ok(await forge({["s/"+(T+1)+"/n"]:{".sv":{"increment":1}},["s/"+(T+1)+"/q/5/b10"]:{".sv":{"increment":1}},["p/"+uid+"/h/"+(T+1)]:{a:50,sb:"b10",q:{"5":{b:"b11",s:50,x:"e"}}}})===401,"incrementing a bin that isn't in your own entry refused");
// offline at completion -> pending -> online flush
const c2=await ctx();const p2=await c2.newPage();p2.on("pageerror",e=>errs.push(e.message));await load(p2);await answer(p2,2);await c2.setOffline(true);await answer(p2,1);await p2.waitForTimeout(800);
const pend=await p2.evaluate(()=>localStorage.getItem("rq-sgp"));await c2.setOffline(false);await p2.evaluate(()=>window.dispatchEvent(new Event("online")));await p2.waitForTimeout(1500);
L=await srv("/__log");ok(!!pend&&L.DB.s[T].n===2,"finished offline: queued, then sent when back online",{pendingWhileOffline:pend,n:L.DB.s[T].n});
// reveal graph for a third player uses the histogram
const c3=await ctx();const p3=await c3.newPage();p3.on("pageerror",e=>errs.push(e.message));await load(p3);await p3.type("#in","1000");await p3.click("#go");await p3.waitForTimeout(2500);
const rg=await p3.evaluate(()=>(document.getElementById("cbox")||{}).innerText);ok(/You/.test(rg),"reveal graph draws with real players from the day node",rg.replace(/\n/g," ").slice(0,140));
await p3.screenshot({path:"rt-reveal.png"});
await p3.click("#nx");await p3.waitForTimeout(300);await answer(p3,2);await p3.waitForTimeout(1200);await p3.evaluate(()=>{landOn=false;intro=true;render()});await p3.waitForTimeout(2500);
ok(/Players/.test(await p3.evaluate(()=>document.getElementById("app").innerText)),"Home players' average loads",(await p3.evaluate(()=>(document.getElementById("havg")||{}).innerText)).replace(/\n/g," "));
ok(!errs.length,"no page errors",errs);
await B.close();console.log(fails?fails+" FAILED":"ALL PASSED");process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2)});
