
const fs = require('fs');
let filePtr = {};
let fileBuffer = {};
let buffer =   Buffer.alloc(4096);


export function fopen (path:string, mode:string):number {
  let handle = fs.openSync(path, mode); //Returns an integer representing the file descriptor.
  filePtr[handle] = 0;
  fileBuffer[handle]= [];
  return handle;
}

export function fclose(handle) {
  fs.closeSync(handle);
  if (handle in filePtr) {
    delete filePtr[handle];
    delete fileBuffer[handle];
  }
  return;
}




export function fgets(handle) {
  if(fileBuffer[handle].length == 0)
  {
    let pos = filePtr[handle];
    let br = fs.readSync(handle, buffer, 0, 4096, pos);
    if(br < 4096) {
      delete filePtr[handle];
      if(br == 0)  return false;
    }
    let lst = buffer.slice(0, br).toString().split("\n");
    let minus = 0;
    if(lst.length > 1) {
      var x = lst.pop();
      minus = x.length;
    }
    fileBuffer[handle] = lst;
    filePtr[handle] = pos + br - minus;
  }
  return fileBuffer[handle].shift();
}

export function eof (handle) {
  return (handle in filePtr) == false && (fileBuffer[handle].length == 0);
}
