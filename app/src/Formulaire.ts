import { mixInfos } from './Parseur/MixInfos';
import { getListeVols } from './Parseur/MixInfos';
import { path } from './main'
import { Contexte } from './Modele/enumContexte';
import {  evaluationContexte, checkInitial, check } from './Parseur/check';
const p = require('path');


var SocketIOFileUpload = require("socketio-file-upload");
import * as grep from "./Parseur/grep";
import { checkAnswer } from './Modele/checkAnswer';
let readline = require("./scripts/node-readline/node-readline");






export class Formulaire {

    private app = require('http').createServer();
    private io = require('socket.io')(this.app);

    constructor() {
        console.log("hello");
        this.app.listen(4000);
        this.initSocket();


    }

    private initSocket() {
        this.io.on("connection", (socket) => {
            console.log('connexion d un client, ouverture d une socket pour la recuperation de fichier');
            var uploader = new SocketIOFileUpload();
            uploader.dir = path.userPath;
            uploader.listen(socket);
            console.log('socket pour la recuperation de fichier cree');






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
                console.log("typeof listVemgsaInput.length",  listVemgsaInput.length);
                console.log("analyseDataInput", "arcid", arcid);
                console.log("analyseDataInput", "plnid", plnid);
                let listVemgsa = new  Array;
                if ( listVemgsaInput.length >= 2) {
                    listVemgsa= grep.orderVemgsa(listVemgsaInput);
                                     }
                  else {
                    listVemgsa[0] = listVemgsaInput[0];
                  }

                  
                let contexte: Contexte = evaluationContexte(lpln, listVemgsa);
                let resultCheckInitial = <checkAnswer>{};
                resultCheckInitial = checkInitial(arcid, plnid, lpln, listVemgsa, contexte);
                if (resultCheckInitial.valeurRetour == 0) {
                    let resultCheck: checkAnswer = check(arcid, plnid, lpln, listVemgsa);
                        socket.emit("check", resultCheck)
                }
                else  {
                    socket.emit("checkInitial", resultCheckInitial)
                }
            });

            socket.on('analysing', (arcid, plnid, lplnfilename, vemgsafilename) => {
                console.log("analysedVol", "arcid: ",arcid,"plnid: ", plnid, 'lplnfilename : ', lplnfilename, 'vemgsafilename : ', vemgsafilename);
                console.log("resulat mixinfos: ", mixInfos(arcid, plnid, lplnfilename, vemgsafilename));
                socket.emit("analysedVol", mixInfos(arcid, plnid, lplnfilename, vemgsafilename));
            });


            // Quand le serveur reçoit un signal de type "chargement Fichier" du client    
            socket.on('chargement_des_fichiers', function (arcid, plnid, fichierLpln, fichierVemgsa) {
                console.log("demande chargement fichiers ");
                console.log("lpln : " + fichierLpln);
                console.log("vemgsa : " + fichierVemgsa);
                console.log("vemgsa 1: " + fichierVemgsa[0]);

                //Test de l'ouverture du fichier              
                let r = readline.fopen(p.resolve(path.userPath, fichierLpln), "r")
                if (r === false) {
                    console.log("Error, can't open ", fichierLpln);
                } else {
                    console.log("ok lpln");
                }
                let r2 = readline.fopen(p.resolve(path.userPath, fichierVemgsa), "r")
                if (r2 === false) {
                    console.log("Error, can't open ", fichierVemgsa);
                } else {
                    console.log("ok vemgsa");
                }




                console.log(mixInfos(arcid, plnid, fichierLpln, fichierVemgsa));
            });

            /** socket.on('identifyingWithPlnid', function (arcid, plnid, fichierLpln, fichierVemgsa) {
                console.log("identifying");
                console.log(identificationF(arcid, plnid, fichierLpln, fichierVemgsa));
                socket.emit("identified",identificationF(arcid, plnid, fichierLpln, fichierVemgsa));
            }); */

        });
    }
}