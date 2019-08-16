import { mixInfos, InfosLpln, InfosVemgsa } from './Parseur/MixInfos';
import { Contexte } from './Modele/enumContexte';
import { evaluationContexte, checkInitial, check } from './Parseur/check';
const p = require('path');
var SocketIOFileUpload = require("socketio-file-upload");
import { checkAnswer } from './Modele/checkAnswer';
import { Vol } from './Modele/vol';
import { UsersRepository } from './Users';
import { GrepVEMGSA } from './Parseur/grepVEMGSA';
import { GrepLPLN } from './Parseur/grepLPLN';
import { Path } from './Modele/path';
let readline = require("./scripts/node-readline/node-readline");

export class Formulaire {
    private app = require('http').createServer();
    private io = require('socket.io')(this.app);
    private users : UsersRepository;
    private contexte: Contexte;
    private grepVEMGSA : GrepVEMGSA;
    private grepLPLN : GrepLPLN;

    constructor() {
        this.users = new UsersRepository (Path.userPath);
        this.users.deleteAllUsers();

        this.app.listen(4000);
        this.initSocket();
    }

    private initSocket() {
        this.io.on("connection", (socket) => {
            console.log('connexion d un client, ouverture d une socket pour la recuperation de fichier', socket.id);
            let clientId : string = socket.id;
            this.users.createUser(clientId);
            this.grepVEMGSA = new GrepVEMGSA ( Path.userPath + "/" + clientId);
            this.grepLPLN = new GrepLPLN ( Path.userPath + "/" + clientId);

            let uploader  = new SocketIOFileUpload();
            uploader.dir = Path.userPath + "/" + clientId;
            uploader.listen(socket);


            socket.on("disconnect", (socket) => {
                console.log('disconnect', clientId);
                this.users.deleteUser (clientId);
            });

            uploader.on("complete", function (event) {
                console.log("upload complete", event.file.name);
                //mixInfos("",0, event.file.name, null);
            });

            socket.on('analyseDataInput', (arcid, plnid, lpln, listVemgsaInput) => {
                console.log("analyseDataInput");
                console.log("analyseDataInput", "fileLpln", lpln);
                console.log("typeof fileLpln", typeof lpln);
                console.log("analyseDataInput", "fileVemgsa", listVemgsaInput);
                console.log("typeof listVemgsaInput", typeof listVemgsaInput);
                console.log("typeof listVemgsaInput.length", listVemgsaInput.length);
                console.log("analyseDataInput", "arcid", arcid);
                console.log("analyseDataInput", "plnid", plnid);
                let listVemgsa = new Array;
                if (listVemgsaInput.length >= 2) {
                    listVemgsa = this.grepVEMGSA.orderVemgsa(listVemgsaInput);
                }
                else if (listVemgsaInput.length == 1){
                    listVemgsa[0] = listVemgsaInput[0];
                }



                this.contexte = evaluationContexte(lpln, listVemgsa);
                let resultCheckInitial = <checkAnswer>{};
                resultCheckInitial = checkInitial(arcid, plnid, lpln, listVemgsa, this.contexte, this.grepLPLN, this.grepVEMGSA);
                if (resultCheckInitial.valeurRetour == 0) {
                    let resultCheck: checkAnswer = check(arcid, plnid, lpln, listVemgsa,this.contexte, this.grepLPLN, this.grepVEMGSA, resultCheckInitial.creneauHoraire);
                    socket.emit("check", resultCheck)
                }
                else {
                    socket.emit("check", resultCheckInitial)
                }
            });

            socket.on('analysing', (arcid, plnid, lplnfilename, vemgsafilename) => {
                console.log("analysedVol", "arcid: ", arcid, "plnid: ", plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename);
                switch (this.contexte) {
                    case Contexte.LPLN: 
                    console.log ("->", this.grepLPLN);
                    socket.emit("analysedVol", "LPLN",  InfosLpln(arcid, plnid, lplnfilename, this.grepLPLN));
                    break;
                    case Contexte.VEMGSA: 
                    socket.emit("analysedVol", "VEMGSA",InfosVemgsa(arcid, plnid, vemgsafilename, this.grepVEMGSA));

                    break;
                    case Contexte.LPLNVEMGSA: 
                    let volLpln: Vol = InfosLpln(arcid, plnid, lplnfilename, this.grepLPLN);
                    let volVemgsa: Vol = InfosVemgsa(arcid, plnid, vemgsafilename, this.grepVEMGSA);                   
                    socket.emit("analysedVolMix",volLpln,volVemgsa,  mixInfos(volLpln, volVemgsa, arcid, plnid));
                    break;

                }

            });
        });
    }
}