const p = require('path');
/**
 * Classe permettant de gérer les chemins vers les différents dossiers de l'application
 */
export class Path {

    /** 
     * Renvoie le chemin vers le dossier hébergeant le fichier main de l'application
     */
    static get distPath(): string {
        return p.dirname(require.main.filename);
    }

    /**
     * Renvoie le chemin vers le dossier contenant toutes les session des utilisateurs
     */
    static get userPath(): string {
        return Path.distPath + "/tmpUsers";
    }

    /**
     * Renvoie le chemin vers le dossier contenant les fichiers décrivant l'association fréquence - secteur définie dans la BDS STPV
     */
    static get systemPath(): string {
        return Path.distPath + "/assets";
    }

    /** 
     * Renvoie le chemin vers le dossier contenant les logs de l'application
     */
    static get logBookPath(): string {
        return Path.distPath + "/log";
    }

    /** 
     * Renvoie le chemin vers le fichier BDS STPV à utiliser
     */
    static get STPVFilePath(): string {
        // TODO : C'est dégeulasse ! Merci de refactorer cela. Si on change le nom ca marche plus.
        return p.resolve(Path.systemPath, "STPV_G2910_CA20180816_13082018__1156")
    }
}