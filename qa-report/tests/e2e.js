const {chromium,devices}=require('playwright');const {install}=require('./fakefb.js');const fs=require('fs');
const OUT=require("path").join(__dirname,"../screenshots/");const URL="https://www.roughly.gg/";
const log=[];const note=(k,v)=>{log.push([k,v]);console.log(k,typeof v==="string"?v:JSON.stringify(v));};
async function fit(p,label){const r=await p.evaluate(()=>({sh:document.scrollingElement.scrollHeight,ih:innerHeight,sw:document.scrollingElement.scrollWidth,iw:innerWidth}));
  note(label+" fit",`${r.sh}px tall vs ${r.ih}px viewport${r.sh>r.ih+2?" -> SCROLLS":""}; width ${r.sw}/${r.iw}${r.sw>r.iw+1?" -> HORIZONTAL OVERFLOW":""}`);}
async function shot(p,name){await p.screenshot({path:OUT+name+".png"});}
async function run(kind){
  const b=await chromium.launch();
  const opt=kind==="mobile"?{...devices["iPhone 13"],locale:"en-GB",timezoneId:"Asia/Qatar"}:{viewport:{width:1440,height:900},deviceScaleFactor:2,locale:"en-GB",timezoneId:"Asia/Qatar"};
  const ctx=await b.newContext(opt);await install(ctx);
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push("pageerror: "+e.message));p.on("console",m=>{if(m.type()==="error")errs.push("console: "+m.text())});
  p.on("requestfailed",r=>{const u=r.url();if(!/googleapis|firebase|identitytoolkit/.test(u))errs.push("requestfailed: "+u)});
  const P=kind[0]+"-";const t0=Date.now();
  await p.goto(URL,{waitUntil:"load"});note(kind+" load ms",Date.now()-t0);
  await p.waitForTimeout(1200);await shot(p,P+"01-first-visit");
  note(kind+" first screen view",await p.evaluate(()=>document.body.getAttribute("data-view")));
  const Qs=await p.evaluate(()=>ids.map(i=>({i,t:Q[i].t,m:Q[i].m,u:Q[i].u,c:Q[i].c})));note(kind+" today's questions",Qs.map(q=>`#${q.i} ${q.t} (m=${q.m} ${q.u})`));
  if(await p.$("#how")){await p.click("#how").catch(()=>{});await p.waitForTimeout(700);await shot(p,P+"02-how-to-play");await p.evaluate(()=>closeSheet());await p.waitForTimeout(400);}
  const guesses=[Qs[0].m*2,Qs[1].m/10,Qs[2].m];
  for(let n=0;n<3;n++){
    await p.waitForSelector("#in");await p.waitForTimeout(500);
    if(n===0){await fit(p,kind+" Q1");await shot(p,P+"03-q1-empty");}
    const g=guesses[n];await p.fill("#in","");await p.type("#in",String(Math.round(g*100)/100),{delay:20});
    if(n===0){await p.waitForTimeout(300);await shot(p,P+"04-q1-typed");}
    // hint/tools
    if(n===0){const tb=await p.$$eval("button",bs=>bs.map(b=>(b.id||"")+":"+b.textContent.trim().slice(0,30)).filter(Boolean));note(kind+" Q1 buttons",tb);}
    await p.click("#go");await p.waitForTimeout(2600);
    await fit(p,kind+" reveal "+(n+1));await shot(p,P+"0"+(5+n*2)+"-reveal-"+(n+1));
    const shown=await p.evaluate(()=>({score:document.getElementById("sn")&&document.getElementById("sn").textContent,verd:(document.querySelector(".rverd")||{}).textContent,cmp:(document.querySelector(".cmp")||{}).innerText,graph:(document.getElementById("cbox")||{}).innerText}));
    note(kind+" reveal "+(n+1),shown);
    if(n===0){await p.click("#lg");await p.waitForTimeout(800);await shot(p,P+"06-see-the-maths");await p.evaluate(()=>closeSheet());await p.waitForTimeout(400);}
    await p.click("#nx");await p.waitForTimeout(600);
  }
  await p.waitForTimeout(2600);await fit(p,kind+" results");await shot(p,P+"11-results");
  await p.screenshot({path:OUT+P+"11b-results-fullpage.png",fullPage:true});
  const st=await p.evaluate(()=>({s:st.s,expect:st.g.map((g,i)=>score(g,Q[ids[i]])),big:document.getElementById("sn").textContent,rows:[...document.querySelectorAll(".qr")].map(r=>r.innerText.replace(/\n/g," | ")),chart:(document.getElementById("cbox")||{}).innerText}));
  note(kind+" results",st);
  await p.click("#sh");await p.waitForTimeout(900);await shot(p,P+"12-share-sheet");
  note(kind+" share text",await p.evaluate(()=>{const t=document.getElementById("nt");return t&&t.value}));
  note(kind+" share links",await p.evaluate(()=>["wa","tg","tw"].map(i=>document.getElementById(i)&&document.getElementById(i).href)));
  await p.evaluate(()=>closeSheet());await p.waitForTimeout(400);
  await p.click("#dsh");await p.waitForTimeout(3500);await shot(p,P+"13-home-dashboard");await p.screenshot({path:OUT+P+"13b-home-fullpage.png",fullPage:true});
  note(kind+" home text",await p.evaluate(()=>document.getElementById("app").innerText.replace(/\n+/g," | ").slice(0,600)));
  if(await p.isVisible("#menu"))await p.click("#menu");else await p.evaluate(()=>openMenu());await p.waitForTimeout(800);await shot(p,P+"14-menu");
  note(kind+" menu",await p.evaluate(()=>document.getElementById("sheet").innerText.replace(/\n+/g," | ")));
  await p.evaluate(()=>closeSheet());await p.waitForTimeout(300);
  await p.evaluate(()=>openGroups());await p.waitForTimeout(1200);await shot(p,P+"15-groups");await p.evaluate(()=>closeSheet());
  // reload behaviour after finishing
  await p.reload();await p.waitForTimeout(2500);note(kind+" after reload view",await p.evaluate(()=>document.body.getAttribute("data-view")));
  if(kind==="mobile"){
    await p.evaluate(()=>toggleLang());await p.waitForTimeout(1500);await shot(p,P+"16-home-arabic");
    await p.evaluate(()=>{intro=false;render()});await p.waitForTimeout(2600);await shot(p,P+"17-results-arabic");
    await p.evaluate(()=>toggleLang());
  }
  note(kind+" console/page errors",errs);note(kind+" Firebase writes (fake, in-memory)",await p.evaluate(()=>window.__fsw));
  await b.close();
}
(async()=>{for(const k of (process.argv[2]||"mobile,desktop").split(","))await run(k);fs.writeFileSync("e2e-log-"+(process.argv[2]||"all")+".json",JSON.stringify(log,null,1));})().catch(e=>{console.error(e);process.exit(1)});
