const fs=require('node:fs'),path=require('node:path');
const {presets,dimensions,available,copyReason}=require('./export-options');
function settings(b,source){
 const s={format:b.format||'mp4',preset:b.preset||'source',quality:b.quality||'high',speed:b.speed||'fast',fps:Number(b.fps||0),start:Number(b.start),end:Number(b.end),title:String(b.title||'').slice(0,1000),titleDuration:Number(b.titleDuration??3),titleDelay:Number(b.titleDelay||0),titleX:Number(b.titleX??.5),titleY:Number(b.titleY??.5),titleSize:Number(b.titleSize??.0625),titleFont:b.titleFont||'arial',titleBold:!!b.titleBold,titleItalic:!!b.titleItalic,titleColor:b.titleColor||'#ffffff',titleOutlineColor:b.titleOutlineColor||'#000000',titleOutline:Number(b.titleOutline??0),titleBackground:b.titleBackground!==false,titleImage:b.titleImage||null,titleImageX:Number(b.titleImageX||0),titleImageY:Number(b.titleImageY||0)};
 if(!['mp4','mov','mkv','avi','webm'].includes(s.format)||!presets[s.preset]||!['high','balanced','small'].includes(s.quality)||!['turbo','fast','balanced','quality'].includes(s.speed))throw Error('Ungültige Exporteinstellung');
 if(!available(source.width,source.height,s.preset))throw Error('Dieses Preset ist nicht kleiner als das Original.');
 s.mode=b.mode||'precise';if(!['precise','copy'].includes(s.mode))throw Error('Ungültiger Schnittmodus');const reason=copyReason(s,source);if(reason)throw Error(reason);
 if(![0,24,25,30,50,60].includes(s.fps)||![s.start,s.end,s.titleDuration,s.titleDelay,s.titleX,s.titleY,s.titleSize].every(Number.isFinite)||s.start<0||s.end<=s.start||s.titleDuration<0||s.titleDelay<0||s.titleX<0||s.titleX>1||s.titleY<0||s.titleY>1||s.titleSize<.015||s.titleSize>.25)throw Error('Ungültige Zeit- oder Titeleinstellung');
 if(!['arial','verdana','georgia','courier','tahoma','trebuchet'].includes(s.titleFont)||!/^#[a-f0-9]{6}$/i.test(s.titleColor)||!/^#[a-f0-9]{6}$/i.test(s.titleOutlineColor)||!Number.isFinite(s.titleOutline)||s.titleOutline<0||s.titleOutline>12)throw Error('Ungültige Titelgestaltung');
 if(s.titleImage){if(typeof s.titleImage!=='string'||s.titleImage.length>8000000||!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(s.titleImage))throw Error('Ungültige Titelgrafik');const png=Buffer.from(s.titleImage.split(',')[1],'base64');if(png.length<24||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png.readUInt32BE(16)<1||png.readUInt32BE(20)<1||png.readUInt32BE(16)>source.width||png.readUInt32BE(20)>source.height||![s.titleImageX,s.titleImageY].every(x=>Number.isFinite(x)&&x>=0&&x<=1))throw Error('Titelgrafik überschreitet die Videogröße');}
 return s;
}
function args(s,source,input,output,{offset=0,length=s.end-s.start}={}){
 if(s.mode==='copy'){const a=['-y','-ss',String(s.start+offset),'-i',input,'-t',String(length),'-map','0:v:0','-map','0:a:0?','-c','copy','-avoid_negative_ts','make_zero'];if(s.format==='mp4'||s.format==='mov')a.push('-movflags','+faststart');return [...a,output];}
 const target=dimensions(source.width,source.height,s.preset),filters=[`scale=${target.width}:${target.height}`,'setsar=1'];
 if(s.fps&&source.fps&&s.fps<source.fps)filters.push(`fps=${s.fps}`);
 const titleFrom=Math.max(0,s.titleDelay-offset),titleTo=Math.min(length,s.titleDelay+s.titleDuration-offset,s.end-s.start-offset);
 const image=s.title.trim()&&s.titleImage&&titleTo>titleFrom;
 if(s.title.trim()&&!image&&titleTo>titleFrom){
  const txt=output+'.txt';fs.writeFileSync(txt,s.title,'utf8');const textfile=txt.replace(/\\/g,'/').replace(/:/g,'\\:');
  const fontNames={arial:['arial','arialbd','ariali','arialbi'],verdana:['verdana','verdanab','verdanai','verdanaz'],georgia:['georgia','georgiab','georgiai','georgiaz'],courier:['cour','courbd','couri','courbi'],tahoma:['tahoma','tahomabd','tahoma','tahomabd'],trebuchet:['trebuc','trebucbd','trebucit','trebucbi']};const font=fontNames[s.titleFont][(s.titleBold?1:0)+(s.titleItalic?2:0)];
  filters.push(`drawtext=fontfile='C\\:/Windows/Fonts/${font}.ttf':textfile='${textfile}':expansion=none:fontcolor=${s.titleColor.replace('#','0x')}:fontsize=h*${s.titleSize}:borderw=${s.titleOutline}:bordercolor=${s.titleOutlineColor.replace('#','0x')}:box=${s.titleBackground?1:0}:boxcolor=black@0.65:boxborderw=8:x='max(0,min(w-text_w,w*${s.titleX}-text_w/2))':y='max(0,min(h-text_h,h*${s.titleY}-text_h/2))':enable='gte(t,${titleFrom})*lt(t,${titleTo})'`);
 }
 const a=['-y','-ss',String(s.start+offset),'-i',input];
 if(image){const pngFile=output+'.title.png';fs.writeFileSync(pngFile,Buffer.from(s.titleImage.split(',')[1],'base64'));a.push('-loop','1','-i',pngFile,'-filter_complex',`[0:v]${filters.join(',')}[base];[base][1:v]overlay=x=W*${s.titleImageX}:y=H*${s.titleImageY}:enable='gte(t,${titleFrom})*lt(t,${titleTo})':eof_action=repeat:shortest=1[v]`,'-map','[v]');}
 else a.push('-map','0:v:0','-vf',filters.join(','));
 a.push('-t',String(length),'-map','0:a:0?','-pix_fmt','yuv420p');
 const crf={high:18,balanced:23,small:28}[s.quality],audio={high:'192k',balanced:'128k',small:'96k'}[s.quality];
 if(s.format==='avi')a.push('-c:v','mpeg4','-q:v',String({high:2,balanced:5,small:9}[s.quality]),'-c:a','libmp3lame','-b:a',audio);
 else if(s.format==='webm')a.push('-c:v','libvpx-vp9','-crf',String(crf+10),'-b:v','0','-cpu-used',String({turbo:8,fast:5,balanced:3,quality:1}[s.speed]),'-c:a','libopus','-b:a',audio);
 else a.push('-c:v','libx264','-preset',{turbo:'ultrafast',fast:'veryfast',balanced:'medium',quality:'slow'}[s.speed],'-crf',String(crf),'-c:a','aac','-b:a',audio);
 if(s.format==='mp4'||s.format==='mov')a.push('-movflags','+faststart');a.push(output);return a;
}
module.exports={settings,args};
