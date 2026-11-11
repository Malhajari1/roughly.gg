const {chromium,devices}=require('playwright');const {install}=require('./fakefb.js');const fs=require('fs');
const OUT=require("path").join(__dirname,"../screenshots/");const URL="https://www.roughly.gg/";const R=[];
const rec=(id,ok,detail)=>{R.push({id,ok,detail});console.log((ok===true?"PASS":ok===false?"FAIL":"INFO")+" "+id+" :: "+(typeof detail==="string"?detail:JSON.stringify(detail)));};
let B;async function page(o={}){const ctx=await B.newContext({...devices["iPhone 13"],timezoneId:"Asia/Qatar",...o.ctx});await install(ctx);
  if(o.clock)await ctx.clock.install({time:o.clock});
  const p=await ctx.newPage();p.errs=[];p.on("pageerror",e=>p.errs.push(e.message));if(o.init)await p.addInitScript(o.init);return p;}
const ready=p=>p.waitForFunction(()=>typeof st!=="undefined"&&document.getElementById("app").children.length);
(async()=>{B=await chromium.launch();
// 1 input validation
{const p=await page();await p.goto(URL);await ready(p);await p.waitForSelector("#in");
 const cases=["0","-5","abc","1e5","1,000,000","٣٠٠","0.5",".5","999999999999999999","12.34567","1.2.3","   7  "];
 const out=[];for(const c of cases){await p.fill("#in","");await p.type("#in",c);out.push({typed:c,shown:await p.inputValue("#in"),confirm:await p.isEnabled("#go"),hint:await p.textContent("#h")});}
 rec("input-validation",null,out);
 await p.fill("#in","");await p.type("#in","0.0001");rec("tiny positive guess accepted",await p.isEnabled("#go"),await p.inputValue("#in"));
 await p.screenshot({path:OUT+"e-01-input-huge.png"});await p.context().close();}
// 2 double submit
{const p=await page();await p.goto(URL);await ready(p);await p.waitForSelector("#in");await p.type("#in","1000");
 await p.evaluate(()=>{const g=document.getElementById("go");g.click();g.click();});await p.waitForTimeout(300);
 await p.keyboard.press("Enter").catch(()=>{});await p.waitForTimeout(300);
 rec("double-tap Confirm records one guess",(await p.evaluate(()=>st.g.length))===1,await p.evaluate(()=>st.g));await p.context().close();}
// 3 unit conversion (force a km / QAR / hours drop via saved state with a hint used so ids are kept)
{const p=await page();await p.goto(URL);await ready(p);
 const pick3=await p.evaluate(()=>{const f=u=>Q.findIndex((q,i)=>q.u===u&&!SKIP[i]);return [f("km"),f("QAR"),f("hours")]});
 await p.evaluate(ids=>{localStorage.setItem("tk8-s"+today,JSON.stringify({day:today,ids,g:[],s:[],un:[],r:false,hu:[1,0,0],nt:["","",""]}))},pick3);
 await p.reload();await ready(p);await p.waitForSelector("#in");
 const res=[];for(let n=0;n<3;n++){await p.waitForSelector("#in");const q=await p.evaluate(()=>{const q=Q[ids[st.g.length]];return {t:q.t,u:q.u,m:q.m,opts:[...document.querySelectorAll("#un option")].map(o=>o.value)}});
  const alt=q.opts[1];if(alt){await p.selectOption("#un",alt);}
  const f=await p.evaluate(a=>unitByLabel(Q[ids[st.g.length]].u,a)[1],alt||q.u);const g=q.m/f;await p.fill("#in","");await p.type("#in",String(Math.round(g*1000)/1000));
  if(n===0)await p.screenshot({path:OUT+"e-02-unit-miles.png"});
  await p.click("#go");await p.waitForTimeout(400);
  const r=await p.evaluate(()=>({s:st.s[st.s.length-1],stored:st.g[st.g.length-1],cmp:document.querySelector(".cmp").innerText.replace(/\n/g," ")}));
  res.push({q:q.t.slice(0,50),unit:alt,typed:Math.round(g*1000)/1000,...r});await p.click("#nx");await p.waitForTimeout(300);}
 rec("answering the estimate in an alternative unit scores 100",res.every(r=>r.s>=99),res);
 const t=await p.evaluate(()=>Q.filter((q,i)=>!SKIP[i]&&q.u==="km"&&/kilomet/i.test(q.t)).length);
 rec("question text hard-codes 'kilometres' while answer unit can be miles",null,t+" km questions mention kilometres in the title");
 await p.context().close();}
// 4 reload mid-game
{const p=await page();await p.goto(URL);await ready(p);await p.waitForSelector("#in");await p.type("#in","500");await p.reload();await ready(p);
 rec("typed-but-unconfirmed guess survives reload",(await p.inputValue("#in").catch(()=>""))!=="",await p.inputValue("#in").catch(()=>"(no input)"));
 await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(300);await p.reload();await ready(p);await p.waitForTimeout(500);
 rec("reload on reveal returns to the same reveal",await p.evaluate(()=>!!document.getElementById("nx")&&st.g.length===1),await p.evaluate(()=>document.body.getAttribute("data-view")));
 // back button
 const before=p.url();await p.goBack().catch(()=>{});await p.waitForTimeout(500);rec("browser Back during the game",null,"before "+before+" -> after "+p.url());
 await p.context().close();}
// 5 challenge links
{const mk=async(s)=>{const p=await page();await p.goto(URL+s);await ready(p);await p.waitForTimeout(600);return p;};
 const T=await (async()=>{const p=await page();await p.goto(URL);await ready(p);const t=await p.evaluate(()=>today);await p.context().close();return t})();
 const enc=s=>Buffer.from(s).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
 let p=await mk("?c="+enc(T+".80-60-40.Sara"));
 const b=await p.evaluate(()=>({view:document.body.getAttribute("data-view"),banner:(document.querySelector(".chb")||{}).innerText,txt:document.getElementById("app").innerText}));
 const Qm=await p.evaluate(()=>ids.map(i=>String(Math.round(Q[i].m))));
 rec("challenge link opens straight into the game with banner",b.view==="play"&&/Sara/.test(b.banner||""),b.banner);
 rec("challenge recipient sees no answers before playing",!Qm.some(m=>b.txt.replace(/,/g,"").includes(m)&&m.length>2),"estimates "+Qm.join("/")+" not in page text");
 await p.screenshot({path:OUT+"e-03-challenge-landing.png"});
 for(let n=0;n<3;n++){await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(300);await p.click("#nx");await p.waitForTimeout(300);}
 await p.waitForTimeout(2500);rec("head-to-head shown after finishing",await p.evaluate(()=>!!document.querySelector(".h2h")),await p.evaluate(()=>(document.querySelector(".h2hm")||{}).innerText));
 await p.screenshot({path:OUT+"e-04-head-to-head.png",fullPage:true});await p.context().close();
 for(const [lab,q] of [["future day",enc((T+1)+".80-60-40.X")],["day before archive start",enc("20000.80-60-40")],["garbage","!!!"],["score 0",enc(T+".0-60-40")],["plain (unencoded) form",T+".80-60-40"],["XSS in name",enc(T+".80-60-40.<img src=x onerror=alert(1)>")]]){
  p=await mk("?c="+q);const v=await p.evaluate(()=>({view:document.body.getAttribute("data-view"),ch:localStorage.getItem("rq-ch-"+today),banner:(document.querySelector(".chb")||{}).innerText||null,url:location.href}));rec("challenge: "+lab,null,v);await p.context().close();}
 // /Qatar path keeps the query
 p=await page();await p.goto("https://www.roughly.gg/Qatar?c="+enc(T+".50-50-50.Ali"));await ready(p);await p.waitForTimeout(800);
 rec("/Qatar?c=... forwards to the game and keeps the challenge",await p.evaluate(()=>!!document.querySelector(".chb")),p.url());await p.context().close();
 // challenge across time zones: Doha friend sends at 01:00 Doha (New York still on the previous day)
 p=await page({ctx:{timezoneId:"America/New_York"},clock:new Date("2026-11-11T22:00:00Z")});await p.goto(URL+"?c="+enc((T+1)+".70-70-70.Doha"));await ready(p);await p.waitForTimeout(600);
 rec("challenge from Doha (new day) opened in New York (still previous day)",null,await p.evaluate(()=>({nyToday:today,banner:(document.querySelector(".chb")||{}).innerText||"NO BANNER - link silently ignored",view:document.body.getAttribute("data-view")})));
 await p.context().close();}
// 6 midnight rollover: start at 23:58 Doha, finish after midnight
{const p=await page({clock:new Date("2026-11-11T20:58:00Z")});await p.goto(URL);await ready(p);const d0=await p.evaluate(()=>({today,ids:ids.join(",")}));
 await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(300);await p.click("#nx");
 await p.clock.fastForward("05:00");await p.waitForTimeout(500);
 for(let n=1;n<3;n++){await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(300);await p.click("#nx");await p.waitForTimeout(300);}
 await p.waitForTimeout(800);
 const d1=await p.evaluate(()=>({today,day,dayNum:dayNum(),stored:Object.keys(localStorage).filter(k=>/^tk8-s/.test(k)),streak:stats.streak,countdown:(document.getElementById("cdn")||{}).textContent}));
 rec("finishing after midnight (started 23:58)",null,{start:d0,end:d1});
 await p.evaluate(()=>document.dispatchEvent(new Event("visibilitychange")));await p.waitForTimeout(800);
 rec("after app regains focus past midnight",null,await p.evaluate(()=>({today,view:document.body.getAttribute("data-view"),ids:ids.join(",")})));
 await p.context().close();}
// 7 streak + coin: yesterday played, 2-day streak -> today makes 3 -> coin
{const p=await page({init:()=>{if(!localStorage.getItem("__seeded")){const t=Math.floor(Date.UTC(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())/864e5);localStorage.setItem("tk7-stats",JSON.stringify({streak:2,last:t-1,played:2,total:300}));localStorage.setItem("rq-gift","n");localStorage.setItem("__seeded","1")}}});
 await p.goto(URL);await ready(p);
 for(let n=0;n<3;n++){await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(300);await p.click("#nx");await p.waitForTimeout(300);}
 await p.waitForTimeout(1500);const c=await p.evaluate(()=>({streak:stats.streak,coins:coinsGet().n,pop:(document.getElementById("pop")||{}).innerText}));
 rec("3-day streak awards a coin + popup",c.coins===1&&!!c.pop,c);await p.screenshot({path:OUT+"e-05-coin-earned.png"});
 if(c.pop)await p.click("#popb");await p.waitForTimeout(400);
 await p.click("#cspend");await p.waitForTimeout(800);const bz=await p.evaluate(()=>({bonus:!!bonus,bd:st.bd,ids:ids,today,coins:coinsGet().n,streak:stats.streak}));
 rec("spending a coin starts a bonus game from a missed drop",bz.bonus&&bz.coins===0,bz);await p.screenshot({path:OUT+"e-06-bonus-game.png"});
 for(let n=0;n<3;n++){await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(300);await p.click("#nx");await p.waitForTimeout(300);}
 await p.waitForTimeout(1200);rec("bonus game does not change streak/played",null,await p.evaluate(()=>({streak:stats.streak,played:stats.played})));
 await p.screenshot({path:OUT+"e-07-bonus-results.png"});await p.context().close();}
// 8 zero coins CTA
{const p=await page({init:()=>{localStorage.setItem("rq-gift","n")}});await p.goto(URL);await ready(p);
 for(let n=0;n<3;n++){await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(300);await p.click("#nx");await p.waitForTimeout(300);}
 await p.waitForTimeout(800);await p.click("#cspend");await p.waitForTimeout(500);rec("'Spend a coin' with 0 coins",null,await p.evaluate(()=>(document.getElementById("pop")||{}).innerText));
 await p.screenshot({path:OUT+"e-08-zero-coins-popup.png"});await p.context().close();}
// 9 narrow 320px + very long number on reveal
{const p=await page({ctx:{viewport:{width:320,height:568},deviceScaleFactor:2,isMobile:true,hasTouch:true}});await p.goto(URL);await ready(p);await p.waitForSelector("#in");
 await p.screenshot({path:OUT+"e-09-320px-question.png"});
 const f1=await p.evaluate(()=>({sh:document.scrollingElement.scrollHeight,ih:innerHeight,sw:document.scrollingElement.scrollWidth}));
 await p.type("#in","123456789012345");await p.click("#go");await p.waitForTimeout(2600);await p.screenshot({path:OUT+"e-10-320px-reveal-huge-guess.png"});
 const f2=await p.evaluate(()=>({sh:document.scrollingElement.scrollHeight,ih:innerHeight,sw:document.scrollingElement.scrollWidth,cmp:document.querySelector(".cmp").innerText.replace(/\n/g," "),verd:document.querySelector(".rverd").innerText}));
 rec("320px (iPhone SE 1st gen) question + reveal",null,{question:f1,reveal:f2});await p.context().close();}
// 10 reduced motion + landscape
{const p=await page({ctx:{reducedMotion:"reduce"}});await p.goto(URL);await ready(p);await p.waitForSelector("#in");await p.type("#in","1000");await p.click("#go");await p.waitForTimeout(250);
 rec("reduced motion: reveal score shows immediately",null,await p.textContent("#sn"));await p.context().close();}
{const p=await page({ctx:{viewport:{width:844,height:390}}});await p.goto(URL);await ready(p);await p.waitForSelector("#in");await p.screenshot({path:OUT+"e-11-landscape.png"});
 rec("landscape phone question screen",null,await p.evaluate(()=>({sh:document.scrollingElement.scrollHeight,ih:innerHeight,inputVisible:document.getElementById("go").getBoundingClientRect().bottom<=innerHeight})));await p.context().close();}
// 11 group invite link with bad code + og tags
{const p=await page();await p.goto(URL+"?g=zzzzzzz");await ready(p);await p.waitForTimeout(1500);rec("invalid group invite link",null,await p.evaluate(()=>({view:document.body.getAttribute("data-view"),sheetOpen:document.getElementById("sheet").classList.contains("open")})));
 const og=await p.evaluate(()=>[...document.querySelectorAll("meta[property^=og],meta[name^=twitter],link[rel=icon],link[rel=apple-touch-icon],link[rel=manifest]")].map(m=>(m.getAttribute("property")||m.getAttribute("name")||m.getAttribute("rel"))+"="+(m.content||m.href)));
 rec("root page social tags",null,og);
 const res=await p.request.get("https://www.roughly.gg/banner.jpg");rec("banner.jpg",res.ok(),res.status()+" "+res.headers()["content-type"]+" "+(await res.body()).length+" bytes");
 const html=await p.request.get(URL);rec("index.html size",null,(await html.body()).length+" bytes");
 await p.context().close();}
// 12 accessibility basics
{const p=await page();await p.goto(URL);await ready(p);await p.waitForSelector("#in");
 rec("buttons without an accessible name",null,await p.evaluate(()=>[...document.querySelectorAll("button")].filter(b=>!b.textContent.trim()&&!b.getAttribute("aria-label")&&b.offsetParent).map(b=>b.id||b.className)));
 rec("html lang / dir",null,await p.evaluate(()=>[document.documentElement.lang,document.documentElement.dir]));
 rec("viewport meta",null,await p.evaluate(()=>(document.querySelector("meta[name=viewport]")||{}).content));
 await p.context().close();}
await B.close();fs.writeFileSync("edge-log.json",JSON.stringify(R,null,1));})().catch(e=>{console.error(e);process.exit(1)});
