'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./python-core.js'),L=require('./python-lessons.js'),Cloud=require('./python-cloud.js');
const config={enabled:true,url:'https://omqknvspgjbfgjfefpqe.supabase.co',publishableKey:'sb_publishable_test',accountDomain:'students.pythonsteps.example'};
function memory(){const map=new Map();return {map,getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};}
function timers(){let count=0;const map=new Map();return {map,schedule:callback=>{map.set(++count,callback);return count;},cancel:id=>map.delete(id)};}
function firstUnit(){const state=C.fresh();for(const step of L.steps.slice(0,5)){C.award(state,step);C.record(state,step).draft=step.referenceCode;}state.currentStep='talk-5';state.view='lesson';return state;}
async function syncTests(){
 const storage=memory(),timer=timers(),messages=[];let remote={state:C.fresh(),revision:0},fail=false,saves=0;
 const api={config,load:async()=>structuredClone(remote),save:async(state,revision)=>{saves++;if(fail)throw new Cloud.CloudError('Offline',0);if(revision!==remote.revision)throw new Cloud.CloudError('Conflict',409);remote={state:structuredClone(state),revision:revision+1};return structuredClone(remote);}};
 const make=(extra={})=>Cloud.createSync({api,storage,...timer,onStatus:value=>messages.push(value),...extra});
 const one=make();await one.open('student-a');one.update(firstUnit(),{immediate:true});assert.equal(one.snapshot().pending,true);assert.ok(storage.map.size);await one.flush();assert.equal(one.snapshot().pending,false);assert.equal(remote.revision,1);one.close();
 const reopen=make();await reopen.open('student-a');assert.equal(C.stars(reopen.snapshot().state,L),30);assert.equal(C.badges(reopen.snapshot().state,L).length,1);assert.equal(C.continueStep(reopen.snapshot().state,L).id,'store-1');
 const newDevice=make({storage:memory()});await newDevice.open('student-a');assert.equal(C.stars(newDevice.snapshot().state,L),30,'cloud restores on a new device');
 fail=true;const next=reopen.snapshot().state;C.award(next,L.steps[5]);reopen.update(next);await reopen.flush();assert.equal(reopen.snapshot().pending,true);assert.ok(timer.map.size,'network failure schedules retry');reopen.close();
 const pending=make();await pending.open('student-a');assert.equal(C.stars(pending.snapshot().state,L),35,'same-account offline cache survives reopen');assert.equal(pending.snapshot().pending,true);fail=false;await pending.flush();assert.equal(remote.revision,2);
 const stale=newDevice.snapshot().state;C.record(stale,L.steps[6]).draft='print("my older device")';newDevice.update(stale);await newDevice.flush();assert.equal(newDevice.snapshot().conflict,true);assert.equal(remote.state.steps['store-1'].completed,true,'stale tab did not erase new work');
 // Reopening an offline conflict repeatedly must not rebase stale work silently.
 const conflictedStore=memory();conflictedStore.setItem('python-steps-cache:v1:'+config.url+':student-a',JSON.stringify({state:stale,revision:1,pending:true}));
 for(let i=0;i<2;i++){const reopenedConflict=make({storage:conflictedStore});await reopenedConflict.open('student-a');assert.equal(reopenedConflict.snapshot().conflict,true);assert.equal(reopenedConflict.snapshot().revision,1);await reopenedConflict.flush();reopenedConflict.close();}
 await newDevice.resolve(false);assert.equal(newDevice.snapshot().conflict,false);assert.equal(C.stars(newDevice.snapshot().state,L),35);assert.ok([...storage.map.keys()].every(key=>key.includes('student-a')));
 // A second account never inherits a first account's cache.
 remote={state:C.fresh(),revision:0};const second=make();await second.open('student-b');assert.equal(C.stars(second.snapshot().state,L),0);assert.equal(second.snapshot().pending,false);
 // A clean stale local cache must never be uploaded over a newer cloud reset.
 remote={state:firstUnit(),revision:5};const resetClient=make();await resetClient.open('reset-student');resetClient.close();remote={state:C.fresh(),revision:6};const afterReset=make();await afterReset.open('reset-student');assert.equal(C.stars(afterReset.snapshot().state,L),0);assert.equal(afterReset.snapshot().pending,false);
 // Persist edits made while a save is in flight, rather than marking them saved.
 let release;const delayed=make({storage:memory(),api:{config,load:async()=>({state:C.fresh(),revision:0}),save:async(state,revision)=>new Promise(resolve=>{release=()=>resolve({state,revision:revision+1});})}});
 await delayed.open('slow-student');delayed.update(firstUnit());const saving=delayed.flush();const edited=firstUnit();edited.steps['talk-1'].draft='print("new draft")';delayed.update(edited);release();await saving;assert.equal(delayed.snapshot().pending,true);assert.equal(delayed.snapshot().state.steps['talk-1'].draft,'print("new draft")');
 // Unavailable local storage is surfaced; cloud save can still succeed.
 const blocked=make({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('quota');}}});await blocked.open('blocked-student');blocked.update(firstUnit());await blocked.flush();assert.equal(blocked.snapshot().cacheWorks,false);assert.equal(blocked.snapshot().pending,false);
 // Explicitly choosing a local copy performs a fresh revision check.
 remote={state:C.fresh(),revision:10};await newDevice.resolve(true);assert.equal(remote.revision,11);assert.equal(C.stars(remote.state,L),35);
 const attempts=saves;newDevice.close();newDevice.update(C.fresh());await newDevice.flush();assert.equal(saves,attempts,'closed sessions cannot save');
 console.log('Cloud sync: unit-one reopen/new device, account isolation, offline pending recovery, retry, revision conflict, explicit resolution, cloud reset, in-flight edits, blocked storage, closed-session isolation passed.');
}
async function apiTests(){
 const store=memory(),calls=[];let expired=false,refreshes=0;
 const fetcher=async(url,options)=>{
  calls.push({url,options});const path=url.replace(config.url,'');
  if(path.includes('grant_type=password')){assert.equal(JSON.parse(options.body).email,'student-01@'+config.accountDomain);return Response.json({access_token:'access-a',refresh_token:'refresh-a',expires_in:3600});}
  if(path.includes('grant_type=refresh_token')){refreshes++;return Response.json({access_token:'access-b',refresh_token:'refresh-b',expires_at:9999999999});}
  if(expired&&options.headers.Authorization==='Bearer access-a')return Response.json({}, {status:401});
  if(path==='/auth/v1/user')return Response.json({id:'student-a'});
  if(path.startsWith('/rest/v1/lab_profiles'))return Response.json([{user_id:'student-a',username:'student-01',role:'student'}]);
  if(path.startsWith('/rest/v1/lab_progress'))return Response.json([]);
  if(path.startsWith('/auth/v1/logout'))return new Response(null,{status:204});
  throw Error('Unexpected '+path);
 };
 const api=Cloud.createAPI(config,{fetch:fetcher,sessionStorage:store});await api.signIn(' Student-01 ','long-password');assert.equal(api.hasSession(),true);assert.equal(refreshes,0,'expires_in is supported without constant refresh');
 expired=true;await Promise.all([api.load('student-a'),api.load('student-a')]);assert.equal(refreshes,1,'concurrent 401s share one refresh');
 const restored=Cloud.createAPI(config,{fetch:fetcher,sessionStorage:store});assert.equal((await restored.identity()).user_id,'student-a');
 await api.signOut();assert.equal(api.hasSession(),false);assert.equal(store.map.size,0);await assert.rejects(()=>api.load('student-a'),error=>error.status===401);
 assert.ok(calls.every(call=>call.options.headers.apikey===config.publishableKey));assert.ok(calls.every(call=>call.options.signal instanceof AbortSignal));
 // Never retry a request from account A with account B's token after a switch.
 let releaseOld,staleRetries=0;
 const switchStore=memory();switchStore.setItem('python-steps-auth:'+config.url,JSON.stringify({access_token:'old-a',refresh_token:'old-refresh',expires_at:9999999999}));
 const switching=Cloud.createAPI(config,{sessionStorage:switchStore,fetch:async(url,options)=>{
  if(url.includes('/rest/v1/rpc/')){if(options.headers.Authorization!=='Bearer old-a'){staleRetries++;return Response.json({revision:1});}return new Promise(resolve=>{releaseOld=()=>resolve(Response.json({}, {status:401}));});}
  if(url.includes('grant_type=password'))return Response.json({access_token:'new-b',refresh_token:'new-refresh',expires_at:9999999999});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'b'});
  if(url.includes('/rest/v1/lab_profiles'))return Response.json([{user_id:'b',role:'student'}]);
  return new Response(null,{status:204});
 }});
 const oldSave=switching.save(firstUnit(),0);await switching.signOut();await switching.signIn('student-01','password');releaseOld();await assert.rejects(()=>oldSave,error=>error.status===401);assert.equal(staleRetries,0);
 assert.throws(()=>Cloud.accountEmail('../bad',config.accountDomain));assert.equal(Cloud.validateConfig({enabled:false}),false);assert.throws(()=>Cloud.validateConfig({...config,publishableKey:'sb_secret_do-not-publish'}));
 const failedAdmin=Cloud.createAPI(config,{sessionStorage:switchStore,fetch:async()=>Response.json({manual_review_required:true,created_user_id:'00000000-0000-4000-8000-000000000001',error:'untrusted response'}, {status:502})});
 await assert.rejects(()=>failedAdmin.admin({action:'create-student'}),error=>error.manualReview===true&&error.createdUserId==='00000000-0000-4000-8000-000000000001'&&!error.message.includes('untrusted response'));
 const interruptedAdmin=Cloud.createAPI(config,{sessionStorage:switchStore,fetch:async()=>{throw Error('transport interrupted');}});
 await assert.rejects(()=>interruptedAdmin.admin({action:'create-student'}),error=>error.manualReview===true&&error.message.includes('unknown'));
 console.log('Auth REST: ID mapping, session restoration, expiry/refresh single-flight, sign-out and public-key-only browser configuration passed.');
}
async function adminTests(){
 const {createHandler}=await import('./supabase/functions/classroom-admin/handler.mjs');
 const mockSecret='sb_secret_'+ 'mock-only-not-a-real-key';
 const values={SUPABASE_URL:config.url,SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:config.publishableKey}),SUPABASE_SECRET_KEYS:JSON.stringify({default:mockSecret}),LAB_ALLOWED_ORIGINS:'http://127.0.0.1:8000'};
 let role='teacher',own=true,profileFail=false,profileThrow=false;const calls=[];
 const handler=createHandler({env:key=>values[key],fetch:async(url,options)=>{
  calls.push({url,options});const path=url.replace(config.url,'');
  assert.notEqual(options.method,'DELETE','No account deletion');
  if(options.headers.apikey===mockSecret)assert.equal(Object.hasOwn(options.headers,'Authorization'),false,'Management key is not a Bearer token');
  else{assert.equal(options.headers.apikey,config.publishableKey);assert.ok(options.headers.Authorization?.startsWith('Bearer '));}
  if(path==='/auth/v1/user')return options.headers.Authorization==='Bearer invalid'?Response.json({}, {status:401}):Response.json({id:'teacher-a'});
  if(path.includes('role=eq.teacher'))return Response.json(role==='teacher'?[{user_id:'teacher-a'}]:[]);
  if(path.includes('role=eq.student'))return Response.json(own?[{user_id:'00000000-0000-4000-8000-000000000001'}]:[]);
  if(path==='/auth/v1/admin/users'){assert.equal(options.headers.apikey,mockSecret);const body=JSON.parse(options.body);assert.equal(body.email_confirm,true);return Response.json({id:'00000000-0000-4000-8000-000000000001'});}
  if(path==='/rest/v1/lab_profiles'&&options.method==='POST'){if(profileThrow)throw Error('transport interrupted');const body=JSON.parse(options.body);assert.equal(body.role,'student');assert.equal(body.teacher_id,'teacher-a');return Response.json({}, {status:profileFail?500:201});}
  if(path.startsWith('/auth/v1/admin/users/'))return Response.json({ok:true});
  throw Error('Unexpected '+path);
 }});
 const request=(body,token='valid',origin='http://127.0.0.1:8000')=>new Request('https://edge.example',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 // Missing optional origins uses only the approved local source; an explicit empty
 // setting still fails closed and no other local port or remote origin is accepted.
 delete values.LAB_ALLOWED_ORIGINS;
 const initialCalls=calls.length;
 assert.equal((await handler(request({},'invalid'))).status,401);
 assert.equal(calls.length,initialCalls+1);
 assert.equal((await handler(request({},'invalid','https://steveniotech.github.io'))).status,401,'Production origin still requires Auth');
 for(const origin of ['http://localhost:8000','http://127.0.0.1:8001','https://evil.example'])assert.equal((await handler(request({},'invalid',origin))).status,403);
 values.LAB_ALLOWED_ORIGINS='';
 assert.equal((await handler(new Request('https://edge.example',{method:'POST',body:'{}'}))).status,503);
 values.LAB_ALLOWED_ORIGINS='http://127.0.0.1:8000';
 const create={action:'create-student',username:'STUDENT-01',displayName:'Moon',password:'long-password-123',role:'teacher',teacher_id:'other-teacher'};
 assert.equal((await handler(request(create,'invalid'))).status,401);
 role='student';assert.equal((await handler(request(create))).status,403);role='teacher';
 const before=calls.length;assert.equal((await handler(request(create,'valid','https://evil.example'))).status,403);assert.equal(calls.length,before,'disallowed origin never reaches Auth');
 assert.equal((await handler(request({...create,password:'short'}))).status,400);
 assert.equal((await handler(request(create))).status,200);
 profileFail=true;
 const failureStart=calls.length,partial=await handler(request(create));assert.equal(partial.status,502);
 const partialBody=await partial.json();assert.equal(partialBody.created_user_id,'00000000-0000-4000-8000-000000000001');assert.equal(partialBody.retryable,false);assert.equal(partialBody.manual_review_required,true);
 assert.equal(calls.slice(failureStart).filter(call=>call.url.endsWith('/auth/v1/admin/users')).length,1,'One creation attempt only');
 assert.ok(!calls.some(call=>call.options.method==='DELETE'),'Partial creation retained');profileFail=false;
 profileThrow=true;const interrupted=await handler(request(create));assert.equal(interrupted.status,503);assert.equal((await interrupted.json()).created_user_id,partialBody.created_user_id);profileThrow=false;
 for(const broken of ['{',JSON.stringify({}),JSON.stringify({default:123})]){
  const saved=values.SUPABASE_SECRET_KEYS;values.SUPABASE_SECRET_KEYS=broken;const count=calls.length;
  assert.equal((await handler(request(create))).status,503);assert.equal(calls.length,count,'Invalid configuration fails before network');values.SUPABASE_SECRET_KEYS=saved;
 }
 const originalURL=values.SUPABASE_URL;values.SUPABASE_URL='https://wrong-project.supabase.co';const count=calls.length;
 assert.equal((await handler(request(create))).status,503);assert.equal(calls.length,count);values.SUPABASE_URL=originalURL;
 values.LAB_API_KEY_NAME='selected';const savedPublic=values.SUPABASE_PUBLISHABLE_KEYS,savedSecret=values.SUPABASE_SECRET_KEYS;
 values.SUPABASE_PUBLISHABLE_KEYS=JSON.stringify({selected:config.publishableKey});values.SUPABASE_SECRET_KEYS=JSON.stringify({selected:mockSecret});
 assert.equal((await handler(request(create))).status,200);delete values.LAB_API_KEY_NAME;values.SUPABASE_PUBLISHABLE_KEYS=savedPublic;values.SUPABASE_SECRET_KEYS=savedSecret;
 const reset={action:'reset-password',userId:'00000000-0000-4000-8000-000000000001',password:'new-password-123'};
 own=false;assert.equal((await handler(request(reset))).status,403);own=true;assert.equal((await handler(request(reset))).status,200);
 assert.equal((await handler(request({...create,padding:'x'.repeat(5000)}))).status,413);
 console.log('Teacher endpoint: verified tokens/teacher role, cross-teacher denial, fixed student role/owner, origin checks, password bounds, hosted key parsing, management headers, retained partial accounts and body-size limits passed. Mock Supabase transport.');
}
async function bootstrapTests(){
 const {teacherProfileSQL,assertTarget,PROJECT_URL}=await import('./scripts/bootstrap-teacher.mjs');
 const input={LAB_SUPABASE_URL:PROJECT_URL,LAB_TEACHER_USER_ID:'00000000-0000-4000-8000-000000000001',LAB_TEACHER_ID:'mcp26-teacher-a',LAB_TEACHER_NAME:"Teacher's Test"};
 const sql=teacherProfileSQL(input);assert.ok(sql.includes("Teacher''s Test"));assert.ok(sql.includes('auth.users'));assert.ok(sql.includes('insert into public.lab_profiles'));
 assert.ok(!/delete|on conflict/i.test(sql));assert.throws(()=>assertTarget({LAB_SUPABASE_URL:'https://other.supabase.co'}));assert.throws(()=>teacherProfileSQL({...input,LAB_TEACHER_USER_ID:'invalid'}));
 console.log('Offline teacher profile SQL preparation and fixed project guard passed; no network calls.');
}
async function accountUITests(){
 const elements=new Map(),local=memory(),events=new Map();let state=firstUnit(),persist=null,loads=0;
 class Element{constructor(){this.hidden=false;this.disabled=false;this.value='';this.textContent='';this.innerHTML='';this.inert=false;this.dataset={};}focus(){}setAttribute(){}reset(){}}
 const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const document={getElementById:el,addEventListener:(name,callback)=>events.set(name,callback)};
 const lab={pause(){},getState:()=>C.normalize(state,L),setPersistence:fn=>{persist=fn;},loadState:value=>{state=C.normalize(value,L);loads++;persist?.(state);},exportState(){}};
 local.setItem(C.key,JSON.stringify(firstUnit()));
 let currentUser='a';const cloudStates={a:firstUnit(),b:C.fresh()};
 const api={config,hasSession:()=>false,signOut:async()=>{},signIn:async id=>{currentUser=id;return {user_id:id,role:'student',display_name:id,username:id};},load:async()=>({state:cloudStates[currentUser],revision:0}),save:async state=>({state,revision:1})};
 const sandbox=vm.createContext({document,window:{PythonLab:lab,addEventListener:(name,callback)=>events.set(name,callback)},PythonCore:C,PythonLessons:L,PythonCloud:{...Cloud,createAPI:()=>api,createSync:options=>Cloud.createSync({...options,...timers()})},PythonCloudConfig:config,localStorage:local,confirm:()=>true,console});
 vm.runInContext(fs.readFileSync('python-account.js','utf8'),sandbox);
 el('login-id').value='a';el('login-password').value='password';await el('login-form').onsubmit({preventDefault(){}});assert.equal(C.stars(state,L),30);assert.equal(el('login-password').value,'');assert.equal(C.continueStep(state,L).id,'store-1');
 await el('sign-out').onclick();assert.equal(C.stars(state,L),30,'sign-out restores original anonymous browser work');
 el('login-id').value='b';await el('login-form').onsubmit({preventDefault(){}});assert.equal(C.stars(state,L),0,'another student does not inherit guest or previous student work');assert.equal(el('import-browser').hidden,false);
 el('import-browser').onclick();assert.equal(C.stars(state,L),30,'guest import is explicit');assert.equal(JSON.parse(local.getItem(C.key)).steps['talk-1'].completed,true,'guest original is retained');assert.ok(loads>=4);
 console.log('Account UI: first-unit login/continue, password clearing, sign-out guest restore, second-student isolation and explicit guest import passed. DOM adapters.');
}
function localConfigTests(){
 const source=fs.readFileSync('cloud-config.js','utf8');
 for(const origin of ['http://127.0.0.1:8000','http://localhost:8000','http://127.0.0.1:8001','https://example.com','null',undefined]){
  const context=vm.createContext(origin===undefined?{}:{location:{origin}});vm.runInContext(source,context);
  const value=context.PythonCloudConfig;
  assert.equal(value.enabled,origin==='http://127.0.0.1:8000');
  assert.equal(value.url,config.url);assert.equal(value.accountDomain,config.accountDomain);
  assert.match(value.publishableKey,/^sb_publishable_[A-Za-z0-9_-]+$/);
 }
 for(const [origin,pathname,enabled] of [
  ['https://steveniotech.github.io','/python-steps-lab/index.html',true],
  ['https://steveniotech.github.io','/python-steps-lab/',true],
  ['https://steveniotech.github.io','/python-steps-lab',true],
  ['https://steveniotech.github.io','/reading-steps/',false],
  ['https://steveniotech.github.io','/python-steps-lab-other/',false],
  ['https://example.com','/python-steps-lab/',false]]){
  const context=vm.createContext({location:{origin,pathname}});vm.runInContext(source,context);
  assert.equal(context.PythonCloudConfig.enabled,enabled);
 }
 console.log('Cloud configuration: approved production project path and local origin enabled; other paths, origins and build context disabled.');
}
(async()=>{localConfigTests();await syncTests();await apiTests();await adminTests();await bootstrapTests();await accountUITests();})().catch(error=>{console.error(error);process.exitCode=1;});
