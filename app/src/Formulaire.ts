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
import { creneauHoraire, Dates } from './Parseur/date';
import { ParseurLPLN } from './Parseur/parseurLPLN';
import { ParseurVEMGSA } from './Parseur/parseurVEMGSA';
import { LogBook } from './logBook';
import { Database } from './database';
import { Identifiants, inputData } from './Modele/identifiants';
import { Split } from './Parseur/split';
//import { Ftp } from './ftp';



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
    private database: Database;
    private dates: Dates;
    private split: Split;
    // private clientFtp: Ftp;



    constructor() {
        console.log("Je rentre dans le constructor Formulaire ");

        this.users = new UsersRepository(Path.userPath);
        this.users.deleteAllUsers();

        this.app.listen(4000);
        this.initSocket();
        this.split = new Split();
        this.dates = new Dates(this.split);
        this.frequences = new Frequences();
        this.check = new Check(this.dates);
        this.mixInfos = new MixInfos(this.dates, this.frequences);

        this.logBook = LogBook.getInstance();


        //Traitement bdd
        this.database = new Database();
        /**
        this.database.query('SELECT * from vol')
            .then(rows => {
                console.log(" database connectee", rows);
            })
            .catch(err => {
                // handle the error
                console.log("bdd non connectee", err);

            });*/
        //https://codeburst.io/node-js-mysql-and-promises-4c3be599909b


        // Connexion FTP
        //  this.clientFtp = new Ftp();
        //  this.clientFtp.connect();



    }

    private initSocket() {
        this.io.on("connection", (socket) => {
            console.log('connexion d un client, ouverture d une socket pour la recuperation de fichier', socket.id);

            let clientId: string = socket.id;
            this.users.createUser(clientId);
            this.grepVEMGSA = new GrepVEMGSA(Path.userPath + "/" + clientId, this.dates);
            this.grepLPLN = new GrepLPLN(Path.userPath + "/" + clientId, this.dates, this.split);
            this.parseurLPLN = new ParseurLPLN(this.grepLPLN, this.dates, this.split, this.frequences);
            this.parseurVEMGSA = new ParseurVEMGSA(this.grepVEMGSA, this.dates, this.split, this.frequences);
            let uploader = new SocketIOFileUpload();
            uploader.dir = Path.userPath + "/" + clientId;
            uploader.listen(socket);
            this.logBook.writeLogBook(clientId, "connexion client");

            // Connexion FTP
            //   this.clientFtp = new Ftp();
            //   this.clientFtp.connect2( socket, this.logBook,clientId );

            /**  Traitement bdd : Récupération de la liste de tous les vols   */
            this.database.readAllVol(socket);

            socket.on("disconnect", (socket) => {
                console.log('disconnect', clientId);
                this.logBook.writeLogBook(clientId, "deconnexion client");
                this.users.deleteUser(clientId);
            });

            uploader.on("complete", (event) => {
                console.log("upload complete", event.file.name);
                let log: string = "telechargement fichier " + event.file.name;
                this.logBook.writeLogBook(clientId, log);
            });

            socket.on('analyseDataInput', (arcid, plnid, lpln, listVemgsaInput) => {
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
                let plageVemgsa = new Array;
                if (listVemgsaInput.length >= 2) {
                    plageVemgsa = this.grepVEMGSA.orderVemgsa(listVemgsaInput);
                }
                else if (listVemgsaInput.length == 1) {
                    plageVemgsa[0] = listVemgsaInput[0];
                }

                this.contexte = this.check.evaluationContexte(lpln, plageVemgsa);
                let resultCheck = <checkAnswer>{};
                resultCheck = this.check.check(arcid, plnid, lpln, plageVemgsa, this.contexte, this.grepLPLN, this.grepVEMGSA);
                socket.emit("check", resultCheck);

            });

            socket.on('analysing', (id: Identifiants, lplnfilename, vemgsafilename, checkanswer: checkAnswer) => {
                this.logBook.writeLogBook(clientId, "analysing " + "arcid: " + id.arcid + "plnid: " + id.plnid + "lplnfilename: " + lplnfilename + "vemgsafilename: " + vemgsafilename);
                console.log("analysing données recues: " + "arcid " + id.arcid, "plnid: ", id.plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename, 'checkanswer : ', checkanswer);
                console.log("analysing données recues: ", "creneauHoraire", id.dates);
                console.log("analysing données recues: ", "inLpln", id.inLpln, "inVemgsa", id.inVemgsa);

                console.log("this.contexte av", this.contexte);

                let inputData: inputData = <inputData>{};
                inputData.identifiant = id;
                inputData.lplnfilename = lplnfilename;
                inputData.vemgsafilename = vemgsafilename;

                if ((this.contexte == Contexte.LPLNVEMGSA) && (!id.inLpln)) {
                    this.contexte = Contexte.VEMGSA;
                }
                if ((this.contexte == Contexte.LPLNVEMGSA) && (!id.inVemgsa)) {
                    this.contexte = Contexte.LPLN;
                }
                console.log("this.contexte ap", this.contexte);

                console.log("analysedVol");
                let volLpln, volVemgsa, volMix;
                switch (this.contexte) {
                    case Contexte.LPLN:

                        console.log("analysedVol Contexte.LPLN");
                        volLpln = this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN);
                        socket.emit("analysedVol", "LPLN", inputData, volLpln, null, null);

                        /**  Traitement bdd */
                        // Mise à jour de la  bdd avec le vol analysé
                        this.database.writeVol(id, "LPLN", volLpln, null, null);
                        //  Traitement bdd : Envoi au client de la liste des vols actualisée 
                        this.database.readAllVol(socket);

                        break;
                    case Contexte.VEMGSA:
                        volVemgsa = this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA);

                        console.log("analysedVol Contexte.VEMGSA");
                        socket.emit("analysedVol", "VEMGSA", inputData, null, volVemgsa, null);
                        /**  Traitement bdd */
                        this.database.writeVol(id, "VEMGSA", null, volVemgsa, null);
                        this.database.readAllVol(socket);;
                        break;
                    case Contexte.LPLNVEMGSA:
                        console.log("analysedVol Contexte.LPLN et VEMGSA");
                        volLpln = this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN);
                        volVemgsa = this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA);
                        volMix = this.mixInfos.mixInfos(this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN), this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA), id.arcid, id.plnid, id.dates);


                        if ((checkanswer.checkLPLN.valeurRetour <= 1) && (checkanswer.checkVEMGSA.valeurRetour <= 2)) {
                            console.log("analysedVol Contexte.LPLN et VEMGSA :  CAS 1 ");

                            socket.emit("analysedVol", "MIX", inputData,
                                // this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN),
                                volLpln,
                                // this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA),
                                volVemgsa,
                                //  this.mixInfos.mixInfos(this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN), this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA), id.arcid, id.plnid, id.dates)
                                volMix
                            );
                            /**  Traitement bdd */
                            this.database.writeVol(id, "MIX", volLpln, volVemgsa, volMix);
                            this.database.readAllVol(socket);;
                        }
                        else {
                            if (checkanswer.checkLPLN.valeurRetour <= 1) {
                                console.log("analysedVol Contexte.LPLN et VEMGSA :  CAS 2 ");

                                socket.emit("analysedVol", "LPLN", inputData,volLpln, null, null);
                                this.database.writeVol(id, "LPLN", volLpln, null, null);
                            }
                            else {
                                console.log("analysedVol Contexte.LPLN et VEMGSA :  CAS 3 ");
                                socket.emit("analysedVol", "VEMGSA", inputData, null,volVemgsa, null);
                                this.database.writeVol(id, "LPLN", null, volVemgsa, null);
                            }
                        }

                        break;

                }

            });

            socket.on("getVolFromDatabase", (id: string) => {
                console.log("getVolFromDatabase", id);
                this.database.readVol(socket, id)
            });

        });
    }


}