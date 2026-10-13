'use strict';
// No packages. Real local CPython tests the same host program shipped to Pyodide.
const assert=require('node:assert/strict'),fs=require('node:fs'),{spawnSync}=require('node:child_process');
const L=require('./python-lessons.js'),C=require('./python-core.js'),R=require('./python-runner.js');
function run(code,inputs=[],fixedSecret=null){
 const script=R.pythonHost+'\nprint(_lab_run(_json.loads(_sys.stdin.read())))\n';
 const process=spawnSync('python3',['-c',script],{input:JSON.stringify({code,inputs,fixedSecret}),encoding:'utf8',timeout:10000});
 assert.equal(process.status,0,process.stderr||String(process.error));return JSON.parse(process.stdout);
}
assert.equal(L.units.length,7);assert.equal(L.steps.length,29);assert.equal(new Set(L.steps.map(step=>step.id)).size,29);
for(const unit of L.units){assert.equal(unit.stepIds.length,unit.project?1:['decisions','loops'].includes(unit.id)?6:5);}
let state=C.fresh();assert.equal(C.stars(state,L),0);assert.deepEqual(C.badges(state,L),[]);
const referenceResults=[];
for(const step of L.steps){
 for(const name of ['id','unitId','title','mission','concept','starterCode','referenceCode','expectedSkills','successChecklist','hints','rule','completionMessage'])assert.ok(step[name],`${step.id} ${name}`);
 assert.equal(step.hints.length,3);assert.equal(C.unlocked(state,L.units.find(unit=>unit.id===step.unitId),L),true,step.id+' follows lock order');
 const result=run(step.referenceCode,step.inputs,step.rule==='guess'?12:null);
 assert.equal(result.ok,true,step.id+': '+result.details);
 const cases=(step.testCases||[]).map(test=>{const result=run(step.referenceCode,test.inputs);return {pass:result.ok&&[test.contains].flat().every(text=>result.output.toLowerCase().includes(text))};});
 assert.equal(C.check(step,result,{ranByStudent:true,cases,fixedSecret:step.rule==='guess'?12:null}).pass,true,step.id+' reference passes');
 referenceResults.push({id:step.id,output:result.output});
 assert.equal(C.award(state,step),C.valueFor(step));const before=C.stars(state,L);assert.equal(C.award(state,step),0);assert.equal(C.stars(state,L),before,'repeat award stays one-time');
}
assert.equal(C.stars(state,L),210);assert.equal(C.badges(state,L).length,7);
assert.equal(C.check(L.steps[0],run(L.steps[0].referenceCode),{ranByStudent:false}).pass,false);
const progress=C.fresh(),record=C.record(progress,L.steps[0]);record.draft='print("Saved draft")';record.inputs=['test'];record.hints=2;record.hintClicks=3;record.lastError='NameError';C.award(progress,L.steps[0]);progress.currentStep='talk-2';progress.view='lesson';
const restored=C.normalize(JSON.parse(JSON.stringify(progress)),L);assert.deepEqual(restored,progress);assert.equal(C.continueStep(restored,L).id,'talk-2');assert.equal(C.unlocked(restored,L.units[1],L),false);
assert.deepEqual(C.normalize({version:10},L),C.fresh());const bad=C.normalize({version:1,steps:{'talk-1':{draft:5,completed:'yes',hints:999,completions:-4,inputs:[null]}}},L);assert.equal(bad.steps['talk-1'].completed,false);assert.equal(bad.steps['talk-1'].hints,3);assert.equal(bad.steps['talk-1'].completions,0);
for(const code of ['import os','import sys','import subprocess','import socket','import pathlib','import requests','import js','from random import randint','open("file.txt", "w")','eval("2 + 2")','exec("print(1)")','getattr(1, "__class__")','print((1).__class__)','print(__builtins__)','import random\nrandom.randint = print']){
 const result=run(code);assert.equal(result.ok,false,code);assert.equal(result.errorType,'PermissionError',code+' restricted');
}
const errors=[
 ['print("Oops!)','quotation mark'],['print("Oops"','parentheses'],['name = "Sky"\nprint(Name)','capital letters'],
 ['if True\n    print("Hi")','colon'],['if True:\nprint("Hi")','4 spaces'],['print("Age: " + 12)','different kinds'],
 ['count = 1\nwhile count <= 3:\n    print(count)','loop'],['while True:\n    pass','loop']
];
for(const [code,text] of errors){const result=run(code);assert.equal(result.ok,false);assert.ok(R.friendlyError(result,code).includes(text),JSON.stringify(result));}
assert.equal(run('name = input("Name? ")',[]).errorType,'EOFError');
assert.equal(run('print("x" * 10000)').ok,false);assert.equal(run('for x in range(2000):\n    print(x)').ok,false);
assert.equal(run('def cheer(name):\n    print(f"Go {name}!")\nteam = ["Sky", "Moon"]\nfor player in team:\n    cheer(player)').output,'Go Sky!\nGo Moon!\n');
const offline=C.offlineCheck(L.steps[3],'print("A")\nprint("blue")\nprint("I am learning Python!")');assert.equal(offline.ready,true);assert.ok(offline.message.includes('not a Python run'));assert.equal(C.offlineCheck(L.steps[3],'# print("a")\nprint("print(1)")').ready,false);
assert.ok(C.structure('print("Hi)').error.includes('quotation'));assert.ok(C.structure('while True\n    print(1)').error.includes('colon'));
// Negative task cases and boundary order: syntax alone cannot win a project.
assert.equal(C.check(L.steps.find(step=>step.rule==='score'),run('score = "15"\nprint(score)')).pass,false);
assert.equal(C.check(L.steps.find(step=>step.rule==='message'),run('print(123)')).pass,false);
assert.equal(C.check(L.steps.find(step=>step.rule==='age'),run('age = 12\nprint(12)')).pass,false);
assert.equal(C.check(L.steps.find(step=>step.rule==='math-vars'),run('points = 20\ncost = 8\nprint(20 - 8)')).pass,false);
assert.equal(C.check(L.steps.find(step=>step.rule==='robot'),run('name = input("Name? ")\nanimal = input("Animal? ")\nprint("Hello")',['Sky','otter'])).pass,false);
const combinedRobot='person = input("Nickname? ")\ncreature = input("Animal? ")\nprint(f"Hello {person}! I like {creature} too.")';
assert.equal(C.check(L.steps.find(step=>step.rule==='robot'),run(combinedRobot,['Sky','otter']),{cases:[{pass:true}]}).pass,true,'combined reply and alternate variable names are accepted');
const gameStep=L.steps.find(step=>step.rule==='guess');
const separateIfGame=gameStep.referenceCode.replace('elif guess < secret_number:', 'if guess < secret_number:').replace('else:', 'if guess == secret_number:');
assert.equal(C.check(gameStep,run(separateIfGame,['5','17','12'],12),{fixedSecret:12}).pass,true,'equivalent separate if branches are accepted');
const wrongPark='height = int(input("Height? "))\nif height >= 120:\n    print("ride")\nelif height > 200:\n    print("special")\nelse:\n    print("short")';
assert.equal(C.check(L.steps.find(step=>step.rule==='park'),run(wrongPark,['120']),{cases:Array(4).fill({pass:true})}).pass,false);
// HTML IDs and local asset references. Student pages contain no JS eval or frameworks.
const html=fs.readFileSync('index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length);
for(const [,file] of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))assert.ok(fs.existsSync(file));
for(const file of ['python-steps.js','python-core.js','python-runner.js'])assert.ok(!/\beval\s*\(/.test(fs.readFileSync(file,'utf8')),file+' does not eval student code');
console.log('Python Lab passed: 29 reference programs, project input transcripts, all decision boundaries, 210-star cap, seven badges, one-time awards, locks, draft/hint restoration, offline honesty, safety restrictions, friendly errors, loop limits, functions and lists. CPython/core checks, not browser or Pyodide tests.');
// Worker lifecycle tests do not download a runtime or impersonate a Python run.
async function workerLifecycle(){
 const vm=require('node:vm'),workers=[],timers=new Map(),statuses=[];let sequence=0;
 class FakeWorker{constructor(){workers.push(this);}postMessage(value){this.payload=value;}terminate(){this.terminated=true;}}
 const sandbox=vm.createContext({Worker:FakeWorker,Blob:class{},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},setTimeout:(callback,delay)=>{const id=++sequence;timers.set(id,{callback,delay});return id;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(fs.readFileSync('python-runner.js','utf8'),sandbox);
 const runner=sandbox.PythonRunner.createRunner(status=>statuses.push(status));assert.equal(runner.status,'loading');assert.equal((await runner.run('print(1)',[])).errorType,'Unavailable');
 workers[0].onmessage({data:{type:'ready'}});assert.equal(runner.status,'ready');assert.equal(timers.size,0);
 const first=runner.run('print(1)',['test']);assert.equal(workers[0].payload.code,'print(1)');workers[0].onmessage({data:{type:'result',result:{ok:true,output:'1\n'}}});assert.equal((await first).ok,true);assert.equal(timers.size,0);
 const stopped=runner.run('while True: pass',[]);runner.cancel();assert.equal((await stopped).errorType,'Cancelled');assert.equal(workers[0].terminated,true);assert.equal(timers.size,0);
 runner.retry();const current=workers.at(-1);workers[0].onmessage({data:{type:'ready'}});assert.equal(runner.status,'loading','old worker cannot mark a new runner ready');current.onmessage({data:{type:'ready'}});
 const timeout=runner.run('while True: pass',[]);[...timers.values()].find(item=>item.delay===6000).callback();assert.equal((await timeout).errorType,'Timeout');assert.equal(current.terminated,true);assert.equal(timers.size,0);
 runner.retry();[...timers.values()].find(item=>item.delay===45000).callback();assert.equal(runner.status,'failed');assert.equal(workers.at(-1).terminated,true);assert.equal(timers.size,0);
 console.log('Worker lifecycle passed: loading/unavailable, ready, run, cancellation, stale worker isolation, timeout, retry and cleanup (Worker substitutes).');
}
workerLifecycle().catch(error=>{console.error(error);process.exitCode=1;});
// Drive the real UI handlers through a small DOM substitute and actual CPython.
async function appHandlers(){
 const vm=require('node:vm'),elements=new Map(),stored=new Map(),windowEvents=new Map();let confirmations=0;
 class Element{
  constructor(){this.value='';this.disabled=false;this.hidden=false;this.dataset={};this.textContent='';this.style={};this.selectionStart=0;this.selectionEnd=0;this.scrollTop=0;this.classList={add(){},remove(){}};this.nodes=[];}
  set innerHTML(value){this.html=value;this.nodes=[];for(const match of value.matchAll(/<(button|input)\b([^>]*)>/g)){
   const node=new Element(),attrs=match[2],attribute=name=>attrs.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1];
   for(const name of ['unit','input','remove','preview']){const value=attribute('data-'+name);if(value!==undefined)node.dataset[name]=value;}
   node.disabled=/\bdisabled\b/.test(attrs);node.value=attribute('value')||'';const id=attribute('id');if(id)elements.set(id,node);this.nodes.push(node);
  }}
  get innerHTML(){return this.html;}
  querySelectorAll(selector){const data=selector.match(/^\[data-([^\]]+)\]$/)?.[1];return this.nodes.filter(node=>data&&node.dataset[data]!==undefined);}
  setAttribute(name,value){this[name]=value;}focus(){this.focused=true;}click(){this.onclick?.();}
  setRangeText(text,start,end){this.value=this.value.slice(0,start)+text+this.value.slice(end);this.selectionStart=this.selectionEnd=start+text.length;}
 }
 const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const document={getElementById:el,addEventListener:(name,callback)=>windowEvents.set('document:'+name,callback),createElement:()=>new Element()};
 let held=null,defer=false;
 const mockRunner={status:'ready',run:(code,inputs,options={})=>defer?new Promise(resolve=>{held=()=>resolve(run(code,inputs,options.fixedSecret));}):Promise.resolve(run(code,inputs,options.fixedSecret)),cancel:()=>{if(held){held();held=null;}},retry(){}};
 const context=vm.createContext({document,PythonLessons:L,PythonCore:C,PythonRunner:{friendlyError:R.friendlyError,createRunner:callback=>{callback('ready');return mockRunner;}},localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},location:{hash:''},window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(name,callback)=>windowEvents.set(name,callback)},confirm:()=>{confirmations++;return true;},setTimeout:()=>1,clearTimeout(){},Blob:class{},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
 vm.runInContext(fs.readFileSync('python-steps.js','utf8'),context);
 const click=async id=>{assert.equal(el(id).disabled,false,id+' enabled');assert.equal(typeof el(id).onclick,'function');await el(id).onclick();};
 const saved=()=>JSON.parse(stored.get(C.key));
 const type=code=>{el('code-editor').value=code;el('code-editor').oninput();};
 await click('continue-map');assert.equal(el('lesson-title').textContent,'Run Your First Print');
 await click('check-button');assert.equal(saved().stars,0,'Run first is mandatory');await click('run-button');await click('check-button');assert.equal(saved().stars,5);await click('check-button');assert.equal(saved().stars,5);assert.equal(saved().steps['talk-1'].completions,2);
 // A draft edit while a run is in flight must not leave Run/Check disabled.
 defer=true;const pending=el('run-button').onclick();type('print("changed")');held();await pending;assert.equal(el('run-button').disabled,false);assert.equal(saved().stars,5);defer=false;type(L.steps[0].referenceCode);
 await click('map-button');await click('continue-map');assert.equal(el('lesson-title').textContent,'Change the Message');
 for(let index=1;index<L.steps.length;index++){
  const step=L.steps[index];assert.equal(el('lesson-title').textContent,step.title);
  type(step.referenceCode);
  if(index===2){await click('hint-button');await click('hint-button');assert.equal(el('example-button').hidden,false);await click('example-button');assert.equal(saved().steps[step.id].hints,3);}
  if(step.project){await click('build-next');await click('build-next');await click('build-next');assert.equal(saved().steps[step.id].stage,3);}
  await click('check-button');assert.equal(saved().steps[step.id].completed,true,step.id+' completed through actual Check handler');
  if(step.challenge||step.project){assert.equal(el('completion-view').hidden,false);assert.ok(el('completion-artifact').textContent);await click('continue-completion');}
  else await click('next-step');
 }
 assert.equal(saved().stars,210);assert.equal(saved().badges.length,7);
 assert.equal(saved().steps['talk-3'].hintClicks,3);assert.ok(saved().steps['guess-1'].artifact.includes('Correct!'));
 windowEvents.get('document:keydown')({key:'s',ctrlKey:true,preventDefault(){}});assert.equal(el('notice').textContent,'Your work is saved automatically.');
 await click('teacher-button');assert.ok(el('teacher-summary').textContent.includes('210 stars'));
 await click('reset-progress');assert.equal(confirmations,2);assert.equal(saved().stars,0);assert.equal(Object.keys(saved().steps).length,0);assert.equal(el('map-view').hidden,false);
 console.log('App handlers passed: all 29 steps through Run/Check/navigation, project checkpoints/completion pages, 210 stars/seven badges in saved JSON, hints, duplicate checks, concurrent draft edits, keyboard save, Teacher View and double-confirmed reset. DOM and runner adapters; no real browser claim.');
}
appHandlers().catch(error=>{console.error(error);process.exitCode=1;});
