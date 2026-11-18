require('./test-fixture').ensureFixture();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
process.env.PORT='8791';require('./server');const base='http://127.0.0.1:8791';
async function post(url,data){const r=await fetch(base+url,{method:'POST',body:JSON.stringify(data)}),b=await r.json();assert.ok(r.ok,JSON.stringify(b));return b;}
async function job(id){return (await fetch(base+'/api/job/'+id)).json();}
(async()=>{
 const input=fs.readFileSync(path.join(__dirname,'tools','test-input.mp4'));const upload=await (await fetch(base+'/api/upload',{method:'POST',body:input})).json();assert.ok(upload.id);
 const pending=await post('/api/export',{id:upload.id,start:0,end:3,title:'Abbruchtest',titleDuration:3,format:'webm',quality:'high',speed:'quality'});
 const result=await post('/api/cancel',{job:pending.job});assert.equal(result.status,'cancelled');assert.equal((await job(pending.job)).status,'cancelled');
 for(const suffix of ['.webm','.webm.txt','.webm.title.png'])assert.equal(fs.existsSync(path.join(__dirname,'data',pending.job+suffix)),false);
 assert.equal((await post('/api/cancel',{job:pending.job})).status,'cancelled');
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');assert.equal(hash(fs.readFileSync(path.join(__dirname,'data',upload.id+'.mp4'))),hash(input));
 const retry=await post('/api/export',{id:upload.id,start:0,end:.4,titleDuration:0,format:'mp4',speed:'turbo'});let done;for(let i=0;i<120;i++){done=await job(retry.job);if(done.status==='done')break;if(done.status==='error')throw Error(done.message);await new Promise(r=>setTimeout(r,100));}assert.equal(done.status,'done');assert.equal((await post('/api/cancel',{job:retry.job})).status,'done');assert.ok(fs.existsSync(path.join(__dirname,'data',retry.job+'.mp4')));
 console.log('OK: Laufenden FFmpeg-Export abgebrochen, Arbeitsdateien entfernt, Original unverändert, erneuter Export erfolgreich und fertiger Export vor spätem Abbruch geschützt.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
