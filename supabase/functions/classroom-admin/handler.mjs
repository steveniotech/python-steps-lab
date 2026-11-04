// This module runs only on the server. Never copy server secrets into the site.
const PROJECT_URL='https://omqknvspgjbfgjfefpqe.supabase.co';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function hostedKey(env,variable,prefix){
 try{
  const keys=JSON.parse(env(variable)||'null'),name=env('LAB_API_KEY_NAME')||'default';
  const value=keys&&typeof keys==='object'&&!Array.isArray(keys)&&Object.hasOwn(keys,name)?keys[name]:null;
  return typeof value==='string'&&value.startsWith(prefix)&&!/\s/.test(value)?value:null;
 }catch{return null;}
}
export function createHandler({env,fetch:fetcher}){
 return async request=>{
  const origin=request.headers.get('Origin');
  const allowed=(env('LAB_ALLOWED_ORIGINS')??'http://127.0.0.1:8000,https://steveniotech.github.io').split(',').map(x=>x.trim()).filter(Boolean);
  const cors={...(origin&&allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Content-Type':'application/json'};
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
  if(origin&&!allowed.includes(origin))return reply({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  const url=env('SUPABASE_URL'),publicKey=hostedKey(env,'SUPABASE_PUBLISHABLE_KEYS','sb_publishable_'),secret=hostedKey(env,'SUPABASE_SECRET_KEYS','sb_secret_');
  const domain=env('LAB_ACCOUNT_DOMAIN')||'students.pythonsteps.example';
  if(url!==PROJECT_URL||!publicKey||!secret||!allowed.length||domain!=='students.pythonsteps.example')return reply({error:'Classroom administration is not configured'},503);
  const authorization=request.headers.get('Authorization')||'';
  if(!/^Bearer \S+$/.test(authorization))return reply({error:'Sign in required'},401);
  const call=async(path,{method='GET',body,admin=false}={})=>{
   const response=await fetcher(url+path,{method,redirect:'error',headers:{apikey:admin?secret:publicKey,...(!admin?{Authorization:authorization}:{}),'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
   let data=null;try{data=await response.json();}catch{/* Supabase may return an empty success response. */}
   return {ok:response.ok,status:response.status,data};
  };
  let createdUserId=null,creationAttempted=false;
  try{
   const auth=await call('/auth/v1/user');if(!auth.ok||!auth.data?.id)return reply({error:'Sign in required'},401);
   const teacherId=auth.data.id;
   const teacher=await call('/rest/v1/lab_profiles?user_id=eq.'+encodeURIComponent(teacherId)+'&role=eq.teacher&select=user_id');
   if(!teacher.ok||teacher.data?.length!==1)return reply({error:'Teacher access required'},403);
   // Limit the body before parsing, including requests with no Content-Length.
   const reader=request.body?.getReader();let text='',bytes=0;const decoder=new TextDecoder();
   if(reader){try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>4096){await reader.cancel();return reply({error:'Request too large'},413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}}
   let body;try{body=JSON.parse(text);}catch{return reply({error:'Invalid request'},400);}
   if(!body||typeof body!=='object')return reply({error:'Invalid request'},400);
   if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)return reply({error:'Use a password of 12–128 characters'},400);
   if(body.action==='create-student'){
    const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';
    const displayName=typeof body.displayName==='string'?body.displayName.trim():'';
    if(!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(username)||!displayName||displayName.length>60)return reply({error:'Check the student ID and nickname'},400);
    creationAttempted=true;
    const created=await call('/auth/v1/admin/users',{method:'POST',admin:true,body:{email:username+'@'+domain,password:body.password,email_confirm:true}});
    if(!created.ok)return reply({error:'Account creation did not succeed. Stop and inspect Auth before retrying.',manual_review_required:true,retryable:false},created.status===429?429:409);
    const userId=created.data?.id;
    if(typeof userId!=='string'||!UUID.test(userId))return reply({error:'Account creation returned no valid ID. Inspect Auth before retrying.',manual_review_required:true,retryable:false},502);
    createdUserId=userId;
    const profile=await call('/rest/v1/lab_profiles',{method:'POST',admin:true,body:{user_id:userId,username,display_name:displayName,role:'student',teacher_id:teacherId}});
    if(!profile.ok)return reply({error:'Auth account exists but profile creation failed. Stop and inspect this account; nothing was deleted.',created_user_id:userId,manual_review_required:true,retryable:false},502);
    return reply({user_id:userId,username,display_name:displayName});
   }
   if(body.action==='reset-password'){
    if(typeof body.userId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.userId))return reply({error:'Invalid student'},400);
    const student=await call('/rest/v1/lab_profiles?user_id=eq.'+encodeURIComponent(body.userId)+'&teacher_id=eq.'+encodeURIComponent(teacherId)+'&role=eq.student&select=user_id');
    if(!student.ok||student.data?.length!==1)return reply({error:'Student not found in your class'},403);
    const updated=await call('/auth/v1/admin/users/'+encodeURIComponent(body.userId),{method:'PUT',admin:true,body:{password:body.password}});
    return updated.ok?reply({ok:true}):reply({error:'Could not reset password. Check the project password rules and try again.'},502);
   }
   return reply({error:'Unknown action'},400);
  }catch{
   if(creationAttempted)return reply({error:'Account creation was interrupted. Stop and inspect Auth before retrying.',...(createdUserId?{created_user_id:createdUserId}:{}),manual_review_required:true,retryable:false},503);
   return reply({error:'Classroom service unavailable.'},503);
  }
 };
}
