
import { Vol } from '../Modele/vol';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Etat } from '../Modele/enumEtat';
import * as moment from 'moment';

import { Split } from './split';




import { DetailCpdlc } from '../Modele/detailCpdlc';
import { Identifiants } from '../Modele/identifiants';
import { GrepVEMGSA } from './grepVEMGSA';
import { Path } from '../Modele/path';
import { Frequences } from './frequences';
import {  datesFile } from './date';
import { ReadLine } from '../scripts/node-readline/node-readline';


const p = require('path');

export class ParseurVEMGSA {
  private grep: GrepVEMGSA;
  private split: Split;
  private frequences : Frequences;
  private readLine: ReadLine;


  constructor(grep: GrepVEMGSA) {
    console.log("Je rentre dans le constructor parseurVemgsa ");

    this.grep = grep;
    this.split = new Split();
    this.frequences = new Frequences();
    this.readLine = new ReadLine();

  }

 



  public parseur(arcid: string, plnid: number, fichierSourceVemgsa: string[],creneau:datesFile, chosenHoraire?:datesFile): Vol {
    console.log("Classe ParseurVemgsa Fonction parseur");
    const fichierGbdi = p.resolve(Path.systemPath, "STPV_G2910_CA20180816_13082018__1156");
    const source = p.resolve(this.grep.getUserPath(), "result.htm"); //Fichier en entree a analyser

    // TODO : DEPLACE DANS LA FONCTION CHECK  ?? 
    this.grep.grepLog(arcid, plnid, fichierSourceVemgsa,creneau, chosenHoraire);

    /* Ouverture du fichier à analyser*/

    let r = this.readLine.fopen(source, "r");
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
      let mylogCpdlc = this.readLine.fgets(r);
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

        log.setJour(moment(momentDate).format('DD-MM-YYYY'));
        log.setHeure(moment(momentDate).format('HH mm ss'));
        log.setDate(moment(momentDate).format('DD-MM-YYYY HH mm ss'));

        log.setAssociable(Boolean(infoGen.toString().replace(motifDateHeure, "$8")));
        if (monvol.getDate() == ""){
          monvol.setDate(log.getJour());
        }
      }
      //Stockage des infos suivantes

      let myMap: DetailCpdlc[] = this.split.stringToDetailCpdlc(infoLog);




      log.setDetailLog(myMap);
      log.setTitle(log.getDetaillog()['TITLE']);
      log.setIsTypeCPC(true);
      monvol.getListeLogs().push(log);

      //automate a etat sur la variable etat
      switch (log.getTitle()) {
        case 'CPCASREQ': {
          if (monEtat == Etat.NonLogue) {
            monEtat = Etat.DemandeLogon;
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCASRES': {
          if ((log.getDetaillog()["ATNASSOC"] == "S") || (log.getDetaillog()["ATNASSOC"] == "L")) {
            monEtat = Etat.DemandeLogonAutorisee;
          }
          else if (log.getDetaillog()["ATNASSOC"]== "F") {
            monEtat = Etat.NonLogue;
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCVNRES': {
          if (log.getDetaillog()["GAPPSTATUS"] == "A") {
            monEtat = Etat.Logue;
          }
          else if (log.getDetaillog()["GAPPSTATUS"] == "F") {
            monEtat = Etat.NonLogue;
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCOPENLNK': {
          if (monEtat == Etat.Logue) {
            monEtat = Etat.DemandeConnexion;
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCCOMSTAT': {
            if (log.getDetaillog()["CPDLCCOMSTATUS"] == "A") {
              monEtat = Etat.Connecte;
            }
            else if (log.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
              monEtat = Etat.Logue;
            }
          break;
        }
        case 'CPCEND': {
          monEtat = Etat.FinVol;
          break;
        }
        case 'CPCCLOSLNK': {
          if (log.getDetaillog()["FREQ"] !== undefined) {
            let freq = this.frequences.conversionFreq(log.getDetaillog()["FREQ"]);
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
          if (monEtat == Etat.TransfertEnCours) {
            if ((log.getDetaillog()["CPDLCMSGDOWN"] == "WIL") || (log.getDetaillog()["CPDLCMSGDOWN"] == "LCK")) {
              monEtat = Etat.Transfere;
            }
            else if ((log.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (log.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
              monEtat = Etat.RetourALaVoix;
            }
          }
          //Cas ou le serveur air n a pas repondu assez tot, le vol passe vtr donc closelink obligatoire -> demande deconnexion en cours
         else if (monEtat == Etat.DemandeDeconnexion) {
            if ((log.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (log.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
              monEtat = Etat.DemandeDeconnexion;
            }
          }
          else {
            monEtat = Etat.Unknown;
          }
          break;
        }
        case 'CPCFREQ': {
          let freq = this.frequences.conversionFreq(log.getDetaillog()["FREQ"]);
          let detail = <DetailCpdlc>{};
          detail.key = "FREQ";
          detail.value = freq;
          log.addDetail(detail);
          monEtat = Etat.TransfertEnCours;
          break;
        }
        case 'CPCMSGUP': {
          monEtat = Etat.Unknown;
          break;
        }
        case 'CPCNXTCNTR': {
          monEtat = Etat.Unknown;;
          break;
        }
        default: {
          monEtat = Etat.Unknown;
          break;
        }

      }
      log.setEtat(monEtat);


      numeroLigne += 1;
    } while (!this.readLine.eof(r));



    this.readLine.fclose(r);
    //fs.closeSync(w);



    return monvol;
  }

}
