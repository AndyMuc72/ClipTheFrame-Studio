const {spawn}=require('node:child_process');
function chooseSavePath(filename,extension,initialDirectory=''){
 if(process.platform!=='win32')return Promise.reject(Error('Der Speichern-Dialog ist nur unter Windows verfügbar.'));
 const script=`$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Windows.Forms
$dialog=New-Object System.Windows.Forms.SaveFileDialog
$dialog.Title='ClipTheFrame Studio - Video speichern unter'
$dialog.FileName=$env:CLIP_SAVE_NAME
$dialog.DefaultExt=$env:CLIP_SAVE_EXT
$dialog.Filter='Videodatei (*.'+$env:CLIP_SAVE_EXT+')|*.'+$env:CLIP_SAVE_EXT
$dialog.AddExtension=$true
$dialog.OverwritePrompt=$true
$dialog.RestoreDirectory=$true
if($env:CLIP_SAVE_DIR -and (Test-Path -LiteralPath $env:CLIP_SAVE_DIR)){$dialog.InitialDirectory=$env:CLIP_SAVE_DIR}else{$dialog.InitialDirectory=[Environment]::GetFolderPath('MyVideos')}
$owner=New-Object System.Windows.Forms.Form
$owner.TopMost=$true
try{if($dialog.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK){@{path=$dialog.FileName}|ConvertTo-Json -Compress}else{@{cancelled=$true}|ConvertTo-Json -Compress}}finally{$dialog.Dispose();$owner.Dispose()}`;
 return new Promise((resolve,reject)=>{const p=spawn('powershell.exe',['-NoProfile','-STA','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,env:{...process.env,CLIP_SAVE_NAME:filename,CLIP_SAVE_EXT:extension,CLIP_SAVE_DIR:initialDirectory}});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',code=>{try{if(code!==0)throw Error(err||'Der Speichern-Dialog konnte nicht geöffnet werden.');resolve(JSON.parse(out.replace(/^\uFEFF/,'')));}catch(e){reject(e);}});});
}
module.exports={chooseSavePath};
