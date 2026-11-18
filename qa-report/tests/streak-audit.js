const {chromium,devices}=require('playwright');const {install}=require('./fakefb.js');
const URL="https://www.roughly.gg/";const R=[];
const rec=(id,res,detail)=>{R.push([id,res,detail]);console.log(res.padEnd(7)+id+" :: "+(typeof detail==="string"?detail:JSON.stringify(detail)));};
const DOHA=s=>new Date(s+"+03:00");
let B;
async function ctxAt(time,o={}){const c=await B.newContext({...devices["iPhone 13"],timezoneId:o.tz||"Asia/Qatar"});await install(c);await c.clock.install({time});const p=await c.newPage();p.errs=[];p.on("pageerror",e=>p.errs.push(e.message));
  await c.addInitScript(()=>{try{if(!localStorage.getItem("rq-gift"))localStorage.setItem("rq-gift","n");localStorage.setItem("rq-nocp","1")}catch(e){}});return {c,p};}
async function load(p){await p.goto(URL);await p.waitForFunction(()=>typeof st!=="undefined"&&document.getElementById("app").children.length);await p.waitForTimeout(300);}
async function answer(p,n=3){for(let k=0;k<n;k++){await p.waitForSelector("#in",{timeout:5000});await p.fill("#in","");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(250);await p.click("#nx");await p.waitForTimeout(250);}}
async function play(p){await load(p);const v=await p.evaluate(()=>document.body.getAttribute("data-view"));if(v!=="play"){await p.evaluate(()=>{intro=false;render()});await p.waitForTimeout(200)}await answer(p);await p.waitForTimeout(400);}
const S=p=>p.evaluate(()=>({today,streak:stats.streak,last:stats.last,played:stats.played,coins:coinsGet().n,stored:JSON.parse(localStorage.getItem("tk7-stats")||"null")}));
async function nextDay(p,t){await p.clock.setSystemTime(t);}
(async()=>{B=await chromium.launch();
// 1-6, 11: normal consecutive play, coin on day 3, refresh, replay
{const {c,p}=await ctxAt(DOHA("2026-11-17T10:00:00"));await play(p);let s=await S(p);rec("1 completed daily game counts",s.streak===1&&s.played===1?"PASS":"FAIL",s);
 await p.reload();await p.waitForTimeout(500);let s2=await S(p);rec("6 refresh does not change streak",s2.streak===1&&s2.played===1?"PASS":"FAIL",s2);
 const before=await S(p);await p.evaluate(()=>{intro=false;render()});await p.waitForTimeout(300);const canPlay=await p.$("#in");rec("4 finished daily game cannot be replayed",!canPlay?"PASS":"FAIL","input shown: "+!!canPlay);
 await nextDay(p,DOHA("2026-11-18T09:00:00"));await play(p);s=await S(p);rec("1b next day continues streak",s.streak===2?"PASS":"FAIL",s);
 await nextDay(p,DOHA("2026-11-19T20:00:00"));await play(p);s=await S(p);rec("5 coin awarded on day 3",s.coins===1?"PASS":"FAIL",s);
 await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{intro=false;render()});await p.waitForTimeout(500);s=await S(p);rec("5b coin not re-awarded on reload/results",s.coins===1?"PASS":"FAIL",s);
 // replay by deleting only today's game record (what a curious user / storage bug could do)
 await p.evaluate(()=>{localStorage.removeItem("tk8-s"+today)});await play(p);s=await S(p);rec("4b replay after today's record is lost",s.played===3&&s.streak===3&&s.coins===1?"PASS":"FAIL",{note:"played should stay 3",...s});
 // 3 bonus game
 await p.evaluate(()=>{const c=coinsGet();c.n=1;coinsSet(c)});await p.evaluate(()=>{intro=false;render()});await p.waitForTimeout(300);await p.evaluate(()=>spendCoin());await answer(p);await p.waitForTimeout(300);s=await S(p);rec("2 bonus game does not change streak/played",s.streak===3?"PASS":"FAIL",s);
 // 12 miss a day
 await nextDay(p,DOHA("2026-11-21T09:00:00"));await load(p);s=await S(p);rec("12 missed day: display before playing",s.streak===0?"PASS":"FAIL",{inMemory:s.streak,stored:s.stored.streak});
 await play(p);s=await S(p);rec("12b missed day: streak restarts at 1",s.streak===1?"PASS":"FAIL",s);
 await c.close();}
// 6b two tabs finishing at once
{const {c,p}=await ctxAt(DOHA("2026-11-17T10:00:00"));const p2=await c.newPage();await load(p);await load(p2);
 await answer(p,2);await answer(p2,2);await answer(p,1);await answer(p2,1);await p.waitForTimeout(300);const s=await S(p2);rec("6b two tabs finish the same day",s.played===1?"PASS":"FAIL",{note:"played should be 1",...s});await c.close();}
// 7 time zone: London vs Doha at 22:30 UTC
{const t=new Date("2026-11-17T22:30:00Z");const a=await ctxAt(t,{tz:"Asia/Qatar"}),b=await ctxAt(t,{tz:"Europe/London"});await load(a.p);await load(b.p);
 const x=await a.p.evaluate(()=>({today,ids:ids.join(",")})),y=await b.p.evaluate(()=>({today,ids:ids.join(",")}));rec("7 day and streak follow Qatar's date",x.today===y.today?"PASS":"FAIL",{doha:x,london:y});await a.c.close();await b.c.close();}
// 8/9 midnight
{const {c,p}=await ctxAt(DOHA("2026-11-17T23:59:00"));await load(p);await answer(p,3);await p.waitForTimeout(300);let s=await S(p);rec("9 finishing at 23:59 credits that day",s.streak===1&&s.last===s.today?"PASS":"FAIL",s);await c.close();}
{const {c,p}=await ctxAt(DOHA("2026-11-16T12:00:00"));await play(p);await nextDay(p,DOHA("2026-11-17T23:58:00"));await load(p);await answer(p,1);
 await nextDay(p,DOHA("2026-11-18T00:02:00"));await p.evaluate(()=>document.dispatchEvent(new Event("visibilitychange")));await p.waitForTimeout(500);
 const mid=await p.evaluate(()=>({today,day,answered:st.g.length,view:document.body.getAttribute("data-view")}));
 await answer(p,3);await p.waitForTimeout(300);const s=await S(p);const y=await p.evaluate(()=>{const x=JSON.parse(localStorage.getItem("tk8-s"+(today-1))||"null");return x&&x.g.length});
 rec("8 game started 23:58, phone unlocked 00:02",s.streak===2?"PASS":"FAIL",{afterUnlock:mid,yesterdayAnswered:y,streakAfterFinishing:s.streak,note:"played 16th + 17th (finished after midnight) = 2 expected"});await c.close();}
{const {c,p}=await ctxAt(DOHA("2026-11-16T12:00:00"));await play(p);await nextDay(p,DOHA("2026-11-17T23:58:00"));await load(p);await answer(p,1);await nextDay(p,DOHA("2026-11-18T00:03:00"));await answer(p,2);await p.waitForTimeout(300);
 const s=await S(p);rec("8b game started 23:58, finished 00:03 without leaving the tab",s.streak===2?"PASS":"FAIL",{...s,countdown:await p.evaluate(()=>(document.getElementById("cdn")||{}).textContent)});await c.close();}
// offline + refresh during submission
{const {c,p}=await ctxAt(DOHA("2026-11-17T10:00:00"));await load(p);await answer(p,2);await c.setOffline(true);await answer(p,1);let s=await S(p);rec("offline: completing a game offline",s.streak===1?"PASS":"FAIL",{...s,gdirty:await p.evaluate(()=>localStorage.getItem("rq-gdirty"))});
 await c.setOffline(false);await c.close();}
{const {c,p}=await ctxAt(DOHA("2026-11-17T10:00:00"));await load(p);await answer(p,2);await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.reload();await p.waitForTimeout(500);const s=await S(p);rec("refresh straight after the last answer",s.streak===1&&s.played===1?"PASS":"FAIL",s);await c.close();}
// manipulation
{const {c,p}=await ctxAt(DOHA("2026-11-17T10:00:00"));await load(p);await p.evaluate(()=>{const t=today;localStorage.setItem("tk7-stats",JSON.stringify({streak:98,last:t-1,played:98,total:9000}))});await play(p);const s=await S(p);rec("local storage edit: streak 98 -> finish",s.streak===99?"INFO":"INFO",{...s,note:"client-trusted: edited streak accepted, coin awarded at 99"});await c.close();}
// 10 linking + other device
{const {c,p}=await ctxAt(DOHA("2026-11-17T10:00:00"));await play(p);const s=await S(p);const fb=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem("__fakedb")||"{}")).filter(k=>!/^answers\//.test(k)));
 rec("10 streak/coins/history stored anywhere besides this device?",fb.length?"INFO":"FAIL",{streak:s.streak,firestoreDocsOtherThanAnswers:fb,note:"no cloud copy of streak, coins or history exists; Google link only keeps the group uid"});
 const t2=await ctxAt(DOHA("2026-11-17T12:00:00"));await load(t2.p);const s2=await S(t2.p);rec("6c/10b same player on a second device",s2.streak===0?"FAIL":"PASS",{secondDeviceStreak:s2.streak,note:"no sync path in production"});await t2.c.close();await c.close();}
await B.close();require('fs').writeFileSync("streak-audit.json",JSON.stringify(R,null,1));})().catch(e=>{console.error(e);process.exit(1)});
