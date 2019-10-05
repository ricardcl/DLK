const p = require('path');
const fs = require('fs');
import moment = require('moment');
import { Path } from './Modele/path';


export class LogBook {
    private static instance : LogBook = null;
    private fichierLog;

    public static getInstance () : LogBook {
        if (LogBook.instance === null) {
            LogBook.instance = new LogBook();
        }
        return LogBook.instance;
    }

    private constructor() {
        this.fichierLog = fs.openSync(p.resolve(Path.logBookPath+"/logBook_" + moment().format("DD_MM_YYYY_hh_mm_s") + ".txt"), "a+");
   //TO DO : creer singleton pour les frequences
   //TO DO : afficher la date en pm et pas am
    }

    public writeLogBook(user: string, log: string): void {
        console.log("writeLogBook");
        fs.writeSync(this.fichierLog, String(moment().format()) + " user: " + user + " log: " + log + "\n", null, 'utf8');
    }
}