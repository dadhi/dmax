const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const cur = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
let head = null;
try{ head = execSync('git show HEAD:index.html',{cwd: path.join(__dirname,'..')}).toString('utf8'); }catch(e){ console.error('git show failed', e.message); process.exit(2); }
function scriptContent(html){
  const m = html.match(/<script[^>]*>([\s\S]*)<\/script>/i);
  return m ? m[1] : '';
}
function bytes(s){ return Buffer.byteLength(s,'utf8'); }
const curAll = cur;
const headAll = head;
const curScript = scriptContent(curAll);
const headScript = scriptContent(headAll);
console.log('Sizes (bytes/chars):');
console.log('Current full file bytes:', bytes(curAll));
console.log('Current full file chars:', curAll.length);
console.log('HEAD full file bytes   :', bytes(headAll));
console.log('HEAD full file chars   :', headAll.length);
console.log('Delta full bytes       :', bytes(curAll)-bytes(headAll));
console.log('');
console.log('Current <script> bytes :', bytes(curScript));
console.log('Current <script> chars :', curScript.length);
console.log('HEAD <script> bytes    :', bytes(headScript));
console.log('HEAD <script> chars    :', headScript.length);
console.log('Delta script bytes     :', bytes(curScript)-bytes(headScript));
console.log('');
// gzip sizes via node zlib
try{
  const zlib = require('zlib');
  const gzCur = zlib.gzipSync(Buffer.from(curScript,'utf8'), {level: 9});
  const gzHead = zlib.gzipSync(Buffer.from(headScript,'utf8'), {level: 9});
  console.log('Gzipped script sizes (bytes): current', gzCur.length, 'HEAD', gzHead.length, 'delta', gzCur.length - gzHead.length);
}catch(e){ /* ignore */ }
