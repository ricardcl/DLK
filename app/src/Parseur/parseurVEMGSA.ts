
import { Vol } from '../Modele/vol';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Etat } from '../Modele/enumEtat';
import * as moment from 'moment';
import * as dates from './date';

import { Split } from './split';



let readline = require("../scripts/node-readline/node-readline");
let frequences = require("./frequences");
//let grep = require("./grep.ts");
import * as grep from "./grepVEMGSA";

import { DetailCpdlc } from '../Modele/detailCpdlc';
import { Identifiants } from '../Modele/identifiants';
import { GrepVEMGSA } from './grepVEMGSA';
import { Path } from '../Modele/path';

const p = require('path');

export class parseurVemgsa {
  private grep: GrepVEMGSA;
  private split: Split;

  constructor(grep: GrepVEMGSA) {
    this.grep = grep;
    this.split = new Split();
  }

  public identification(arcid: string, plnid: number, fichierSourceVemgsa: string[], horaire?: dates.datesFile): Identifiants {
    console.log("identification VEMGSA");


    let id = <Identifiants>{};
    id.identifie = false;

    //console.log("arcid : "+arcid);
    //console.log("plnid : "+plnid);
    if ((arcid == "") && (plnid !== 0)) {

      for (let fichier of fichierSourceVemgsa) {
        //console.log("fichier : ", fichier);
        //console.log("fichierSourceVemgsa : ", fichierSourceVemgsa);

        arcid = this.grep.grepArcidFromPlnid(plnid, fichier, horaire);

        if (arcid !== "") {
          //console.log("arcid trouve : "+arcid);
          id.identifie = true;
          break;
        }
      }


    }
    if ((arcid !== "") && (plnid == 0)) {
      for (let fichier of fichierSourceVemgsa) {
        plnid = this.grep.grepPlnidFromArcid(arcid, fichier, horaire);
        if (plnid !== 0) {
          //console.log("plnid trouve : "+plnid);
          id.identifie = true;
          break;
        }
      }
    }


    id.plnid = plnid;
    id.arcid = arcid;


    console.log(" id.arcid: ", id.arcid, " id.plnid: ", id.plnid, " id.identifie: ", id.identifie);
    return id;
  }



  public parseur(arcid: string, plnid: number, fichierSourceVemgsa: string[]): Vol {
    console.log("Je rentre dans parseur de parseurVEMGSA" );
    console.log("fichierSourceVemgsa: ", fichierSourceVemgsa );
    const fichierGbdi = p.resolve(Path.systemPath, "STPV_G2910_CA20180816_13082018__1156");
    const source = p.resolve(this.grep.getUserPath(), "result.htm"); //Fichier en entree a analyser

    this.grep.grepLog(arcid, plnid, fichierSourceVemgsa);

    /* Ouverture du fichier à analyser*/

    let r = readline.fopen(source, "r");
    if (r === false) {    // Test de l ouverture du fichier
      console.log("Error, can't open ", source);
      process.exit(1);
    }

    /* Initialiation des variables */
    let numeroLigne = 0; // Numero de la de lignes lue
    let monEtat = Etat.NonLogue; // Etat CPDLC par defaut
    let mylisteLogsCpdlc = new Array(); //Liste des lignes lues



    let monvol = new Vol(arcid, plnid);

    /* CREATION DU GRAPHE D ETAT */

    do {
      //lecture d'une ligne du fichier
      let mylogCpdlc = readline.fgets(r);
      //Test de fin de fichier
      if (mylogCpdlc === false) { break; }


      //Recuperation de la date/heure et des infos suivantes
      let mylogCpdlcDecompose = this.split.splitString(mylogCpdlc, 'TITLE');
      let infoGen = mylogCpdlcDecompose[0];
      let infoLog = mylogCpdlcDecompose[1];

      //Creation de l objet logCpdlc et etatCpdlc
      let log = new EtatCpdlc(numeroLigne);
      log.setLog(infoLog);
      //Stockage de la date/heure
      let motifDateHeure = /(\d\d\/\d\d\/\d\d\d\d)( )(\d\d)(H)(\d\d)(')(\d\d)(.*)/;


      let dateHeure = infoGen.toString().match(motifDateHeure);
      if (dateHeure !== null) {
        const date = dateHeure.toString().replace(motifDateHeure, "$1");
        const heure = dateHeure.toString().replace(motifDateHeure, "$3");
        const minutes = dateHeure.toString().replace(motifDateHeure, "$5");
        const secondes = dateHeure.toString().replace(motifDateHeure, "$7");
        const dateToStore = date + " " + heure + " " + minutes + " " + secondes;
        const momentDate = moment(dateToStore, 'DD-MM-YYYY HH mm ss');
        // console.log("test date: ",momentDate.format()); 

        log.setDate(moment(momentDate).format('DD-MM-YYYY'));
        log.setHeure(moment(momentDate).format('HH mm ss'));

        log.setAssociable(Boolean(infoGen.toString().replace(motifDateHeure, "$8")));

      }
      //Stockage des infos suivantes

      let myMap: DetailCpdlc[] = this.split.stringToDetailCpdlc(infoLog);




      log.setDetailLog(myMap);


      log.setTitle(log.getDetail('TITLE'));

      monvol.getListeLogs().push(log);

      //automate a etat sur la variable etat
      switch (log.getTitle()) {
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
          if ((log.getDetail("ATNASSOC") == "S") || (log.getDetail("ATNASSOC") == "L")) {
            monEtat = Etat.DemandeLogonAutorisee;
          }
          else if (log.getDetail("ATNASSOC") == "F") {
            monEtat = Etat.NonLogue;
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCVNRES': {
          //console.log('CPCVNRES');
          if (log.getDetail("GAPPSTATUS") == "A") {
            monEtat = Etat.Logue;
          }
          else if (log.getDetail("GAPPSTATUS") == "F") {
            monEtat = Etat.NonLogue;
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCOPENLNK': {
          //console.log('CPCOPENLNK');
          if (monEtat == Etat.Logue) {
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

            if (log.getDetail("CPDLCCOMSTATUS") == "A") {
              monEtat = Etat.Associe;
            }
            else if (log.getDetail("CPDLCCOMSTATUS") == "N") {
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
          if (log.getDetail("FREQ") !== undefined) {
            let freq = frequences.conversionFreq(log.getDetail("FREQ"));
            let detail = <DetailCpdlc>{};
            detail.key = "FREQ";
            detail.value = freq;
            log.addDetail(detail);
            monEtat = Etat.TransfertEnCours;
          }

          else {
            monEtat = Etat.DemandeDeconnexion;
          }
          break;
        }
        case 'CPCMSGDOWN': {
          //console.log('CPCMSGDOWN');
          //  console.log('CPCMSGDOWN :'+log.getInfoMap().get("CPDLCMSGDOWN"));
          if (monEtat == Etat.TransfertEnCours) {
            if ((log.getDetail("CPDLCMSGDOWN") == "WIL") || (log.getDetail("CPDLCMSGDOWN") == "LCK")) {
              monEtat = Etat.Transfere;
            }
            else if ((log.getDetail("CPDLCMSGDOWN") == "UNA") || (log.getDetail("CPDLCMSGDOWN") == "STB")) {
              monEtat = Etat.RetourALaVoix;
            }
          }
          //Cas ou le serveur air n a pas repondu assez tot, le vol passe vtr donc closelink obligatoire -> demande deconnexion en cours
          if (monEtat == Etat.DemandeDeconnexion) {
            if ((log.getDetail("CPDLCMSGDOWN") == "UNA") || (log.getDetail("CPDLCMSGDOWN") == "STB")) {
              monEtat = Etat.DemandeDeconnexion;
            }
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCFREQ': {
          let freq = frequences.conversionFreq(log.getDetail("FREQ"));

          let detail = <DetailCpdlc>{};
          detail.key = "FREQ";
          detail.value = freq;
          log.addDetail(detail);
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
      log.setEtat(monEtat);


      numeroLigne += 1;
    } while (!readline.eof(r));



    readline.fclose(r);
    //fs.closeSync(w);



    return monvol;
  }

}
