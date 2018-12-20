import { mixInfos } from './Parseur/MixInfos';
var SocketIOFileUpload = require("socketio-file-upload");
const path_dir_input_user = "./app/assets/Input/user/";
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
            console.log('1');
            var uploader = new SocketIOFileUpload();
            uploader.dir = path_dir_input_user;
            uploader.listen(socket);
            console.log('2');
           

            // Quand le serveur reçoit un signal de type "chargement Fichier" du client    
            socket.on('chargement_des_fichiers', function (arcid, plnid, fichierLpln, fichierVemgsa) {
                console.log("demande chargement fichiers ");
                console.log("lpln : " + fichierLpln);
                console.log("vemgsa : " + fichierVemgsa);
                console.log("vemgsa 1: " + fichierVemgsa[0]);

                  //Test de l'ouverture du fichier              
                let r = readline.fopen(path_dir_input_user+fichierLpln, "r")
                if (r === false) {
                console.log("Error, can't open ", fichierLpln);
              }else {
                console.log("ok lpln");
              }
              let r2 = readline.fopen(path_dir_input_user+fichierVemgsa, "r")
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