const fs = require('node:fs');
// MP4 mvhd stores creation time as seconds since 1904-01-01 UTC.
function creationDate(file) {
 const fd=fs.openSync(file,'r');
 try {
  const size=fs.fstatSync(fd).size;
  function scan(from,to,depth=0) {
   if(depth>5)return null;
   for(let pos=from;pos+8<=to;) {
    const h=Buffer.alloc(16);if(fs.readSync(fd,h,0,8,pos)!==8)return null;
    let length=h.readUInt32BE(0),header=8;const type=h.toString('ascii',4,8);
    if(length===1){if(fs.readSync(fd,h,8,8,pos+8)!==8)return null;const n=h.readBigUInt64BE(8);if(n>BigInt(Number.MAX_SAFE_INTEGER))return null;length=Number(n);header=16;}
    if(length===0)length=to-pos;
    if(length<header||pos+length>to)return null;
    if(type==='moov'){const date=scan(pos+header,pos+length,depth+1);if(date)return date;}
    if(type==='mvhd') {
     const b=Buffer.alloc(12);if(length<header+12||fs.readSync(fd,b,0,12,pos+header)!==12)return null;
     if(b[0]!==0&&b[0]!==1)return null;
     const seconds=b[0]===1?Number(b.readBigUInt64BE(4)):b.readUInt32BE(4);
     if(!seconds)return null;
     const date=new Date(Date.UTC(1904,0,1)+seconds*1000);
     return Number.isFinite(date.getTime())&&date.getUTCFullYear()>=1904&&date.getUTCFullYear()<=9999?date.toISOString().slice(0,10):null;
    }
    pos+=length;
   }
   return null;
  }
  return scan(0,size);
 } finally {fs.closeSync(fd);}
}
module.exports={creationDate};
