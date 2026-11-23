const {chromium,devices}=require('playwright');const {install}=require('./fakefb2.js');
const U="http://127.0.0.1:8772/rt.html",KV="http://127.0.0.1:8772/kv";let fails=0,B;
const ok=(c,m,d)=>{console.log((c?"PASS ":"FAIL ")+m+(d!==undefined?" :: "+JSON.stringify(d):""));if(!c)fails++;};
const kv=async(op,b)=>(await fetch(KV,{method:"POST",body:JSON.stringify(Object.assign({op},b||{}))})).json();
async function dev(){const c=await B.newContext({...devices["iPhone 13"],permissions:["clipboard-read","clipboard-write"]});await install(c);await c.addInitScript(()=>{localStorage.setItem("rq-gift","n");localStorage.setItem("rq-nocp","1")});const p=await c.newPage();p.errs=[];p.on("pageerror",e=>p.errs.push(e.message));return {c,p};}
const ready=p=>p.waitForFunction(()=>window.RQGroups&&window.RQGroups.user&&window.RQGroups.user());
const menuName=async p=>{await p.evaluate(()=>openMenu());await p.waitForFunction(()=>{const e=document.getElementById("hname");return e&&e.textContent!=="…"},null,{timeout:8000});return p.textContent("#hname")};
const handles=async()=>Object.entries((await kv("list",{prefix:"handles/"})).v||{});
(async()=>{B=await chromium.launch();await fetch("http://127.0.0.1:8772/__reset");
const d1=await dev();await d1.p.goto(U);await ready(d1.p);
let n=await menuName(d1.p);ok(/^Player #\d{4}$/.test(n),"new player opening the menu gets a default name",n);await d1.p.screenshot({path:"t-name-menu-default.png"});
await d1.p.click("[data-act=copyid]");await d1.p.waitForTimeout(300);const clip=await d1.p.evaluate(()=>navigator.clipboard.readText());ok(/Copied/.test(await d1.p.textContent("[data-act=copyid]"))&&clip===n,"Copy copies exactly the name shown",clip);
await d1.p.click("[data-act=editname]");await d1.p.waitForSelector("#hn");await d1.p.fill("#hn","a");await d1.p.click("#hs");ok(/at least 2/.test(await d1.p.textContent("#he")),"too short refused");
await d1.p.fill("#hn","fuckface");await d1.p.click("#hs");ok(/different name/.test(await d1.p.textContent("#he")),"rude name refused");
await d1.p.fill("#hn","كس");await d1.p.click("#hs");ok(/different name/.test(await d1.p.textContent("#he")),"rude Arabic name refused");
// force a clash: the first two tags tried are taken by someone else
await d1.p.evaluate(()=>{const seq=[0.5,0.5,0.7];let i=0;const R=Math.random;Math.random=()=>i<seq.length?seq[i++]:R()});
await kv("set",{path:"handles/sara_5500",v:{uid:"someoneElse",name:"Sara",nameLower:"sara",tag:"5500"}});
await d1.p.fill("#hn","Sara");await d1.p.screenshot({path:"t-name-edit.png"});await d1.p.click("#hs");await d1.p.waitForSelector("#hname",{timeout:8000});
n=await d1.p.textContent("#hname");ok(n==="Sara #7300","taken tag skipped: gets a free one",n);
const toast=await d1.p.evaluate(()=>(document.getElementById("toast")||{}).textContent);ok(/Sara #7300/.test(toast||""),"confirmation note",toast);
const uid1=await d1.p.evaluate(()=>window.RQGroups.user().uid);let H=await handles();
ok(H.some(([k,v])=>k==="handles/sara_7300"&&v.uid===uid1)&&!H.some(([k,v])=>/^handles\/player_/.test(k)&&v.uid===uid1),"name claimed for this player; old default released",H.map(x=>x[0]));
ok((await kv("get",{path:"handles/sara_5500"})).v.uid==="someoneElse","the other Sara keeps her name");
ok(await d1.p.evaluate(()=>myName()==="Sara"),"same name used in groups and challenges");
await d1.p.screenshot({path:"t-name-menu.png"});
// rename updates the group board
await d1.p.evaluate(()=>window.RQGroups.createGroup("Crew"));const GID=Object.keys((await kv("list",{prefix:"groups/"})).v).find(k=>k.split("/").length===2).split("/")[1];
await d1.p.evaluate(()=>window.RQGroups.claimHandle("Sara Q"));const mem=(await kv("get",{path:"groups/"+GID+"/members/"+uid1})).v;ok(mem&&mem.name==="Sara Q","renaming updates the name in their groups",mem);
// a name typed when joining a group becomes the player name if they had none
const d2=await dev();await d2.p.goto(U);await ready(d2.p);await d2.p.evaluate(()=>window.RQGroups.ensureHandle());ok(/^Player #/.test(await d2.p.evaluate(()=>handleText())),"second player starts as Player #…");
await d2.p.evaluate(g=>{localStorage.setItem("rq-name",JSON.stringify({n:"Omar"}));return window.RQGroups.joinGroup(g,"Omar")},GID);await d2.p.waitForTimeout(800);
ok(/^Omar #\d{4}$/.test(await d2.p.evaluate(()=>handleText())),"name typed when joining a group becomes their player name",await d2.p.evaluate(()=>handleText()));
// Google: device 1 links (same account) -> profile carries the name; device 3 with its own name signs in to that account -> adopts it
await d1.p.evaluate(()=>{closeSheet();window.__gEmail="sara@example.com"});await d1.p.evaluate(()=>window.RQGroups.signIn());await d1.p.waitForTimeout(2000);
let prof=(await kv("get",{path:"players/"+uid1})).v;ok(prof&&prof.handle&&prof.handle.name==="Sara Q","signed-in profile stores the name",prof&&prof.handle);
const d3=await dev();await d3.p.goto(U);await ready(d3.p);await d3.p.evaluate(()=>window.RQGroups.claimHandle("Bob"));const bobKey=await d3.p.evaluate(()=>handleGet().key);
await d3.p.evaluate(()=>{window.__gEmail="sara@example.com"});await d3.p.evaluate(()=>window.RQGroups.signIn());await d3.p.waitForTimeout(1500);
ok(await d3.p.evaluate(()=>handleText())===await d1.p.evaluate(()=>handleText()),"same Google account on another device shows the same name",await d3.p.evaluate(()=>handleText()));
ok(!(await kv("get",{path:"handles/"+bobKey})).v,"that device's old name was released, no duplicates");
// admin reset -> player falls back to Player #… on next daily check
await kv("del",{path:"handles/"+(await d2.p.evaluate(()=>handleGet().key))});await d2.p.evaluate(()=>localStorage.removeItem("rq-hchk"));await d2.p.reload();await d2.p.waitForTimeout(2500);
ok(/^Player #/.test(await d2.p.evaluate(()=>handleText())),"after an admin reset the player becomes Player #… and can pick again",await d2.p.evaluate(()=>handleText()));
// Dev page finds names
const acc=(await kv("get",{path:"__gacc"})).v;await kv("set",{path:"admins/"+acc["sara@example.com"],v:{name:"SWISS"}});
const dv=await d1.c.newPage();dv.on("dialog",x=>x.accept());await dv.goto("http://127.0.0.1:8772/dev.html");await dv.waitForSelector("[data-t]",{timeout:8000});
const sq=await d1.p.evaluate(()=>handleText());await dv.fill("#q",sq);await dv.click("#go");await dv.waitForSelector("[data-g]");ok((await dv.textContent("#res")).includes(sq),"Dev page: search by exact name and tag",sq);
await dv.fill("#q","sar");await dv.click("#go");await dv.waitForSelector("[data-g]");ok((await dv.textContent("#res")).includes("Sara Q"),"Dev page: search by start of name");await dv.screenshot({path:"t-dev-name.png"});
const myKey=await d1.p.evaluate(()=>handleGet().key);await dv.click(`[data-rn="${myKey}"]`);await dv.waitForTimeout(800);ok(/Name reset/.test(await dv.textContent("#res"))&&!(await kv("get",{path:"handles/"+myKey})).v,"Dev page: Reset name releases it and logs it");
const lg=Object.values((await kv("list",{prefix:"adminLog/"})).v||{});ok(lg.some(x=>x.action==="reset_name"),"reset recorded in the activity log");
const errs=[d1,d2,d3].flatMap(d=>d.p.errs);ok(!errs.length,"no page errors",errs);
await B.close();console.log(fails?fails+" FAILED":"ALL PASSED");process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2)});
