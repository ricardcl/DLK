//import { Server } from "./createServer";
import { Formulaire } from "./Formulaire";
import { split } from "./Parseur/split";
import { Path } from './Modele/path';
import { mixInfos, InfosLpln, InfosVemgsa } from './Parseur/MixInfos';
import { getListeVols } from './Parseur/MixInfos';
import * as grep from "./Parseur/grep";
import { Contexte } from "./Modele/enumContexte";
import { log } from "util";


const fs = require('fs');



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
const user = p.resolve(input, 'user');
const system = p.resolve(input, 'system');


console.log("debut main");
export const path = new Path(dist, assets, input, output, user, system);

//try {

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

/* 
 
*/


//grep.grepDifferentsVolsVemgsaTrouves(["../user/VEMGSA2.OPP.stpv1_010519_0706_020519_0716","../user/VEMGSA5.OPP.stpv1_300419_0708_010519_0706"], 3727);
//grep.orderVemgsa(["../user/VEMGSA2.OPP.stpv1_010519_0706_020519_0716","../user/VEMGSA5.OPP.stpv1_300419_0708_010519_0706","../user/VEMGSA2.OPP.stpv1_010519_0706_020519_0716"]);

// VEMGSA5.OPP.stpv1_300419_0708_010519_0706
// VEMGSA2.OPP.stpv1_010519_0706_020519_0716
// VEMGSA3.OPP.stpv1_020519_0716_030519_0625
// VEMGSA4.OPP.stpv1_030519_0625_040519_0941
// VEMGSA5.OPP.stpv1_040519_0941_050519_0642

/** 
let arcid = "AFR21Q";//"FIN6RM"; //"EWG6LB"
let plnid = 0;
//8977 = lpln   9694= lpln2   
//5854= lpln3 &  5491 = lpln4 pas de vemgsa
//3124 entre le 30.04 et le 01.05 : test vol sur deux fichiers vemgsa , fichier lpln : 3124_EJU38QK
//3727 deux vols avec le meme plnid et meme arcid dans VEMGSA5.OPP.stpv1_300419_0708_010519_0706,  et  VEMGSA2.OPP.stpv1_010519_0706_020519_0716
// fichiers lpln concernes : 3727_FIN6RM et 3727_30mai 
console.log("resulat mixinfos: ");
//mixInfos(arcid,plnid,  "lpln3", ["vemgsa3"]);


let lpln = "lpln2";

//EJU261N 8549
let listVemgsaInput ="../user/vemgsa2";//["../user/VEMGSA5.OPP.stpv1_300419_0708_010519_0706","../user/VEMGSA2.OPP.stpv1_010519_0706_020519_0716"];
let listVemgsa = new  Array;



if ( typeof listVemgsaInput == "string") {
  listVemgsa[0] = listVemgsaInput;
}
if ( typeof listVemgsaInput == "object") {
  listVemgsa= grep.orderVemgsa(listVemgsaInput);
}

//TODO traiter le cas else typeof ni string ni object



let contexte: Contexte = evaluationContexte(lpln, listVemgsa);



let resultCheckInitial = <checkAnswer>{};
resultCheckInitial = checkInitial(arcid, plnid, lpln, listVemgsa, contexte);


if (resultCheckInitial.valeurRetour == 1) {
  
  let resultCheck:checkAnswer = check(arcid, plnid, lpln, listVemgsa);
  
  if (resultCheck.valeurRetour == 1){
    if (contexte == Contexte.LPLNVEMGSA) {
      mixInfos(resultCheck.arcid, resultCheck.plnid, lpln, listVemgsa);
    }
    if (contexte == Contexte.LPLN) {
      InfosLpln(resultCheck.arcid, resultCheck.plnid, lpln);
    }
    if (contexte == Contexte.VEMGSA) {     
      InfosVemgsa(resultCheck.arcid, resultCheck.plnid, listVemgsa);
    }
    
  }
  else {
    console.log("resultCheck : ", resultCheck.valeurRetour);
    
  }
}
if (resultCheckInitial.valeurRetour == 2) {
 // check(arcid, plnid, lpln, listVemgsa);
}




*/

new Formulaire();

//} catch (exception) {
//  console.log("erreur trouvee:", exception.code); //TO DO recuperer les exceptions pour indiquer a lutilisateur qu'il y a un pbm
//}

