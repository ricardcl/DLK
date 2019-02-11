

export class Path {
    readonly distPath : string;
    readonly assetsPath: string;
    readonly inputPath: string;
    readonly outputPath : string;
    readonly userPath : string;
    readonly  systemPath : string;

    constructor(distPath : string, assetsPath: string, inputPath: string, outputPath : string,  userPath : string, systemPath : string){
        this.distPath = distPath;
        this.assetsPath = assetsPath;
        this.inputPath = inputPath;
        this.outputPath = outputPath;
        this.userPath = userPath;
        this.systemPath = systemPath;
    }
  }