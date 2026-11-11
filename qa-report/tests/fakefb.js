// Fake in-memory Firebase modules. Nothing reaches real Firebase.
const APP=`export function initializeApp(c){return {c};}`;
const AUTH=`
let cur=null;const subs=[];
export function getAuth(){return {get currentUser(){return cur;}};}
export function onAuthStateChanged(a,cb){subs.push(cb);setTimeout(()=>{let id=localStorage.getItem("__fakeuid");if(id)cur={uid:id,isAnonymous:true,email:""};cb(cur);},20);}
export async function signInAnonymously(){const id="qa"+Math.random().toString(36).slice(2,8);localStorage.setItem("__fakeuid",id);cur={uid:id,isAnonymous:true,email:""};subs.forEach(f=>f(cur));return {user:cur};}
export class GoogleAuthProvider{}
export async function linkWithPopup(){throw new Error("popup blocked in QA");}
export async function signInWithPopup(){throw new Error("popup blocked in QA");}`;
const FS=`
function L(){try{return JSON.parse(localStorage.getItem("__fakedb"))||{};}catch(e){return {};}}
function S(d){localStorage.setItem("__fakedb",JSON.stringify(d));}
window.__fsw=[];
export function getFirestore(){return {};}
export function doc(db,...p){return {path:p.join("/"),id:p[p.length-1]};}
export function collection(db,...p){return {cpath:p.join("/")};}
export function where(f,op,v){return {t:"w",f,op,v};}
export function limit(n){return {t:"l",n};}
export function query(c,...w){return {cpath:c.cpath,w};}
export function serverTimestamp(){return Date.now();}
export function arrayUnion(...v){return {__u:v};}
export function arrayRemove(...v){return {__r:v};}
function snap(path,data){return {id:path.split("/").pop(),exists:()=>data!==undefined,data:()=>data};}
export async function getDoc(r){return snap(r.path,L()[r.path]);}
export async function setDoc(r,data,o){const d=L();d[r.path]=o&&o.merge?Object.assign({},d[r.path],data):data;S(d);window.__fsw.push(r.path);}
export async function updateDoc(r,data){const d=L(),cur=Object.assign({},d[r.path]);if(!d[r.path])throw new Error("nf");
  for(const k in data){const v=data[k];if(v&&v.__u){cur[k]=(cur[k]||[]).slice();v.__u.forEach(x=>{if(cur[k].indexOf(x)<0)cur[k].push(x)});}else if(v&&v.__r){cur[k]=(cur[k]||[]).filter(x=>v.__r.indexOf(x)<0);}else cur[k]=v;}
  d[r.path]=cur;S(d);window.__fsw.push(r.path);}
export async function deleteDoc(r){const d=L();delete d[r.path];S(d);}
export async function getDocs(q){const d=L(),out=[];const cp=q.cpath;
  for(const k in d){if(k.indexOf(cp+"/")!==0||k.slice(cp.length+1).indexOf("/")>=0)continue;const v=d[k];let ok=true;
    for(const w of (q.w||[])){if(w.t!=="w")continue;if(w.op==="=="&&v[w.f]!==w.v)ok=false;if(w.op==="in"&&w.v.indexOf(v[w.f])<0)ok=false;if(w.op==="array-contains"&&(v[w.f]||[]).indexOf(w.v)<0)ok=false;}
    if(ok)out.push(snap(k,v));}
  return {docs:out,size:out.length,forEach:f=>out.forEach(f)};}`;
async function install(ctx){
  // Firebase SDK -> fakes; every other Google backend host -> aborted, as a second safety net.
  await ctx.route(/gstatic\.com\/firebasejs/,r=>{const u=r.request().url();r.fulfill({status:200,contentType:"application/javascript",headers:{"access-control-allow-origin":"*"},body:u.includes("firebase-app")?APP:u.includes("firebase-auth")?AUTH:FS});});
  await ctx.route(/(googleapis\.com|firebaseio\.com|firebaseapp\.com|identitytoolkit|securetoken)/,r=>{const u=r.request().url();if(/fonts\.googleapis\.com/.test(u))return r.continue();r.abort();});
}
module.exports={install};
