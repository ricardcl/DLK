import * as moment from 'moment';
import { Path } from './Modele/path';
const p = require('path');
const fs = require('fs');

/**
 * La Classe LogBook logge toutes les actions utilisateurs 
 * 
 */
export class LogBook {

    private fichierLog;

    //Création d'une unique instance de gestion des logs
    private static instance: LogBook = null;
    public static getInstance(): LogBook {
        if (LogBook.instance === null) {
            LogBook.instance = new LogBook();
        }
        return LogBook.instance;
    }
    
    /**
     * Constructeur de la classe LogBook 
     *  
     * fichierLog : fichier dans lequel écrire les logs 
     */
    private constructor() {
        console.log("Je rentre dans constructeur LogBook");
        this.fichierLog = fs.openSync(p.resolve(Path.logBookPath + "/logBook_" + moment().format("DD_MM_YYYY_hh_mm_s") + ".txt"), "a+");
    }
    /**
     * Cette fonction écrit dans le fichier de log l'action associée à un utilisateur donné
     * @param user utilisateur
     * @param log action de l'utilisateur
     */
    public writeLogBook(user: string, log: string): void {
        console.log("classe LogBook Fonction writeLogBook");
        fs.writeSync(this.fichierLog, String(moment().format()) + " user: " + user + " log: " + log + "\n", null, 'utf8');
    }


}