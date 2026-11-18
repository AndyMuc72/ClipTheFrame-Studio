require('./test-fixture').ensureFixture();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
process.env.PORT='8767';require('./server');
const ffmpeg=path.join(__dirname,'tools','ffmpeg.exe'),base='http://127.0.0.1:8767';
function command(args){const p=spawnSync(ffmpeg,['-hide_banner','-loglevel','error',...args],{windowsHide:true,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr||p.error);return p;}
async function request(url,body){const r=await fetch(base+url,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});const b=await r.json();assert.ok(r.ok,JSON.stringify(b));return b;}
async function wait(job){for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,250));const j=await request('/api/job/'+job);if(j.status==='error')throw Error(j.message);if(j.status==='done')return j;}throw Error('Zeitlimit');}
(async()=>{
 for(const format of ['mov','mkv','avi','webm']){
  const file=path.join(__dirname,'tools','format-test.'+format);
  command(['-y','-i',path.join(__dirname,'tools','test-input.mp4'),'-metadata','creation_time=2020-08-09T10:20:30Z',... (format==='webm'?['-c:v','libvpx-vp9','-c:a','libopus']:['-c:v','mpeg4','-c:a','aac']),file]);
  const response=await fetch(base+'/api/upload',{method:'POST',body:fs.readFileSync(file)});assert.ok(response.ok);const upload=await response.json();
  if(format==='mov'||format==='mkv')assert.equal(upload.creationDate,'2020-08-09');
  const preview=await wait((await request('/api/preview',{id:upload.id})).job);assert.ok(preview.url);
  const result=await wait((await request('/api/export',{id:upload.id,start:.5,end:2,title:'Urlaub am See',titleDuration:1})).job);
  const output=await fetch(base+result.url);assert.ok(output.ok);const target=path.join(__dirname,'tools','export-test-'+format+'.mp4');fs.writeFileSync(target,Buffer.from(await output.arrayBuffer()));
  command(['-i',target,'-f','null','-']);console.log('OK: '+format.toUpperCase()+' Import, Vorschau und MP4-Export mit Titel und Ton');
 }
 const sourceFile=path.join(__dirname,'tools','preset-source.mp4');command(['-y','-f','lavfi','-i','color=c=blue:s=1280x720:d=1','-f','lavfi','-i','sine=frequency=440:duration=1','-c:v','libx264','-c:a','aac',sourceFile]);
 const upload=await (await fetch(base+'/api/upload',{method:'POST',body:fs.readFileSync(sourceFile)})).json();assert.equal(upload.video.width,1280);
 const invalid=await fetch(base+'/api/export',{method:'POST',body:JSON.stringify({id:upload.id,start:0,end:1,titleDuration:0,preset:'uhd'})});assert.equal(invalid.status,400);
 for(const format of ['mp4','avi','mkv','mov','webm']){
  const result=await wait((await request('/api/export',{id:upload.id,start:0,end:.8,title:'FrameForge',titleDuration:.4,format,preset:'mobile',quality:'small',speed:'fast',fps:24})).job);
  assert.ok(result.url.endsWith('.'+format));const target=path.join(__dirname,'tools','converted-test.'+format);fs.writeFileSync(target,Buffer.from(await (await fetch(base+result.url)).arrayBuffer()));
  const p=spawnSync(path.join(__dirname,'tools','ffprobe.exe'),['-v','error','-show_streams','-of','json',target],{windowsHide:true,encoding:'utf8'});assert.equal(p.status,0);const streams=JSON.parse(p.stdout).streams,v=streams.find(s=>s.codec_type==='video');assert.equal(v.width,852);assert.equal(v.height,480);assert.ok(streams.some(s=>s.codec_type==='audio'));assert.equal(v.avg_frame_rate,'24/1');console.log('OK: '+format.toUpperCase()+' Konvertierung, Handy-Preset, Qualität, Ton, 24 fps und Titel');
 }
 console.log('OK: UHD-Hochskalierung serverseitig abgewiesen');
 const titleExport=await wait((await request('/api/export',{id:upload.id,start:0,end:1,title:'TEST',titleDuration:.4,titleDelay:.3,titleX:.25,titleY:.7,titleSize:.1,format:'mp4',preset:'mobile',quality:'high'})).job);
 const titleFile=path.join(__dirname,'tools','title-position-test.mp4');fs.writeFileSync(titleFile,Buffer.from(await (await fetch(base+titleExport.url)).arrayBuffer()));
 function whitePixels(time){const p=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(time),'-i',titleFile,'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-'],{windowsHide:true,maxBuffer:10e6});assert.equal(p.status,0);let count=0,x=0,y=0;for(let i=0;i<p.stdout.length;i+=3){if(p.stdout[i]>180&&p.stdout[i+1]>180&&p.stdout[i+2]>180){count++;x+=(i/3)%852;y+=Math.floor(i/3/852);}}return {count,x:x/count,y:y/count};}
 assert.equal(whitePixels(.1).count,0);const visible=whitePixels(.5);assert.ok(visible.count>100);assert.ok(Math.abs(visible.x-852*.25)<25);assert.ok(Math.abs(visible.y-480*.7)<25);assert.equal(whitePixels(.85).count,0);console.log('OK: Titel erscheint verzögert, an der gewählten Position und verschwindet wieder (dekodierte Bildpixel geprüft)');
 const estimate=await wait((await request('/api/estimate',{id:upload.id,start:0,end:1,title:'TEST',titleDuration:.4,titleDelay:.3,titleX:.25,titleY:.7,titleSize:.1,format:'avi',preset:'mobile',quality:'small',speed:'fast'})).job);
 assert.equal(estimate.estimates.length,3);for(const e of estimate.estimates){assert.ok(e.estimatedBytes>0);assert.ok(e.minBytes<e.estimatedBytes);assert.ok(e.maxBytes>e.estimatedBytes);}assert.equal(estimate.recommended,estimate.estimates[0].format);console.log('OK: Stichprobenbasierte Größenschätzung und Formatvergleich AVI/MP4/WebM');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
