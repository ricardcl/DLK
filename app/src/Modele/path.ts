const p = require('path');

export class Path {
    static get distPath () : string {
        return p.dirname(require.main.filename);
    }

    static get userPath () : string {
        return Path.distPath + "/tmpUsers";
    }

    static get systemPath () : string {
        return Path.distPath + "/assets/system";
    }

    static get STPVFilePath () : string {
        // TODO : C'est dégeulasse ! Merci de refactorer cela. Si on change le nom ca marche plus.
        return p.resolve(Path.systemPath,"STPV_G2910_CA20180816_13082018__1156")
    }
  }