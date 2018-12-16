
import {vol} from '../Modele/vol';
import {etatCpdlc} from '../Modele/etatCpdlc';
import {Etat} from './enumEtat';


import {split} from './split';
let fsplit = new split();



let readline = require("../scripts/node-readline/node-readline");
//let grep = require("./grep.ts");
import * as grep from "./grep";


export class parseurVemgsa {


  parseur = function (arcid:string, plnid:number, fichierSourceVemgsa:string[]):vol {


    console.log("arcid : "+arcid);
    console.log("plnid : "+plnid);
    if ((arcid == "") && (plnid !== 0)){
      for (let fichier of fichierSourceVemgsa) {
        arcid = grep.grepArcidFromPlnid(plnid, fichier);

        if(arcid !== ""){
            console.log("arcid trouve : "+arcid);
            break;
        }
      }


    }
    if ((arcid !== "") && (plnid == 0)){
      for (let fichier of fichierSourceVemgsa) {
        plnid = grep.grepPlnidFromArcid(arcid,fichier );
        if(plnid !== 0){
            console.log("plnid trouve : "+plnid);
            break;
        }
      }
    }
    console.log("arcid2 : "+arcid);
    console.log("plnid2 : "+plnid);

    grep.grepLog(arcid,plnid, fichierSourceVemgsa);

    //grep.grepPlnId(7183);

    let frequences = require("./frequences.ts");
    let fichierGbdi = "./Input/STPV_G2910_CA20180816_13082018__1156";
    //let fichierDest = "../Output/freq.htm";
    frequences.GbdiToFreq(fichierGbdi);


    /* Ouverture du fichier à analyser*/
    let source = "./Input/result.htm"; //Fichier en entree a analyser
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


      //Recuperation de la date/heure et des infos suivantes
      let mylogCpdlcDecompose = fsplit.splitString(mylogCpdlc, 'TITLE');
      let ingoGen = mylogCpdlcDecompose[0];
      let infoLog = mylogCpdlcDecompose[1];

      //Creation de l objet logCpdlc et etatCpdlc
      let  log = new etatCpdlc(numeroLigne);

      //Stockage de la date/heure
      let dateHeure = fsplit.splitString(ingoGen, " ");
      log.date=dateHeure[0];
      log.heure=dateHeure[1];
      log.associable=dateHeure[2];


      //Stockage des infos suivantes

      let myMap = fsplit.stringToTuple (infoLog);
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
  if (log.infoMap.has("FREQ")){
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
  //  console.log('CPCMSGDOWN :'+log.infoMap.get("CPDLCMSGDOWN"));
  if (monEtat == Etat.TransfertEnCours)  {
  if ((log.infoMap.get("CPDLCMSGDOWN") == "WIL") || (log.infoMap.get("CPDLCMSGDOWN") == "LCK")){
    monEtat = Etat.Transfere;
  }
  else if ((log.infoMap.get("CPDLCMSGDOWN") == "UNA") || (log.infoMap.get("CPDLCMSGDOWN") == "STB")) {
    monEtat = Etat.RetourALaVoix;
  }
}
//Cas ou le serveur air n a pas repondu assez tot, le vol passe vtr donc closelink obligatoire -> demande deconnexion en cours
if (monEtat == Etat.DemandeDeconnexion)  {
if ((log.infoMap.get("CPDLCMSGDOWN") == "UNA") || (log.infoMap.get("CPDLCMSGDOWN") == "STB")) {
  monEtat = Etat.DemandeDeconnexion;
}
}
else {
  monEtat = Etat.Unknown;
}
break;
}
case 'CPCFREQ': {
  let freq = frequences.conversionFreq(log.getFrequence());
  log.infoMap.set("FREQ",freq);
  monEtat = Etat.TransfertEnCours;

  //console.log('CPCFREQ');
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
//console.log("affichage : "+ log.afficheLogCpdlc());
log.etat=monEtat;
/*console.log(log.getHeureLogCpdlc()+ " --> "+log.title + " Etat calcule : "+monEtat);
if ((log.title == "CPCFREQ")  || (log.title == "CPCNXTCNTR") || ((log.title == "CPCCLOSLNK") && (log.infoMap.get("FREQ") !== undefined))){
  console.log("vers  : "+log.infoMap.get("UNITID"));
}
if (log.getFrequence() !== null) {

  console.log("freq recuperee : "+log.getFrequence());
  console.log("Transfert vers : "+ frequences.freqToSecteur(log.getFrequence()));

}*/


numeroLigne += 1;
} while (!readline.eof(r));



readline.fclose(r);
//fs.closeSync(w);

return monvol;
}

}
