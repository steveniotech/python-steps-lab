// Only static browser assets belong in the GitHub Pages artifact.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['index.html','python-steps.css','python-lessons.js','python-core.js','python-runner.js','python-steps.js','cloud-config.js','python-cloud.js','python-account.js'];
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
for(const file of files){
 const content=fs.readFileSync(path.join(root,file),'utf8');
 if(/sb_secret_[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(content))throw Error('Credential-like value detected in static asset: '+file);
}
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
const unexpected=fs.readdirSync(out).filter(name=>!files.includes(name));
if(unexpected.length)throw Error('dist contains unexpected files; review them before building.');
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
console.log('Static site prepared in dist/ ('+files.length+' assets). Target project, production path, local support and credential scan passed.');
