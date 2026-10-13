'use strict';
(function(root){
 const key='python-steps-lab:v1';
 function fresh(){return {version:1,currentStep:'talk-1',view:'map',steps:{}};}
 function record(state,step){
  if(!state.steps[step.id])state.steps[step.id]={draft:step.starterCode,completed:false,completions:0,hints:0,hintClicks:0,stage:0,inputs:[...step.inputs],lastError:'',artifact:''};
  return state.steps[step.id];
 }
 function normalize(value,lessons){
  const state=fresh();if(!value||value.version!==1||typeof value.steps!=='object'||!value.steps)return state;
  for(const step of lessons.steps){
   const saved=value.steps[step.id];if(!saved||typeof saved!=='object')continue;
   const entry=record(state,step);
   for(const name of ['draft','lastError','artifact'])if(typeof saved[name]==='string')entry[name]=saved[name].slice(0,name==='draft'?12000:12000);
   entry.completed=saved.completed===true;
   for(const name of ['completions','hintClicks','hints','stage'])entry[name]=Number.isInteger(saved[name])?Math.max(0,Math.min(name==='hints'?3:name==='stage'?3:100000,saved[name])):0;
   if(Array.isArray(saved.inputs))entry.inputs=saved.inputs.slice(0,100).map(item=>String(item).slice(0,200));
  }
  if(lessons.steps.some(step=>step.id===value.currentStep))state.currentStep=value.currentStep;
  if(['map','lesson'].includes(value.view))state.view=value.view;
  return state;
 }
 function unitComplete(state,unit){return unit.stepIds.every(id=>state.steps[id]?.completed);}
 function unlocked(state,unit,lessons){const index=lessons.units.indexOf(unit);return index===0||lessons.units.slice(0,index).every(item=>unitComplete(state,item));}
 function valueFor(step){return step.project?(step.unitId==='robot'?20:30):step.challenge?10:5;}
 function stars(state,lessons){return lessons.steps.reduce((sum,step)=>sum+(state.steps[step.id]?.completed?valueFor(step):0),0);}
 function badges(state,lessons){return lessons.units.filter(unit=>unitComplete(state,unit)).map(unit=>unit.badge);}
 function continueStep(state,lessons){
  const current=lessons.steps.find(step=>step.id===state.currentStep);
  if(current&&!state.steps[current.id]?.completed&&unlocked(state,lessons.units.find(unit=>unit.id===current.unitId),lessons))return current;
  return lessons.steps.find(step=>!state.steps[step.id]?.completed&&unlocked(state,lessons.units.find(unit=>unit.id===step.unitId),lessons))||lessons.steps.at(-1);
 }
 function award(state,step){const entry=record(state,step);entry.completions++;const added=entry.completed?0:valueFor(step);entry.completed=true;return added;}
 function structure(code){
  // A lexical fallback, never an interpreter. Comments/strings cannot impersonate calls.
  let clean='',quote=null,escaped=false,comment=false,parens=0;
  for(const character of code){
   if(comment){if(character==='\n'){comment=false;clean+='\n';}else clean+=' ';continue;}
   if(quote){
    if(character==='\n')return {error:'Your text started with a quotation mark (") but it needs another quotation mark to close it. Try Again.'};
    clean+=' ';if(escaped)escaped=false;else if(character==='\\')escaped=true;else if(character===quote)quote=null;
   }else if(character==='"'||character==="'"){quote=character;clean+=' ';}
   else if(character==='#'){comment=true;clean+=' ';}
   else {clean+=character;if(character==='(')parens++;if(character===')')parens--;if(parens<0)return {error:'Check your parentheses. If you open one with (, you need to close it with ). Try Again.'};}
  }
  if(quote)return {error:'Your text started with a quotation mark (") but it needs another quotation mark to close it. Try Again.'};
  if(parens)return {error:'Check your parentheses. If you open one with (, you need to close it with ). Try Again.'};
  if(/^\s*(?:if|elif|else|for|while|def)\b[^\n:]*$/m.test(clean))return {error:'This line is making a code block. Try adding a colon : at the end. Try Again.'};
  if([...clean.matchAll(/^\s*import\s+([^\n]+)/gm)].some(match=>!/^random(?:\s+as\s+[A-Za-z]\w*)?\s*$/.test(match[1]))||/\b(?:from\s+|eval\s*\(|exec\s*\(|open\s*\(|__\w+|getattr\s*\()/m.test(clean))return {error:'This lab uses basic Python only. Use print, variables, decisions, loops, or random.'};
  const calls={};for(const match of clean.matchAll(/\b([A-Za-z]\w*(?:\.randint)?)\s*\(/g))calls[match[1]]=(calls[match[1]]||0)+1;
  return {calls,clean,for:/\bfor\s/.test(clean),while:/\bwhile\s/.test(clean),if:/\bif\s/.test(clean),input:!!calls.input,assignments:[...clean.matchAll(/^\s*([A-Za-z]\w*)\s*=(?!=)/gm)].map(match=>match[1])};
 }
 function offlineCheck(step,code){
  const info=structure(code);if(info.error)return {ready:false,message:info.error};
  let ready=!!info.calls.print;
  if(['three-print','poster'].includes(step.rule))ready&&=info.calls.print>=3;
  if(step.unitId==='store')ready&&=info.assignments.length>=(step.challenge?4:1);
  if(['snacks','remainder','even'].includes(step.rule))ready&&=info.clean.includes('%');
  if(step.project||step.unitId==='decisions')ready&&=info.input;
  if(step.rule==='robot')ready&&=info.calls.input>=2;
  if(step.unitId==='decisions'&&step.rule!=='int-input')ready&&=info.if;
  if(step.unitId==='loops')ready&&=info.for||info.while;
  if(step.rule==='guess')ready&&=info.while&&info.if&&/\b\w+\.randint\s*\(/.test(info.clean);
  return {ready,message:ready?'Your code structure looks ready. This is not a Python run. Connect the runner, then Check to finish and earn stars.':'Keep building. Match the Success Checklist, then Check again. Structure checks cannot confirm output while the runner is offline.'};
 }
 function check(step,result,metadata={}){
  if(!result.ok)return {pass:false,message:'Fix the run error, then Check again.'};
  const m=result.metadata,c=m.calls,v=m.variables,lines=result.output.trim().split('\n').filter(line=>line.trim()),ops=m.operators;
  const call=name=>(c[name]||0)>0,hasOp=name=>ops.includes(name),numberOutput=n=>lines.some(line=>Number(line.trim())===n),variable=(name,type)=>v[name]?.type===type;
  const numbers=lines.map(line=>Number(line.trim()));
  const numericNames=Object.keys(v).filter(name=>['int','float'].includes(v[name].type));
  const inputs=m.inputValues||[],checks=metadata.cases||[];
  let pass=false;
  switch(step.rule){
   case 'first-print':pass=metadata.ranByStudent&&call('print')&&result.output.includes('Hello, world!');break;
   case 'message':pass=call('print')&&(m.printTypes||[]).includes('str')&&lines.some(line=>line.trim()&&!/^Hello!?$/i.test(line.trim()));break;
   case 'quotes':pass=call('print')&&(m.printTypes||[]).includes('str')&&lines.length>0;break;
   case 'three-print':pass=c.print>=3&&lines.length>=3&&result.output.includes('I am learning Python!');break;
   case 'poster':pass=c.print>=3&&lines.length>=3&&new Set(lines).size>=3;break;
   case 'name':pass=variable('name','str')&&(m.printNames||[]).includes('name')&&v.name.value.trim()&&v.name.value!=='Alex'&&result.output.includes(v.name.value);break;
   case 'age':pass=variable('age','int')&&(m.printNames||[]).includes('age')&&numberOutput(v.age.value);break;
   case 'score':pass=variable('score','int')&&hasOp('Add')&&numberOutput(15);break;
   case 'boolean':pass=variable('likes_pizza','bool')&&(m.printNames||[]).includes('likes_pizza')&&result.output.includes(v.likes_pizza.value?'True':'False');break;
   case 'profile':pass=Object.keys(v).length>=4&&Object.values(v).filter(item=>item.type==='str'&&item.value.trim()).length>=2&&numericNames.length>=1&&Object.values(v).some(item=>item.type==='bool')&&lines.length>=3&&Object.keys(v).filter(name=>(m.printNames||[]).includes(name)).length>=3;break;
   case 'arithmetic':pass=['Add','Mult','Sub'].every(hasOp)&&numberOutput(10)&&numberOutput(12);break;
   case 'divide':pass=hasOp('Div')&&numberOutput(4.5);break;
   case 'remainder':pass=hasOp('Mod')&&numberOutput(2);break;
   case 'math-vars':pass=numericNames.filter(name=>(m.mathNames||[]).includes(name)).length>=2&&hasOp('Sub')&&numberOutput(12);break;
   case 'snacks':{
    const shares=(m.calculations||[]).filter(item=>['Div','FloorDiv'].includes(item.op)&&item.left>0&&item.right>=2&&Number.isInteger(item.right));
    pass=numericNames.filter(name=>(m.mathNames||[]).includes(name)).length>=2&&shares.some(share=>(m.calculations||[]).some(left=>left.op==='Mod'&&left.left===share.left&&left.right===share.right&&result.output.includes(String(left.value)))&&result.output.includes(String(share.value)))&&lines.length>=2&&lines.every(line=>/[A-Za-z]/.test(line)&&/\d/.test(line));break;
   }
   case 'robot':pass=c.input>=2&&inputs.length>=2&&new Set(m.prompts).size>=2&&lines.length>=1&&inputs.slice(0,2).every(value=>value.trim()&&result.output.includes(value))&&checks.length===1&&checks.every(item=>item.pass);break;
   case 'int-input':pass=call('input')&&call('int')&&hasOp('Add')&&numberOutput(Number(inputs[0])+1);break;
   case 'even':pass=call('input')&&call('int')&&m.if&&m.else&&hasOp('Mod')&&checks.every(item=>item.pass)&&checks.length===2;break;
   case 'compare':pass=call('input')&&m.if&&m.else&&m.comparisons.some(item=>item.op==='GtE'&&item.right===50)&&checks.length===2&&checks.every(item=>item.pass);break;
   case 'choices':pass=call('input')&&m.if&&m.else&&checks.length===2&&checks.every(item=>item.pass);break;
   case 'elif':pass=call('input')&&m.if>=2&&m.else&&checks.length===3&&checks.every(item=>item.pass);break;
   case 'park':{
    const large=m.comparisons.find(item=>item.op==='Gt'&&item.right===200),ride=m.comparisons.find(item=>item.op==='GtE'&&item.right===120);
    pass=call('input')&&call('int')&&large&&ride&&large.line<ride.line&&checks.length===4&&checks.every(item=>item.pass);break;
   }
   case 'five':pass=m.for&&lines.length===5&&new Set(lines).size===1;break;
   case 'ten':pass=m.for&&JSON.stringify(numbers)===JSON.stringify([1,2,3,4,5,6,7,8,9,10]);break;
   case 'evens':pass=m.for&&JSON.stringify(numbers)===JSON.stringify([2,4,6,8,10]);break;
   case 'counter':pass=m.while&&JSON.stringify(numbers)===JSON.stringify([1,2,3]);break;
   case 'stop':pass=m.while&&JSON.stringify(numbers)===JSON.stringify([1,2,3,4,5]);break;
   case 'countdown':{const start=Number(lines[0]);pass=(m.for||m.while)&&[5,10].includes(start)&&lines.length===start+1&&lines.slice(0,start).every((line,index)=>Number(line)===start-index)&&/[A-Za-z]/.test(lines.at(-1));break;}
   case 'guess':{
    const conversation=m.conversation||[];
    pass=call('random.randint')&&(m.randomRanges||[]).some(range=>range[0]===1&&range[1]===20)&&m.while&&m.if>=2&&call('input')&&call('int')&&metadata.fixedSecret===12&&Number(inputs.at(-1))===12&&conversation.some(turn=>Number(turn.reply)<12)&&conversation.some(turn=>Number(turn.reply)>12)&&conversation.every(turn=>{const reply=Number(turn.reply),text=turn.output.join(''),positive=/correct|you won|well done|got it|great|nice|yay|hooray/i.test(text);return reply<12?/too low/i.test(text)&&!/too high/i.test(text)&&!positive:reply>12?/too high/i.test(text)&&!/too low/i.test(text)&&!positive:positive;});break;
   }
  }
  return {pass:!!pass,message:pass?'Your code meets the checklist!':step.rule==='first-print'&&!metadata.ranByStudent?'Click Run Code first. Read the output, then Check.':'Not quite yet. '+step.successChecklist.join('. ')+'. Try Again.'};
 }
 root.PythonCore={key,fresh,record,normalize,unitComplete,unlocked,valueFor,stars,badges,continueStep,award,structure,offlineCheck,check};
 if(typeof module!=='undefined')module.exports=root.PythonCore;
})(typeof globalThis!=='undefined'?globalThis:this);
