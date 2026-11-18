require('./test-fixture').ensureFixture();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
let saveDialogCalls=0,saveChoice={path:path.join(__dirname,'tools','saved-video-test.mp4')};require('./save-dialog').chooseSavePath=async()=>{saveDialogCalls++;return saveChoice;};
require('./open-dialog').chooseOpenPath=async()=>({path:path.join(__dirname,'tools','test-input.mp4')});
process.env.PORT='8790';process.env.INSTANCE_TOKEN='regression-test';require('./server');const base='http://127.0.0.1:8790';
async function post(url,body){const r=await fetch(base+url,{method:'POST',body:JSON.stringify(body)});const b=await r.json();assert.ok(r.ok,JSON.stringify(b));return b;}
async function wait(job){for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,250));const b=await (await fetch(base+'/api/job/'+job)).json();if(b.status==='error')throw Error(b.message);if(b.status==='done')return b;}throw Error('Zeitlimit');}
(async()=>{
 const health=await (await fetch(base+'/api/health')).json();assert.equal(health.apiVersion,8);assert.equal(health.instance,'regression-test');
 const missing=await fetch(base+'/api/not-found');assert.equal(missing.status,404);assert.ok((await missing.json()).message);
 const uploaded=await (await fetch(base+'/api/upload',{method:'POST',body:fs.readFileSync(path.join(__dirname,'tools','test-input.mp4'))})).json();assert.ok(uploaded.video.width>0);assert.ok(uploaded.video.height>0);
 const metadata=await post('/api/metadata',{id:uploaded.id});assert.equal(metadata.video.width,uploaded.video.width);
 const copy=await wait((await post('/api/export',{id:uploaded.id,start:0,end:.7,mode:'copy',format:'mp4'})).job);const copyFile=path.join(__dirname,'tools','copy-test.mp4');fs.writeFileSync(copyFile,Buffer.from(await (await fetch(base+copy.url)).arrayBuffer()));
 function hashes(file){const p=spawnSync(path.join(__dirname,'tools','ffprobe.exe'),['-v','error','-select_streams','v:0','-show_packets','-show_data_hash','sha256','-of','json',file],{windowsHide:true,encoding:'utf8'});assert.equal(p.status,0);return JSON.parse(p.stdout).packets.map(p=>p.data_hash);}
 const originals=hashes(path.join(__dirname,'tools','test-input.mp4')),copied=hashes(copyFile);assert.ok(copied.length>0);assert.deepEqual(copied,originals.slice(0,copied.length));console.log('OK: Schnellschnitt kopiert die Videopakete unverändert (SHA-256-Vergleich).');
 const settings={id:uploaded.id,start:0,end:.7,title:'ClipTheFrame',titleDelay:.2,titleDuration:.3,titleX:.4,titleY:.6,titleSize:.08,preset:'source',quality:'small',speed:'fast',format:'mp4'};
 const result=await wait((await post('/api/export',settings)).job);const file=await fetch(base+result.url);assert.equal(Number(file.headers.get('Content-Length')),result.bytes);assert.ok(result.bytes>0);assert.equal(result.percent,100);assert.equal(result.remainingSeconds,0);
 const saved=await post('/api/save',{url:result.url,filename:'2026-11-18 Mein Titel.mp4'});assert.equal(saved.path,saveChoice.path);assert.equal(fs.statSync(saved.path).size,result.bytes);saveChoice={cancelled:true};assert.equal((await post('/api/save',{url:result.url,filename:'Test.mp4'})).cancelled,true);
 const native=await post('/api/open',{});assert.equal(native.originalPath,path.join(__dirname,'tools','test-input.mp4'));assert.ok(native.video.width>0);
 const linked=await post('/api/link-source',{id:uploaded.id});assert.equal(linked.originalPath,native.originalPath);
 const directName='direct-save-'+Date.now()+'.mp4',dialogCount=saveDialogCalls;const direct=await post('/api/save',{url:result.url,sourceId:native.id,filename:directName,direct:true});assert.equal(path.dirname(direct.path),path.dirname(native.originalPath));assert.equal(saveDialogCalls,dialogCount);assert.equal(fs.statSync(direct.path).size,result.bytes);
 const unchanged=fs.readFileSync(direct.path);const cancelledCollision=await post('/api/save',{url:result.url,sourceId:native.id,filename:directName,direct:true});assert.equal(cancelledCollision.cancelled,true);assert.equal(saveDialogCalls,dialogCount+1);assert.deepEqual(fs.readFileSync(direct.path),unchanged);
 saveChoice={path:path.join(__dirname,'tools','renamed-save-test.mp4')};const renamed=await post('/api/save',{url:result.url,sourceId:native.id,filename:directName,direct:true});assert.equal(renamed.path,saveChoice.path);assert.equal(fs.statSync(renamed.path).size,result.bytes);console.log('OK: Originalpfad beim Öffnen, Drag-&-Drop-Zuordnung, direktes Speichern im Originalordner sowie Namenskollision mit Abbruch/Umbenennen.');
 const estimate=await wait((await post('/api/estimate',settings)).job);assert.ok(estimate.estimates.every(e=>e.estimatedBytes>0));
 const ffmpeg=path.join(__dirname,'tools','ffmpeg.exe'),pngPath=path.join(__dirname,'tools','title-bitmap-test.png');let p=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=red:s=100x30','-frames:v','1',pngPath],{windowsHide:true});assert.equal(p.status,0);
 const imageSettings={...settings,titleImage:'data:image/png;base64,'+fs.readFileSync(pngPath).toString('base64'),titleImageX:.2,titleImageY:.6};
 const bitmapJob=await post('/api/export',imageSettings);const initial=await (await fetch(base+'/api/job/'+bitmapJob.job)).json();assert.ok(Number.isFinite(initial.percent));const bitmapResult=await wait(bitmapJob.job),bitmapFile=path.join(__dirname,'tools','title-bitmap-test.mp4');fs.writeFileSync(bitmapFile,Buffer.from(await (await fetch(base+bitmapResult.url)).arrayBuffer()));
 function redPixels(time){const frame=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(time),'-i',bitmapFile,'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-'],{windowsHide:true,maxBuffer:5e6});assert.equal(frame.status,0);let count=0;for(let i=0;i<frame.stdout.length;i+=3)if(frame.stdout[i]>180&&frame.stdout[i+1]<70&&frame.stdout[i+2]<70)count++;return count;}
 assert.equal(redPixels(.05),0);assert.ok(redPixels(.35)>2000);assert.equal(redPixels(.6),0);
 const invalid=await fetch(base+'/api/export',{method:'POST',body:JSON.stringify({...imageSettings,titleImage:'data:image/png;base64,AAAA'})});assert.equal(invalid.status,400);
 console.log('OK: Versionsprüfung, JSON-Fehlerantwort, MP4-Auflösung, Metadaten-Fallback, Export mit Dateigröße und Größenvergleich.');console.log('OK: Titelgrafik zeitversetzt eingeblendet (Bildpixel geprüft), PNG-Validierung und Exportfortschritt bis 100 %.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
