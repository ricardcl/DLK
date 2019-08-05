import { Formulaire } from "./Formulaire";
import { Path } from './Modele/path';
const fs = require('fs');
let frequences = require("./Parseur/frequences");

//Remarques :  Lancement du main 
/**
 * cd DLK/app
 * node dist/main.js
 * console.log("diraname: "+__dirname); -> C:\Users\claire.ricard\Desktop\DLK\app\dist
 *   console.log("process: "+process.cwd()); -> C:\Users\claire.ricard\Desktop\DLK\app
 * => Solution, repertoire de base = repertoire où est situé le fichier main 
 * => variables dir_path définies au lancement du main
 */


console.log("debut main");

if (!fs.existsSync(Path.userPath)) {
    fs.mkdirSync(Path.userPath);
}
frequences.GbdiToFreq(Path.STPVFilePath);
new Formulaire();
