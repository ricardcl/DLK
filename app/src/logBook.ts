const p = require('path');
const fs = require('fs');
import moment = require('moment');
import { Path } from './Modele/path';


export class LogBook {

    constructor() { }

    public writeLogBook(user: string, log: string): void {
        console.log("writeLogBook");

        let fichierDestination = p.resolve(Path.logBookPath);
        let w = fs.openSync(fichierDestination, "w");

        fs.writeSync(w, String(moment().format()) + " user: " + user + " log: " + log + "\n", null, 'utf8');

        fs.closeSync(w);
    }
}