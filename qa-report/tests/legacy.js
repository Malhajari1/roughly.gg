// Evaluate pick(d) under an older index.html (only the question bank + picker, no DOM).
const fs=require('fs'),vm=require('vm');
function picker(html){
  const js=html.split(/<script>/)[2]||html; // main game script
  const src=html.slice(html.indexOf("var Q="),html.indexOf("var HINTS="));
  const rngSrc=(html.match(/function rng\(s\)\{[^\n]*/)||[""])[0];
  const skip=(html.match(/var SKIP=\{[^}]*\}/)||["var SKIP={}"])[0];
  const lp=(html.match(/function (legacyPick|pick)\(d\)\{var r=rng[\s\S]*?return \[O\[0\],O\[1\],H\[0\]\]\}/)||[""])[0].replace(/function pick\(/,"function legacyPick(");
  const ctx={};vm.createContext(ctx);vm.runInContext("var COUNTRY='Qatar',_cn={};"+src+";"+rngSrc+";"+skip+";"+lp+";this.lp=legacyPick;this.n=Q.length;this.Q=Q;",ctx);return ctx;}
const [a,b,days]=process.argv.slice(2);
const A=picker(fs.readFileSync(a,"utf8")),B=picker(fs.readFileSync(b,"utf8"));
console.log("old bank",A.n,"new bank",B.n);
let diff=0;for(const d of days.split(",").map(Number)){const x=A.lp(d),y=B.lp(d);if(String(x)!==String(y))diff++;
 console.log(new Date(d*864e5).toISOString().slice(0,10),"then:",x.join(","),"now:",y.join(","),String(x)===String(y)?"same":"CHANGED");}
