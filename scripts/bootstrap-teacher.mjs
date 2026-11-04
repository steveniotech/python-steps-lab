// Offline SQL preparation only. Auth users must first be created in Dashboard.
// This script has no network client and never reads a password or management key.
import { pathToFileURL } from 'node:url';
export const PROJECT_REF='omqknvspgjbfgjfefpqe';
export const PROJECT_URL='https://'+PROJECT_REF+'.supabase.co';
export function assertTarget(env){
 if(env.LAB_SUPABASE_URL&&env.LAB_SUPABASE_URL!==PROJECT_URL)throw Error('Target project URL does not match the fixed project.');
 if(env.LAB_PROJECT_REF&&env.LAB_PROJECT_REF!==PROJECT_REF)throw Error('Target project ref does not match the fixed project.');
}
export function teacherProfileSQL(env=process.env){
 assertTarget(env);
 const id=env.LAB_TEACHER_USER_ID,username=env.LAB_TEACHER_ID,name=env.LAB_TEACHER_NAME||'Test Teacher';
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')||!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(username||'')||name.length>60||!name.trim()||/[\x00-\x1f\x7f]/.test(name))throw Error('Provide a Dashboard Auth user UUID, valid teacher ID and nickname.');
 const literal=value=>"'"+value.replaceAll("'","''")+"'";
 return `-- REVIEW ONLY: target ${PROJECT_REF}. Not executed by this script.
-- The Auth user must already have this exact internal email. No upsert or cleanup.
begin;
do $lab$
begin
 if not exists(select 1 from auth.users where id=${literal(id)}::uuid and email=${literal(username+'@students.pythonsteps.example')}) then
  raise exception 'Dashboard Auth user ID/email does not match';
 end if;
end;
$lab$;
insert into public.lab_profiles(user_id,username,display_name,role,teacher_id)
values (${literal(id)}::uuid,${literal(username)},${literal(name)},'teacher',null);
commit;`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(teacherProfileSQL());}
 catch{console.error('Cannot prepare teacher profile SQL. Check the fixed project, Dashboard user UUID, teacher ID and nickname. No request was sent.');process.exitCode=1;}
}
