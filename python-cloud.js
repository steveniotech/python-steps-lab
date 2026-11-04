'use strict';
(function(root){
 const C=root.PythonCore||(typeof require==='function'?require('./python-core.js'):null);
 const L=root.PythonLessons||(typeof require==='function'?require('./python-lessons.js'):null);
 const clean=value=>C.normalize(value,L);
 const copy=value=>JSON.parse(JSON.stringify(value));
 const username=value=>String(value).trim().toLowerCase();
 function accountEmail(value,domain){
  const name=username(value);
  if(!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(name))throw new Error('Use the 3–32 character student ID your teacher gave you.');
  return name+'@'+domain;
 }
 function validateConfig(config){
  if(!config?.enabled)return false;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)||!/^students\.[a-z0-9.-]+$/.test(config.accountDomain))throw new Error('Cloud configuration is incomplete. Local learning is still available.');
  return true;
 }
 class CloudError extends Error{constructor(message,status=0,code=''){super(message);this.status=status;this.code=code;}}
 function createAPI(config,{fetch:fetcher=root.fetch,sessionStorage:providedStore,now=Date.now}={}){
  validateConfig(config);
  let store=providedStore;
  if(!store)try{store=root.sessionStorage;}catch{/* Some browsers deny access to the property itself. */}
  store=store||{getItem:()=>null,setItem(){},removeItem(){}};
  const sessionKey='python-steps-auth:'+config.url;
  let session=null,refreshing=null,epoch=0;
  try{session=JSON.parse(store.getItem(sessionKey)||'null');}catch{/* A blocked session store requires signing in again after refresh. */}
  function remember(value){session=value?{...value,expires_at:value.expires_at||Math.floor(now()/1000)+(value.expires_in||3600)}:null;try{if(session)store.setItem(sessionKey,JSON.stringify(session));else store.removeItem(sessionKey);}catch{/* Tokens stay in memory only. */}}
  async function raw(path,{method='GET',body,token,keepalive=false}={}){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const response=await fetcher(config.url+path,{method,headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,keepalive});
    const text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch{/* Do not render raw proxy error pages. */}
    if(!response.ok&&path==='/functions/v1/classroom-admin'&&data?.manual_review_required===true){
     const id=typeof data.created_user_id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.created_user_id)?data.created_user_id:null;
     const error=new CloudError('Account creation needs manual review. Do not retry.'+(id?' Created Auth account ID: '+id+'.':' Inspect Auth for the requested ID.'),response.status);
     error.manualReview=true;error.createdUserId=id;throw error;
    }
    if(!response.ok)throw new CloudError(response.status===429?'Too many attempts. Wait a moment and try again.':response.status===401||response.status===400&&path.includes('/token')?'Sign-in failed or expired. Check your ID and password, then sign in again.':'Cloud request failed. Your work stays on this device.',response.status,data?.code||data?.error_code||'');
    return data;
   }catch(error){
    if(error instanceof CloudError)throw error;
    if(path==='/functions/v1/classroom-admin'&&body?.action==='create-student'){
     const interrupted=new CloudError('Account creation outcome is unknown. Do not retry; inspect Auth for the requested ID.');interrupted.manualReview=true;throw interrupted;
    }
    throw new CloudError('Cannot reach the cloud. Your work stays on this device.');
   }
   finally{clearTimeout(timer);}
  }
  async function refresh(){
   if(refreshing)return refreshing;
   if(!session?.refresh_token)throw new CloudError('Please sign in again to sync your work.',401);
   const token=session.refresh_token,started=epoch;
   refreshing=(async()=>{
    try{const data=await raw('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:token}});if(started!==epoch)throw new CloudError('Session changed. Please sign in again.',401);remember(data);return data;}
    catch(error){if(started===epoch&&[400,401,403].includes(error.status))remember(null);throw error;}
    finally{refreshing=null;}
   })();return refreshing;
  }
  async function request(path,options={}){
   const started=epoch;
   const sameSession=()=>{if(started!==epoch)throw new CloudError('Session changed. Please sign in again.',401);};
   if(!session?.access_token)throw new CloudError('Please sign in to sync your work.',401);
   if((session.expires_at||0)*1000<now()+60000)await refresh();
   sameSession();
   try{return await raw(path,{...options,token:session.access_token});}
   catch(error){if(error.manualReview||error.status!==401)throw error;sameSession();await refresh();sameSession();return raw(path,{...options,token:session.access_token});}
  }
  return {
   config,request,hasSession:()=>!!session?.refresh_token,
   async signIn(id,password){const started=++epoch;remember(null);const data=await raw('/auth/v1/token?grant_type=password',{method:'POST',body:{email:accountEmail(id,config.accountDomain),password}});if(started!==epoch)throw new CloudError('Session changed. Please sign in again.',401);remember(data);return this.identity();},
   async identity(){const user=await request('/auth/v1/user');const rows=await request('/rest/v1/lab_profiles?user_id=eq.'+encodeURIComponent(user.id)+'&select=user_id,username,display_name,role,teacher_id');if(rows?.length!==1)throw new CloudError('Your account is not set up. Ask your teacher for help.',403);return rows[0];},
   async signOut(){const token=session?.access_token;epoch++;remember(null);if(token)try{await raw('/auth/v1/logout?scope=local',{method:'POST',token});}catch{/* Local sign-out must work offline. */}},
   async load(userId){const rows=await request('/rest/v1/lab_progress?user_id=eq.'+encodeURIComponent(userId)+'&select=state,revision,updated_at');return rows[0]||{state:C.fresh(),revision:0,updated_at:null};},
   async save(state,revision){return request('/rest/v1/rpc/save_python_progress',{method:'POST',body:{p_state:clean(state),p_revision:revision}});},
   async roster(){return request('/rest/v1/lab_profiles?role=eq.student&select=user_id,username,display_name,lab_progress(state,revision,updated_at)&order=username&limit=500');},
   async admin(body){return request('/functions/v1/classroom-admin',{method:'POST',body});}
  };
 }
 // A revision check prevents old tabs/devices from silently replacing newer work.
 // No cloud data is accepted until the authenticated account has been loaded.
 function createSync({api,storage,onState=()=>{},onStatus=()=>{},schedule=setTimeout,cancel=clearTimeout}){
  let active=false,key='',state=C.fresh(),revision=0,pending=false,conflict=false,timer=null,inFlight=null,sequence=0,cacheWorks=true;
  const status=message=>onStatus({message,pending,conflict,cacheWorks});
  function cache(){try{storage.setItem(key,JSON.stringify({state,revision,pending}));cacheWorks=true;}catch{cacheWorks=false;}}
  function changed(next){return JSON.stringify(clean(next))!==JSON.stringify(state);}
  function retryLater(){if(active&&!conflict){cancel(timer);timer=schedule(()=>{void flush();},5000);}}
  async function open(userId){
   key='python-steps-cache:v1:'+api.config.url+':'+userId;
   const remote=await api.load(userId);revision=Number(remote.revision);
   let local=null;try{local=JSON.parse(storage.getItem(key)||'null');}catch{/* Recover from the cloud if the cache is unreadable. */}
   state=clean(remote.state);pending=false;conflict=false;active=true;
   if(local?.pending===true&&Number.isSafeInteger(local.revision)&&local.state?.version===1&&local.state.steps&&typeof local.state.steps==='object'){
    state=clean(local.state);pending=true;conflict=local.revision!==revision;
    // Keep the pending copy's original base revision across refreshes.
    revision=local.revision;
   }
   cache();onState(copy(state));status(conflict?'Another device has newer work. Choose which copy to continue.':pending?'Work on this device is waiting to sync.':'Cloud progress loaded.');
   if(pending&&!conflict)retryLater();return copy(state);
  }
  function update(next,{immediate=false}={}){
   if(!active||!changed(next))return;
   state=clean(next);sequence++;pending=true;cache();
   status(conflict?'Another device has newer work. Choose which copy to continue.':'Waiting to sync…');
   if(conflict)return;
   cancel(timer);timer=schedule(()=>{void flush();},immediate?0:700);
  }
  async function flush(){
   cancel(timer);if(inFlight)return inFlight;
   if(!active||!pending||conflict)return !pending;
   const snapshot=copy(state),sentSequence=sequence,expected=revision;
   status('Saving to cloud…');
   inFlight=(async()=>{
    try{
     const saved=await api.save(snapshot,expected);
     if(!active)return false;
     revision=Number(saved.revision);
     pending=sequence!==sentSequence;cache();status(pending?'New changes are waiting to sync.':'Saved to cloud');
     if(pending)retryLater();return !pending;
    }catch(error){
     if(!active)return false;
     if(error.status===409){conflict=true;status('Another device has newer work. Choose which copy to continue.');}
     else{status(error.message+(error.status===401?' Open your account, sign out, then sign in again.':'')+(cacheWorks?'':' Local storage is unavailable; keep this page open and export your work.'));if(error.status!==401)retryLater();}
     return false;
    }finally{inFlight=null;}
   })();return inFlight;
  }
  async function resolve(useLocal){
   if(inFlight)await inFlight;
   const remote=await api.load(key.slice(key.lastIndexOf(':')+1));
   // Preserve a recovery copy before explicitly discarding the displayed copy.
   if(!useLocal){try{storage.setItem(key+':recovery',JSON.stringify({state,revision,pending}));}catch{throw new CloudError('Cannot back up this device’s copy. Export it before loading cloud work.');}state=clean(remote.state);sequence++;}
   revision=Number(remote.revision);conflict=false;pending=useLocal;cache();onState(copy(state));
   status(useLocal?'Waiting to sync this device’s copy.':'Cloud progress loaded.');return useLocal?flush():true;
  }
  function close(){active=false;cancel(timer);}
  return {open,update,flush,resolve,close,snapshot:()=>({state:copy(state),revision,pending,conflict,cacheWorks}),get active(){return active;}};
 }
 root.PythonCloud={accountEmail,validateConfig,createAPI,createSync,CloudError};
 if(typeof module!=='undefined')module.exports=root.PythonCloud;
})(typeof globalThis!=='undefined'?globalThis:this);
