
const fs = require('fs');



export class ReadLine {

  private  filePtr ;
  private fileBuffer;
  private buffer ;

  
  constructor() {
      this.filePtr = {};
      this.fileBuffer = {};
      this.buffer =   Buffer.alloc(4096);
  }

  public  fopen (path:string, mode:string):any {
    let handle = fs.openSync(path, mode); //Returns an integer representing the file descriptor.
    this.filePtr[handle] = 0;
    this.fileBuffer[handle]= [];
    return handle;
  }

  public fclose(handle) {
    fs.closeSync(handle);
    if (handle in this.filePtr) {
      delete this.filePtr[handle];
      delete this.fileBuffer[handle];
    }
    return;
  }
  
  
  
  
  public fgets(handle) {
    if(this.fileBuffer[handle].length == 0)
    {
      let pos = this.filePtr[handle];
      let br = fs.readSync(handle, this.buffer, 0, 4096, pos);
      if(br < 4096) {
        delete this.filePtr[handle];
        if(br == 0)  return false;
      }
      let lst = this.buffer.slice(0, br).toString().split("\n");
      let minus = 0;
      if(lst.length > 1) {
        var x = lst.pop();
        minus = x.length;
      }
      this.fileBuffer[handle] = lst;
      this.filePtr[handle] = pos + br - minus;
    }
    return this.fileBuffer[handle].shift();
  }
  
  public eof (handle) {
    return (handle in this.filePtr) == false && (this.fileBuffer[handle].length == 0);
  }
  
 
  
  


}

