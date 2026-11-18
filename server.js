const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const crypto = require('node:crypto');
const {creationDate} = require('./mp4-date');
const {probe}=require('./probe');
const encoder=require('./encode');
const {chooseSavePath}=require('./save-dialog');
const {chooseOpenPath}=require('./open-dialog');
const sourcePaths=new Map();
async function fileHash(file){const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');}
let saveDialogOpen=false,lastSaveDirectory='';
const uploads=new Map(),processes=new Map(),exportTasks=new Map();
const root = __dirname, jobs = new Map();
const data = path.join(root,'data'); fs.mkdirSync(data,{recursive:true});
function run(args,onProgress,jobId){return new Promise((resolve,reject)=>{const local=path.join(root,'tools','ffmpeg.exe');const p=spawn(fs.existsSync(local)?local:'ffmpeg',onProgress?['-progress','pipe:1','-nostats',...args]:args,{windowsHide:true});if(jobId)processes.set(jobId,p);let log='',pending='';p.stderr.on('data',d=>log=(log+d).slice(-12000));p.stdout.on('data',d=>{pending+=d;let newline;while((newline=pending.indexOf('\n'))>=0){const line=pending.slice(0,newline).trim();pending=pending.slice(newline+1);const match=/^out_time_us=(\d+)$/.exec(line);if(match&&onProgress)onProgress(Number(match[1])/1e6);}});p.on('error',reject);p.on('close',c=>{if(jobId)processes.delete(jobId);if(jobId&&jobs.get(jobId)?.status==='cancelling'){const error=Error('Export abgebrochen');error.code='ABORTED';reject(error);}else c===0?resolve(log):reject(new Error(log));});});}
function progressReporter(job,duration){const started=Date.now();return seconds=>{const current=jobs.get(job);if(!current||current.status!=='running')return;const elapsed=(Date.now()-started)/1000,ratio=Math.max(0,Math.min(.995,seconds/duration));jobs.set(job,{...current,percent:ratio*100,elapsedSeconds:elapsed,remainingSeconds:seconds>.1&&elapsed>.5?Math.max(0,(duration-seconds)*elapsed/seconds):null});};}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));}
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>12000000)throw Error('Anfrage zu groß');}return JSON.parse(s);}
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost');
 res.setHeader('Cache-Control','no-store');
 if(u.pathname==='/api/health'){json(res,200,{app:'cliptheframe',apiVersion:8,version:require('./package.json').version,instance:process.env.INSTANCE_TOKEN||null});return;}
 if(req.method==='POST'&&u.pathname==='/api/cancel'){
  const b=await body(req);if(!/^[a-f0-9-]{36}$/.test(b.job))throw Error('Ungültiger Auftrag');const current=jobs.get(b.job);if(!current)throw Error('Auftrag unbekannt');
  if(['done','error','cancelled'].includes(current.status)){json(res,200,current);return;}
  const task=exportTasks.get(b.job);if(!task)throw Error('Dieser Auftrag kann hier nicht abgebrochen werden.');
  if(current.status!=='cancelling'){const process=processes.get(b.job);if(!process)throw Error('Der Prozess wird bereits beendet. Bitte kurz warten.');jobs.set(b.job,{...current,status:'cancelling',remainingSeconds:null});try{if(!process.kill()){jobs.set(b.job,current);throw Error('Der Prozess konnte nicht beendet werden.');}}catch(e){jobs.set(b.job,current);throw e;}}
  await task;json(res,200,jobs.get(b.job));return;
 }
 if(req.method==='POST'&&['/api/open','/api/link-source'].includes(u.pathname)){
  if(saveDialogOpen)throw Error('Eine Dateiauswahl ist bereits geöffnet.');saveDialogOpen=true;
  try{const b=await body(req);if(u.pathname==='/api/link-source'&&!/^[a-f0-9-]{36}$/.test(b.id))throw Error('Ungültiges Video');const chosen=await chooseOpenPath(u.pathname==='/api/link-source'?'Originalvideo wählen, um in dessen Ordner zu speichern':'ClipTheFrame Studio - Video öffnen');if(chosen.cancelled){json(res,200,{cancelled:true});return;}
   const original=path.resolve(chosen.path);if(u.pathname==='/api/link-source'){if(await fileHash(original)!==await fileHash(path.join(data,b.id+'.mp4')))throw Error('Das gewählte Video entspricht nicht dem geladenen Original. Bitte dieselbe Datei wählen.');sourcePaths.set(b.id,original);json(res,200,{originalPath:original});return;}
   const id=crypto.randomUUID(),copy=path.join(data,id+'.mp4');await fs.promises.copyFile(original,copy);const video=await probe(copy),stat=await fs.promises.stat(original);uploads.set(id,video);sourcePaths.set(id,original);let date=null;try{date=creationDate(copy);}catch{}json(res,200,{id,video,originalPath:original,filename:path.basename(original),lastModified:stat.mtimeMs,creationDate:date||video.creationDate});return;
  }finally{saveDialogOpen=false;}
 }
 if(req.method==='POST'&&u.pathname==='/api/save'){
  const b=await body(req);const match=/^\/media\/([a-f0-9-]{36})\.(mp4|mov|mkv|avi|webm)$/.exec(b.url||'');if(!match)throw Error('Ungültige Exportdatei');const input=path.join(data,match[1]+'.'+match[2]);if(!fs.existsSync(input))throw Error('Exportdatei fehlt');
  const filename=String(b.filename||'Mein-Videoschnitt').replace(/[<>:"/\\|?*\x00-\x1f]/g,' ').replace(/\.(mp4|mov|mkv|avi|webm)$/i,'').replace(/[. ]+$/,'').slice(0,180)+'.'+match[2];
  const original=sourcePaths.get(b.sourceId),directory=original?path.dirname(original):lastSaveDirectory;if(b.direct&&!original)throw Error('Der Originalordner ist noch nicht bekannt. Bitte das Originalvideo zuordnen.');
  if(saveDialogOpen)throw Error('Ein Speichern-Dialog ist bereits geöffnet.');saveDialogOpen=true;
  try{let target;
   if(b.direct){target=path.join(directory,filename);try{await fs.promises.copyFile(input,target,fs.constants.COPYFILE_EXCL);lastSaveDirectory=directory;json(res,200,{path:target,bytes:fs.statSync(target).size});return;}catch(e){if(e.code!=='EEXIST')throw e;}}
   const chosen=await chooseSavePath(filename,match[2],directory);if(chosen.cancelled){json(res,200,{cancelled:true});return;}target=path.resolve(chosen.path);if(!path.isAbsolute(chosen.path)||target.toLowerCase()===input.toLowerCase())throw Error('Bitte einen anderen Speicherort wählen.');await fs.promises.copyFile(input,target);lastSaveDirectory=path.dirname(target);json(res,200,{path:target,bytes:fs.statSync(target).size});return;
  }finally{saveDialogOpen=false;}
 }
 if(req.method==='POST'&&u.pathname==='/api/metadata'){
  const b=await body(req);if(!/^[a-f0-9-]{36}$/.test(b.id))throw Error('Ungültiges Video');const video=await probe(path.join(data,b.id+'.mp4'));uploads.set(b.id,video);json(res,200,{video});return;
 }
 if(req.method==='POST'&&u.pathname==='/api/upload'){
  const id=crypto.randomUUID(), file=path.join(data,id+'.mp4'); let size=0;
  const out=fs.createWriteStream(file);req.on('data',c=>size+=c.length);req.pipe(out);
  await new Promise((resolve,reject)=>{out.on('finish',resolve);out.on('error',reject);req.on('aborted',()=>{out.destroy();reject(Error('Upload abgebrochen'));});});
  if(!size)throw Error('Leere Videodatei');let date=null;try{date=creationDate(file);}catch{}
  const video=await probe(file);uploads.set(id,video);
  json(res,200,{id,creationDate:date||video.creationDate,video});return;
 }
 if(req.method==='POST'&&u.pathname==='/api/preview'){
  const b=await body(req);if(!/^[a-f0-9-]{36}$/.test(b.id))throw Error('Ungültiges Video');
  const input=path.join(data,b.id+'.mp4');if(!fs.existsSync(input))throw Error('Video fehlt');
  const job=crypto.randomUUID(),output=path.join(data,job+'.mp4');jobs.set(job,{status:'running'});
  run(['-y','-i',input,'-map','0:v:0','-map','0:a:0?','-vf','scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2','-c:v','libx264','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',output]).then(()=>jobs.set(job,{status:'done',url:'/media/'+job+'.mp4'})).catch(e=>jobs.set(job,{status:'error',message:e.code==='ENOENT'?'FFmpeg fehlt. Bitte Starten.cmd ausführen.':e.message}));
  json(res,202,{job});return;
 }
 if(req.method==='POST'&&['/api/export','/api/estimate'].includes(u.pathname)){
  const b=await body(req);if(!/^[a-f0-9-]{36}$/.test(b.id))throw Error('Ungültiges Video');const input=path.join(data,b.id+'.mp4');if(!fs.existsSync(input))throw Error('Video fehlt');
  const source=uploads.get(b.id)||await probe(input),s=encoder.settings(b,source),job=crypto.randomUUID();jobs.set(job,{status:'running',percent:0,remainingSeconds:null});
  if(u.pathname==='/api/estimate'){
   if(s.mode==='copy'){const bytes=Math.round((source.bitRate||0)*(s.end-s.start)/8);jobs.set(job,{status:'done',recommended:s.format,estimates:[{format:s.format,estimatedBytes:bytes,minBytes:Math.round(bytes*.8),maxBytes:Math.round(bytes*1.2)}]});json(res,202,{job});return;}
   (async()=>{const length=s.end-s.start,sampleLength=Math.min(1.5,length),offsets=length<=4.5?[0]:[0,(length-sampleLength)/2,length-sampleLength],results=[];
    for(const format of new Set([s.format,'mp4','webm'])){let bytes=0,seconds=0;for(let i=0;i<offsets.length;i++){const offset=offsets[i],sample=path.join(data,job+'-sample-'+format+'-'+i+'.'+format);try{await run(encoder.args({...s,format},source,input,sample,{offset,length:sampleLength}));bytes+=fs.statSync(sample).size;seconds+=sampleLength;}finally{for(const file of [sample,sample+'.txt',sample+'.title.png']){try{fs.unlinkSync(file);}catch{}}}}
     const estimatedBytes=Math.round(bytes/seconds*length);results.push({format,estimatedBytes,minBytes:Math.round(estimatedBytes*.55),maxBytes:Math.round(estimatedBytes*1.6)});
    }results.sort((a,b)=>a.estimatedBytes-b.estimatedBytes);jobs.set(job,{status:'done',estimates:results,recommended:results[0].format});
   })().catch(e=>jobs.set(job,{status:'error',message:e.message}));
  }else{const output=path.join(data,job+'.'+s.format);const task=run(encoder.args(s,source,input,output),progressReporter(job,s.end-s.start),job).then(()=>jobs.set(job,{status:'done',url:'/media/'+job+'.'+s.format,percent:100,remainingSeconds:0,bytes:fs.statSync(output).size})).catch(async e=>{if(e.code==='ABORTED'){const cleanupErrors=[];for(const file of [output,output+'.txt',output+'.title.png']){try{await fs.promises.unlink(file);}catch(error){if(error.code!=='ENOENT')cleanupErrors.push(error.message);}}jobs.set(job,{...jobs.get(job),status:'cancelled',remainingSeconds:null,message:cleanupErrors.length?'Export abgebrochen. Eine Arbeitsdatei konnte nicht entfernt werden.':'Export abgebrochen.'});}else jobs.set(job,{status:'error',message:e.code==='ENOENT'?'FFmpeg fehlt. Bitte Starten.cmd ausführen.':e.message});}).finally(()=>exportTasks.delete(job));exportTasks.set(job,task);}
  json(res,202,{job});return;
 }
 if(u.pathname.startsWith('/api/job/')){json(res,200,jobs.get(u.pathname.split('/').pop())||{status:'error',message:'Auftrag unbekannt'});return;}
 if(u.pathname.startsWith('/api/')){json(res,404,{message:'Diese Funktion ist auf dem laufenden Server nicht vorhanden. Bitte Starten.cmd erneut öffnen.'});return;}
 let file;
 if(/^\/media\/[a-f0-9-]{36}\.(mp4|mov|mkv|avi|webm)$/.test(u.pathname))file=path.join(data,path.basename(u.pathname));
 else {const files={'/':'index.html','/logo.svg':'logo.svg','/app.js':'app.js','/title-layout.js':'title-layout.js','/export-options.js':'export-options.js','/style.css':'style.css'};if(!files[u.pathname]){res.writeHead(404);res.end();return;}file=path.join(root,files[u.pathname]);}
 const stat=fs.statSync(file),type=({'.svg':'image/svg+xml','.mp4':'video/mp4','.mov':'video/quicktime','.mkv':'video/x-matroska','.avi':'video/x-msvideo','.webm':'video/webm','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'text/html; charset=utf-8';
 const range=req.headers.range;
 if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m){res.writeHead(416);res.end();return;}const a=+m[1],b=m[2]?Math.min(+m[2],stat.size-1):stat.size-1;if(a>b){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Type':type,'Content-Range':`bytes ${a}-${b}/${stat.size}`,'Accept-Ranges':'bytes','Content-Length':b-a+1});fs.createReadStream(file,{start:a,end:b}).pipe(res);}
 else{res.writeHead(200,{'Content-Type':type,'Content-Length':stat.size,'Accept-Ranges':'bytes'});fs.createReadStream(file).pipe(res);}
 }catch(e){json(res,400,{message:e.message});}});
const port=Number(process.env.PORT)||8765;
server.listen(port,'127.0.0.1',()=>console.log(`Videoschnitt: http://127.0.0.1:${port}`));
