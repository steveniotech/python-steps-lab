'use strict';
(function(root){
 // The host may use Python services. Student code receives only a small builtins table.
 const pythonHost=String.raw`
import ast as _ast, json as _json, sys as _sys, random as _random, types as _types, traceback as _traceback

def _lab_run(payload):
    code = payload.get("code", "")
    output, transcript, replies = [], [], list(payload.get("inputs", []))
    input_values, prompts = [], []
    meta = {"calls": {}, "operators": [], "calculations": [], "comparisons": [], "assignments": [], "for": 0, "while": 0, "if": 0, "else": 0, "functions": 0, "variables": {}, "inputValues": input_values, "prompts": prompts, "conversation": [], "randomRanges": [], "printTypes": [], "printNames": [], "mathNames": []}
    try:
        if len(code) > 12000:
            raise ValueError("Keep this program below 12000 characters.")
        tree = _ast.parse(code, filename="main.py")
        nodes = list(_ast.walk(tree))
        if len(nodes) > 1200:
            raise ValueError("Try a smaller program.")
        allowed = {"Module", "Expr", "Assign", "AugAssign", "Name", "Load", "Store", "Constant", "Call", "keyword", "BinOp", "UnaryOp", "Add", "Sub", "Mult", "Div", "FloorDiv", "Mod", "USub", "UAdd", "Not", "Compare", "Eq", "NotEq", "Lt", "LtE", "Gt", "GtE", "BoolOp", "And", "Or", "If", "For", "While", "Break", "Continue", "Pass", "Import", "alias", "Attribute", "List", "Tuple", "Subscript", "Slice", "FunctionDef", "arguments", "arg", "Return", "JoinedStr", "FormattedValue", "IfExp"}
        functions = {node.name for node in nodes if isinstance(node, _ast.FunctionDef)}
        random_names = {alias.asname or "random" for node in nodes if isinstance(node, _ast.Import) for alias in node.names if alias.name == "random"}
        safe_calls = {"print", "input", "int", "float", "str", "bool", "range", "len", "abs", "min", "max", "round", "list"} | functions
        for node in nodes:
            kind = type(node).__name__
            if kind not in allowed:
                raise PermissionError("This lab uses basic Python only. " + kind + " is not part of this lesson.")
            if isinstance(node, (_ast.Name, _ast.arg, _ast.FunctionDef)):
                name = getattr(node, "id", getattr(node, "arg", getattr(node, "name", "")))
                if name.startswith("_"):
                    raise PermissionError("Use a simple variable name without a starting underscore.")
            if isinstance(node, _ast.Import) and any(alias.name != "random" for alias in node.names):
                raise PermissionError("Only import random is allowed. Files, network, system commands, and packages are not available.")
            if isinstance(node, _ast.Attribute):
                permitted = node.attr in {"append", "pop", "count", "index", "lower", "upper", "strip"} or (isinstance(node.value, _ast.Name) and node.value.id in random_names and node.attr == "randint")
                if not permitted or not isinstance(node.ctx, _ast.Load):
                    raise PermissionError("That feature is not available in this basic Python lab.")
            if isinstance(node, _ast.Call):
                if isinstance(node.func, _ast.Name):
                    if node.func.id not in safe_calls:
                        raise PermissionError("That function is not available in this lab: " + node.func.id)
                    call = node.func.id
                elif isinstance(node.func, _ast.Attribute):
                    call = "random.randint" if node.func.attr == "randint" else node.func.attr
                else:
                    raise PermissionError("Call a named function, such as print().")
                meta["calls"][call] = meta["calls"].get(call, 0) + 1
                if call == "print":
                    meta["printNames"].extend(item.id for arg in node.args for item in _ast.walk(arg) if isinstance(item, _ast.Name))
            if isinstance(node, _ast.Constant):
                if isinstance(node.value, str) and len(node.value) > 2000:
                    raise ValueError("Use a shorter message.")
                if isinstance(node.value, (int, float)) and abs(node.value) > 10000:
                    raise ValueError("Use numbers between -10000 and 10000 in this lab.")
            if isinstance(node, _ast.FormattedValue) and node.format_spec is not None:
                raise PermissionError("Use a simple f-string without a format width in this lab.")
            if isinstance(node, _ast.BinOp):
                meta["operators"].append(type(node.op).__name__)
                meta["mathNames"].extend(item.id for item in _ast.walk(node) if isinstance(item, _ast.Name))
            if isinstance(node, _ast.Compare):
                for op, right in zip(node.ops, node.comparators):
                    meta["comparisons"].append({"op":type(op).__name__, "right":right.value if isinstance(right, _ast.Constant) else None, "line":node.lineno})
            if isinstance(node, _ast.Assign):
                for target in node.targets:
                    if isinstance(target, _ast.Name): meta["assignments"].append(target.id)
            if isinstance(node, _ast.AugAssign): meta["operators"].append(type(node.op).__name__)
            if isinstance(node, _ast.For): meta["for"] += 1
            if isinstance(node, _ast.While): meta["while"] += 1
            if isinstance(node, _ast.If):
                meta["if"] += 1
                if node.orelse: meta["else"] += 1
            if isinstance(node, _ast.FunctionDef):
                meta["functions"] += 1
                if node.decorator_list: raise PermissionError("Use a simple function without decorators.")
        def lab_print(*values, sep=" ", end="\n"):
            text = sep.join(str(value) for value in values) + end
            if sum(map(len, output)) + len(text) > 12000 or len(output) >= 500:
                raise RuntimeError("OutputLimit: Try fewer repeated messages.")
            output.append(text)
            meta["printTypes"].extend(type(value).__name__ for value in values)
            transcript.append(text)
            if meta["conversation"]: meta["conversation"][-1]["output"].append(text)
        def lab_input(question=""):
            if not replies:
                raise EOFError("Test Inputs ran out. Add another reply and run again.")
            reply = str(replies.pop(0))[:200]
            prompts.append(str(question)); input_values.append(reply)
            meta["conversation"].append({"reply":reply, "output":[]})
            transcript.append(str(question) + reply + "\n")
            return reply
        def lab_range(*args):
            value = range(*args)
            if len(value) > 1000: raise ValueError("Use no more than 1000 loop turns.")
            return value
        def lab_randint(a, b):
            if a > b or abs(a) > 10000 or abs(b) > 10000: raise ValueError("Choose a small random range.")
            meta["randomRanges"].append([a, b])
            if payload.get("fixedSecret") is not None:
                fixed = payload["fixedSecret"]
                if not a <= fixed <= b: raise ValueError("The project check needs a range that includes 12.")
                return fixed
            return _random.randint(a, b)
        random_module = _types.SimpleNamespace(randint=lab_randint)
        def lab_import(name, *args, **kwargs):
            if name == "random": return random_module
            raise PermissionError("Only random is available.")
        # Bound native operations before they can allocate giant text or lists.
        def lab_binary(op, a, b):
            if op == "Mult":
                for value, count in [(a, b), (b, a)]:
                    if isinstance(value, (str, list, tuple)) and isinstance(count, int) and len(value) * max(0, count) > 4000:
                        raise ValueError("Try a smaller repeated value.")
            if op == "Add": value = a + b
            elif op == "Sub": value = a - b
            elif op == "Mult": value = a * b
            elif op == "Div": value = a / b
            elif op == "FloorDiv": value = a // b
            else: value = a % b
            if isinstance(value, (str, list, tuple)) and len(value) > 4000: raise ValueError("Try a smaller value.")
            if isinstance(value, (int, float)) and abs(value) > 100000000: raise ValueError("Try smaller numbers.")
            if type(a) in (int, float) and type(b) in (int, float) and len(meta["calculations"]) < 1000:
                meta["calculations"].append({"op":op, "left":a, "right":b, "value":value})
            return value
        class BoundMath(_ast.NodeTransformer):
            def visit_BinOp(self, node):
                self.generic_visit(node)
                return _ast.copy_location(_ast.Call(func=_ast.Name(id="_lab_binary", ctx=_ast.Load()), args=[_ast.Constant(type(node.op).__name__), node.left, node.right], keywords=[]), node)
        executable = _ast.fix_missing_locations(BoundMath().visit(tree))
        safe_builtins = {"print":lab_print, "input":lab_input, "int":int, "float":float, "str":str, "bool":bool, "range":lab_range, "len":len, "abs":abs, "min":min, "max":max, "round":round, "list":list, "__import__":lab_import}
        namespace = {"__builtins__":safe_builtins, "_lab_binary":lab_binary}
        turns = 0
        def trace(frame, event, arg):
            nonlocal turns
            if frame.f_code.co_filename == "main.py" and event in ("line", "call"):
                turns += 1
                if turns > 6000: raise RuntimeError("LoopLimit: Your loop may not have a way to stop.")
            return trace
        try:
            _sys.settrace(trace)
            exec(compile(executable, "main.py", "exec"), namespace, namespace)
        finally:
            _sys.settrace(None)
        for name, value in namespace.items():
            if not name.startswith("_") and type(value) in (str, int, float, bool, list):
                meta["variables"][name] = {"type":type(value).__name__, "value":value if type(value) != list else str(value)[:200]}
        return _json.dumps({"ok":True, "output":"".join(output), "transcript":"".join(transcript), "metadata":meta})
    except Exception as error:
        _sys.settrace(None)
        return _json.dumps({"ok":False, "output":"".join(output), "transcript":"".join(transcript), "metadata":meta, "errorType":type(error).__name__, "message":str(error), "details":"".join(_traceback.format_exception(type(error), error, error.__traceback__))})
`;
 function friendlyError(result, code=''){
  const type=result.errorType||'Error',message=result.message||'';
  let text='Try one small change, then run again.';
  if(/unterminated|string literal|EOL while scanning/.test(message))text='Your text started with a quotation mark (") but it needs another quotation mark to close it.';
  else if(/never closed|unmatched|parenthes/.test(message))text='Check your parentheses. If you open one with (, you need to close it with ).';
  else if(type==='NameError')text='Python cannot find this variable. Check the spelling and capital letters. name and Name are different.';
  else if(/expected ':'/.test(message)||(/SyntaxError/.test(type)&&/^\s*(?:if|elif|else|for|while|def)\b[^\n:]*$/m.test(code)))text='This line is making a code block. Try adding a colon : at the end.';
  else if(/Indentation|TabError/.test(type))text='This line belongs inside the block above it. Move it right by 4 spaces.';
  else if(type==='TypeError'&&/str|concatenat|unsupported operand/.test(message))text='Python sees different kinds of information here: text and a number. You may need str() or an f-string.';
  else if(/LoopLimit|Timeout/.test(message+type))text='Your loop may not have a way to stop. Check what changes each time through the loop.';
  else if(type==='EOFError')text='Your program needs another reply. Add a value to Test Inputs, then run again.';
  else if(type==='PermissionError')text='This lab uses basic Python only. Files, system tools, networking, and extra packages are not available. Try print, variables, loops, or random.';
  else if(type==='ValueError'&&/invalid literal/.test(message))text='int() needs a whole number, such as 12. Change the matching Test Input to a number.';
  else if(type==='ZeroDivisionError')text='You cannot divide by zero. Choose a number greater than zero for your group.';
  else if(type==='SyntaxError')text='Look at this line closely. Check its quotes, parentheses, and Python words.';
  else if(/OutputLimit/.test(message))text=/\bwhile\b/.test(code)?'Your loop may not have a way to stop. Check what changes each time through the loop.':'That makes a lot of output! Try fewer loop turns.';
  else if(type==='ValueError')text=message;
  return text+' Try Again.';
 }
 const runtimeBase='https://cdn.jsdelivr.net/pyodide/v0.28.0/full/';
 function createRunner(onStatus=()=>{}){
  let worker=null,ready=false,pending=null,loadingTimer=null,runTimer=null,generation=0;
  let status='loading';
  const report=value=>{status=value;onStatus(value);};
  function dispose(){
   generation++;ready=false;clearTimeout(loadingTimer);clearTimeout(runTimer);
   if(worker)worker.terminate();worker=null;
   if(pending){pending.resolve({ok:false,errorType:'Cancelled',message:'Run stopped.',output:'',transcript:''});pending=null;}
  }
  function load(){
   dispose();report('loading');const token=generation;
   try{
    const source=`importScripts(${JSON.stringify(runtimeBase+'pyodide.js')});\nlet python;\n(async()=>{try{python=await loadPyodide({indexURL:${JSON.stringify(runtimeBase)}});python.runPython(${JSON.stringify(pythonHost)});postMessage({type:'ready'});}catch(error){postMessage({type:'failed'});}})();\nonmessage=event=>{try{python.globals.set('_lab_payload_json',JSON.stringify(event.data));const result=python.runPython('_lab_run(_json.loads(_lab_payload_json))');postMessage({type:'result',result:JSON.parse(result)});}catch(error){postMessage({type:'result',result:{ok:false,errorType:'RunnerError',message:String(error),output:'',transcript:''}});}};`;
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    try{worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
    worker.onmessage=event=>{
     if(token!==generation)return;
     if(event.data.type==='ready'){clearTimeout(loadingTimer);ready=true;report('ready');}
     else if(event.data.type==='failed'){dispose();report('failed');}
     else if(event.data.type==='result'&&pending){clearTimeout(runTimer);const task=pending;pending=null;task.resolve(event.data.result);}
    };
    worker.onerror=()=>{if(token===generation){dispose();report('failed');}};
    loadingTimer=setTimeout(()=>{if(token===generation&&!ready){dispose();report('failed');}},45000);
   }catch{dispose();report('failed');}
  }
  function run(code,inputs,options={}){
   if(!ready||pending)return Promise.resolve({ok:false,errorType:'Unavailable',message:'Python runner is not ready.',output:'',transcript:''});
   return new Promise(resolve=>{
    pending={resolve};
    runTimer=setTimeout(()=>{const task=pending;pending=null;dispose();report('failed');task.resolve({ok:false,errorType:'Timeout',message:'Timeout: Check your loop stopping condition.',output:'',transcript:''});},6000);
    try{worker.postMessage({code,inputs,fixedSecret:options.fixedSecret??null});}catch{clearTimeout(runTimer);pending=null;dispose();report('failed');resolve({ok:false,errorType:'RunnerError',message:'Runner stopped.',output:'',transcript:''});}
   });
  }
  load();return {run,retry:load,cancel:()=>{if(pending){dispose();report('failed');}},get status(){return status;}};
 }
 root.PythonRunner={pythonHost,friendlyError,createRunner,runtimeBase};
 if(typeof module!=='undefined')module.exports=root.PythonRunner;
})(typeof globalThis!=='undefined'?globalThis:this);
