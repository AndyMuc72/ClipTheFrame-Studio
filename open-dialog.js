const {spawn}=require('node:child_process');
function chooseOpenPath(title='ClipTheFrame Studio - Video öffnen'){
 const script=`$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Windows.Forms
$dialog=New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title=$env:CLIP_OPEN_TITLE
$dialog.Filter='Videodateien|*.mp4;*.mov;*.mkv;*.avi;*.webm;*.m4v;*.mpeg;*.mpg;*.mts;*.m2ts;*.ts;*.wmv;*.flv;*.3gp;*.ogv;*.vob;*.mxf|Alle Dateien|*.*'
$dialog.Multiselect=$false
$owner=New-Object System.Windows.Forms.Form
$owner.TopMost=$true
try{if($dialog.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK){@{path=$dialog.FileName}|ConvertTo-Json -Compress}else{@{cancelled=$true}|ConvertTo-Json -Compress}}finally{$dialog.Dispose();$owner.Dispose()}`;
 return new Promise((resolve,reject)=>{const p=spawn('powershell.exe',['-NoProfile','-STA','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,env:{...process.env,CLIP_OPEN_TITLE:title}});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',c=>{try{if(c!==0)throw Error(err||'Dateiauswahl fehlgeschlagen');resolve(JSON.parse(out.replace(/^\uFEFF/,'')));}catch(e){reject(e);}});});
}
module.exports={chooseOpenPath};
