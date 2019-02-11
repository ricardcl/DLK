
import {Vol} from '../Modele/vol';
import {EtatCpdlc} from '../Modele/etatCpdlc';
import {Etat} from '../Modele/enumEtat';
import { TSMap } from "typescript-map";
import {split} from './split';
let fsplit = new split();


//let plnid = 6461;
//7183

let readline = require("../scripts/node-readline/node-readline");
import * as grep from "./grepLPLN";
import { isUndefined } from 'util';

const p = require('path');
import {path}  from '../main'












export class parseurLpln {
  

  parseur = function (arcid:string, plnid:number, fichierSourceLpln:string):Vol {

    const fichierGbdi = p.resolve(path.systemPath,"STPV_G2910_CA20180816_13082018__1156" );   
    const source =  p.resolve(path.outputPath,"resultLPLN.htm"); //Fichier en entree a analyser

    fichierSourceLpln=  p.resolve(path.userPath,fichierSourceLpln);

    if ((arcid == "") && (plnid !== 0)){
      arcid = grep.grepArcidFromPlnid(plnid, fichierSourceLpln);
    }
    if ((arcid !== "") && (plnid == 0)){
      plnid = grep.grepPlnidFromArcid(arcid, fichierSourceLpln);
    }


    grep.grepLogLPLN(arcid,plnid, fichierSourceLpln);

    //TODO : partie a mettre en commun avec l'autre parseur
    let frequences = require("./frequences");

    //let fichierDest = "../Output/freq.htm";
    frequences.GbdiToFreq(fichierGbdi);


    /* Ouverture du fichier à analyser*/

    let r = readline.fopen(source, "r");
    if (r === false) {    // Test de l ouverture du fichier
      console.log("Error, can't open ", source);
      process.exit(1);
    }

    /* Initialiation des letiables */
    let numeroLigne = 0; // Nuemro de la de lignes lue
    let monEtat = Etat.NonLogue; // Etat CPDLC par defaut
    let mylisteLogsCpdlc = new Array(); //Liste des lignes lues

    let monvol = new Vol(arcid,plnid);


    /* CREATION DU GRAPHE D ETAT */

    do {
      //lecture d'une ligne du fichier
      let mylogCpdlc = readline.fgets(r);
      //Test de fin de fichier
      if (mylogCpdlc === false) { break;}


      //Test si la ligne lue est une info générale CPDLC ou une information sur un etat CPDLC
      //TODO : faire un check plus complet sur le format attentu : * nombre date *
      if ( mylogCpdlc.match(/\*/) !== null ){
      //Recuperation de la date/heure et du contenu CPDLC de la ligne lue
      let mylogCpdlcDecompose = fsplit.splitString(mylogCpdlc, '*');
      //Recuperation de la date/heure de la ligne lue
      let ingoGen = mylogCpdlcDecompose[1].trim();
      ingoGen=ingoGen.replace(/\s+/g," ");
      //Recuperation du contenu CPDLC de la ligne lue
      let infoLog = mylogCpdlcDecompose[2];




      //Creation de l objet logCpdlc et etatCpdlc
      let  log = new EtatCpdlc(numeroLigne);

      //Stockage de la date/heure
      let dateHeure = fsplit.splitString(ingoGen, " ");
      //log.date=dateHeure[0];
      log.setHeure(dateHeure[1]);
      //log.associable=dateHeure[2];

      //Stockage des infos générales
      let myMap=this.recuperationCPC(infoLog);
      log.setTitle(myMap['TITLE']);
      log.setInfoMap( myMap);

      monvol.getListeVol().push(log);



      //automate a etat sur la letiable etat
      switch(log.getTitle()) {
      case 'CPCASREQ': {
        //console.log('CPCASREQ');
        if (monEtat == Etat.NonLogue) {
        monEtat = Etat.DemandeLogon;
      }
      else {
        monEtat = Etat.Unknown;
      }
      break;
    }
    case 'CPCASRES': {
      //console.log('CPCASRES');
      if ((log.getInfoMap()["ATNASSOC"] == "S") || (log.getInfoMap()["ATNASSOC"] == "L") ) {
      monEtat = Etat.DemandeLogonAutorisee;
    }
    else if (log.getInfoMap()["ATNASSOC"] == "F"){
      monEtat = Etat.NonLogue;
    }
    else {
      monEtat = Etat.Unknown;
    }
    break;
  }
  case 'CPCVNRES': {
    //console.log('CPCVNRES');
    if (log.getInfoMap()["GAPPSTATUS"] == "A") {
    monEtat = Etat.Logue;
  }
  else if (log.getInfoMap()["GAPPSTATUS"] == "F"){
    monEtat = Etat.NonLogue;
  }
  else {
    monEtat = Etat.Unknown;
  }
  break;
}
case 'CPCOPENLNK': {
  //console.log('CPCOPENLNK');
  if (monEtat == Etat.Logue)  {
  monEtat = Etat.DemandeConnexion;
}
else {
  monEtat = Etat.Unknown;
}
break;
}
case 'CPCCOMSTAT': {
  //console.log('CPCCOMSTAT');
  if (monEtat == Etat.DemandeConnexion) {

  if (log.getInfoMap()["CPDLCCOMSTATUS"] == "A"){
    monEtat = Etat.Associe;
  }
  else if (log.getInfoMap()["CPDLCCOMSTATUS"] == "N"){
    monEtat = Etat.Logue;
    let causeEchec = "demande de connexion a echoue , raisons de l echec dans les logs du serveur air";
  }
}
else {
  monEtat = Etat.Logue;
}
break;
}
case 'CPCEND': {
  //console.log('CPCEND');

  monEtat = Etat.FinVol;

  break;
}
case 'CPCCLOSLNK': {
  //console.log('CPCCLOSLNK');
  if ((monEtat == Etat.Associe) &&  log.getInfoMap()["FREQ"] !== isUndefined){
  monEtat = Etat.TransfertEnCours;
}
if ((monEtat == Etat.TransfertEnCours) && log.getInfoMap()["FREQ"] !== undefined){
  let freq = frequences.conversionFreq(log.getFrequence());
  log.getInfoMap()["FREQ"] = freq;
  monEtat = Etat.TransfertEnCours;
}
else {
  monEtat = Etat.DemandeDeconnexion;
}
break;
}
case 'CPCMSGDOWN': {
  //console.log('CPCMSGDOWN');
  if (monEtat == Etat.TransfertEnCours)  {
  if ((log.getInfoMap()["CPDLCMSGDOWN"] == "WIL") || (log.getInfoMap()["CPDLCMSGDOWN"] == "LCK")){
    monEtat = Etat.Transfere;
  }
  else if ((log.getInfoMap()["CPDLCMSGDOWN"] == "UNA") || (log.getInfoMap()["CPDLCMSGDOWN"] == "STB")) {
    monEtat = Etat.RetourALaVoix;
  }

}
else {
  monEtat = Etat.Unknown;
}
break;
}
case 'CPCFREQ': {
  monEtat = Etat.TransfertEnCours;
  //console.log('CPCFREQ');
  // TODO:
  break;
}
case 'FIN TRFDL': {
  monEtat = Etat.RetourALaVoix;
  // TODO:
  break;
}
case 'FIN VOL': {
  monEtat = Etat.FinVol;
  // TODO:
  break;
}
case 'FPCLOSE': {
  monEtat = Etat.FinVol;
  // TODO:
  break;
}
case 'TRARTV': {
  monEtat = Etat.RetourALaVoixAcquitte;
  // TODO:
  break;
}
case 'CPCMSGUP': {
  //console.log('CPCMSGUP');
  // TODO:
  break;
}
case 'CPCNXTCNTR': {
  //console.log('CPCNXTCNTR');
  // TODO:
  break;
}
default: {
  //console.log('etats.title');
  break;
}
}

//console.log("HEURE:"+log.heure);
//console.log(log.getMapCpdlc());
log.setEtat(monEtat);
//console.log("a:"+log.etat);

/*console.log(log.getHeureLogCpdlc()+ " --> "+log.title + " Etat calcule : "+monEtat);
// UNITID : info non remontee dans le log LPLN

if (log.getFrequence() !== null) {
console.log("freq recuperee : "+log.getFrequence());
console.log("Transfert vers : "+ frequences.freqToSecteur(log.getFrequence()));
}*/
}



numeroLigne += 1;
} while (!readline.eof(r));



readline.fclose(r);
//fs.closeSync(w);

return monvol;
}


recuperationCPC = function(infoLog:string):string[] {
  let mymap : string[] = []; 

  if (infoLog.match("ENVOI MSG") !== null){
    let motif = /(ENVOI MSG )(.*)(AU SERVEUR AIR)/;
    mymap['ORIGINE_MSG']='STPV';
    if (infoLog.match(motif) !== null ){
      let cpcInfo = infoLog.replace(motif, "$2").trim();
      cpcInfo=cpcInfo.replace(/\s+/g," ");
      let etatCpc = fsplit.splitString(cpcInfo, " ");
      let title=etatCpc[0];
      mymap['TITLE']= title;
      switch (title) {
        case 'CPCASRES': {
          if (etatCpc[1].trim() == "(S)"){
            mymap['ATNASSOC']='S';
          }
          else {
            mymap['ATNASSOC']='F';
            //TODO verifier quil ny a pas dautres valeurs possibles
          }
          break;
        }
        case 'CPCOPENLNK': {
          //Rien a faire
          break;
        }
        case 'CPCEND': {
          //Rien a faire
          break;
        }
        case 'CPCCLOSELNK': {
          mymap['TITLE']='CPCCLOSLNK';
          //Rien a f]aire
          break;
        }
        case 'CPCFREQ': {
          mymap['FREQ']=etatCpc[2];
          break;
        }
        case 'CPCNXTCNTR': {
          if (etatCpc[1].trim() == "(G)"){
            mymap['TFLOGONMODE']='G';
          }
          if (etatCpc[1].trim() == "(A)"){
            mymap['TFLOGONMODE']='A';
          }
          break;
        }
        default: {
          //console.log('etats.title');
          break;
        }

      }

    }
    else {
      let motif = /(ENVOI MSG )(.*)(POUR POSITION\(S\))(.*)/;
      let cpcInfo = infoLog.replace(motif, "$2").trim();
      cpcInfo=cpcInfo.replace(/\s+/g," ");
      let etatCpc = fsplit.splitString(cpcInfo, " ");
      let title=etatCpc[0];
      mymap['TITLE']=title;
      mymap['EVT']=etatCpc[2];
      cpcInfo = infoLog.replace(motif, "$4").trim();
      cpcInfo=cpcInfo.replace(/\s+/g," ");

      mymap['POSITIONS']=cpcInfo;


    }
  }

  if (infoLog.match("RECEPTION MSG") !== null){
    mymap['ORIGINE_MSG']='SA';
    let motif = /(RECEPTION MSG )(.*)(DU SERVEUR AIR)/;
    let cpcInfo = infoLog.replace(motif, "$2").trim();

    cpcInfo=cpcInfo.replace(/\s+/g," ");
    let etatCpc = fsplit.splitString(cpcInfo, " ");
    let title=etatCpc[0];
    //let mymap = new TSMap<string,string>();
    mymap['TITLE']=title;


    switch (title) {
      case 'CPCASREQ': {
        //rien a faire
        break;
      }
      case 'CPCVNRES': {
        if (etatCpc[1].trim() == "(A)"){
          mymap['GAPPSTATUS']='A';
        }
        if (etatCpc[1].trim() == "(F)"){
          mymap['GAPPSTATUS']='F';
        }
        break;
      }

      case 'CPCCOMSTAT': {
        if (etatCpc[1].trim() == "(A)"){
          mymap['CPDLCCOMSTATUS']='A';
        }
        if (etatCpc[1].trim() == "(N)"){
          mymap['CPDLCCOMSTATUS']='N';
        }
        break;
      }
      case 'CPCMSGDOWN': {
        if (etatCpc[1].trim() == "(WIL)"){
          mymap['CPDLCMSGDOWN']='WIL';
        }
        if (etatCpc[1].trim() == "(LCK)"){
          mymap['CPDLCMSGDOWN']='LCK';
        }
        if (etatCpc[1].trim() == "(UNA)"){
          mymap['CPDLCMSGDOWN']='UNA';
        }
        if (etatCpc[1].trim() == "(STB)"){
          mymap['CPDLCMSGDOWN']='STB';
        }
        break;
      }
      case 'CPCMSGUP': {
        //console.log('CPCMSGUP');
        // TODO:
        break;
      }
      default: {
        //console.log('etats.title');
        break;
      }

    }
  }

  if (infoLog.match("EVENEMENT DATE: FIN TRFDL") !== null){
    mymap['TITLE']='FIN TRFDL';
    mymap['ORIGINE_MSG']='INTERNE';
    let motif = /(.*)(HEURE:)(.*)/;
    let heure = infoLog.replace(motif, "$3").trim();

    mymap['HEURE']=heure;
  }

  if (infoLog.match("EVENEMENT DATE: FIN VOL") !== null){
    mymap['TITLE']='FIN VOL';
    mymap['ORIGINE_MSG']='INTERNE';
    let motif = /(.*)(HEURE:)(.*)(AVEC)(.*)/;
    let heure = infoLog.replace(motif, "$3").trim();

    mymap['HEURE']=heure;
  }

  if (infoLog.match("EVENEMENT DATE: TRANSFERT") !== null){
    mymap['TITLE']='TRANSFERT';
    mymap['ORIGINE_MSG']='INTERNE';
    let motif = /(.*)(HEURE:)(.*)(ETAT :)(.*)(SECTEUR:)(.*)(BALISE :)(.*)(RANG.*)/;
    let heure = infoLog.replace(motif, "$3");
    mymap['HEURE']=heure;
    let etat = infoLog.replace(motif, "$5");
    mymap['ETAT']=etat;
    let secteur = infoLog.replace(motif, "$7");
    mymap['SECTEUR']=secteur;
    let balise = infoLog.replace(motif, "$9");
    mymap['BALISE']=balise;

  }


  if (infoLog.match("TRAITEMENT TRANSACTION") !== null){
    mymap['TYPE_MSG']='INTERNE';
    let motif = /(TRAITEMENT TRANSACTION )(.*)(POSITION ORIGINE)(.*)/;
    let transaction = infoLog.replace(motif, "$2").trim();
    mymap['TITLE']=transaction;
    let position = infoLog.replace(motif, "$4");
    mymap['POSITION']=position;

  }

  return mymap;
}

grepListeVolFromLpln =function( fichierSourceLpln:string):Vol[] {
console.log("coucou");
  let fichierSource = p.resolve(path.userPath,fichierSourceLpln);
  let fd = this.isFichierLisible(fichierSource); //Test de l'ouverture du fichier et recuperation du file descriptor

  //let motif = /(-)(.*)(\/)(.*)(H)(.*)(MN)(.*)(NUMERO PLN:)(.*)(INDICATIF:)(.*)(NOM SL:)(.*)(RANG SL:)(.*)(PLN)(.*)(-)/;
  let motif = /(.*)(NUMERO PLN:)(.*)(INDICATIF:)(.*)(NOM SL:)(.*)(RANG SL:)(.*)/;
 // - 23/AOUT       06H00MN     NUMERO PLN: 9352   INDICATIF: DLH37F    NOM SL: AIX      RANG SL:   2 PLN TERMINE                      
  let plnid:number =0;
  let indicatif:string="";
  let nomSL:string="";
  let listeVols :Vol[]= [];
//Traitement du fichier
do {
//Test de la fin de fichier
var mylogCpdlc = readline.fgets(fd);
if (mylogCpdlc === false) { break;}
//Recuperation des lignes contenant le motif
let info1Lpln = mylogCpdlc.match(motif);
if  (info1Lpln !== null){
  //console.log(info1Lpln);
  plnid =  mylogCpdlc.toString().replace(motif, "$3").trim();
  //console.log("plnid : "+plnid);
  indicatif =  mylogCpdlc.toString().replace(motif, "$5").trim();
  //console.log("arcid : "+indicatif);
  nomSL =  mylogCpdlc.toString().replace(motif, "$7").trim();
  //console.log("nomSL : "+nomSL);
  let monvol = new Vol(indicatif,plnid);
  monvol.setSL(nomSL);
  listeVols.push(monvol);
  
}

}while (!readline.eof(fd));
readline.fclose(fd);

//console.log(listeVols);

return listeVols;
}

 isFichierLisible = function ( fichier:string):number {
  let fd = readline.fopen(fichier, "r");
  //Test de l'ouverture du fichier
  if (fd === false) {
    console.log("Error, can't open ", fichier);
    process.exit(1);
  }
  else {
    return fd;
  }
}

}
