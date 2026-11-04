'use strict';
(function(){
 const $=id=>document.getElementById(id),C=PythonCore,L=PythonLessons,Cloud=PythonCloud,lab=window.PythonLab;
 const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 let api=null,sync=null,identity=null,working=false,configured=false,rosterSequence=0;
 const setMessage=message=>{$('account-message').textContent=message;};
 const hasWork=state=>Object.keys(state.steps).some(id=>{const item=state.steps[id],step=L.steps.find(s=>s.id===id);return item.completed||item.hintClicks||item.draft!==step?.starterCode;});
 function guestState(){try{return C.normalize(JSON.parse(localStorage.getItem(C.key)||'null'),L);}catch{return C.fresh();}}
 function panel(open=true){$('account-panel').hidden=!open;$('account-button').setAttribute('aria-expanded',String(open));if(open)$('account-title').focus();}
 function lock(value){working=value;lab.pause();$('learning-content').inert=value;for(const id of ['login-submit','sign-out','sync-now','import-browser','use-cloud','use-device'])$(id).disabled=value;}
 function status(value){
  $('save-status').textContent=value.message;
  $('sync-conflict').hidden=!value.conflict;
  if(value.conflict)panel();
  if(!value.cacheWorks)setMessage('This browser cannot keep an offline copy. Keep this page open until cloud saving finishes, or download your progress.');
 }
 function resetUI(){
  rosterSequence++;$('classroom-roster').textContent='';$('reset-student').innerHTML='<option value="">选择学生</option>';
  $('classroom-panel').hidden=true;$('signed-in-controls').hidden=true;$('sync-conflict').hidden=true;
  $('login-form').hidden=!configured;$('learning-content').hidden=false;$('teacher-button').hidden=false;
  $('account-button').textContent='Student Sign In';$('account-name').textContent='';
  for(const id of ['student-id','student-name','student-password','new-password','login-password'])$(id).value='';
  $('classroom-action-message').textContent='';$('roster-message').textContent='';
 }
 async function attach(profile){
  identity=profile;lab.setPersistence(()=>{});
  $('login-form').hidden=true;$('signed-in-controls').hidden=false;
  $('account-name').textContent=profile.display_name+' · '+profile.username;
  $('account-button').textContent=profile.role==='teacher'?'班级管理':profile.display_name;
  const student=profile.role==='student';
  $('classroom-panel').hidden=student;$('learning-content').hidden=!student;$('teacher-button').hidden=!student;
  $('sync-now').hidden=!student;$('account-export').hidden=!student;
  $('import-browser').hidden=!student||!hasWork(guestState());$('import-help').hidden=$('import-browser').hidden;
  if(student){
   sync=Cloud.createSync({api,storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},onState:state=>lab.loadState(state),onStatus:status});
   lab.setPersistence(state=>{const before=sync.snapshot().state;const finished=L.steps.some(step=>state.steps[step.id]?.completed&&!before.steps[step.id]?.completed);sync.update(state,{immediate:finished});});
   await sync.open(profile.user_id);
   setMessage('Your progress belongs to this account. Use Continue Learning to open your next unfinished step.');
   if(!sync.snapshot().conflict)panel(false);
  }else{
   lab.loadState(C.fresh());$('save-status').textContent='Teacher account';
   setMessage('已登录教师账号。你可以创建学生账号、查看进度和重置密码。');panel();await loadRoster();
  }
 }
 async function loadRoster(){
  if(identity?.role!=='teacher')return;
  const requestNumber=++rosterSequence,teacherId=identity.user_id;
  $('refresh-roster').disabled=true;$('roster-message').textContent='正在加载…';
  try{
   const rows=await api.roster();if(requestNumber!==rosterSequence||identity?.user_id!==teacherId)return;
   $('classroom-roster').innerHTML=rows.length?'<div class="teacher-table-wrap"><table><thead><tr><th scope="col">学生</th><th scope="col">已完成任务</th><th scope="col">星星 / 徽章</th><th scope="col">最近保存 / 单元进度</th></tr></thead><tbody>'+rows.map(row=>{
    const progress=Array.isArray(row.lab_progress)?row.lab_progress[0]:row.lab_progress;
    const state=C.normalize(progress?.state,L),count=L.steps.filter(step=>state.steps[step.id]?.completed).length;
    const date=progress?.updated_at?new Date(progress.updated_at).toLocaleString():'尚未上传记录';
    return `<tr><td>${escape(row.display_name)}<br><small>${escape(row.username)}</small></td><td>${count} / 29</td><td>${C.stars(state,L)} / ${C.badges(state,L).length}</td><td>${escape(date)}<details><summary>查看各单元</summary><ul>${L.units.map(unit=>`<li>${escape(unit.title)}: ${unit.stepIds.filter(id=>state.steps[id]?.completed).length} / ${unit.stepIds.length}</li>`).join('')}</ul></details></td></tr>`;
   }).join('')+'</tbody></table></div>':'<p>还没有学生。请先创建学生账号。</p>';
   $('reset-student').innerHTML='<option value="">选择学生</option>'+rows.map(row=>`<option value="${escape(row.user_id)}">${escape(row.username+' · '+row.display_name)}</option>`).join('');
   $('roster-message').textContent=`已加载 ${rows.length} 位学生。`+(rows.length===500?' 当前最多显示500位。':'');
  }catch(error){if(requestNumber===rosterSequence)$('roster-message').textContent=error.message;}
  finally{if(requestNumber===rosterSequence)$('refresh-roster').disabled=false;}
 }
 async function login(event){
  event.preventDefault();if(working||!configured)return;
  lock(true);setMessage('Signing in and loading your progress…');
  try{const profile=await api.signIn($('login-id').value,$('login-password').value);$('login-password').value='';await attach(profile);}
  catch(error){sync?.close();sync=null;identity=null;await api.signOut();resetUI();lab.setPersistence(null);lab.loadState(guestState());setMessage(error.message);panel();}
  finally{lock(false);}
 }
 $('account-button').onclick=()=>panel(identity?.role==='teacher'||$('account-panel').hidden);
 $('login-form').onsubmit=login;
 $('sync-now').onclick=async()=>{if(working||!sync)return;lock(true);try{await sync.flush();}finally{lock(false);}};
 $('account-export').onclick=()=>lab.exportState();
 $('sign-out').onclick=async()=>{
  if(working)return;lock(true);
  try{
   if(sync){await sync.flush();if(sync.snapshot().pending&&!confirm('Some work has not reached the cloud. It will stay in this account’s cache on this device. Sign out anyway?'))return;sync.close();sync=null;}
   identity=null;await api.signOut();resetUI();lab.setPersistence(null);lab.loadState(guestState());setMessage('Signed out. Anonymous browser work is separate from your account.');panel();
  }finally{lock(false);}
 };
 for(const [id,useLocal] of [['use-cloud',false],['use-device',true]])$(id).onclick=async()=>{
  if(working||!sync)return;
  if(!confirm(useLocal?'Replace the cloud record with this device’s full copy? Work saved on the other device may be replaced. Download both copies first if needed.':'Load the cloud copy? This device’s current copy will be kept as a local recovery backup.'))return;
  lock(true);try{await sync.resolve(useLocal);}catch(error){setMessage(error.message);}finally{lock(false);}
 };
 $('import-browser').onclick=()=>{
  if(working||!sync)return;
  if(!confirm('Does the previous anonymous browser work belong to you? Import it into '+identity.username+'? Completed account work and its code take priority.'))return;
  const source=guestState(),target=lab.getState();
  for(const step of L.steps){const from=source.steps[step.id];if(!from)continue;const to=target.steps[step.id];if(!to){target.steps[step.id]=from;continue;}
   if(from.completed&&!to.completed){target.steps[step.id]={...from};}
   const result=target.steps[step.id];result.completed=to.completed||from.completed;
   for(const name of ['completions','hints','hintClicks','stage'])result[name]=Math.max(to[name],from[name]);
  }
  lab.loadState(target);void sync.flush();setMessage('Browser work imported into this account. The original anonymous copy is still available after sign-out.');
 };
 $('refresh-roster').onclick=loadRoster;
 for(const [form,button,action] of [['create-student-form','create-student-submit','create-student'],['reset-password-form','reset-password-submit','reset-password']])$(form).onsubmit=async event=>{
  event.preventDefault();if(identity?.role!=='teacher'||$(button).disabled)return;
  if(action==='reset-password'&&!confirm('重置选中学生的密码？学习记录将保留。'))return;
  const teacherId=identity.user_id;$(button).disabled=true;$('classroom-action-message').textContent='正在保存…';
  const body=action==='create-student'?{action,username:$('student-id').value,displayName:$('student-name').value,password:$('student-password').value}:{action,userId:$('reset-student').value,password:$('new-password').value};
  try{const result=await api.admin(body);if(identity?.user_id!==teacherId)return;$('classroom-action-message').textContent=action==='create-student'?'学生账号已创建：'+result.username+'。请单独把编号和密码交给学生。':'密码已重置，学习记录保留。';$(form).reset();await loadRoster();}
  catch(error){if(identity?.user_id===teacherId){$('classroom-action-message').textContent=error.message;if(error.manualReview)$(button).dataset.manualReview='true';}}
  finally{$('student-password').value='';$('new-password').value='';$(button).disabled=$(button).dataset.manualReview==='true';}
 };
 window.addEventListener('online',()=>{if(sync)void sync.flush();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&sync)void sync.flush();});
 window.addEventListener('beforeunload',event=>{if(sync?.snapshot().pending){event.preventDefault();event.returnValue='';}});
 async function initialize(){
  try{configured=Cloud.validateConfig(PythonCloudConfig);}catch(error){setMessage(error.message);}
  if(!configured){$('login-form').hidden=true;if(!PythonCloudConfig.enabled)setMessage('Cloud sign-in is not enabled yet. Your existing browser progress still works.');return;}
  api=Cloud.createAPI(PythonCloudConfig);
  if(!api.hasSession())return;
  lock(true);lab.setPersistence(()=>{});
  try{setMessage('Restoring your account…');await attach(await api.identity());}
  catch(error){sync?.close();sync=null;identity=null;await api.signOut();resetUI();lab.setPersistence(null);lab.loadState(guestState());setMessage(error.message+' Sign in again when connected.');panel();}
  finally{lock(false);}
 }
 void initialize();
})();
