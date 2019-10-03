import { Contexte } from './Modele/enumContexte';
var SocketIOFileUpload = require("socketio-file-upload");
import { checkAnswer } from './Modele/checkAnswer';
import { Vol } from './Modele/vol';
import { UsersRepository } from './Users';
import { GrepVEMGSA } from './Parseur/grepVEMGSA';
import { GrepLPLN } from './Parseur/grepLPLN';
import { Path } from './Modele/path';
import { Check } from './Parseur/check';
import { MixInfos } from './Parseur/MixInfos';
import { Frequences } from './Parseur/frequences';
import { datesFile } from './Parseur/date';
import { ParseurLPLN } from './Parseur/parseurLPLN';
import { ParseurVEMGSA } from './Parseur/ParseurVEMGSA';
import { LogBook } from './logBook';



export class Formulaire {
    private app = require('http').createServer();
    private io = require('socket.io')(this.app);
    private users: UsersRepository;
    private contexte: Contexte;
    private grepVEMGSA: GrepVEMGSA;
    private grepLPLN: GrepLPLN;
    private parseurLPLN: ParseurLPLN;
    private parseurVEMGSA: ParseurVEMGSA;
    private check: Check;
    private mixInfos: MixInfos;
    private frequences: Frequences;
    private logBook: LogBook;

    constructor() {
        this.users = new UsersRepository(Path.userPath);
        this.users.deleteAllUsers();

        this.app.listen(4000);
        this.initSocket();
        this.check = new Check();
        this.mixInfos = new MixInfos();
        this.frequences = new Frequences();
        this.logBook = new LogBook();
    }

    


    private initSocket() {
        this.io.on("connection", (socket) => {
            console.log('connexion d un client, ouverture d une socket pour la recuperation de fichier', socket.id);

            let clientId: string = socket.id;
            this.users.createUser(clientId);
            this.grepVEMGSA = new GrepVEMGSA(Path.userPath + "/" + clientId);
            this.grepLPLN = new GrepLPLN(Path.userPath + "/" + clientId);
            this.parseurLPLN = new ParseurLPLN(this.grepLPLN);
            this.parseurVEMGSA = new ParseurVEMGSA(this.grepVEMGSA);
            let uploader = new SocketIOFileUpload();
            uploader.dir = Path.userPath + "/" + clientId;
            uploader.listen(socket);
            this.logBook.writeLogBook(clientId,"connexion client");

            socket.on("disconnect", (socket) => {
                console.log('disconnect', clientId);
                this.logBook.writeLogBook(clientId,"deconnexion client");
                this.users.deleteUser(clientId);
            });

            uploader.on("complete", function (event) {
                console.log("upload complete", event.file.name);
                let log:string="telechargement fichier "+event.file.name;
                this.logBook.writeLogBook(clientId,log);

                //mixInfos("",0, event.file.name, null); 
            });

            socket.on('analyseDataInput', (arcid, plnid, lpln, listVemgsaInput, horaire) => {

                // Create frequence files : 
                this.frequences.GbdiToFreq(Path.STPVFilePath);  //A modifier de place !!! 

                console.log("analyseDataInput");
                console.log("analyseDataInput", "fileLpln", lpln);
                console.log("typeof fileLpln", typeof lpln);
                console.log("analyseDataInput", "fileVemgsa", listVemgsaInput);
                console.log("typeof listVemgsaInput", typeof listVemgsaInput);
                console.log("typeof listVemgsaInput.length", listVemgsaInput.length);
                console.log("analyseDataInput", "arcid", arcid);
                console.log("analyseDataInput", "plnid", plnid);
                console.log("analyseDataInput", "horaire", horaire);
                if (horaire == '') {
                    horaire = undefined;
                }
                console.log("analyseDataInput", "horaire", horaire);
                let listVemgsa = new Array;
                if (listVemgsaInput.length >= 2) {
                    listVemgsa = this.grepVEMGSA.orderVemgsa(listVemgsaInput);
                }
                else if (listVemgsaInput.length == 1) {
                    listVemgsa[0] = listVemgsaInput[0];
                }



                this.contexte = this.check.evaluationContexte(lpln, listVemgsa);
                let resultCheck = <checkAnswer>{};
                resultCheck = this.check.check(arcid, plnid, lpln, listVemgsa, this.contexte, this.grepLPLN, this.grepVEMGSA, horaire);
                socket.emit("check", resultCheck);

            });

            socket.on('analysing', (arcid, plnid, lplnfilename, vemgsafilename, checkanswer: checkAnswer, chosenHoraire) => {
                this.logBook.writeLogBook(clientId,"analysing "+"arcid: "+arcid+"plnid: "+ plnid+"lplnfilename: "+ lplnfilename+"vemgsafilename: "+vemgsafilename +"chosenHoraire: "+ chosenHoraire);
                if (chosenHoraire == '') {
                    chosenHoraire = undefined;
                }


                console.log("analysedVol");
                switch (this.contexte) {
                    case Contexte.LPLN:
                        console.log("analysedVol Contexte.LPLN", "arcid: ", checkanswer.checkLPLN.arcid, "plnid: ", checkanswer.checkLPLN.plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename, 'checkanswer : ', checkanswer);
                        socket.emit("analysedVol", "LPLN", this.mixInfos.InfosLpln(checkanswer.arcid, checkanswer.plnid, lplnfilename, this.parseurLPLN));
                        break;
                    case Contexte.VEMGSA:
                        console.log("analysedVol Contexte.VEMGSA", "arcid: ", checkanswer.checkVEMGSA.arcid, "plnid: ", checkanswer.checkVEMGSA.plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename, 'checkanswer : ', checkanswer);
                        socket.emit("analysedVol", "VEMGSA", this.mixInfos.InfosVemgsa(checkanswer.arcid, checkanswer.plnid, vemgsafilename, this.parseurVEMGSA, checkanswer.checkVEMGSA.creneauVemgsa, chosenHoraire));
                        break;
                    case Contexte.LPLNVEMGSA:
                        console.log("analysedVol Contexte.LPLN et VEMGSA : données LPLN", "arcid: ", checkanswer.checkLPLN.arcid, "plnid: ", checkanswer.checkLPLN.plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename, 'checkanswer : ', checkanswer);
                        console.log("analysedVol Contexte.LPLN et VEMGSA : données VEMGSA", "arcid: ", checkanswer.checkVEMGSA.arcid, "plnid: ", checkanswer.checkVEMGSA.plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename, 'checkanswer : ', checkanswer);


                        if ((checkanswer.checkLPLN.valeurRetour <= 1) && (checkanswer.checkVEMGSA.valeurRetour <= 4)) {

                            //let volLpln :Vol;
                            //let volVemgsa :Vol;
                            // volLpln = this.mixInfos.InfosLpln(checkanswer.checkLPLN.arcid, checkanswer.checkLPLN.plnid, lplnfilename, this.parseurLPLN); 
                            //volVemgsa = this.mixInfos.InfosVemgsa(checkanswer.checkVEMGSA.arcid, checkanswer.checkVEMGSA.plnid, vemgsafilename,this.parseurVEMGSA, checkanswer.checkVEMGSA.creneauVemgsa, chosenHoraire); 

                            socket.emit("analysedVolMix",
                                this.mixInfos.InfosLpln(checkanswer.checkLPLN.arcid, checkanswer.checkLPLN.plnid, lplnfilename, this.parseurLPLN),
                                this.mixInfos.InfosVemgsa(checkanswer.checkVEMGSA.arcid, checkanswer.checkVEMGSA.plnid, vemgsafilename, this.parseurVEMGSA, checkanswer.checkVEMGSA.creneauVemgsa, chosenHoraire),
                                this.mixInfos.mixInfos(this.mixInfos.InfosLpln(checkanswer.checkLPLN.arcid, checkanswer.checkLPLN.plnid, lplnfilename, this.parseurLPLN), this.mixInfos.InfosVemgsa(checkanswer.checkVEMGSA.arcid, checkanswer.checkVEMGSA.plnid, vemgsafilename, this.parseurVEMGSA, checkanswer.checkVEMGSA.creneauVemgsa, chosenHoraire), checkanswer.arcid, checkanswer.plnid)
                                );                                
                        }
                        else {
                            if (checkanswer.checkLPLN.valeurRetour <= 1) {
                                socket.emit("analysedVol", "LPLN", this.mixInfos.InfosLpln(checkanswer.checkLPLN.arcid, checkanswer.checkLPLN.plnid, lplnfilename, this.parseurLPLN));
                            }
                            else {
                                socket.emit("analysedVol", "VEMGSA", this.mixInfos.InfosVemgsa(checkanswer.checkVEMGSA.arcid, checkanswer.checkVEMGSA.plnid, vemgsafilename, this.parseurVEMGSA, checkanswer.checkVEMGSA.creneauVemgsa, chosenHoraire));
                            }
                        }

                        break;

                }

            });
        });
    }

    
}