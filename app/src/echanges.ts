import { Contexte } from './Modele/enumContexte';
import { checkAnswer } from './Modele/interfacesControles';
import { Vol } from './Modele/vol';
import { UsersRepository } from './Users';
import { ParseurVEMGSA } from './Parseur/parseurVEMGSA';
import { ParseurLPLN } from './Parseur/parseurLPLN';
import { Path } from './Modele/path';
import { Controles } from './Parseur/controles';
import { Conception } from './Parseur/conceptionVol';
import { Frequences } from './Parseur/frequences';
import { Dates } from './Parseur/date';
import { AnalyseLPLN } from './Parseur/analyseLPLN';
import { AnalyseVEMGSA } from './Parseur/analyseVEMGSA';
import { LogBook } from './logBook';
import { Database } from './database';
import { Identifiants, inputData } from './Modele/identifiants';
import { Split } from './Parseur/split';
var SocketIOFileUpload = require("socketio-file-upload");

//import { Ftp } from './ftp';



export class Echanges {
    private app = require('http').createServer();
    private io = require('socket.io')(this.app);
    private users: UsersRepository;
    private contexte: Contexte;
    private parseurVEMGSA: ParseurVEMGSA;
    private parseurLPLN: ParseurLPLN;
    private analyseLPLN: AnalyseLPLN;
    private analyseVEMGSA: AnalyseVEMGSA;
    private controles: Controles;
    private conception: Conception;
    private frequences: Frequences;
    private logBook: LogBook;
    private database: Database;
    private dates: Dates;
    private split: Split;
    // private clientFtp: Ftp;



    constructor() {
        console.log("Je rentre dans le constructor Echanges ");

        this.users = new UsersRepository(Path.userPath);
        this.users.deleteAllUsers();

        this.app.listen(4000);
        this.initSocket();
        this.split = new Split();
        this.dates = new Dates(this.split);
        this.frequences = new Frequences();
        this.controles = new Controles(this.dates);
        this.conception = new Conception(this.dates, this.frequences);

        //Gestion des logs
        this.logBook = LogBook.getInstance();
        //Traitement bdd
        this.database = new Database();
        // Connexion FTP
        /**  this.clientFtp = new Ftp();
          this.clientFtp.connect(); **/



    }

    private initSocket() {
        this.io.on("connection", (socket) => {
            console.log('connexion d un client, ouverture d une socket pour la recuperation de fichier', socket.id);


            /** ACTIONS LORS DE LA CONNEXION D UN CLIENT **/
            //Creation d'un client 
            let clientId: string = socket.id;
            this.users.createUser(clientId);
            //Creation d'une socket d'upload
            let uploader = new SocketIOFileUpload();
            uploader.dir = Path.userPath + "/" + clientId;
            uploader.listen(socket);

            //Declaration des parseurs et analyseurs de fichiers de log
            this.parseurVEMGSA = new ParseurVEMGSA(Path.userPath + "/" + clientId, this.dates);
            this.parseurLPLN = new ParseurLPLN(Path.userPath + "/" + clientId, this.dates, this.split);
            this.analyseLPLN = new AnalyseLPLN(this.parseurLPLN, this.dates, this.split, this.frequences);
            this.analyseVEMGSA = new AnalyseVEMGSA(this.parseurVEMGSA, this.dates, this.split, this.frequences);

            //Traitement des Logs --> Sauvegarde du client connecté
            this.logBook.writeLogBook(clientId, "connexion client");

            // Connexion FTP
            /**   this.clientFtp = new Ftp();
               this.clientFtp.connect2( socket, this.logBook,clientId );*/

            //  Traitement bdd  --> Envoi au client de la liste des vols sauvegardés    
            this.database.readAllVol(socket);

            /** FIN DES ACTIONS LORS DE LA CONNEXION D UN CLIENT **/


            /** DEFINITION DES ACTIONS LORS DE LA DECONNEXION D UN CLIENT **/
            socket.on("disconnect", (socket) => {
                console.log('disconnect', clientId);
                this.logBook.writeLogBook(clientId, "deconnexion client");
                this.users.deleteUser(clientId);
            });

            /** DEFINITION DES ACTIONS LORS DU CHARGEMENT D UN FICHIER PAR LE CLIENT **/
            uploader.on("complete", (event) => {
                console.log("upload complete", event.file.name);
                let log: string = "telechargement fichier " + event.file.name;
                this.logBook.writeLogBook(clientId, log);
            });

            /** DEFINITION DES ACTIONS LORS DE L EVENEMENT 'analyseDataInput' COTE CLIENT **/
            socket.on('analyseDataInput', (arcid, plnid, lpln, listVemgsaInput) => {

                // TODO : Create frequence files : 
                this.frequences.GbdiToFreq(Path.STPVFilePath);  //A modifier de place !!! 

                //Recuperation des dates des plages horaires des fichiers VEMGSA pour les traiter dans l'ordre chronologique
                let plageVemgsa = new Array;
                if (listVemgsaInput.length >= 2) {
                    plageVemgsa = this.parseurVEMGSA.orderVemgsa(listVemgsaInput);
                }
                else if (listVemgsaInput.length == 1) {
                    plageVemgsa[0] = listVemgsaInput[0];
                }

                //Analyse du contexte , c'est à dire du type de fichiers en entrée ( LPLN, VEMGSA, LPLNVEMGSA)
                this.contexte = this.controles.evaluationContexte(lpln, plageVemgsa);
                //Vérification de la syntaxe des identifiants fournis par l'utilisateur et de leur présence dans les fichiers de logs
                let resultCheck = <checkAnswer>{};
                resultCheck = this.controles.controle(arcid, plnid, lpln, plageVemgsa, this.contexte, this.parseurLPLN, this.parseurVEMGSA);
                //Envoi du résultat du check à l'utilisateur 

                socket.emit("check", resultCheck);

            });

            /** DEFINITION DES ACTIONS LORS DE L EVENEMENT 'analysing' COTE CLIENT **/
            socket.on('analysing', (id: Identifiants, lplnfilename, vemgsafilename, checkanswer: checkAnswer) => {
                console.log("Evenement --> analysing");

                //Traitement des Logs --> Sauvegarde de la demande d'analyse
                this.logBook.writeLogBook(clientId, "analysing " + "arcid: " + id.arcid + "plnid: " + id.plnid + "lplnfilename: " + lplnfilename + "vemgsafilename: " + vemgsafilename);

                //Recuperation des données du vol à analyser ( id complet, nom des fichiers de log)
                let inputData: inputData = <inputData>{};
                inputData.identifiant = id;
                inputData.lplnfilename = lplnfilename;
                inputData.vemgsafilename = vemgsafilename;

                //mise à jour du type de contexte (LPLN, VEMGSA, LPLNVEMGSA ) en cas de données manquantes
                if ((this.contexte == Contexte.LPLNVEMGSA) && (!id.inLpln)) {
                    this.contexte = Contexte.VEMGSA;
                }
                if ((this.contexte == Contexte.LPLNVEMGSA) && (!id.inVemgsa)) {
                    this.contexte = Contexte.LPLN;
                }


                //Création des vols en fonction du type de données en entrée
                let volLpln, volVemgsa, volMix;
                switch (this.contexte) {

                    case Contexte.LPLN:
                        console.log("analysedVol Contexte.LPLN");
                        volLpln = this.conception.InfosLpln(id.arcid, id.plnid, lplnfilename, this.analyseLPLN);
                        //Envoi des données calculées à l'utilisateur 
                        socket.emit("analysedVol", "LPLN", inputData, volLpln, null, null);
                        // Traitement bdd  --> Ajout du vol analysé dans la Bdd
                        this.database.writeVol(id, "LPLN", inputData, volLpln, null, null);
                        //  Traitement bdd  --> Envoi au client de la liste des vols actualisée 
                        this.database.readAllVol(socket);
                        break;

                    case Contexte.VEMGSA:
                        console.log("analysedVol Contexte.VEMGSA");
                        volVemgsa = this.conception.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.analyseVEMGSA);
                        //Envoi des données calculées à l'utilisateur 
                        socket.emit("analysedVol", "VEMGSA", inputData, null, volVemgsa, null);
                        // Traitement bdd  --> Ajout du vol analysé dans la Bdd
                        this.database.writeVol(id, "VEMGSA", inputData, null, volVemgsa, null);
                        //  Traitement bdd  --> Envoi au client de la liste des vols actualisée
                        this.database.readAllVol(socket);;
                        break;

                    case Contexte.LPLNVEMGSA:
                        console.log("analysedVol Contexte.LPLN et VEMGSA");
                        volLpln = this.conception.InfosLpln(id.arcid, id.plnid, lplnfilename, this.analyseLPLN);
                        volVemgsa = this.conception.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.analyseVEMGSA);
                        volMix = this.conception.mixInfos(this.conception.InfosLpln(id.arcid, id.plnid, lplnfilename, this.analyseLPLN), this.conception.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.analyseVEMGSA), id.arcid, id.plnid, id.dates);


                        //CAS 1/3 : des données sur le vol ont été identifiées dans les deux fichiers
                        if ((checkanswer.checkLPLN.valeurRetour <= 1) && (checkanswer.checkVEMGSA.valeurRetour <= 2)) {
                            console.log("analysedVol Contexte.LPLN et VEMGSA :  CAS 1 ");
                            //Envoi des données calculées à l'utilisateur 
                            socket.emit("analysedVol", "MIX", inputData,
                                // this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN),
                                volLpln,
                                // this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA),
                                volVemgsa,
                                //  this.mixInfos.mixInfos(this.mixInfos.InfosLpln(id.arcid, id.plnid, lplnfilename, this.parseurLPLN), this.mixInfos.InfosVemgsa(id.arcid, id.plnid, id.dates, vemgsafilename, this.parseurVEMGSA), id.arcid, id.plnid, id.dates)
                                volMix
                            );
                            // Traitement bdd  --> Ajout du vol analysé dans la Bdd
                            this.database.writeVol(id, "MIX", inputData, volLpln, volVemgsa, volMix);
                            //  Traitement bdd  --> Envoi au client de la liste des vols actualisée
                            this.database.readAllVol(socket);
                        }
                        else {
                            //CAS 2/3 : des données sur le vol ont été identifiées uniquement dans le ficher LPLN
                            if (checkanswer.checkLPLN.valeurRetour <= 1) {
                                //Envoi des données calculées à l'utilisateur 
                                socket.emit("analysedVol", "LPLN", inputData, volLpln, null, null);
                                // Traitement bdd  --> Ajout du vol analysé dans la Bdd
                                this.database.writeVol(id, "LPLN", inputData, volLpln, null, null);
                            }

                            //CAS 3/3 : des données sur le vol ont été identifiées uniquement dans le ficher VEMGSA
                            else {
                                //Envoi des données calculées à l'utilisateur 
                                socket.emit("analysedVol", "VEMGSA", inputData, null, volVemgsa, null);
                                // Traitement bdd  --> Ajout du vol analysé dans la Bdd
                                this.database.writeVol(id, "LPLN", inputData, null, volVemgsa, null);
                            }
                        }
                        break;
                }

            });

            /** DEFINITION DES ACTIONS LORS DE L EVENEMENT 'getVolFromDatabase' COTE CLIENT **/
            socket.on("getVolFromDatabase", (id: string) => {
                console.log("Evenement --> getVolFromDatabase");
                this.database.readVol(socket, id)
            });

        });
    }


}