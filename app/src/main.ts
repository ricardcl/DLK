//import { Server } from "./createServer";
import { Formulaire } from "./Formulaire";
import {split} from "./Parseur/split";
import { Path } from './Modele/path';



       //Remarques :  Lancement du main 
            /**
             * cd DLK/app
             * node dist/main.js
             * console.log("diraname: "+__dirname); -> C:\Users\claire.ricard\Desktop\DLK\app\dist
             *   console.log("process: "+process.cwd()); -> C:\Users\claire.ricard\Desktop\DLK\app
             * => Solution, repertoire de base = repertoire où est situé le fichier main 
             * => variables dir_path définies au lancement du main
             */
const p = require('path');
const dist = p.resolve(__dirname);
let motifPath = /(.*)(dist)/;
const app = dist.replace(motifPath, "$1");
const assets = p.resolve(app, 'assets');
const input = p.resolve(assets, 'Input');
const output = p.resolve(assets, 'Output');
const user = p.resolve(input,'user');
const system = p.resolve(input, 'system');

//export const path : Path = {distPath: dist,assetsPath:  assets, inputPath: input ,outputPath: output, userPath: user, systemPath:system};




 /**
  * console.log("debug");
console.log("distPath: "+distPath);
console.log("appPath: "+appPath);
console.log("assetsPath: "+assetsPath);
console.log("inputPath: "+inputPath);
console.log("outputPath: "+outputPath);
console.log("userPath: "+userPath);
console.log("systemPath: "+systemPath);
  */


 console.log("debut main");
 export const path  = new Path (dist, assets, input , output,  user, system);


new Formulaire();

