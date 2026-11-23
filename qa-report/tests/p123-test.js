const {chromium,devices}=require('playwright');const {install}=require('./fakefb2.js');
const U="http://127.0.0.1:8772/rt.html",KV="http://127.0.0.1:8772/kv";let fails=0,B;
const ok=(c,m,d)=>{console.log((c?"PASS ":"FAIL ")+m+(d!==undefined?" :: "+JSON.stringify(d):""));if(!c)fails++;};
const kv=async(op,b)=>(await fetch(KV,{method:"POST",body:JSON.stringify(Object.assign({op},b||{}))})).json();
const DOHA=s=>new Date(s+"+03:00");
async function dev(o={}){const c=await B.newContext({...devices["iPhone 13"],timezoneId:"Asia/Qatar"});await install(c,o);if(o.clock)await c.clock.install({time:o.clock});
  await c.addInitScript(()=>{if(!localStorage.getItem("rq-gift"))localStorage.setItem("rq-gift","n");localStorage.setItem("rq-nocp","1")});
  const p=await c.newPage();p.errs=[];p.on("pageerror",e=>p.errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource/.test(m.text()))p.errs.push(m.text())});return {c,p};}
async function load(p,q=""){await p.goto(U+q);await p.waitForFunction(()=>typeof st!=="undefined"&&document.getElementById("app").children.length);await p.waitForTimeout(300);}
const ready=p=>p.waitForFunction(()=>window.RQGroups&&window.RQGroups.enabled&&window.RQGroups.user&&window.RQGroups.user());
async function answer(p,n=3){for(let k=0;k<n;k++){await p.waitForSelector("#in",{timeout:8000});await p.fill("#in","");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(250);await p.click("#nx");await p.waitForTimeout(250);}}
async function play(p,q){await load(p,q);const v=await p.evaluate(()=>document.body.getAttribute("data-view"));if(v!=="play"){await p.evaluate(()=>{intro=false;render()});await p.waitForTimeout(200)}await answer(p);await p.waitForTimeout(500);}
const S=p=>p.evaluate(()=>({today,streak:stats.streak,played:stats.played,coins:coinsGet().n}));
(async()=>{B=await chromium.launch();await fetch("http://127.0.0.1:8772/__reset");
// ---------------- STREAKS
{const {c,p}=await dev({clock:DOHA("2026-11-20T10:00:00")});await load(p);
 // an existing player from before this build: old counter says 5 days, but only 2 day records are on this device
 await p.evaluate(()=>{const T=today;[T-1,T-2].forEach(d=>localStorage.setItem("tk8-s"+d,JSON.stringify({day:d,ids:pick(d),g:[1,2,3],s:[50,50,50],un:[],r:false,hu:[0,0,0],nt:["","",""],pd:d})));
   localStorage.setItem("tk7-stats",JSON.stringify({streak:5,last:T-1,played:9,total:1200}));localStorage.setItem("rq-coins",JSON.stringify({n:4,aw:T-1}));localStorage.removeItem("rq-sv2")});
 await load(p);let s=await S(p);ok(s.streak===5&&s.played===9&&s.coins===4,"existing player keeps streak 5, played 9 and 4 coins when the new code arrives",s);
 await play(p);s=await S(p);ok(s.streak===6&&s.played===10&&s.coins===5,"playing today continues it: 6, and 6 is a multiple of 3: coin (4 -> 5)",s);
 await p.clock.setSystemTime(DOHA("2026-11-21T09:00:00"));await play(p);s=await S(p);ok(s.streak===7&&s.coins===5,"next day 7 (no coin)",s);
 await p.clock.setSystemTime(DOHA("2026-11-22T09:00:00"));await play(p);s=await S(p);ok(s.streak===8,"next day 8",s);
 await p.clock.setSystemTime(DOHA("2026-11-23T09:00:00"));await play(p);s=await S(p);ok(s.streak===9&&s.coins===6,"day 9: one coin (5 -> 6)",s);
 await p.reload();await p.waitForTimeout(500);s=await S(p);ok(s.streak===9&&s.coins===6,"reload: no change, no second coin",s);
 await p.evaluate(()=>localStorage.removeItem("tk8-s"+today));await play(p);s=await S(p);ok(s.played===13&&s.coins===6&&s.streak===9,"today's record lost and replayed: played not inflated, no extra coin",s);
 await p.evaluate(()=>{intro=false;render()});await p.waitForTimeout(200);await p.evaluate(()=>spendCoin());await answer(p);await p.waitForTimeout(300);s=await S(p);ok(s.streak===9&&s.played===13&&s.coins===5,"bonus game: coin spent, streak and played untouched",s);
 await p.clock.setSystemTime(DOHA("2026-11-25T09:00:00"));await load(p);s=await S(p);ok(s.streak===0,"missed a day: 0 before playing",s);
 await play(p);s=await S(p);ok(s.streak===1,"then 1",s);await c.close();}
{const {c,p}=await dev({clock:DOHA("2026-11-20T10:00:00")});const p2=await c.newPage();await load(p);await load(p2);await answer(p,2);await answer(p2,2);await answer(p,1);await answer(p2,1);await p.waitForTimeout(300);
 await p2.evaluate(()=>deriveStats());ok((await S(p2)).played===1,"two tabs finishing the same day: played 1",await S(p2));await c.close();}
{const {c,p}=await dev({clock:DOHA("2026-11-19T12:00:00")});await play(p);await p.clock.setSystemTime(DOHA("2026-11-20T23:58:00"));await load(p);await answer(p,1);
 await p.clock.setSystemTime(DOHA("2026-11-21T00:02:00"));await p.evaluate(()=>document.dispatchEvent(new Event("visibilitychange")));await p.waitForTimeout(400);
 const mid=await p.evaluate(()=>({day,today,answered:st.g.length}));ok(mid.answered===1&&mid.day===mid.today-1,"phone unlocked 00:02 mid-game: the started game stays",mid);
 await answer(p,2);await p.waitForTimeout(600);let s=await S(p);ok(s.streak===2,"finishing it counts for its own day: streak 2",s);
 await p.screenshot({path:"t-midnight-results.png"});const btn=await p.$("#tnew");ok(!!btn,"results point to today's drop instead of a wrong countdown");
 await btn.click();await p.waitForTimeout(400);await answer(p,3);await p.waitForTimeout(400);s=await S(p);ok(s.streak===3&&s.coins===1,"then today's drop: streak 3 and the coin",s);await c.close();}
{const {c,p}=await dev({clock:DOHA("2026-11-20T23:58:00")});await load(p);await answer(p,1);await p.clock.setSystemTime(DOHA("2026-11-21T00:40:00"));await load(p);
 const r=await p.evaluate(()=>({day,today,answered:st.g.length}));ok(r.day===r.today-1&&r.answered===1,"app reopened at 00:40: resumes last night's game",r);await c.close();}
// ---------------- SIGN-IN
await fetch("http://127.0.0.1:8772/__reset");
const d1=await dev({clock:DOHA("2026-11-20T10:00:00")});await play(d1.p);await ready(d1.p);
await d1.p.evaluate(()=>window.RQGroups.createGroup("Doha Crew"));const gid=(await kv("list",{prefix:"groups/"})).v;const GID=Object.keys(gid).find(k=>k.split("/").length===2).split("/")[1];
const uidA=await d1.p.evaluate(()=>window.RQGroups.user().uid);
await d1.p.evaluate(()=>openMenu());await d1.p.waitForTimeout(300);ok(/Player name/.test(await d1.p.textContent("#sheet")),"menu shows the player name");
await d1.p.click("[data-act=signin]");await d1.p.waitForTimeout(300);await d1.p.screenshot({path:"t-signin-sheet.png"});
await d1.p.click("#sgo");await d1.p.waitForSelector("#sd",{timeout:8000});await d1.p.waitForTimeout(400);
let prof=(await kv("get",{path:"players/"+uidA})).v;ok(prof&&prof.email==="gee@example.com"&&Object.keys(prof.days).length===1&&prof.coins,"link a new Google account: same ID, profile created with history and coins",{uid:uidA,days:prof&&Object.keys(prof.days)});
await d1.p.click("#sd");await d1.p.evaluate(()=>openMenu());await d1.p.waitForTimeout(300);ok(/Signed in/.test(await d1.p.textContent("#sheet"))&&!!(await d1.p.$("[data-act=signout]")),"menu shows the email and Sign out");
await d1.p.screenshot({path:"t-menu-signedin.png"});
// device 2 with its own anonymous progress and a seat in the same group
const d2=await dev({clock:DOHA("2026-11-21T10:00:00")});await play(d2.p);await ready(d2.p);const uidB=await d2.p.evaluate(()=>window.RQGroups.user().uid);
await d2.p.evaluate(g=>window.RQGroups.joinGroup(g,"Sam"),GID);
await d1.p.clock.setSystemTime(DOHA("2026-11-21T10:05:00"));
const s2a=await S(d2.p);
await d2.p.evaluate(()=>openSignIn());await d2.p.click("#sgo");await d2.p.waitForSelector("#sd",{timeout:8000});await d2.p.waitForTimeout(800);
const uidG=await d2.p.evaluate(()=>window.RQGroups.user().uid);ok(uidG===uidA,"second device signs in to the same Google account: becomes that account",{uidB,uidG});
const grp=(await kv("get",{path:"groups/"+GID})).v;ok(grp.memberUids.indexOf(uidB)<0&&grp.memberUids.filter(x=>x===uidA).length===1,"group seat handed over: no duplicate member",grp.memberUids);
const al=(await kv("get",{path:"aliases/"+uidB})).v;ok(al&&al.to===uidA,"anonymous account left a one-time alias to the Google account",al);
const sc=(await kv("list",{prefix:"groups/"+GID+"/scores/"})).v;ok(Object.keys(sc).some(k=>k.endsWith("__"+uidA)&&sc[k].from===uidB),"this week's group score copied to the Google account",Object.keys(sc));
prof=(await kv("get",{path:"players/"+uidA})).v;ok(Object.keys(prof.days).length===2&&(prof.merged||[]).indexOf(uidB)>=0,"profile merged both devices' days (union) with the merge recorded",Object.keys(prof.days));
const s2=await S(d2.p);ok(s2.streak===2&&s2.played===2,"device 2 now shows the combined streak 2",s2);
await d1.p.evaluate(()=>localStorage.removeItem("rq-pchk"));await load(d1.p);await d1.p.waitForTimeout(1500);const s1=await S(d1.p);ok(s1.streak===2,"device 1 picks up device 2's day on next open: streak 2",s1);
// sign out keeps progress, forgets groups
await d2.p.evaluate(()=>openMenu());await d2.p.waitForTimeout(200);await d2.p.click("[data-act=signout]");await d2.p.waitForTimeout(800);
const so=await d2.p.evaluate(()=>({u:window.RQGroups.user(),groups:localStorage.getItem("rq-groups"),streak:stats.streak}));ok(so.u&&so.u.anon&&so.u.uid!==uidA&&!so.groups&&so.streak===2,"sign out: anonymous again, progress kept, remembered groups cleared",so);
await d2.p.reload();await d2.p.waitForTimeout(1500);const g2=(await kv("get",{path:"groups/"+GID})).v;ok(g2.memberUids.indexOf(so.u.uid)<0,"signed-out device does not silently rejoin the group",g2.memberUids);
// admin grant to an anonymous player, picked up once
const d3=await dev({clock:DOHA("2026-11-21T10:00:00")});await load(d3.p);await ready(d3.p);const uidC=await d3.p.evaluate(()=>window.RQGroups.user().uid);
await kv("set",{path:"players/"+uidC,v:{grants:{g1:{n:3,reason:"thanks",by:"admin"}}}});await d3.p.evaluate(()=>localStorage.removeItem("rq-pchk"));await load(d3.p);await d3.p.waitForTimeout(1500);
let c3=await S(d3.p);await load(d3.p);await d3.p.waitForTimeout(800);let c3b=await S(d3.p);ok(c3.coins===3&&c3b.coins===3,"admin grant reaches an anonymous player once",{first:c3.coins,again:c3b.coins});
// gift links
await kv("set",{path:"gifts/GIFTabcdefghijkl1",v:{n:2,reason:"launch",by:"admin",claimedBy:null}});
await load(d3.p,"?gift2=GIFTabcdefghijkl1");await d3.p.waitForSelector("#popb",{timeout:15000});await d3.p.screenshot({path:"t-gift.png"});await d3.p.click("#popb");await d3.p.waitForTimeout(800);
c3=await S(d3.p);const gd=(await kv("get",{path:"gifts/GIFTabcdefghijkl1"})).v;ok(c3.coins===5&&gd.claimedBy===uidC,"gift link claimed once: +2",{coins:c3.coins,claimedBy:gd.claimedBy});
await load(d1.p,"?gift2=GIFTabcdefghijkl1");await d1.p.waitForSelector("#pop",{timeout:15000});ok(/already/i.test(await d1.p.textContent("#pop")),"same gift on another device: already used");await d1.p.click("#popb");
await load(d3.p,"?gift=3.abcdef.123456789");await d3.p.waitForSelector("#pop",{timeout:5000});ok(/expired/i.test(await d3.p.textContent("#pop")),"old-style gift link: says it has expired");await d3.p.click("#popb");
// ---------------- GROUPS
// owner removes a member
const d4=await dev({clock:DOHA("2026-11-21T10:00:00")});await play(d4.p);await ready(d4.p);await d4.p.evaluate(g=>window.RQGroups.joinGroup(g,"Rami"),GID);const uidD=await d4.p.evaluate(()=>window.RQGroups.user().uid);
await d1.p.evaluate(g=>openGroup(g),GID);await d1.p.waitForSelector("[data-rm]",{timeout:8000});await d1.p.screenshot({path:"t-board-owner.png"});
const rmCount=await d1.p.$$eval("[data-rm]",x=>x.length);await d4.p.evaluate(g=>openGroup(g),GID);await d4.p.waitForSelector(".lbr");ok(rmCount>=1&&(await d4.p.$$("[data-rm]")).length===0,"only the creator sees Remove",{ownerSees:rmCount});
await d1.p.click("[data-rm='"+uidD+"']");await d1.p.waitForSelector("#rmy");await d1.p.screenshot({path:"t-remove-confirm.png"});await d1.p.click("#rmy");await d1.p.waitForTimeout(800);
const g3=(await kv("get",{path:"groups/"+GID})).v;ok(g3.memberUids.indexOf(uidD)<0&&(g3.removed||[]).indexOf(uidD)>=0,"confirmed: member removed and recorded",{removed:g3.removed});
const sc2=(await kv("list",{prefix:"groups/"+GID+"/scores/"})).v;ok(Object.keys(sc2).some(k=>k.endsWith("__"+uidD)),"their past scores stay in the group's history");
await d4.p.evaluate(()=>{sessionStorage.clear()});await load(d4.p,"?g="+GID);await d4.p.waitForTimeout(1500);ok(/removed you/.test(await d4.p.textContent("#sheet")),"removed member opening the invite: told why it doesn't work");
// invite onboarding: brand-new player, slow connection
const d5=await dev({clock:DOHA("2026-11-21T10:00:00"),slowSdk:2500});const t0=Date.now();await d5.p.goto(U+"?g="+GID);await d5.p.waitForSelector("#gjn",{timeout:3000});const tSheet=Date.now()-t0;
ok(tSheet<2500,"invite sheet appears before Firebase has loaded",{ms:tSheet});await d5.p.screenshot({path:"t-invite-loading.png"});
await d5.p.fill("#gjn","Noor");await d5.p.click("#gok");await d5.p.waitForFunction(()=>!document.getElementById("sheet").classList.contains("open"),null,{timeout:10000});
const after=await d5.p.evaluate(()=>({view:document.body.getAttribute("data-view"),input:!!document.getElementById("in"),toast:(document.getElementById("toast")||{}).textContent}));
ok(after.input&&/joined/.test(after.toast||""),"tap Join: straight into the game with a note",after);await d5.p.screenshot({path:"t-invite-joined.png"});
const g4=(await kv("get",{path:"groups/"+GID})).v;const nUid=await d5.p.evaluate(()=>window.RQGroups.user().uid);ok(g4.memberUids.filter(x=>x===nUid).length===1,"joined exactly once");
await d5.p.goto(U+"?g="+GID);await d5.p.waitForTimeout(3500);const again=await d5.p.evaluate(()=>({sheet:document.getElementById("sheet").classList.contains("open"),toast:(document.getElementById("toast")||{}).textContent}));
ok(!again.sheet&&/already/.test(again.toast||""),"opening the invite again as a member: straight into the game",again);
// refresh during join
const d6=await dev({clock:DOHA("2026-11-21T10:00:00"),slowSdk:1500});await d6.p.goto(U+"?g="+GID);await d6.p.waitForSelector("#gjn");await d6.p.reload();await d6.p.waitForSelector("#gjn",{timeout:4000});
ok(/Invitation/.test(await d6.p.textContent("#sheet")),"refresh mid-join: the invite comes back");
// invalid code
const d7=await dev({clock:DOHA("2026-11-21T10:00:00")});await d7.p.goto(U+"?g=zzzzzzz");await d7.p.waitForTimeout(2500);ok(/doesn’t work/.test(await d7.p.textContent("#sheet")),"invalid invite: clear message with a Play button");await d7.p.screenshot({path:"t-invite-invalid.png"});
await d7.p.click("#gpl");await d7.p.waitForTimeout(300);ok(!!(await d7.p.$("#in")),"Play button goes to the game");
// caching: Home + results share one group list
await d1.p.evaluate(()=>{window.__gd=[];intro=true;landOn=false;render()});await d1.p.waitForTimeout(1200);await d1.p.evaluate(()=>{intro=false;render()});await d1.p.waitForTimeout(1200);await d1.p.evaluate(()=>{intro=true;render()});await d1.p.waitForTimeout(1200);
const q=await d1.p.evaluate(()=>window.__gd.filter(x=>x==="groups").length);ok(q<=1,"Home, results and Home again: group list fetched once",{groupQueries:q});
const errs=[d1,d2,d3,d4,d5,d6,d7].flatMap(d=>d.p.errs);ok(!errs.length,"no page errors",errs.slice(0,5));
await B.close();console.log(fails?fails+" FAILED":"ALL PASSED");process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2)});
