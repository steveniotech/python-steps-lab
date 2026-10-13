'use strict';
(function(){
 const L=PythonLessons,C=PythonCore,$=id=>document.getElementById(id);
 const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 let state=C.fresh(),storageWorks=true,storageMessage='',current=null,preview=false,teacherOpen=location.hash==='#teacher';
 let busy=false,revision=0,lastRun=null,completionTimer=null,runner=null;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 try{const saved=localStorage.getItem(C.key);if(saved)state=C.normalize(JSON.parse(saved),L);}catch{storageWorks=false;storageMessage='Saved progress could not be read. This session still works. Export your work in Teacher View.';}
 function save(){
  try{localStorage.setItem(C.key,JSON.stringify({...state,stars:C.stars(state,L),badges:C.badges(state,L)}));storageWorks=true;$('save-status').textContent='Saved on this browser';}
  catch{storageWorks=false;$('save-status').textContent='Not saved · export your work';$('notice').textContent='This browser could not save your work. Keep this page open and use Export JSON in Teacher View.';}
 }
 function entry(){return C.record(state,current);}
 function announce(text){$('notice').textContent=text;}
 function focus(id){$(id).focus();}
 function total(){const n=C.stars(state,L);$('stars').textContent=`★ ${n} stars`;$('stars').setAttribute('aria-label',`${n} total stars`);}
 function stopCelebration(){clearTimeout(completionTimer);completionTimer=null;$('completion-view').classList.remove('celebrate');}
 motion.addEventListener('change',()=>{if(motion.matches)stopCelebration();});
 function hideViews(){for(const id of ['map-view','lesson-view','completion-view','teacher-view'])$(id).hidden=true;stopCelebration();}
 function resetOperation(){revision++;lastRun=null;if(busy&&runner)runner.cancel();busy=false;updateRunButtons();}
 function unitFor(step){return L.units.find(unit=>unit.id===step.unitId);}
 function continueLearning(){
  if(L.steps.every(step=>state.steps[step.id]?.completed)){showMap();announce('You finished every stop! Review any unit or project from your map.');}
  else openLesson(C.continueStep(state,L));
 }
 function showMap(shouldFocus=true){
  resetOperation();preview=false;teacherOpen=false;state.view='map';hideViews();$('map-view').hidden=false;
  const completed=L.steps.filter(step=>state.steps[step.id]?.completed).length;
  $('map-progress').textContent=`${completed} / ${L.steps.length} steps complete`;
  $('unit-map').innerHTML=L.units.map(unit=>{
   const done=unit.stepIds.filter(id=>state.steps[id]?.completed).length,open=C.unlocked(state,unit,L),finished=C.unitComplete(state,unit);
   const earned=unit.stepIds.reduce((sum,id)=>sum+(state.steps[id]?.completed?C.valueFor(L.steps.find(step=>step.id===id)):0),0);
   return `<article class="unit-card ${unit.project?'project':''} ${open?'':'locked'}"><div class="unit-top"><span class="unit-icon" aria-hidden="true">${unit.icon}</span><span class="status-chip">${finished?'✓ Completed':open?'○ Unlocked':'🔒 Locked'}</span></div><p class="eyebrow">${unit.label}${unit.project?' · MINI PROJECT':''}</p><h3>${unit.title}</h3><p>${done} / ${unit.stepIds.length} steps complete · ★ ${earned} stars</p><progress aria-label="${unit.title} completion" max="${unit.stepIds.length}" value="${done}"></progress><p>${unit.project?'Project badge: ': 'Challenge badge: '}${unit.badge}</p><button data-unit="${unit.id}" aria-label="${open?'Open':'Locked'} ${unit.title}" ${open?'':'disabled'}>${finished?'Review your work':open?'Start creating':'Finish the previous stop'}<span aria-hidden="true">${open?'→':'🔒'}</span></button></article>`;
  }).join('');
  $('unit-map').querySelectorAll('[data-unit]').forEach(button=>button.onclick=()=>{
   const unit=L.units.find(item=>item.id===button.dataset.unit);if(!C.unlocked(state,unit,L))return;
   openLesson(L.steps.find(step=>step.unitId===unit.id&&!state.steps[step.id]?.completed)||L.steps.find(step=>step.unitId===unit.id));
  });
  const earned=C.badges(state,L);
  $('badges').innerHTML=earned.length?earned.map(badge=>`<span class="maker-badge">✦ ${badge}</span>`).join(''):'<p class="empty-badges">Your first badge is waiting at the end of Unit 1. Keep making!</p>';
  total();save();if(shouldFocus)focus('map-title');
 }
 function lineNumbers(){const lines=$('code-editor').value.split('\n').length;$('line-numbers').textContent=Array.from({length:lines},(_,index)=>index+1).join('\n');$('line-numbers').scrollTop=$('code-editor').scrollTop;}
 function changed(){entry().draft=$('code-editor').value;revision++;lastRun=null;lineNumbers();$('feedback').textContent='';$('output-label').textContent='Code changed · run again';save();}
 function setFeedback(text,kind=''){$('feedback').textContent=text;$('feedback').className='feedback '+kind;}
 function renderHints(){
  const count=entry().hints;$('hint-panel').hidden=!count;$('hint-code').hidden=count<3;
  $('hint-label').textContent=count===3?'Use this to learn, then try typing it yourself.':`Hint ${count} of 3`;
  $('hint-text').hidden=count===3;$('hint-text').textContent=count<3?current.hints[count-1]||'':'';
  $('hint-code').textContent=count===3?current.hints[2]:'';
  $('hint-button').disabled=count>=3;$('example-button').hidden=count<2||count>=3;
 }
 function renderBuild(){
  $('build-section').hidden=!current.project;if(!current.project)return;
  const stage=entry().stage;
  $('build-steps').innerHTML=current.buildSteps.map((text,index)=>`<li class="${stage===index?'current':''}">${index<stage?'✓ ':index===stage?'→ ':''}${escapeHtml(text)}${index>stage?' · Locked until the previous build step':''}</li>`).join('');
  $('build-next').hidden=stage>=3;$('build-feedback').textContent=stage>=3?'Your build steps are ready. Run, then Check Project.':'';
 }
 function buildCheckpoint(){
  const info=C.structure($('code-editor').value),stage=entry().stage;
  if(info.error){$('build-feedback').textContent=info.error;return;}
  let good=false;
  if(current.unitId==='robot')good=stage===0?info.calls.input>=2:info.calls.print>=1;
  else good=stage===0?info.while&&info.calls.input&&info.calls.int:stage===1?info.if&&/too high/i.test(entry().draft)&&/too low/i.test(entry().draft):/\belse\s*:/.test(info.clean)&&/correct|won/i.test(entry().draft);
  if(good){entry().stage=Math.min(3,stage+1);renderBuild();save();}
  else $('build-feedback').textContent='Keep building this part: '+current.buildSteps[stage]+'. Use a hint if you need one.';
 }
 function renderInputs(){
  const values=entry().inputs;$('test-panel').hidden=!values.length&&!current.project&&current.unitId!=='decisions'&&current.rule!=='countdown';
  $('input-summary').textContent=`· ${values.length} replies`;
  $('all-guesses').hidden=current.unitId!=='guess';$('all-guesses').disabled=values.length>80;
  $('input-help').textContent=current.unitId==='guess'?'Each input() takes the next reply. Check uses secret 12: include a low guess, a high guess, then 12. Run picks a fresh secret; add more guesses if your replies run out.':'Each input() takes the next reply in this list. These are pretend player replies, not sent anywhere.';
  $('test-inputs').innerHTML=values.map((value,index)=>`<div class="input-row"><label for="test-input-${index}">${current.unitId==='robot'&&index<2?['Name','Animal'][index]:`Reply ${index+1}`}</label><input id="test-input-${index}" data-input="${index}" type="text" value="${escapeHtml(value)}" maxlength="200" aria-label="Test input reply ${index+1}"><button data-remove="${index}" aria-label="Remove test reply ${index+1}">Remove</button></div>`).join('');
  $('test-inputs').querySelectorAll('[data-input]').forEach(input=>input.oninput=()=>{entry().inputs[Number(input.dataset.input)]=input.value;revision++;lastRun=null;save();});
  $('test-inputs').querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{entry().inputs.splice(Number(button.dataset.remove),1);revision++;lastRun=null;renderInputs();save();focus('add-input');});
  $('add-input').disabled=values.length>=100;
 }
 function navigation(){
  const unit=unitFor(current),index=unit.stepIds.indexOf(current.id);
  $('previous-step').disabled=index===0;$('next-step').disabled=!entry().completed||preview;
  $('next-step').textContent=index===unit.stepIds.length-1?'Next Stop →':'Next Step →';
  $('step-complete').textContent=entry().completed?'✓ Complete · stars already earned':'Check your code to complete this step';
  $('lesson-progress').max=unit.stepIds.length;$('lesson-progress').value=unit.stepIds.filter(id=>state.steps[id]?.completed).length;
 }
 function openLesson(step,isPreview=false,shouldFocus=true){
  if(!step||(!isPreview&&!C.unlocked(state,unitFor(step),L))){showMap();return;}
  resetOperation();current=step;preview=isPreview;teacherOpen=false;hideViews();$('lesson-view').hidden=false;
  if(!preview){state.currentStep=step.id;state.view='lesson';}
  const unit=unitFor(step),index=unit.stepIds.indexOf(step.id),item=entry();
  $('step-position').textContent=`${unit.label} · ${unit.title} · Step ${index+1} of ${unit.stepIds.length}`;
  $('lesson-title').textContent=step.title;$('exercise-mode').textContent=step.project?'Mini Project':step.challenge?'Unit Challenge · Build It':step.mode;
  $('preview-notice').hidden=!preview;$('mission').textContent=step.mission;$('concept').textContent=step.concept;
  $('skills').innerHTML=step.expectedSkills.map(skill=>`<li>${escapeHtml(skill)}</li>`).join('');
  $('checklist-heading').textContent=step.project?'MUST HAVE CHECKLIST':'SUCCESS CHECKLIST';
  $('checklist').innerHTML=step.successChecklist.map(text=>`<li>${escapeHtml(text)}</li>`).join('');
  $('project-intro').hidden=!step.project;
  $('project-intro').innerHTML=step.project?`<div class="project-intro"><p class="eyebrow">PROJECT GOAL</p><h2 class="project-heading">${step.title}</h2><p>${escapeHtml(step.projectGoal)}</p><h3 class="small-heading">SKILLS YOU ALREADY KNOW</h3><ul>${step.knownSkills.map(text=>`<li>${escapeHtml(text)}</li>`).join('')}</ul></div>`:'';
  $('bonus-section').hidden=!step.bonus.length&&!step.extra&&!step.comingSoon;$('bonus-section').open=false;
  $('bonus-list').innerHTML=step.bonus.map(text=>`<li>${escapeHtml(text)}</li>`).join('');$('extra-concept').textContent=step.extra||step.comingSoon||'';
  $('code-editor').value=item.draft;$('code-editor').scrollTop=0;lineNumbers();
  $('check-button').textContent=step.project?'Check Project':'Check';
  $('output').textContent='Run your code to see what happens.';$('output-label').textContent='Ready for your ideas';
  $('error-details').hidden=true;$('error-details').open=false;setFeedback('');
  renderHints();renderBuild();renderInputs();$('test-panel').open=step.project||step.unitId==='decisions';navigation();total();save();updateRunButtons();
  if(shouldFocus)focus('lesson-title');
 }
 function updateRunButtons(){
  $('run-button').disabled=busy||!runner||runner.status!=='ready';$('check-button').disabled=busy;$('reset-code').disabled=busy;
  $('stop-run').hidden=!busy;$('retry-runner').hidden=!runner||runner.status!=='failed';
 }
 function displayResult(result){
  $('output').textContent=result.transcript||result.output||(result.ok?'Your code ran. It did not print anything yet.':'No output yet.');
  $('output-label').textContent=result.ok?'✓ Python ran your code':'Try Again · no stars lost';
  $('error-details').hidden=result.ok;$('error-details').open=false;
  if(!result.ok){entry().lastError=result.errorType;$('raw-error').textContent=result.details||result.message;setFeedback(PythonRunner.friendlyError(result,entry().draft),'error');save();}
 }
 async function execute(checking=false){
  if(!current||busy)return;
  const code=$('code-editor').value,inputs=[...entry().inputs],token=revision,step=current;
  if(checking&&current.project&&entry().stage<3){setFeedback('Build one part at a time. Use Check Build Step on the left before Check Project.');return;}
  if(!runner||runner.status!=='ready'){
   if(checking){const verdict=C.offlineCheck(step,code);setFeedback(verdict.message,verdict.ready?'':'error');}
   return;
  }
  if(checking&&step.rule==='first-print'&&(!lastRun||lastRun.code!==code||!lastRun.result.ok)){
   setFeedback('Click Run Code first. Read the output, then Check.');return;
  }
  busy=true;updateRunButtons();setFeedback(checking?'Checking your code...':'Running your code...');
  const fixedSecret=checking&&step.rule==='guess'?12:null;
  let result=await runner.run(code,inputs,{fixedSecret});
  if(token!==revision||step!==current){if(step===current){busy=false;updateRunButtons();setFeedback('Your code or test inputs changed. Run again to check the new version.');}return;}
  const cases=[];
  if(checking&&result.ok&&step.testCases){
   for(const test of step.testCases){
    const tested=await runner.run(code,test.inputs);
    if(token!==revision||step!==current){if(step===current){busy=false;updateRunButtons();setFeedback('Your code or test inputs changed. Run again to check the new version.');}return;}
    cases.push({pass:tested.ok&&[test.contains].flat().every(text=>tested.output.toLowerCase().includes(text)),inputs:test.inputs,contains:test.contains,output:tested.output});
    if(!tested.ok){result=tested;break;}
   }
  }
  busy=false;updateRunButtons();displayResult(result);
  if(!result.ok)return;
  const ranByStudent=!!lastRun?.result.ok&&lastRun.code===code;
  if(!checking){lastRun={code,result};setFeedback('Your code ran! Read the output. When you are ready, click Check.');return;}
  const verdict=C.check(step,result,{cases,fixedSecret,ranByStudent});
  if(!verdict.pass){setFeedback(verdict.message+(cases.some(item=>!item.pass)?' Check all the test cases, not just one input.':''),'error');return;}
  if(preview){setFeedback('✓ Preview check passed. No stars or completion status were changed.','success');return;}
  if(!C.unlocked(state,unitFor(step),L))return;
  const added=C.award(state,step);entry().artifact=result.transcript||result.output;save();total();navigation();
  setFeedback(added?`Nice work! +${added} stars. ${step.completionMessage}`:'✓ Nice work! This step is complete. You already earned its stars.','success');
  if(added&&(step.challenge||step.project))showCompletion(step,added);
 }
 function showCompletion(step,added){
  hideViews();$('completion-view').hidden=false;
  const unit=unitFor(step);$('completion-title').textContent=step.title;$('completion-message').textContent=step.completionMessage;
  $('completion-stars').textContent=`★ +${added} stars · ${C.stars(state,L)} total`;
  $('completion-badge').textContent=C.unitComplete(state,unit)?`✦ ${unit.badge}`:'Keep going to earn your unit badge';
  $('completion-skills').textContent='You used: '+step.expectedSkills.join(' · ');
  $('completion-artifact').textContent=entry().artifact||'Your finished program is saved in your code draft.';
  if(!motion.matches){$('completion-view').classList.add('celebrate');completionTimer=setTimeout(stopCelebration,900);}
  focus('completion-title');
 }
 function showTeacher(){
  resetOperation();teacherOpen=true;hideViews();$('teacher-view').hidden=false;total();
  $('teacher-summary').textContent=`${C.stars(state,L)} stars · ${C.badges(state,L).length} badges · ${L.steps.filter(step=>state.steps[step.id]?.completed).length} / ${L.steps.length} steps complete`;
  $('teacher-table').innerHTML=L.units.map(unit=>`<h2>${unit.label}: ${unit.title} · ${C.unitComplete(state,unit)?'Complete':C.unlocked(state,unit,L)?'Unlocked':'Locked'}</h2><div class="teacher-table-wrap"><table><thead><tr><th scope="col">Step</th><th scope="col">Complete</th><th scope="col">Successful checks</th><th scope="col">Hint uses / level</th><th scope="col">Last error</th><th scope="col">Preview</th></tr></thead><tbody>${L.steps.filter(step=>step.unitId===unit.id).map(step=>{const item=state.steps[step.id];return `<tr><td>${step.title}</td><td>${item?.completed?'Yes':'No'}</td><td>${item?.completions||0}</td><td>${item?.hintClicks||0} / ${item?.hints||0}</td><td>${escapeHtml(item?.lastError||'None')}</td><td><button data-preview="${step.id}" aria-label="Preview ${step.title}">Open step</button></td></tr>`;}).join('')}</tbody></table></div>`).join('');
  $('teacher-table').querySelectorAll('[data-preview]').forEach(button=>button.onclick=()=>{location.hash='';openLesson(L.steps.find(step=>step.id===button.dataset.preview),true);});
  const saved=L.steps.find(step=>step.id===(current?.id||state.currentStep));$('teacher-draft').textContent=saved?C.record(state,saved).draft:'';
  focus('teacher-title');
 }
 $('code-editor').oninput=changed;
 $('code-editor').onscroll=()=>{$('line-numbers').scrollTop=$('code-editor').scrollTop;};
 $('code-editor').onkeydown=event=>{
  if(event.key==='Tab'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();const editor=event.target,start=editor.selectionStart,end=editor.selectionEnd;editor.setRangeText('    ',start,end,'end');changed();}
  if(event.key==='Escape'){event.preventDefault();focus(busy?'map-button':'check-button');}
 };
 document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save();announce(storageWorks?'Your work is saved automatically.':'This browser could not save. Export your work in Teacher View.');}
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&!$('lesson-view').hidden){event.preventDefault();execute();}
 });
 $('hint-button').onclick=()=>{entry().hintClicks++;entry().hints=Math.min(3,entry().hints+1);renderHints();save();};
 $('example-button').onclick=()=>{entry().hintClicks++;entry().hints=3;renderHints();save();};
 $('run-button').onclick=()=>execute();$('check-button').onclick=()=>execute(true);
 $('reset-code').onclick=()=>{if(!confirm('Reset this step? Your saved draft for this step will be replaced.'))return;$('code-editor').value=current.starterCode;changed();setFeedback('Starter code restored. Your earned stars are safe.');};
 $('build-next').onclick=buildCheckpoint;
 $('add-input').onclick=()=>{if(entry().inputs.length>=100)return;entry().inputs.push('');revision++;lastRun=null;renderInputs();$('test-panel').open=true;save();focus('test-input-'+(entry().inputs.length-1));};
 $('all-guesses').onclick=()=>{if(current.unitId!=='guess'||entry().inputs.length>80)return;entry().inputs.push(...Array.from({length:20},(_,index)=>String(index+1)));revision++;lastRun=null;renderInputs();save();announce('Replies 1 to 20 added. Run can now finish with any secret in this range.');};
 $('map-button').onclick=()=>{location.hash='';showMap();};$('completion-map').onclick=()=>showMap();
 $('continue-map').onclick=continueLearning;$('continue-completion').onclick=continueLearning;
 $('review-creation').onclick=()=>openLesson(current);
 $('previous-step').onclick=()=>{const ids=unitFor(current).stepIds,index=ids.indexOf(current.id);if(index>0)openLesson(L.steps.find(step=>step.id===ids[index-1]),preview);};
 $('next-step').onclick=()=>{if(!entry().completed||preview)return;const index=L.steps.indexOf(current);if(index<L.steps.length-1)openLesson(L.steps[index+1]);else showMap();};
 $('teacher-button').onclick=()=>{location.hash='teacher';showTeacher();};
 $('close-teacher').onclick=()=>{location.hash='';showMap();};
 window.addEventListener('hashchange',()=>{if(location.hash==='#teacher'&&!teacherOpen)showTeacher();});
 $('export-progress').onclick=()=>{
  const data={...state,stars:C.stars(state,L),badges:C.badges(state,L)};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='python-steps-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 $('reset-progress').onclick=()=>{
  if(!confirm('Reset all Python Steps Lab progress? Drafts, stars, badges, and hints will be removed.'))return;
  if(!confirm('Are you sure? Export JSON first if you want to keep your work.'))return;
  resetOperation();state=C.fresh();current=null;preview=false;save();location.hash='';showMap();announce('Python progress reset. Unit 1 is ready.');
 };
 $('retry-runner').onclick=()=>runner.retry();
 $('stop-run').onclick=()=>{resetOperation();setFeedback('Run stopped. Check what changes inside your loop, then try again.','error');};
 runner=PythonRunner.createRunner(status=>{
  $('runner-status').textContent=status==='ready'?'Python is ready · runs locally in this browser':status==='loading'?'Python is getting ready...':'Python runner could not load. You can still read the lesson and edit code, but Run Code needs an internet connection.';
  $('retry-runner').hidden=status!=='failed';$('run-button').disabled=status!=='ready'||busy;
 });
 window.addEventListener('pagehide',()=>{save();runner.cancel();stopCelebration();});
 if(teacherOpen)showTeacher();
 else if(state.view==='lesson')openLesson(L.steps.find(step=>step.id===state.currentStep),false,false);
 else showMap(false);
 if(storageMessage)announce(storageMessage);
})();
