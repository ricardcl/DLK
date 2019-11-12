const p = require('path');
const fs = require('fs');
import moment = require('moment');
import { Path } from './Modele/path';
import { Vol } from './Modele/vol';
import { ReadLine } from './scripts/node-readline/node-readline';


export class LogBook {
    private static instance: LogBook = null;
    private fichierLog;
    private fichierVols;
    private readLine: ReadLine;
    private obj;

    public static getInstance(): LogBook {
        if (LogBook.instance === null) {
            LogBook.instance = new LogBook();
        }
        return LogBook.instance;
    }

    private constructor() {
        this.readLine = new ReadLine();
        this.obj = {
            table: []
        };
        this.fichierLog = fs.openSync(p.resolve(Path.logBookPath + "/logBook_" + moment().format("DD_MM_YYYY_hh_mm_s") + ".txt"), "a+");
         this.fichierVols = fs.openSync(p.resolve(Path.logBookPath + "/zflightBook" + ".json"), "w+");

        //TO DO : creer singleton pour les frequences
        //TO DO : afficher la date en pm et pas am
    }

    public writeLogBook(user: string, log: string): void {
        console.log("writeLogBook");
        fs.writeSync(this.fichierLog, String(moment().format()) + " user: " + user + " log: " + log + "\n", null, 'utf8');
    }

    public writeFlightLogFile(vol: Vol) {
       

        const file = this.fichierVols;
        //  return new Promise((res, rej) => {
        fs.readFile(file, 'utf8', (err, content) => {
            console.log("!!! JSON writeFlightLogFile");
            if (err) {
                //  return rej(err)
                console.log("!!! JSON writeFlightLogFile erreur", err);
                //TODO traiter le cas d'erreur
            }
            else {
                if (content !== "") {
                    console.log("!!! JSON writeFlightLogFile fichier non vide");
                    this.obj = JSON.parse(content); //now it an object
                }
                else {
                    console.log("!!! JSON writeFlightLogFile fichier  vide");
                }
                let vol2 = { "id": 12, "name": "claire" };
                console.log("!!! JSON writeFlightLogFile ajout vol");
        
                this.obj.table.push({ id: 2, vol2 }); //add some data
                const json = JSON.stringify(this.obj); //convert it back to json
                fs.writeFileSync(file, json, null, 'utf8');
            }
            console.log("!!! JSON writeFlightLogFile je sors de la fonction");
        })
      

        // this.readLine.writeFileAsync(this.fichierVols, json+"\n");
        //  res(content)

        //  })
       // fs.closeSync(file);
      

    }



    public readFlightLogFile() {
             const file = this.fichierVols;
        fs.readFile(file, 'utf8', (err, content) => {
            console.log("!!! JSON readFlightLogFile ");
            if (err) {
                console.log("!!! JSON readFlightLogFile erreur", err);
            }else {
                if (content !== "") {
                    let obj2;
                    obj2 = JSON.parse(content); //now it an object
                    console.log("!!! JSON readFlightLogFile contenu  ", obj2, "arcid", obj2.arcid);
                }
                else{
                    console.log("!!! JSON readFlightLogFile contenu vide ");
                }
            }
            console.log("!!! JSON readFlightLogFile je sors de la fonction");
        })
        // fs.closeSync(file);
    }
    //https://prograide.com/pregunta/15820/ecrire--ajouter-des-donnees-dans-un-fichier-json-en-utilisant-nodejs
    //exemple code lecture ecriture
    //https://gist.github.com/quenti77/9c6e0655896b074e7bcfdbfa338ddfb4
}