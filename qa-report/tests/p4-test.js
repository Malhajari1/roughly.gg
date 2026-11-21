const {chromium,devices}=require('playwright');const {install}=require('./fakefb2.js');
const KV="http://127.0.0.1:8772/kv";let fails=0;const ok=(c,m,d)=>{console.log((c?"PASS ":"FAIL ")+m+(d!==undefined?" :: "+JSON.stringify(d):""));if(!c)fails++;};
const kv=async(op,b)=>(await fetch(KV,{method:"POST",body:JSON.stringify(Object.assign({op},b||{}))})).json();
(async()=>{const B=await chromium.launch();await fetch("http://127.0.0.1:8772/__reset");
// a signed-in player and an anonymous player exist
await kv("set",{path:"players/gSamUid000000000000000000",v:{name:"Sam",nameLower:"sam",email:"sam@example.com",emailLower:"sam@example.com",days:{"20777":"x"},coins:{b:{},e:{"20777":1},s:{},g:{}}}});
const c=await B.newContext({viewport:{width:1280,height:900}});await install(c);const p=await c.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://127.0.0.1:8772/dev.html");await p.waitForSelector("#si");await p.evaluate(()=>window.__gEmail="intruder@example.com");await p.click("#si");await p.waitForTimeout(800);
ok(/Not an admin/.test(await p.textContent("main")),"a Google account without an admins doc sees 'Not an admin' (plus its ID to add)");await p.screenshot({path:"t-dev-notadmin.png"});
const acc=(await kv("get",{path:"__gacc"})).v;await kv("set",{path:"admins/"+acc["intruder@example.com"],v:{name:"SWISS"}});await p.reload();await p.waitForSelector("[data-t]",{timeout:8000});ok(true,"after adding the admins doc: the Dev page opens");
await p.fill("#q","sam@example.com");await p.click("#go");await p.waitForSelector("[data-g]");ok(/Sam/.test(await p.textContent("#res"))&&/Synced coin balance: 1/.test(await p.textContent("#res")),"search by email finds the signed-in player and their synced balance");
await p.fill("#q","sa");await p.click("#go");await p.waitForSelector("[data-g]");ok(/Sam/.test(await p.textContent("#res")),"search by name prefix works");
await p.click("[data-g]");await p.waitForTimeout(400);ok(/Add a reason/.test(await p.textContent("#res")),"grant refuses without a reason");
await p.fill("[data-r]","bug report");await p.selectOption("[data-n]","3");await p.click("[data-g]");await p.waitForTimeout(800);
const pl=(await kv("get",{path:"players/gSamUid000000000000000000"})).v;const gk=Object.keys(pl.grants||{});ok(gk.length===1&&pl.grants[gk[0]].n===3&&pl.grants[gk[0]].reason==="bug report","grant written to the player's grants with amount and reason",pl.grants);
await p.screenshot({path:"t-dev-players.png"});
await p.fill("#q","anonPlayerUid0000000000001");await p.click("#go");await p.waitForSelector("[data-g]");ok(/kept on the player's device/.test(await p.textContent("#res")),"anonymous player by full Player ID: explains balance lives on their device");
await p.fill("[data-r]","welcome");await p.click("[data-g]");await p.waitForTimeout(600);ok(!!(await kv("get",{path:"players/anonPlayerUid0000000000001"})).v.grants,"grant to an anonymous player creates a grants-only record");
await p.click("[data-t=gifts]");await p.waitForSelector("#gm");await p.fill("#gr","launch week");await p.selectOption("#gn","2");await p.click("#gm");await p.waitForSelector("#gl");
const link=await p.inputValue("#gl");const gid=link.split("gift2=")[1];const gift=(await kv("get",{path:"gifts/"+gid})).v;ok(gift&&gift.n===2&&gift.claimedBy===null&&gid.length===20,"gift link made: random 20-char id, 2 coins, unclaimed",{link});
await p.waitForTimeout(500);ok(/launch week/.test(await p.textContent("#glist")),"gift appears in the recent list");await p.screenshot({path:"t-dev-gifts.png"});
await p.click("[data-t=log]");await p.waitForTimeout(800);const lg=await p.textContent("#al");ok(/grant/.test(lg)&&/gift/.test(lg)&&/bug report/.test(lg),"activity log lists every grant and gift with the admin and reason");await p.screenshot({path:"t-dev-log.png"});
await p.click("[data-t=stats]");await p.waitForTimeout(500);ok(/Not connected yet/.test(await p.textContent("#ga")),"analytics tab explains the one-time GA setup while IDs are empty");await p.screenshot({path:"t-dev-stats.png"});
ok(!errs.length,"dev page: no errors",errs);
// GA events from the game (GA_ID set in a test copy; Google's script itself is blocked in tests)
const g=await B.newContext({...devices["iPhone 13"]});await install(g);await g.addInitScript(()=>{localStorage.setItem("rq-gift","n");localStorage.setItem("rq-nocp","1")});const q=await g.newPage();
await q.goto("http://127.0.0.1:8772/ga.html?c="+Buffer.from((await (async()=>{const t=Math.floor(Date.UTC(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())/864e5);return t})())+".50-50-50.Ali").toString("base64").replace(/=+$/,""));
await q.waitForSelector("#in");for(let k=0;k<3;k++){await q.waitForSelector("#in");await q.type("#in","1000");await q.click("#go");await q.waitForTimeout(300);await q.click("#nx");await q.waitForTimeout(300);}
await q.waitForTimeout(800);await q.click("#sh");await q.waitForTimeout(300);await q.click("#cp2");await q.waitForTimeout(300);
const dl=await q.evaluate(()=>window.dataLayer.map(a=>Array.from(a)).map(a=>a[0]==="event"?a[1]:a[0]==="config"?"config:"+JSON.stringify(a[2]):a[0]==="consent"?"consent:"+JSON.stringify(a[2]):a[0]));
ok(["challenge_open","game_start","game_complete","share"].every(e=>dl.includes(e)),"game sends challenge_open, game_start, game_complete, share",dl.filter(x=>!/^(js|config|consent)/.test(x)));
ok(dl.some(x=>/client_storage":"none"/.test(x)&&/client_id/.test(x))&&dl.some(x=>/ad_storage":"denied"/.test(x)),"GA configured with no cookies, the anonymous device id, ads off");
const ck=await g.cookies();ok(!ck.some(x=>/^_ga/.test(x.name)),"no GA cookies set",ck.map(x=>x.name));
await B.close();console.log(fails?fails+" FAILED":"ALL PASSED");process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2)});
