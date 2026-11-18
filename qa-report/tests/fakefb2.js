// Fake Firebase for local tests: Auth (anonymous, Google link/switch, second app instance, sign-out) and Firestore,
// with data kept on the test server (/kv) so several browser profiles ("devices") share one database and one set of
// Google accounts. Security rules are NOT enforced here.
const KV="http://127.0.0.1:8772/kv";
const APP=`const apps=[];export function initializeApp(c,name){const a={c,name:name||"[DEFAULT]"};apps.push(a);return a;}export async function deleteApp(a){}`;
const AUTH=`
const KV="${KV}";const kv=async(op,body)=>(await fetch(KV,{method:"POST",body:JSON.stringify(Object.assign({op},body||{}))})).json();
const auths=new Map();
function mk(id,anon,email){return {uid:id,isAnonymous:anon,email:email||"",displayName:anon?"":"Gee Player",getIdToken:async()=>"tok-"+id};}
export function getAuth(app){if(!auths.has(app))auths.set(app,{app,_cur:null,_subs:[],get currentUser(){return this._cur}});return auths.get(app);}
const isMain=a=>a.app.name==="[DEFAULT]";
function setCur(a,u){a._cur=u;if(isMain(a)){if(u){localStorage.setItem("__fakeuid",u.uid);if(u.isAnonymous)localStorage.removeItem("__fakeg");else localStorage.setItem("__fakeg",u.email)}else{localStorage.removeItem("__fakeuid");localStorage.removeItem("__fakeg")}}a._subs.forEach(f=>f(u));}
export function onAuthStateChanged(a,cb){a._subs.push(cb);setTimeout(()=>{const id=localStorage.getItem("__fakeuid"),g=localStorage.getItem("__fakeg");if(id&&isMain(a))a._cur=mk(id,!g,g||"");cb(a._cur);},20);}
export async function signInAnonymously(a){setCur(a,mk("anon"+Math.random().toString(36).slice(2,8),true));return {user:a._cur};}
export class GoogleAuthProvider{setCustomParameters(){}static credentialFromError(e){return e.__cred||null}}
export async function linkWithPopup(user,p){if(window.__popupError){const e=new Error("x");e.code=window.__popupError;throw e;}
  const em=window.__gEmail||"gee@example.com",acc=(await kv("get",{path:"__gacc"})).v||{};
  if(acc[em]&&acc[em]!==user.uid){const e=new Error("Firebase: credential already in use");e.code="auth/credential-already-in-use";e.__cred={email:em};throw e;}
  acc[em]=user.uid;await kv("set",{path:"__gacc",v:acc});user.isAnonymous=false;user.email=em;user.displayName="Gee Player";localStorage.setItem("__fakeg",em);return {user};}
export async function signInWithCredential(a,cred){const acc=(await kv("get",{path:"__gacc"})).v||{};setCur(a,mk(acc[cred.email],false,cred.email));return {user:a._cur};}
export async function signInWithPopup(a){const em=window.__gEmail||"admin@example.com",acc=(await kv("get",{path:"__gacc"})).v||{};if(!acc[em]){acc[em]="g"+Math.random().toString(36).slice(2,8);await kv("set",{path:"__gacc",v:acc});}setCur(a,mk(acc[em],false,em));return {user:a._cur};}
export async function updateCurrentUser(a,u){a._cur=u;}
export async function signOut(a){setCur(a,null);}`;
const FS=`
const KV="${KV}";const kv=async(op,body)=>(await fetch(KV,{method:"POST",body:JSON.stringify(Object.assign({op},body||{}))})).json();
window.__fsw=window.__fsw||[];window.__gd=window.__gd||[];
export function getFirestore(app){return {app};}
export function doc(db,...p){return {db,path:p.join("/"),id:p[p.length-1]};}
export function collection(db,...p){return {cpath:p.join("/")};}
export function where(f,op,v){return {t:"w",f,op,v};}
export function limit(n){return {t:"l",n};}
export function orderBy(f,d){return {t:"o",f,d};}
export function startAt(v){return {t:"sa",v};}
export function endAt(v){return {t:"ea",v};}
export function documentId(){return "__name__";}
export function query(c,...w){return {cpath:c.cpath,w};}
export function serverTimestamp(){return {__ts:1};}
export function arrayUnion(...v){return {__u:v};}
export function arrayRemove(...v){return {__r:v};}
function snap(path,data){return {id:path.split("/").pop(),exists:()=>data!==undefined&&data!==null,data:()=>data};}
function apply(cur,data,merge){const out=merge?JSON.parse(JSON.stringify(cur||{})):{};
  for(const k in data){let v=data[k];const ks=k.split(".");let o=out;for(let i=0;i<ks.length-1;i++){o[ks[i]]=(o[ks[i]]&&typeof o[ks[i]]==="object")?o[ks[i]]:{};o=o[ks[i]];}const last=ks[ks.length-1];
    if(v&&v.__u){o[last]=(o[last]||[]).slice();v.__u.forEach(x=>{if(o[last].indexOf(x)<0)o[last].push(x)});}else if(v&&v.__r){o[last]=(o[last]||[]).filter(x=>v.__r.indexOf(x)<0);}else if(v&&v.__ts){o[last]=Date.now();}else o[last]=v;}
  return out;}
export async function getDoc(r){return snap(r.path,(await kv("get",{path:r.path})).v);}
export async function setDoc(r,data,o){const cur=(await kv("get",{path:r.path})).v;await kv("set",{path:r.path,v:apply(cur,data,o&&o.merge)});window.__fsw.push(r.path);}
export async function updateDoc(r,data){const cur=(await kv("get",{path:r.path})).v;if(cur==null)throw Object.assign(new Error("No document to update"),{code:"not-found"});await kv("set",{path:r.path,v:apply(cur,data,true)});window.__fsw.push(r.path);}
export async function deleteDoc(r){await kv("del",{path:r.path});}
export async function getDocs(q){window.__gd.push(q.cpath);const all=(await kv("list",{prefix:q.cpath+"/"})).v||{},out=[];
  for(const k in all){if(k.slice(q.cpath.length+1).indexOf("/")>=0)continue;const v=all[k];let ok=true;
    for(const w of (q.w||[])){if(w.t!=="w")continue;if(w.op==="=="&&v[w.f]!==w.v)ok=false;if(w.op==="in"&&w.v.indexOf(v[w.f])<0)ok=false;if(w.op==="array-contains"&&(v[w.f]||[]).indexOf(w.v)<0)ok=false;}
    if(ok)out.push(snap(k,v));}
  const W=q.w||[],o=W.find(w=>w.t==="o"),sa=W.find(w=>w.t==="sa"),ea=W.find(w=>w.t==="ea"),lm=W.find(w=>w.t==="l");let res=out.slice();
  if(o){const key=d=>o.f==="__name__"?d.id:(d.data()[o.f]);res=res.filter(d=>key(d)!==undefined);
    if(sa)res=res.filter(d=>String(key(d))>=String(sa.v));if(ea)res=res.filter(d=>String(key(d))<=String(ea.v));
    res.sort((x,y)=>{const a=key(x),b=key(y),c=(typeof a==="number"&&typeof b==="number")?a-b:String(a).localeCompare(String(b));return o.d==="desc"?-c:c});}
  if(lm)res=res.slice(0,lm.n);out.length=0;res.forEach(x=>out.push(x));
  return {docs:out,size:out.length,forEach:f=>out.forEach(f)};}`;
async function install(ctx,o={}){
  await ctx.route(/gstatic\.com\/firebasejs/,async r=>{const u=r.request().url();if(o.slowSdk)await new Promise(x=>setTimeout(x,o.slowSdk));
    r.fulfill({status:200,contentType:"application/javascript",headers:{"access-control-allow-origin":"*"},body:u.includes("firebase-app")?APP:u.includes("firebase-auth")?AUTH:FS});});
  await ctx.route(/(googleapis\.com|firebaseio\.com|firebaseapp\.com|identitytoolkit|securetoken|googletagmanager|google-analytics)/,r=>{const u=r.request().url();if(/fonts\.googleapis\.com/.test(u))return r.continue();r.abort();});
}
module.exports={install};
