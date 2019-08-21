import { Vol } from '../Modele/vol';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Etat } from '../Modele/enumEtat';
import { TSMap } from "typescript-map";
import { split } from './split';
import * as moment from 'moment';
import * as dates from './date';

let fsplit = new split();
let readline = require("../scripts/node-readline/node-readline");
let frequences = require("./frequences");
import * as grep from "./grepLPLN";
import { isUndefined } from 'util';

const p = require('path');
import { DetailCpdlc } from '../Modele/detailCpdlc';
import { Identifiants } from '../Modele/identifiants';
import { GrepLPLN } from './grepLPLN';
import { Path } from '../Modele/path';

export class parseurLpln {

  private grep: GrepLPLN;

  constructor(grep: GrepLPLN) {
    this.grep = grep;
  }

  public identification (arcid: string, plnid: number, fichierSourceLpln: string): Identifiants {
    console.log("identification LPLN");

    //console.log("grep.isPlnid",grep.isPlnid(plnid, fichierSourceLpln) );

    let id = <Identifiants>{};
    id.identifie = false;

    //console.log("arcid : "+arcid);
    //console.log("plnid : "+plnid);
    if ((arcid == "") && (plnid !== 0)) {

      arcid = this.grep.grepArcidFromPlnid(plnid, fichierSourceLpln);
      console.log(arcid);
      if (arcid !== "") {
        //console.log("arcid trouve : "+arcid);
        id.identifie = true;
      }
    }

    if ((arcid !== "") && (plnid == 0)) {
      plnid = this.grep.grepPlnidFromArcid(arcid, fichierSourceLpln);
      if (plnid !== 0) {
        //console.log("plnid trouve : "+plnid);
        id.identifie = true;

      }
    }



    id.plnid = plnid;
    id.arcid = arcid;

    console.log(" id.arcid: ", id.arcid, " id.plnid: ", id.plnid, " id.identifie: ", id.identifie);
    return id;
  }

  public parseur (arcid: string, plnid: number, fichierSourceLpln: string): Vol {

    const fichierGbdi = p.resolve(Path.systemPath, "STPV_G2910_CA20180816_13082018__1156");
    const source = p.resolve(this.grep.getUserPath(), "resultLPLN.htm"); //Fichier en entree a analyser

    fichierSourceLpln = p.resolve(this.grep.getUserPath(), fichierSourceLpln);

    if ((arcid == "") && (plnid !== 0)) {
      arcid = this.grep.grepArcidFromPlnid(plnid, fichierSourceLpln);
      console.log("cas impossible");

    }
    if ((arcid !== "") && (plnid == 0)) {
      plnid = this.grep.grepPlnidFromArcid(arcid, fichierSourceLpln);
      console.log("cas impossible");

    }


    this.grep.grepLogLPLN(arcid, plnid, fichierSourceLpln);

    //TODO : partie a mettre en commun avec l'autre parseur


    //let fichierDest = "../Output/freq.htm";
    frequences.GbdiToFreq(fichierGbdi);


    /* Ouverture du fichier à analyser*/

    let r = readline.fopen(source, "r");
    if (r === false) {    // Test de l ouverture du fichier
      console.log("Error, can't open ", source);
      process.exit(1);
    }

    /* Initialisation des variables */
    let numeroLigne = 0; // Nuemro de la de lignes lue
    let monEtat = Etat.NonLogue; // Etat CPDLC par defaut
    let mylisteLogsCpdlc = new Array(); //Liste des lignes lues
    let dateTemp: string = "";
    let mois: string = "";
    let jour: string = "";

    let monvol = new Vol(arcid, plnid);


    /* CREATION DU GRAPHE D ETAT */

    do {
      //lecture d'une ligne du fichier
      let mylogCpdlc = readline.fgets(r);
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
            mois = dates.MonthLetterToNumber(dateTemp.toString().replace(motifDate, "$3"));
          }

        }
        else {

          //Recuperation du numero de ligne et de l'heure et du contenu CPDLC de la ligne lue
          let mylogCpdlcDecompose = fsplit.splitString(mylogCpdlc, '*');
          //Recuperation du numero de ligne et de l'heure de la ligne lue
          let infoGen = mylogCpdlcDecompose[1].trim();



          infoGen = infoGen.replace(/\s+/g, " ");
          //Recuperation du contenu CPDLC de la ligne lue
          let infoLog = mylogCpdlcDecompose[2];




          //Creation de l objet logCpdlc et etatCpdlc
          let log = new EtatCpdlc(numeroLigne);
          log.setLog(infoLog);
          //Stockage de la date/heure

          let motifDateHeure = /(.*)( )(.*)(H)(.*)/;
          let dateHeure = infoGen.match(motifDateHeure);
          if (dateHeure !== null) {
            const heure = dateHeure.toString().replace(motifDateHeure, "$3");
            const minutes = dateHeure.toString().replace(motifDateHeure, "$5");
            const dateToStore = jour + "-" + mois + " " + heure + " " + minutes;
            const momentDate = moment(dateToStore, 'DD-MM HH mm');

            log.setDate(moment(momentDate).format('DD-MM'));
            log.setHeure(moment(momentDate).format('HH mm'));
          }


          //Stockage des infos générales
          let myMap = this.recuperationCPC(infoLog);
          log.setTitle(myMap['TITLE']);

          log.setDetailLog(myMap);



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

              if ((log.getDetaillog()["ATNASSOC"] == "S") || (log.getDetaillog()["ATNASSOC"] == "L")) {
                monEtat = Etat.DemandeLogonAutorisee;
              }
              else if (log.getDetaillog()["ATNASSOC"] == "F") {
                monEtat = Etat.NonLogue;
              }
              else {
                monEtat = Etat.Unknown;
              }
              break;
            }
            case 'CPCVNRES': {
              //console.log('CPCVNRES');
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

                if (log.getDetaillog()["CPDLCCOMSTATUS"] == "A") {
                  monEtat = Etat.Associe;
                }
                else if (log.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
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
              if ((monEtat == Etat.Associe) && log.getDetaillog()["FREQ"] !== undefined) {
                monEtat = Etat.TransfertEnCours;
              }
              if ((monEtat == Etat.TransfertEnCours) && log.getDetaillog()["FREQ"] !== undefined) {
                let freq = frequences.conversionFreq(log.getDetaillog()["FREQ"]);
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
              if (monEtat == Etat.TransfertEnCours) {
                if ((log.getDetaillog()["CPDLCMSGDOWN"] == "WIL") || (log.getDetaillog()["CPDLCMSGDOWN"] == "LCK")) {
                  monEtat = Etat.Transfere;
                }
                else if ((log.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (log.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
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
      }
      else {

        if (mylogCpdlc.match("AERODROME  DEP.:") !== null) {        
          let motif = /(.*)(AERODROME  DEP.:)(.*)(NIVEAU)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          console.log("info adep:", transaction);
          monvol.setAdep(transaction);
        }



        if (mylogCpdlc.match("AERODROME DEST.:") !== null) { 
          let motif = /(.*)(AERODROME DEST.:)(.*)(RANG)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          console.log("info ades:", transaction);
          monvol.setAdes(transaction);
        }

        if (mylogCpdlc.match("ADRESSE MODE S :") !== null) {  
          let motif = /(.*)(ADRESSE MODE S :)(.*)(EVT|EVEIL|FIN|IMP)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          console.log("info adrModeS:", transaction);
          monvol.setAdrModeS(transaction);


        }
        if (mylogCpdlc.match("ADR MODE S INF :") !== null) {   
          let motif = /(.*)(ADR MODE S INF :)(.*)(EVT|EVEIL|FIN|IMP)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          console.log("info adrModeSInf:", transaction);
          monvol.setAdrModeSInf(transaction);

        }

        if (mylogCpdlc.match("ADR. DEPOSEE   :") !== null) { 
          let motif = /(.*)(ADR. DEPOSEE   :)(.*)(EVT|EVEIL|FIN|IMP)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          console.log("info adrDeposee:", transaction);
          monvol.setAdrDeposee(transaction);
        }


        if (mylogCpdlc.match("EQUIPEMENT CPDLC") !== null) {
          let motif = /(.*)(EQUIPEMENT CPDLC :)(.*)/;
          let transaction = mylogCpdlc.replace(motif, "$3").trim();
          console.log("info equipement:", transaction);
          monvol.setEquipementCpdlc(transaction);

        }




      }



      numeroLigne += 1;
    } while (!readline.eof(r));



    readline.fclose(r);
    //fs.closeSync(w);

    return monvol;
  }


  private recuperationCPC (infoLog: string): DetailCpdlc[] {
    let mymap: DetailCpdlc[] = [];

    if (infoLog.match("ENVOI MSG") !== null) {
      let motif = /(ENVOI MSG )(.*)(AU SERVEUR AIR)/;
      mymap['ORIGINE_MSG'] = 'STPV';
      if (infoLog.match(motif) !== null) {
        let cpcInfo = infoLog.replace(motif, "$2").trim();
        cpcInfo = cpcInfo.replace(/\s+/g, " ");
        let etatCpc = fsplit.splitString(cpcInfo, " ");
        let title = etatCpc[0];
        mymap['TITLE'] = title;
        switch (title) {
          case 'CPCASRES': {
            console.log("je rentre dans CPCASRES", etatCpc[1].trim());
            
            if (etatCpc[1].trim() == "(S)") {    
              mymap['ATNASSOC'] = 'S';
            }
            
            else {
              if  (etatCpc[1].trim() == "(L)"){
                mymap['ATNASSOC'] = 'L';
              }
              else {
                mymap['ATNASSOC'] = 'F';
                //TODO verifier quil ny a pas dautres valeurs possibles
              }

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
            mymap['TITLE'] = 'CPCCLOSLNK';
            //Rien a f]aire
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
            //console.log('etats.title');
            break;
          }

        }

      }
      else {
        let motif = /(ENVOI MSG )(.*)(POUR POSITION\(S\))(.*)/;
        let cpcInfo = infoLog.replace(motif, "$2").trim();
        cpcInfo = cpcInfo.replace(/\s+/g, " ");
        let etatCpc = fsplit.splitString(cpcInfo, " ");
        let title = etatCpc[0];
        mymap['TITLE'] = title;
        mymap['EVT'] = etatCpc[2];
        cpcInfo = infoLog.replace(motif, "$4").trim();
        cpcInfo = cpcInfo.replace(/\s+/g, " ");

        mymap['POSITIONS'] = cpcInfo;


      }
    }

    if (infoLog.match("RECEPTION MSG") !== null) {
      mymap['ORIGINE_MSG'] = 'SA';
      let motif = /(RECEPTION MSG )(.*)(DU SERVEUR AIR)/;
      let cpcInfo = infoLog.replace(motif, "$2").trim();

      cpcInfo = cpcInfo.replace(/\s+/g, " ");
      let etatCpc = fsplit.splitString(cpcInfo, " ");
      let title = etatCpc[0];
      //let mymap = new TSMap<string,string>();
      mymap['TITLE'] = title;


      switch (title) {
        case 'CPCASREQ': {
          //rien a faire
          break;
        }
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

  public grepListeVolFromLpln (fichierSourceLpln: string): Vol[] {
    console.log("coucou");
    let fichierSource = p.resolve(this.grep.getUserPath(), fichierSourceLpln);
    let fd = this.isFichierLisible(fichierSource); //Test de l'ouverture du fichier et recuperation du file descriptor

    //let motif = /(-)(.*)(\/)(.*)(H)(.*)(MN)(.*)(NUMERO PLN:)(.*)(INDICATIF:)(.*)(NOM SL:)(.*)(RANG SL:)(.*)(PLN)(.*)(-)/;
    let motif = /(.*)(NUMERO PLN:)(.*)(INDICATIF:)(.*)(NOM SL:)(.*)(RANG SL:)(.*)/;
    // - 23/AOUT       06H00MN     NUMERO PLN: 9352   INDICATIF: DLH37F    NOM SL: AIX      RANG SL:   2 PLN TERMINE                      
    let plnid: number = 0;
    let indicatif: string = "";
    let nomSL: string = "";
    let listeVols: Vol[] = [];
    let listeVolsUniques: Vol[] = [];
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      var line = readline.fgets(fd);
      if (line === false) { break; }
      //Recuperation des lignes contenant le motif
      let motifLine = line.match(motif);
      if (motifLine !== null) {
        //console.log(info1Lpln);
        plnid = line.toString().replace(motif, "$3").trim();
        //console.log("plnid : "+plnid);
        indicatif = line.toString().replace(motif, "$5").trim();
        //console.log("arcid : "+indicatif);
        nomSL = line.toString().replace(motif, "$7").trim();
        //console.log("nomSL : "+nomSL);
        let monvol = new Vol(indicatif, plnid);
        monvol.setSL(nomSL);
        listeVols.push(monvol);
      }

    } while (!readline.eof(fd));
    readline.fclose(fd);

    //console.log(listeVols);
    // suppression des doublons
    var cache = {};
    listeVolsUniques = listeVols.filter(function (elem) {
      return cache[elem.getArcid()] ? 0 : cache[elem.getArcid()] = 1;
    });
    return listeVolsUniques;
  }

  private isFichierLisible (fichier: string): number {
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
