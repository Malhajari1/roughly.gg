// Static file server for the repo + a mock Realtime Database REST API that mirrors backend/database.rules.json.
const http=require('http'),fs=require('fs'),path=require('path');const ROOT="/home/user/roughly.gg";
const DB={};let log=[];
const get=(p)=>p.split('/').filter(Boolean).reduce((o,k)=>o==null?undefined:o[k],DB);
function set(p,v){const ks=p.split('/').filter(Boolean);let o=DB;ks.slice(0,-1).forEach(k=>{o[k]=o[k]||{};o=o[k]});o[ks[ks.length-1]]=v;}
function check(uid,P){ // returns null if allowed, else reason
  const keys=Object.keys(P);
  for(const k of keys){const m=/^s\/(\d{5})\/(.+)$/.exec(k),h=/^p\/([^/]+)\/h\/(\d{5})$/.exec(k);
    if(h){if(h[1]!==uid)return "not your profile";if(get(k)!==undefined)return "history is write-once";continue;}
    if(!m)return "path not allowed: "+k;const day=m[1],rest=m[2],hk="p/"+uid+"/h/"+day;
    if(get(hk)!==undefined)return "already counted";const H=P[hk];if(!H)return "no history in same write";
    const v=P[k],cur=get(k)||0,inc=v&&v[".sv"]&&v[".sv"].increment;
    if(rest==="n"){if(inc!==1)return "n must +1";continue}
    if(rest==="sum"){if(inc!==H.a)return "sum must + own avg";continue}
    let mm=/^d\/(b\d+)$/.exec(rest);if(mm){if(inc!==1||H.sb!==mm[1])return "day bin";continue}
    mm=/^q\/(\d+)\/(\w+)$/.exec(rest);if(mm){const hq=H.q&&H.q[mm[1]];if(!hq||inc!==1)return "q";if(!(mm[2]==="n"||mm[2]===hq.b||mm[2]===hq.x))return "bin not yours";continue}
    return "unknown "+k;}
  return null;}
http.createServer((req,res)=>{const u=new URL(req.url,"http://x");
  if(u.pathname.startsWith("/rtdb/")){const p=u.pathname.slice(6).replace(/\.json$/,"").replace(/^\//,"");const tok=u.searchParams.get("auth")||"";const uid=tok.replace(/^tok-/,"");
    res.setHeader("access-control-allow-origin","*");res.setHeader("access-control-allow-methods","GET,PATCH");if(req.method==="OPTIONS"){res.end();return}
    if(req.method==="GET"){log.push("GET "+p);if(p.startsWith("p/")&&!p.startsWith("p/"+uid)){res.statusCode=401;res.end('{"error":"Permission denied"}');return}res.setHeader("content-type","application/json");res.end(JSON.stringify(p?(get(p)??null):DB));return}
    if(req.method==="PATCH"){let b="";req.on("data",c=>b+=c);req.on("end",()=>{const P=JSON.parse(b);log.push("PATCH "+Object.keys(P).length+" paths");
      if(u.searchParams.get("slow")){} const why=check(uid,P);if(why){log.push("DENIED "+why);res.statusCode=401;res.end(JSON.stringify({error:"Permission denied",why}));return}
      for(const k in P){const v=P[k];if(v&&v[".sv"])set(k,(get(k)||0)+v[".sv"].increment);else set(k,v);}res.end("{}");});return}}
  if(u.pathname==="/__log"){res.end(JSON.stringify({log,DB}));return}
  if(u.pathname==="/__reset"){for(const k in DB)delete DB[k];log=[];res.end("ok");return}
  let f=path.join(ROOT,u.pathname==="/"?"index.html":u.pathname);if(u.pathname==="/rt.html")f="/tmp/claude-0/-home-user-roughly-gg/d074bb44-b2c0-5a66-8866-5a879378e0ae/scratchpad/qa/rt.html";
  fs.readFile(f,(e,d)=>{if(e){res.statusCode=404;res.end();return}res.setHeader("content-type",f.endsWith(".html")?"text/html":"application/javascript");res.end(d)});
}).listen(8772,"127.0.0.1",()=>console.log("mock up"));
