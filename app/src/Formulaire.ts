import { mixInfos } from './Parseur/MixInfos';
import { getListeLogss } from './Parseur/MixInfos';
import {path}  from './main'
const p = require('path');


var SocketIOFileUpload = require("socketio-file-upload");

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
           


     


            uploader.on("complete", function(event){
                console.log("upload complete", event.file.name);
                //mixInfos("",0, event.file.name, null);
            });

            socket.on('analysingPlnid', (file) => {
                console.log("analysingPlnid");
                console.log(getListeLogss("",0, file, null));
                socket.emit("analysedPlnid",getListeLogss("",0, file, null));
            });

            socket.on('analysing', (plnid, lplnfilename, vemgsafilename) => {
                console.log("analysedVol", "plnid: ",plnid, 'lplnfilename : ',lplnfilename, 'vemgsafilename : ', vemgsafilename );
                console.log("resulat mixinfos: ",mixInfos("",plnid,  lplnfilename, vemgsafilename));
                socket.emit("analysedVol",mixInfos("",plnid,  lplnfilename, vemgsafilename));
            });


            // Quand le serveur reçoit un signal de type "chargement Fichier" du client    
            socket.on('chargement_des_fichiers', function (arcid, plnid, fichierLpln, fichierVemgsa) {
                console.log("demande chargement fichiers ");
                console.log("lpln : " + fichierLpln);
                console.log("vemgsa : " + fichierVemgsa);
                console.log("vemgsa 1: " + fichierVemgsa[0]);

                  //Test de l'ouverture du fichier              
                let r = readline.fopen(p.resolve(path.userPath,fichierLpln), "r")
                if (r === false) {
                console.log("Error, can't open ", fichierLpln);
              }else {
                console.log("ok lpln");
              }
              let r2 = readline.fopen(p.resolve(path.userPath,fichierVemgsa), "r")
              if (r2 === false) {
              console.log("Error, can't open ", fichierVemgsa);
            }else {
                console.log("ok vemgsa");
              }




                console.log(mixInfos(arcid, plnid, fichierLpln, fichierVemgsa));
            });

        });
    }
}