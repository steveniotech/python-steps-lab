// Only static browser assets belong in the GitHub Pages artifact.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const textFiles=['index.html','python-steps.css','brand.css','python-lessons.js','python-core.js','python-runner.js','python-steps.js','cloud-config.js','python-cloud.js','python-account.js'];
const logo='assets/io-tech-center-logo.png';
const files=[...textFiles,logo];
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'cloud-config.js'),'utf8'),context);
const config=context.PythonCloudConfig;
if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)||config.url!=='https://omqknvspgjbfgjfefpqe.supabase.co')throw Error('Invalid public cloud configuration.');
if(/sb_secret_|service_role/.test(config.publishableKey||''))throw Error('Server secrets must never be published.');
for(const [origin,pathname,expected] of [
 ['https://steveniotech.github.io','/python-steps-lab/index.html',true],
 ['http://127.0.0.1:8000','/',true],
 ['https://steveniotech.github.io','/reading-steps/',false],
 ['https://example.com','/python-steps-lab/',false]]){
 const runtime=vm.createContext({location:{origin,pathname}});
 vm.runInContext(fs.readFileSync(path.join(root,'cloud-config.js'),'utf8'),runtime);
 if(runtime.PythonCloudConfig.enabled!==expected)throw Error('Cloud origin/path gate failed.');
}
for(const file of textFiles){
 const content=fs.readFileSync(path.join(root,file),'utf8');
 if(/sb_secret_[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(content))throw Error('Credential-like value detected in static asset: '+file);
}
const image=fs.readFileSync(path.join(root,logo));
if(image.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||image.readUInt32BE(16)!==1383||image.readUInt32BE(20)!==742)throw Error('Expected complete approved PNG logo.');
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
function inspect(directory,prefix=''){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const name=prefix+entry.name;
  if(entry.isSymbolicLink())throw Error('dist contains a symlink; review it before building.');
  if(entry.isDirectory()){
   if(!files.some(file=>file.startsWith(name+'/')))throw Error('dist contains unexpected directory: '+name);
   inspect(path.join(directory,entry.name),name+'/');
  }else if(!files.includes(name))throw Error('dist contains unexpected file: '+name);
 }
}
inspect(out);
for(const file of files){
 const source=path.join(root,file);
 if(fs.lstatSync(source).isSymbolicLink())throw Error('Static source must not be a symlink: '+file);
 const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.copyFileSync(source,target);
}
console.log('Static site prepared in dist/ ('+files.length+' assets). Target project, production path, local support and credential scan passed.');
