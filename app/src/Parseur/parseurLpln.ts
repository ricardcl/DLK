import { Vol } from '../Modele/vol';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Etat } from '../Modele/enumEtat';
import { Split } from './split';
import * as moment from 'moment';
import { DetailCpdlc } from '../Modele/detailCpdlc';
import { GrepLPLN } from './grepLPLN';
import { Path } from '../Modele/path';
import { Dates } from './date';
import { ReadLine } from '../scripts/node-readline/node-readline';
import { Frequences } from './frequences';
const p = require('path');

export class ParseurLPLN {

  private grep: GrepLPLN;
  private split: Split;
  private dates: Dates;
  private frequences: Frequences;
  private readLine: ReadLine;

  constructor(grep: GrepLPLN, dates:Dates,split:Split,frequences:Frequences) {
    console.log("Je rentre dans le constructor parseurLpln ");
    this.grep = grep;
    this.split =split;
    this.dates = dates;
    this.frequences = frequences;
    this.readLine = new ReadLine();
  }

  public parseur(arcid: string, plnid: number): Vol {
    console.log("Classe ParseurLpln Fonction parseur");
    const fichierGbdi = p.resolve(Path.systemPath, "STPV_G2910_CA20180816_13082018__1156");
    const source = p.resolve(this.grep.getUserPath(), "resultLPLN.htm"); //Fichier en entree a analyser 

    // DEPLACé DNAS LA FONCTION CHECK ! this.grep.grepLogLPLN(arcid, plnid, fichierSourceLpln); 

    //TODO : partie a mettre en commun avec l'autre parseur 


    //let fichierDest = "../Output/freq.htm"; 
    this.frequences.GbdiToFreq(fichierGbdi);


    /* Ouverture du fichier à analyser*/

    let r = this.readLine.fopen(source, "r");
    if (r === false) {    // Test de l ouverture du fichier 
      console.log("Error, can't open ", source);
      process.exit(1);
    }

    /* Initialisation des variables */
    let numeroLigne = 0; // Numero de la de lignes lue 
    let monEtat = Etat.NonLogue; // Etat CPDLC par defaut 
    let dateTemp: string = "";
    let mois: string = "";
    let jour: string = "";

    let monvol = new Vol(arcid, plnid);

    /* CREATION DU GRAPHE D ETAT */

    do {
      //lecture d'une ligne du fichier 
      let mylogCpdlc = this.readLine.fgets(r);
      //Test de fin de fichier 
      if (mylogCpdlc === false) { break; }


      //Test si la ligne lue est une info générale CPDLC ou une information sur un etat CPDLC 
      //TODO : faire un check plus complet sur le format attentu : * nombre date * 
      if (mylogCpdlc.match(/\*/) !== null) {

        //Recuperation de la date si c est la ligne  "EDITION DU CHAMP ARCHIVAGE" 
        if (mylogCpdlc.match("EDITION DU CHAMP ARCHIVAGE") !== null) {
          let motif = /(\*)(.*)(\*)(.*)(CHAMP)(.*)/;
          //console.log(mylogCpdlc); 

          dateTemp = mylogCpdlc.replace(motif, "$2").trim();
          let motifDate = /(.*)( )(.*)/;
          if (dateTemp.match(motifDate) !== null) {
            jour = dateTemp.toString().replace(motifDate, "$1");
            mois = this.dates.MonthLetterToNumber(dateTemp.toString().replace(motifDate, "$3"));
          }

        }
        else {

          //Recuperation du numero de ligne et de l'heure et du contenu CPDLC de la ligne lue 
          let mylogCpdlcDecompose = this.split.splitString(mylogCpdlc, '*');
          //Recuperation du numero de ligne et de l'heure de la ligne lue 
          let infoGen = mylogCpdlcDecompose[1].trim();



          infoGen = infoGen.replace(/\s+/g, " ");
          //Recuperation du contenu CPDLC de la ligne lue 
          let infoLog = mylogCpdlcDecompose[2];

          //Creation de l objet logCpdlc et  
          let log = new EtatCpdlc(numeroLigne);
          log.setLog(infoLog);
          //Stockage de la date/heure 

          let motifDateHeure = /(.*)( )(.*)(H)(.*)/;
          let dateHeure = infoGen.match(motifDateHeure);
          if (dateHeure !== null) {
            const heure = dateHeure.toString().replace(motifDateHeure, "$3");
            const minutes = dateHeure.toString().replace(motifDateHeure, "$5");
            const dateToStore = jour + "-" + mois + " " + heure + " " + minutes + " OO";
            const momentDate = moment(dateToStore, 'DD-MM HH mm ss');

            log.setJour(moment(momentDate).format('DD-MM'));
            log.setHeure(moment(momentDate).format('HH mm ss'));
            log.setDate(moment(momentDate).format('DD-MM HH mm ss'));

            if (monvol.getDate() == "") {
              monvol.setDate(log.getJour());
            }
          }


          //Stockage des infos générales 
          let myMap = this.recuperationCPC(infoLog);
          log.setTitle(myMap['TITLE']);
          log.setDetailLog(myMap);


          if (log.getTitle().match("CPC")) {
            log.setIsTypeCPC(true);
          }
          else {
            log.setIsTypeCPC(false);
          }

          monvol.getListeLogs().push(log);


          //automate a etat sur la variable etat 
          if ((log.getTitle() == "CPCCLOSLNK") || (log.getTitle() == "CPCFREQ")) {
            if (log.getDetaillog()["FREQ"] !== undefined) {
              let freq = this.frequences.conversionFreq(log.getDetaillog()["FREQ"]);
              let detail = <DetailCpdlc>{};
              detail.key = "FREQ";
              detail.value = freq;
              log.addDetail(detail);
            }
          }

        }
      }
      else {

        if (mylogCpdlc.match("AERODROME  DEP.:") !== null) {
          let motif = /(.*)(AERODROME  DEP.:)(.*)(NIVEAU)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
         // console.log("info adep:", transaction);
          monvol.setAdep(transaction);
        }

        if (mylogCpdlc.match("AERODROME DEST.:") !== null) {
          let motif = /(.*)(AERODROME DEST.:)(.*)(RANG)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          //console.log("info ades:", transaction);
          monvol.setAdes(transaction);
        }

        if (mylogCpdlc.match("ADRESSE MODE S :") !== null) {
          let motif = /(.*)(ADRESSE MODE S :)(.*)(EVT|EVEIL|FIN|IMP)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          //console.log("info adrModeS:", transaction);
          monvol.setAdrModeS(transaction);
        }

        if (mylogCpdlc.match("ADR MODE S INF :") !== null) {
          let motif = /(.*)(ADR MODE S INF :)(.*)(EVT|EVEIL|FIN|IMP)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          //console.log("info adrModeSInf:", transaction);
          monvol.setAdrModeSInf(transaction);
        }

        if (mylogCpdlc.match("ADR. DEPOSEE   :") !== null) {
          let motif = /(.*)(ADR. DEPOSEE   :)(.*)(EVT|EVEIL|FIN|IMP)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
         // console.log("info adrDeposee:", transaction);
          monvol.setAdrDeposee(transaction);
        }

        if (mylogCpdlc.match("EQUIPEMENT CPDLC") !== null) {
          let motif = /(.*)(EQUIPEMENT CPDLC :)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
         // console.log("info equipement:", transaction);
          monvol.setEquipementCpdlc(transaction);
        }

      }

      numeroLigne += 1;
    } while (!this.readLine.eof(r));

    this.readLine.fclose(r);
    //fs.closeSync(w); 

    return monvol;
  }

  public isVolEquipeCpdlc(): boolean {
    console.log("Classe ParseurLpln Fonction isVolEquipeCpdlc");

    /* Ouverture du fichier à analyser*/
    const source = p.resolve(this.grep.getUserPath(), "resultLPLN.htm"); //Fichier en entree a analyser     
    let r = this.readLine.fopen(source, "r");
    if (r === false) {    // Test de l ouverture du fichier 
      console.log("Error, can't open ", source);
      process.exit(1);
    }

    let isEquipe: boolean = false;
    do {
      //lecture d'une ligne du fichier 
      let mylogCpdlc = this.readLine.fgets(r);
      //Test de fin de fichier 
      if (mylogCpdlc === false) { break; }


      if (mylogCpdlc.match("EQUIPEMENT CPDLC") !== null) {
        let motif = /(.*)(EQUIPEMENT CPDLC :)(.*)/;
        let transaction = mylogCpdlc.replace(motif, "$3").trim();
      //  console.log("info equipement:", transaction);
        if (transaction == "EQUIPE") {
          isEquipe = true;
        }
        break;
      }
    } while (!this.readLine.eof(r));

    this.readLine.fclose(r);
    return isEquipe;
  }

  private recuperationCPC(infoLog: string): DetailCpdlc[] {
    let mymap: DetailCpdlc[] = [];

    if (infoLog.match("ENVOI MSG") !== null) {
      let motif = /(ENVOI MSG )(.*)(AU SERVEUR AIR)/;
      mymap['ORIGINE_MSG'] = 'STPV';
      if (infoLog.match(motif) !== null) {
        let cpcInfo = infoLog.replace(motif, "$2").trim();
        cpcInfo = cpcInfo.replace(/\s+/g, " ");
        let etatCpc = this.split.splitString(cpcInfo, " ");
        let title = etatCpc[0];
        mymap['TITLE'] = title;
        switch (title) {
          case 'CPCASRES': {
        //    console.log("je rentre dans CPCASRES", etatCpc[1].trim());
            if (etatCpc[1].trim() == "(S)") {
              mymap['ATNASSOC'] = 'S';
            }
            else {
              if (etatCpc[1].trim() == "(L)") {
                mymap['ATNASSOC'] = 'L';
              }
              else {
                mymap['ATNASSOC'] = 'F';
                //TODO verifier quil ny a pas dautres valeurs possibles 
              }
            }
            break;
          }
          case 'CPCCLOSELNK': {
            mymap['TITLE'] = 'CPCCLOSLNK';
            break;
          }
          case 'CPCFREQ': {
            mymap['FREQ'] = etatCpc[2];
            break;
          }
          case 'CPCNXTCNTR': {
            if (etatCpc[1].trim() == "(G)") {
              mymap['TFLOGONMODE'] = 'G';
            }
            if (etatCpc[1].trim() == "(A)") {
              mymap['TFLOGONMODE'] = 'A';
            }
            break;
          }
          default: {
            break;
          }

        }

      }
      else {
        let motif = /(ENVOI MSG FPCRD   EVT)(.*)(POUR POSITION\(S\))(.*)/;
        
        let cpcInfo = infoLog.replace(motif, "$2").trim();
        cpcInfo = cpcInfo.replace(/\s+/g, " ");
        mymap['TITLE'] = cpcInfo;
        mymap['EVT'] = "FPCRD";
        cpcInfo = infoLog.replace(motif, "$4").trim();
        cpcInfo = cpcInfo.replace(/\s+/g, " ");

        mymap['POSITION'] = cpcInfo;


      }
    }

    if (infoLog.match("RECEPTION MSG") !== null) {
      mymap['ORIGINE_MSG'] = 'SA';
      let motif = /(RECEPTION MSG )(.*)(DU SERVEUR AIR)/;
      let cpcInfo = infoLog.replace(motif, "$2").trim();

      cpcInfo = cpcInfo.replace(/\s+/g, " ");
      let etatCpc = this.split.splitString(cpcInfo, " ");
      let title = etatCpc[0];
      mymap['TITLE'] = title;


      switch (title) {
        case 'CPCVNRES': {
          if (etatCpc[1].trim() == "(A)") {
            mymap['GAPPSTATUS'] = 'A';
          }
          if (etatCpc[1].trim() == "(F)") {
            mymap['GAPPSTATUS'] = 'F';
          }
          break;
        }
        case 'CPCCOMSTAT': {
          if (etatCpc[1].trim() == "(A)") {
            mymap['CPDLCCOMSTATUS'] = 'A';
          }
          if (etatCpc[1].trim() == "(N)") {
            mymap['CPDLCCOMSTATUS'] = 'N';
          }
          break;
        }
        case 'CPCMSGDOWN': {
          if (etatCpc[1].trim() == "(WIL)") {
            mymap['CPDLCMSGDOWN'] = 'WIL';
          }
          if (etatCpc[1].trim() == "(LCK)") {
            mymap['CPDLCMSGDOWN'] = 'LCK';
          }
          if (etatCpc[1].trim() == "(UNA)") {
            mymap['CPDLCMSGDOWN'] = 'UNA';
          }
          if (etatCpc[1].trim() == "(STB)") {
            mymap['CPDLCMSGDOWN'] = 'STB';
          }
          break;
        }
        default: {
          break;
        }
      }
    }

    if (infoLog.match("EVENEMENT DATE: FIN TRFDL") !== null) {
      mymap['TITLE'] = 'FIN TRFDL';
      mymap['ORIGINE_MSG'] = 'INTERNE';
      let motif = /(.*)(HEURE:)(.*)/;
      let heure = infoLog.replace(motif, "$3").trim();
      mymap['HEURE'] = heure;
    }

    if (infoLog.match("EVENEMENT DATE: FIN VOL") !== null) {
      mymap['TITLE'] = 'FIN VOL';
      mymap['ORIGINE_MSG'] = 'INTERNE';
      let motif = /(.*)(HEURE:)(.*)(AVEC)(.*)/;
      let heure = infoLog.replace(motif, "$3").trim();
      mymap['HEURE'] = heure;
    }

    if (infoLog.match("EVENEMENT DATE: TRANSFERT") !== null) {
      mymap['TITLE'] = 'TRANSFERT';
      mymap['ORIGINE_MSG'] = 'INTERNE';
      let motif = /(.*)(HEURE:)(.*)(ETAT :)(.*)(SECTEUR:)(.*)(BALISE :)(.*)(RANG.*)/;
      let heure = infoLog.replace(motif, "$3");
      mymap['HEURE'] = heure;
      let etat = infoLog.replace(motif, "$5");
      mymap['ETAT'] = etat;
      let secteur = infoLog.replace(motif, "$7");
      mymap['SECTEUR'] = secteur;
      let balise = infoLog.replace(motif, "$9");
      mymap['BALISE'] = balise;

    }


    if (infoLog.match("TRANSACTION") !== null) {
      mymap['TYPE_MSG'] = 'INTERNE';
      let motif = /(.*)(TRANSACTION )(.*)(POSITION ORIGINE)(.*)/;
      let transaction = infoLog.replace(motif, "$3").trim();
      mymap['TITLE'] = transaction;
      let position = infoLog.replace(motif, "$5");
      mymap['POSITION'] = position.trim();
    }

    return mymap;
  }


  private isFichierLisible(fichier: string): number {
    let fd = this.readLine.fopen(fichier, "r");
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
