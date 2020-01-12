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
import { ParseurVEMGSA } from './Parseur/ParseurVEMGSA';
import { LogBook } from './logBook';
import { Database } from './database';
import { Identifiants, inputData } from './Modele/identifiants';
import { Split } from './Parseur/split';



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
        this.database = new Database();
        this.database.connectionDatabase();
    }




    private initSocket() {
        this.io.on("connection", (socket) => {
            console.log('connexion d un client, ouverture d une socket pour la recuperation de fichier', socket.id);

            let clientId: string = socket.id;
            this.users.createUser(clientId);
            this.grepVEMGSA = new GrepVEMGSA(Path.userPath + "/" + clientId, this.dates);
            this.grepLPLN = new GrepLPLN(Path.userPath + "/" + clientId, this.dates, this.split);
            this.parseurLPLN = new ParseurLPLN(this.grepLPLN, this.dates, this.split,this.frequences);
            this.parseurVEMGSA = new ParseurVEMGSA(this.grepVEMGSA, this.dates, this.split,this.frequences);
            let uploader = new SocketIOFileUpload();
            uploader.dir = Path.userPath + "/" + clientId;
            uploader.listen(socket);
            this.logBook.writeLogBook(clientId, "connexion client");
            this.database.readFlightDatabase().then(result => {
                console.log("result",result);
                
                socket.emit("database", result.rows);
            }).catch(e => console.error(e.stack));
            
            socket.on("disconnect", (socket) => {
                console.log('disconnect', clientId);
                this.logBook.writeLogBook(clientId, "deconnexion client");
                this.users.deleteUser(clientId);
            });

            uploader.on("complete", (event) => {
                console.log("upload complete", event.file.name);
                let log: string = "telechargement fichier " + event.file.name;
                this.logBook.writeLogBook(clientId, log);

                //mixInfos("",0, event.file.name, null); 
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

                //TODO : gérer l'envoi par l'utilisateur de deux fichiers identiques


                this.contexte = this.check.evaluationContexte(lpln, plageVemgsa);
                let resultCheck = <checkAnswer>{};
                resultCheck = this.check.check(arcid, plnid, lpln, plageVemgsa, this.contexte, this.grepLPLN, this.grepVEMGSA );
                socket.emit("check", resultCheck);

            });

            socket.on('analysing', (id: Identifiants, lplnfilename, vemgsafilename, checkanswer: checkAnswer) => {
                this.logBook.writeLogBook(clientId, "analysing " + "arcid: " + id.arcid + "plnid: " + id.plnid + "lplnfilename: " + lplnfilename + "vemgsafilename: " + vemgsafilename);
                console.log("analysing données recues: " + "arcid " + id.arcid, "plnid: ", id.plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename, 'checkanswer : ', checkanswer);
                console.log("analysing données recues: ", "creneauHoraire", id.dates);
                console.log("analysing données recues: ", "inLpln", id.inLpln, "inVemgsa", id.inVemgsa);

                console.log("this.contexte av", this.contexte);

                let inputData:inputData = <inputData>{};
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
                switch (this.contexte) {
                    case Contexte.LPLN:
                        // Stockage du vol dans un fichier json
                        /** console.log("!!!! this.database.writeFlightDatabase");
                        //TODO gerer la database
                          try {
                              this.database.writeFlightDatabase(this.mixInfos.InfosLpln(checkanswer.arcid, checkanswer.plnid, lplnfilename, this.parseurLPLN));
                          } catch (error) {
                              console.log ("ERRORRRRRR", error);
                          }
  */ 
                        
                        console.log("analysedVol Contexte.LPLN");
                        socket.emit("analysedVol", "LPLN",inputData, this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN), null, null);
                        //recuperation du vol dans le fichier json
                        //console.log("!!!!JSON this.logBook.readFlightDatabase");
                        //this.database.readFlightDatabase();

                        break;
                    case Contexte.VEMGSA:
                        console.log("analysedVol Contexte.VEMGSA");
                        socket.emit("analysedVol", "VEMGSA", inputData,null, this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA), null);
                        break;
                    case Contexte.LPLNVEMGSA:
                        console.log("analysedVol Contexte.LPLN et VEMGSA");


                        if ((checkanswer.checkLPLN.valeurRetour <= 1) && (checkanswer.checkVEMGSA.valeurRetour <= 2)) {
                            console.log("analysedVol Contexte.LPLN et VEMGSA :  CAS 1 ");
                            // let volLpln :Vol;
                            //                 let volVemgsa :Vol;
                            //              volLpln = this.mixInfos.InfosLpln(checkanswer.checkLPLN.arcid, checkanswer.checkLPLN.plnid, lplnfilename, this.parseurLPLN); 
                            //         volVemgsa = this.mixInfos.InfosVemgsa(checkanswer.checkVEMGSA.arcid, checkanswer.checkVEMGSA.plnid, vemgsafilename,this.parseurVEMGSA, checkanswer.checkVEMGSA.creneauVemgsa); 


                            socket.emit("analysedVol", "MIX",inputData,
                                //null,    
                                this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN),
                                //volLpln,
                                // null,
                                this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA),
                                //volVemgsa,
                                this.mixInfos.mixInfos(this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN), this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA), id.arcid, id.plnid, id.dates)
                                //this.mixInfos.mixInfos(volLpln,volVemgsa,checkanswer.arcid, checkanswer.plnid)
                            );
                        }
                        else {
                            if (checkanswer.checkLPLN.valeurRetour <= 1) {
                                console.log("analysedVol Contexte.LPLN et VEMGSA :  CAS 2 ");

                                socket.emit("analysedVol", "LPLN",inputData, this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN), null, null);
                            }
                            else {
                                console.log("analysedVol Contexte.LPLN et VEMGSA :  CAS 3 ");

                                socket.emit("analysedVol", "VEMGSA",inputData, null, this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA), null);
                            }
                        }

                        break;

                }

            });
        });
    }


}