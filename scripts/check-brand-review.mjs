// Routing/content and artifact checks. These do not substitute for browser acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handler} from './serve-brand-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='/python-steps-lab/';
function request(url,method='GET'){
  let result;
  handler({url,method},{writeHead(status,headers){result={status,headers};},end(body){result.body=body;}});
  return result;
}
const page=request(base);
assert.equal(page.status,200);
assert.deepEqual(page.body,fs.readFileSync(path.join(root,'index.html')));
for(const [,ref] of page.body.toString().matchAll(/(?:src|href)="(?!https?:|#|\.\.\/)([^\"]+)"/g)){
  const url=new URL(ref,'http://localhost'+base).pathname;
  const response=request(url);assert.equal(response.status,200,ref);
  const name=url.slice(base.length);
  assert.deepEqual(response.body,fs.readFileSync(path.join(root,'dist',name)),name+' matches build artifact');
}
const logoPath=base+'assets/io-tech-center-logo.png';
const logo=request(logoPath);
assert.equal(logo.status,200);assert.equal(logo.headers['Content-Type'],'image/png');
assert.equal(logo.body.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(logo.body.readUInt32BE(16),1383);assert.equal(logo.body.readUInt32BE(20),742);
assert.deepEqual(logo.body,fs.readFileSync(path.join(root,'dist/assets/io-tech-center-logo.png')));
assert.equal(request(logoPath,'HEAD').body,undefined);
assert.equal(request(logoPath,'POST').status,405);
for(const url of [base+'.env',base+'.git/config',base+'docs/CLOUD_SETUP.md',base+'supabase/config.toml',base+'tests/verify-existing-accounts.py',base+'assets/other.png',base+'assets/%2e%2e/index.html'])assert.equal(request(url).status,404,url);
assert.equal(new URL('../io-tech-learning-hub/','https://steveniotech.github.io'+base).href,'https://steveniotech.github.io/io-tech-learning-hub/');
const before=path.join(root,'.local/brand-review/before/index.html');
if(fs.existsSync(before))assert.deepEqual(request('/before'+base).body,fs.readFileSync(before));
console.log('PASS routing, real PNG bytes/MIME, exact built resources, private-path rejection, unchanged baseline route and production Hub path.');
if(process.argv.includes('--http')){
  try{
    for(const [url,expected] of [[base,page],[logoPath,logo]]){
      const response=await fetch('http://127.0.0.1:8773'+url);
      assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),expected.headers['Content-Type']);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected.body);
    }
    console.log('PASS actual HTTP: latest homepage and exact PNG from running preview.');
  }catch(error){
    console.error('Actual HTTP NOT VERIFIED: '+(error.cause?.code||error.code||error.message));process.exitCode=1;
  }
}
