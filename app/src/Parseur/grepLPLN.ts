/*
OBJECTIF DE CETTE FONCTION :
Lire le contenu d un fichier LPLN donne en entree
recuperer uniquement les informations relatives a un PLNID
copier le resultat dans un fichier texte
*/

const fs = require('fs');
let readline = require("../scripts/node-readline/node-readline");

import {path}  from '../main'
//console.log('path: '+path);

//console.log("path.outputPath: "+path.outputPath);



export function grepLogLPLN (arcid:string, plnid:number, fichierSourceLpln:string):void {
  let fichierDestination = path.outputPath+"resultLPLN.htm";
  let fichierSource = fichierSourceLpln;
  //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
  //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
  let r = readline.fopen(fichierSource, "r");
  let w = fs.openSync(fichierDestination, "w");
  let count = 0;

  //Test de l'ouverture du fichier
  if (r === false) {
  console.log("Error, can't open ", fichierSource);
  process.exit(1);
}
//Traitement du fichier
do {
//Test de la fin de fichier
let mylogCpdlc = readline.fgets(r);
if (mylogCpdlc === false) { break;}
//Test du début des logs concernant le vol dans le SL AIX
let info1Lpln = mylogCpdlc.match("NUMERO PLN: "+plnid);
let info2Lpln = mylogCpdlc.match("NOM SL: AIX");
if  ((info1Lpln !== null) && (info2Lpln !== null) ){
  fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
  console.log(mylogCpdlc);
  //Lecture des logs concernant le vol dans le SL AIX
  do {
    mylogCpdlc = readline.fgets(r);
  if (mylogCpdlc === false) { break;}

  //Recuperation des infos DLK generales
  let info6Lpln = mylogCpdlc.match(/EQUIPEMENT CPDLC|ETAT CONN CPDLC|DONNEES LOGON/);
  if (info6Lpln !== null){
    fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
  //console.log(mylogCpdlc);
  }

  //Recuperation du resume des tranferts DLK
  let info5Lpln = mylogCpdlc.match("TRANSFERT DATA LINK");
  if (info5Lpln !== null){
    let nbSep =0;
    do {

       mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break;}

      if (mylogCpdlc.match("--------------------------------") !== null) {
        nbSep ++;
        //console.log("compteur : "+nbSep)
      }
      //
      let info3Lpln = mylogCpdlc.match(/NOM   SECTEUR|NUMERO EO ASSOCIEE|ETAT  DATA  LINK/);
      if (info3Lpln !== null){
        fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
        //console.log("b: "+mylogCpdlc);
      }
      else{
        //console.log("match pas : "+mylogCpdlc);
      }

    }while ( nbSep !== 2);
  }

  // Recuperation des echanges CPC
  let info4Lpln = mylogCpdlc.match("EDITION DU CHAMP ARCHIVAGE");
  if (info4Lpln !== null){
    do {
       mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break;}

      let info3Lpln = mylogCpdlc.match(/RECEPTION MSG CPC|ENVOI MSG CPC|TRFDL|FPCRD   EVT TRFSEC|TRARTV|VTR  SECTEUR|EVENEMENT DATE: FIN VOL|FPCLOSE EVT END/);
      if (info3Lpln !== null){
        fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
        //console.log(mylogCpdlc);
      }
    }while ( (mylogCpdlc.match("Separateur d'impression") == null) && (mylogCpdlc.match("FIN DES DEPOUILLEMENTS") == null ));
  }


}while(mylogCpdlc.match("Separateur d'impression") == null)
}

}while (!readline.eof(r));
readline.fclose(r);
fs.closeSync(w);
}




export function grepArcidFromPlnid ( plnid:number, fichierSourceLpln:string):string {
  let fichierSource = fichierSourceLpln;
  //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
  //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
  let r = readline.fopen(fichierSource, "r");
  let count = 0;
  let motif = /(.*)(NUMERO PLN:)(.*)(INDICATIF)(.*)(NOM SL: AIX)(.*)/;
  let arcid ="";
  //Test de l'ouverture du fichier
  if (r === false) {
  console.log("Error, can't open ", fichierSource);
  process.exit(1);
}
//Traitement du fichier
do {
//Test de la fin de fichier
var mylogCpdlc = readline.fgets(r);
if (mylogCpdlc === false) { break;}
//Test du début des logs concernant le vol dans le SL AIX
let info1Lpln = mylogCpdlc.match(motif);
let info2Lpln = mylogCpdlc.match(plnid);
if  ((info1Lpln !== null) && (info2Lpln !== null) ){
  arcid =  mylogCpdlc.toString().replace(motif, "$5").trim();
    break;
}

}while (!readline.eof(r));
readline.fclose(r);

return arcid;
}


export function grepPlnidFromArcid ( arcid:string, fichierSourceLpln:string):number {
  let fichierSource = fichierSourceLpln;
  //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
  //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
  let r = readline.fopen(fichierSource, "r");
  let count = 0;
  let motif = /(.*)(NUMERO PLN:)(.*)(INDICATIF)(.*)(NOM SL: AIX)(.*)/;
  let plnid =0;
  //Test de l'ouverture du fichier
  if (r === false) {
  console.log("Error, can't open ", fichierSource);
  process.exit(1);
}
//Traitement du fichier
do {
//Test de la fin de fichier
var mylogCpdlc = readline.fgets(r);
if (mylogCpdlc === false) { break;}
//Test du début des logs concernant le vol dans le SL AIX
let info1Lpln = mylogCpdlc.match(motif);
let info2Lpln = mylogCpdlc.match(arcid);
if  ((info1Lpln !== null) && (info2Lpln !== null) ){
  plnid =  mylogCpdlc.toString().replace(motif, "$3").trim();
  break;
}

}while (!readline.eof(r));
readline.fclose(r);

return plnid;
}




//this.grepPlnIdLPLN(7183);

/*
*/


/*
var info5Lpln = mylogCpdlc.match("TRANSFERT DATA LINK");
if (info5Lpln !== null){
do {
var nbSep =0;
var info3Lpln = mylogCpdlc.match(/EQUIPEMENT CPDLC|ETAT CONN CPDLC|DONNEES LOGON/);
if (mylogCpdlc.match("--------------------------------") !== null) {
nbSep ++;
}
if (info3Lpln !== null){
fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
console.log(mylogCpdlc);
}
}while ( (mylogCpdlc.match("--------------------------------") == null) && (nbSep !== 2));
}



var info4Lpln = mylogCpdlc.match("EDITION DU CHAMP ARCHIVAGE");
if (info4Lpln !== null){
do {
var info3Lpln = mylogCpdlc.match(/RECEPTION MSG CPC|ENVOI MSG CPC|TRFDL|FPCRD   EVT TRFSEC|TRARTV|VTR  SECTEUR|EVENEMENT DATE: FIN VOL|FPCLOSE EVT END/);
if (info3Lpln !== null){
fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
console.log(mylogCpdlc);
}
}while ( mylogCpdlc.match("Separateur d'impression") == null);
}*/
