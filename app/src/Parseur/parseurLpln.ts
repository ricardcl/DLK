
import {vol} from '../Modele/vol';
import {etatCpdlc} from '../Modele/etatCpdlc';
import {Etat} from './enumEtat';
import { TSMap } from "typescript-map";

import {split} from './split';
let fsplit = new split();


//let plnid = 6461;
//7183

let readline = require("../scripts/node-readline/node-readline");
import * as grep from "./grepLPLN";

export class parseurLpln {


  parseur = function (arcid:string, plnid:number, fichierSourceLpln:string):vol {


    if ((arcid == "") && (plnid !== 0)){
      arcid = grep.grepArcidFromPlnid(plnid, fichierSourceLpln);
    }
    if ((arcid !== "") && (plnid == 0)){
      plnid = grep.grepPlnidFromArcid(arcid, fichierSourceLpln);
    }


    grep.grepLogLPLN(arcid,plnid, fichierSourceLpln);

    //TODO : partie a mettre en commun avec l'autre parseur
    let frequences = require("./frequences.ts");
    let fichierGbdi = "./Input/STPV_G2910_CA20180816_13082018__1156";
    //let fichierDest = "../Output/freq.htm";
    frequences.GbdiToFreq(fichierGbdi);


    /* Ouverture du fichier à analyser*/
    let source = "./Input/resultLPLN.htm"; //Fichier en entree a analyser
    let r = readline.fopen(source, "r");
    if (r === false) {    // Test de l ouverture du fichier
      console.log("Error, can't open ", source);
      process.exit(1);
    }

    /* Initialiation des letiables */
    let numeroLigne = 0; // Nuemro de la de lignes lue
    let monEtat = Etat.NonLogue; // Etat CPDLC par defaut
    let mylisteLogsCpdlc = new Array(); //Liste des lignes lues

    let monvol = new vol(arcid,plnid);


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
      let  log = new etatCpdlc(numeroLigne);

      //Stockage de la date/heure
      let dateHeure = fsplit.splitString(ingoGen, " ");
      //log.date=dateHeure[0];
      log.heure=dateHeure[1];
      //log.associable=dateHeure[2];

      //Stockage des infos générales
      let myMap=this.recuperationCPC(infoLog);
      log.title = myMap.get('TITLE');
      log.infoMap = myMap;

      monvol.listeLogs.set(numeroLigne,log);



      //automate a etat sur la letiable etat
      switch(log.title) {
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
      if ((log.infoMap.get("ATNASSOC") == "S") || (log.infoMap.get("ATNASSOC") == "L") ) {
      monEtat = Etat.DemandeLogonAutorisee;
    }
    else if (log.infoMap.get("ATNASSOC") == "F"){
      monEtat = Etat.NonLogue;
    }
    else {
      monEtat = Etat.Unknown;
    }
    break;
  }
  case 'CPCVNRES': {
    //console.log('CPCVNRES');
    if (log.infoMap.get("GAPPSTATUS") == "A") {
    monEtat = Etat.Logue;
  }
  else if (log.infoMap.get("GAPPSTATUS") == "F"){
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

  if (log.infoMap.get("CPDLCCOMSTATUS") == "A"){
    monEtat = Etat.Associe;
  }
  else if (log.infoMap.get("CPDLCCOMSTATUS") == "N"){
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
  if ((monEtat == Etat.Associe) &&  log.infoMap.has("FREQ")){
  monEtat = Etat.TransfertEnCours;
}
if ((monEtat == Etat.TransfertEnCours) && log.infoMap.has("FREQ")){
  let freq = frequences.conversionFreq(log.getFrequence());
  log.infoMap.set("FREQ",freq);
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
  if ((log.infoMap.get("CPDLCMSGDOWN") == "WIL") || (log.infoMap.get("CPDLCMSGDOWN") == "LCK")){
    monEtat = Etat.Transfere;
  }
  else if ((log.infoMap.get("CPDLCMSGDOWN") == "UNA") || (log.infoMap.get("CPDLCMSGDOWN") == "STB")) {
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
log.etat=monEtat;
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


recuperationCPC = function(infoLog:string):TSMap<string,string> {
  let mymap = new TSMap<string,string>();

  if (infoLog.match("ENVOI MSG") !== null){
    let motif = /(ENVOI MSG )(.*)(AU SERVEUR AIR)/;
    mymap.set('ORIGINE_MSG','STPV');
    if (infoLog.match(motif) !== null ){
      let cpcInfo = infoLog.replace(motif, "$2").trim();
      cpcInfo=cpcInfo.replace(/\s+/g," ");
      let etatCpc = fsplit.splitString(cpcInfo, " ");
      let title=etatCpc[0];
      mymap.set('TITLE',title);
      switch (title) {
        case 'CPCASRES': {
          if (etatCpc[1].trim() == "(S)"){
            mymap.set('ATNASSOC','S');
          }
          else {
            mymap.set('ATNASSOC','F');
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
          mymap.set('TITLE','CPCCLOSLNK');
          //Rien a faire
          break;
        }
        case 'CPCFREQ': {
          mymap.set('FREQ',etatCpc[2]);
          break;
        }
        case 'CPCNXTCNTR': {
          if (etatCpc[1].trim() == "(G)"){
            mymap.set('TFLOGONMODE','G');
          }
          if (etatCpc[1].trim() == "(A)"){
            mymap.set('TFLOGONMODE','A');
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
      mymap.set('TITLE',title);
      mymap.set('EVT',etatCpc[2]);
      cpcInfo = infoLog.replace(motif, "$4").trim();
      cpcInfo=cpcInfo.replace(/\s+/g," ");

      mymap.set('POSITIONS',cpcInfo);


    }
  }

  if (infoLog.match("RECEPTION MSG") !== null){
    mymap.set('ORIGINE_MSG','SA');
    let motif = /(RECEPTION MSG )(.*)(DU SERVEUR AIR)/;
    let cpcInfo = infoLog.replace(motif, "$2").trim();

    cpcInfo=cpcInfo.replace(/\s+/g," ");
    let etatCpc = fsplit.splitString(cpcInfo, " ");
    let title=etatCpc[0];
    //let mymap = new TSMap<string,string>();
    mymap.set('TITLE',title);


    switch (title) {
      case 'CPCASREQ': {
        //rien a faire
        break;
      }
      case 'CPCVNRES': {
        if (etatCpc[1].trim() == "(A)"){
          mymap.set('GAPPSTATUS','A');
        }
        if (etatCpc[1].trim() == "(F)"){
          mymap.set('GAPPSTATUS','F');
        }
        break;
      }

      case 'CPCCOMSTAT': {
        if (etatCpc[1].trim() == "(A)"){
          mymap.set('CPDLCCOMSTATUS','A');
        }
        if (etatCpc[1].trim() == "(N)"){
          mymap.set('CPDLCCOMSTATUS','N');
        }
        break;
      }
      case 'CPCMSGDOWN': {
        if (etatCpc[1].trim() == "(WIL)"){
          mymap.set('CPDLCMSGDOWN','WIL');
        }
        if (etatCpc[1].trim() == "(LCK)"){
          mymap.set('CPDLCMSGDOWN','LCK');
        }
        if (etatCpc[1].trim() == "(UNA)"){
          mymap.set('CPDLCMSGDOWN','UNA');
        }
        if (etatCpc[1].trim() == "(STB)"){
          mymap.set('CPDLCMSGDOWN','STB');
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
    mymap.set('TITLE','FIN TRFDL');
    mymap.set('ORIGINE_MSG','INTERNE');
    let motif = /(.*)(HEURE:)(.*)/;
    let heure = infoLog.replace(motif, "$3").trim();

    mymap.set('HEURE',heure);
  }

  if (infoLog.match("EVENEMENT DATE: FIN VOL") !== null){
    mymap.set('TITLE','FIN VOL');
    mymap.set('ORIGINE_MSG','INTERNE');
    let motif = /(.*)(HEURE:)(.*)(AVEC)(.*)/;
    let heure = infoLog.replace(motif, "$3").trim();

    mymap.set('HEURE',heure);
  }

  if (infoLog.match("EVENEMENT DATE: TRANSFERT") !== null){
    mymap.set('TITLE','TRANSFERT');
    mymap.set('ORIGINE_MSG','INTERNE');
    let motif = /(.*)(HEURE:)(.*)(ETAT :)(.*)(SECTEUR:)(.*)(BALISE :)(.*)(RANG.*)/;
    let heure = infoLog.replace(motif, "$3");
    mymap.set('HEURE',heure);
    let etat = infoLog.replace(motif, "$5");
    mymap.set('ETAT',etat);
    let secteur = infoLog.replace(motif, "$7");
    mymap.set('SECTEUR',secteur);
    let balise = infoLog.replace(motif, "$9");
    mymap.set('BALISE',balise);

  }


  if (infoLog.match("TRAITEMENT TRANSACTION") !== null){
    mymap.set('TYPE_MSG','INTERNE');
    let motif = /(TRAITEMENT TRANSACTION )(.*)(POSITION ORIGINE)(.*)/;
    let transaction = infoLog.replace(motif, "$2").trim();
    mymap.set('TITLE',transaction);
    let position = infoLog.replace(motif, "$4");
    mymap.set('POSITION',position);

  }

  return mymap;
}

}
