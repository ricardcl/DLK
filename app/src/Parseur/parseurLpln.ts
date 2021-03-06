import { Identifiants } from "../Modele/identifiants";
import { Split } from './split';
import { ReadLine } from "../scripts/node-readline/node-readline";
import { Dates, creneauHoraire } from "./date";
import moment = require("moment");
const fs = require('fs');
const p = require('path');


/**
 * Classe regroupant les fonctions qui accedent directement au fichier LPLN en lecture
 * Soit pour récuperer des infos ponctuelles ( lors du check ini comme l'arcid ou le plnid)
 * soit pour recuperer l'ensemble des logs a stocker dans un fichier destination
 */
export class ParseurLPLN {
  private userPath: string;
  private split: Split;
  private readLine: ReadLine;
  private dates: Dates;


  constructor(userPath: string,dates:Dates,split:Split) {
    console.log("Je rentre dans le constructor ParseurLPLN ");
    this.dates = dates;
    this.userPath = userPath;
    this.split = split;
    this.readLine = new ReadLine();
  }


  public getUserPath(): string {
    return this.userPath;
  }

  public parseLogLPLN(arcid: string, plnid: number, fichierSourceLpln: string): void {
    
    console.log("Classe ParseurLPLN Fonction parseLogLPLN", "plnid", plnid, "arcid", arcid);

    let fichierDestination = p.resolve(this.userPath, "resultLPLN.htm");

    let fichierSource = p.resolve(this.userPath, fichierSourceLpln);


    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let w = fs.openSync(fichierDestination, "w");

    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      let mylogCpdlc = this.readLine.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match("NUMERO PLN: " + plnid);
      let info1Lplnbis = mylogCpdlc.match("NUMERO PLN:  " + Math.round(plnid));
      let info2Lpln = mylogCpdlc.match("NOM SL: AIX");
      if (((info1Lpln !== null) || (info1Lplnbis !== null)) && (info2Lpln !== null)) {
        fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
        //console.log(mylogCpdlc);
        //Lecture des logs concernant le vol dans le SL AIX
        do {
          mylogCpdlc = this.readLine.fgets(r);
          if (mylogCpdlc === false) { break; }

          //Recuperation des infos DLK generales
          let info6Lpln = mylogCpdlc.match(/EQUIPEMENT CPDLC|ETAT CONN CPDLC|DONNEES LOGON/);
          if (info6Lpln !== null) {
            fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
            //console.log(mylogCpdlc);
          }

          //Recuperation des infos DLK liees aux adresses Mode S et déposees ( de l aeroport d arrivee)
          let info7Lpln = mylogCpdlc.match(/ADR. DEPOSEE|ADR MODE S INF|ADRESSE MODE S/);
          if (info7Lpln !== null) {
            fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
            //console.log(mylogCpdlc);
          }

          //Recuperation des infos liees a l aeroport de depart
          let info8Lpln = mylogCpdlc.match(/AERODROME  DEP|AERODROME DEST/);
          if (info8Lpln !== null) {
            fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
            //console.log(mylogCpdlc);
          }

          //Recuperation du resume des tranferts DLK
          let info5Lpln = mylogCpdlc.match("TRANSFERT DATA LINK");
          if (info5Lpln !== null) {
            let nbSep = 0;
            do {

              mylogCpdlc = this.readLine.fgets(r);
              if (mylogCpdlc === false) { break; }

              if (mylogCpdlc.match("--------------------------------") !== null) {
                nbSep++;
                //console.log("compteur : "+nbSep)
              }
              //
              let info3Lpln = mylogCpdlc.match(/NOM   SECTEUR|NUMERO EO ASSOCIEE|ETAT  DATA  LINK/);
              if (info3Lpln !== null) {
                fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
                //console.log("b: "+mylogCpdlc);
              }
              else {
                //console.log("match pas : "+mylogCpdlc);
              }

            } while (nbSep !== 2);
          }

          // Recuperation des echanges CPC
          let info4Lpln = mylogCpdlc.match("EDITION DU CHAMP ARCHIVAGE");
          if (info4Lpln !== null) {
            fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
            do {
              mylogCpdlc = this.readLine.fgets(r);
              if (mylogCpdlc === false) { break; }

              // let info3Lpln = mylogCpdlc.match(/RECEPTION MSG CPC|ENVOI MSG CPC|TRFDL|FPCRD   EVT TRFSEC|FPCRD   EVT ETATDL|TRARTV|VTR  SECTEUR|EVENEMENT DATE: FIN VOL|FPCLOSE EVT END/);
              let info3Lpln = mylogCpdlc.match(/RECEPTION MSG CPC|ENVOI MSG CPC|TRFDL|TRARTV|EVENEMENT DATE: FIN VOL|FPCLOSE EVT END/);
              if (info3Lpln !== null) {
                fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
                //console.log(mylogCpdlc);
              }
            } while ((mylogCpdlc.match("Separateur d'impression") == null) && (mylogCpdlc.match("FIN DES DEPOUILLEMENTS") == null)
            && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null)) && ((mylogCpdlc.match("NUMERO PLN:") == null) || (mylogCpdlc.match("NUMERO PLN: " + plnid) !== null)));
          }


        } while ((mylogCpdlc.match("Separateur d'impression") == null) && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null)) && ((mylogCpdlc.match("NUMERO PLN:") == null) || (mylogCpdlc.match("NUMERO PLN: " + plnid) !== null)));
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);
    fs.closeSync(w);
  }

  /**
   * Fonction recuperant le créneau horaire du vol passé en paramètre à partir de son fichier de log LPLN
   * @param arcid : arcid du vol étudié
   * @param plnid : plnid du vol étudié
   * @param fichierSourceLpln : nom du ficher LPLN contenant les logs du vol étudié
   * @returns {dateMin:string,dateMax:string} où les dates sont au format('DD-MM HH mm ss'); 
   */
  public parseDatesLogLPLN(arcid: string, plnid: number, fichierSourceLpln: string): creneauHoraire {
    console.log("Classe ParseurLPLN Fonction parseDatesLogLPLN", "plnid", plnid, "arcid", arcid);

    let fichierSource = p.resolve(this.userPath, fichierSourceLpln);
    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");

    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }

    let datesFichier = <creneauHoraire>{};
    datesFichier.dateMin = "";
    datesFichier.dateMax = "";
    let dateTemp: string = "";
    let mois: string = "";
    let jour: string = "";
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      let mylogCpdlc = this.readLine.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match("NUMERO PLN: " + plnid);
      let info1Lplnbis = mylogCpdlc.match("NUMERO PLN:  " + Math.round(plnid));
      let info2Lpln = mylogCpdlc.match("NOM SL: AIX");
      if (((info1Lpln !== null) || (info1Lplnbis !== null)) && (info2Lpln !== null)) {
        //Lecture des logs concernant le vol dans le SL AIX
        do {
          mylogCpdlc = this.readLine.fgets(r);
          if (mylogCpdlc === false) { break; }

          // Recuperation des infos de date
          let info4Lpln = mylogCpdlc.match("EDITION DU CHAMP ARCHIVAGE");
          if (info4Lpln !== null) {
            // Recuperation du jour et du mois
            let motif = /(\*)(.*)(\*)(.*)(CHAMP)(.*)/;
            dateTemp = mylogCpdlc.replace(motif, "$2").trim();
            let motifDate = /(.*)( )(.*)/;
            if (dateTemp.match(motifDate) !== null) {
              jour = dateTemp.toString().replace(motifDate, "$1");
              mois = this.dates.MonthLetterToNumber(dateTemp.toString().replace(motifDate, "$3"));
            }

            do {
              mylogCpdlc = this.readLine.fgets(r);
              if (mylogCpdlc === false) { break; }

              // let info3Lpln = mylogCpdlc.match(/RECEPTION MSG CPC|ENVOI MSG CPC|TRFDL|FPCRD   EVT TRFSEC|FPCRD   EVT ETATDL|TRARTV|VTR  SECTEUR|EVENEMENT DATE: FIN VOL|FPCLOSE EVT END/);
              let info3Lpln = mylogCpdlc.match(/RECEPTION PLN ACTIVE|RECEPTION M|ENVOI/);
              if (info3Lpln !== null) {
                //Recuperation du numero de ligne et de l'heure et du contenu CPDLC de la ligne lue 
                let mylogCpdlcDecompose = this.split.splitString(mylogCpdlc, '*');
                //Recuperation du numero de ligne et de l'heure de la ligne lue 
                let infoGen = mylogCpdlcDecompose[1].trim();
                infoGen = infoGen.replace(/\s+/g, " ");
                let motifDateHeure = /(.*)( )(.*)(H)(.*)/;
                let dateHeure = infoGen.match(motifDateHeure);
                if (dateHeure !== null) {
                  const heure = dateHeure.toString().replace(motifDateHeure, "$3");
                  const minutes = dateHeure.toString().replace(motifDateHeure, "$5");
                  const dateToStore = jour + "-" + mois + " " + heure + " " + minutes + " OO";
                  const momentDate = moment(dateToStore, 'DD-MM HH mm ss').format('DD-MM HH mm ss');

                  // console.log("momentDate: ",momentDate);
                  
                  if (datesFichier.dateMin === "") {
                    datesFichier.dateMin = momentDate;
                    datesFichier.dateMax = momentDate;
                  }
                  if (this.dates.isDateSup(momentDate, datesFichier.dateMax)) {
                    datesFichier.dateMax = momentDate;
                  }
                  //console.log("dateMin: ",datesFichier.dateMin," dateMax: ",datesFichier.dateMax);
                }
              }
            } while ((mylogCpdlc.match("Separateur d'impression") == null) && (mylogCpdlc.match("FIN DES DEPOUILLEMENTS") == null)
            && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null)) && ((mylogCpdlc.match("NUMERO PLN:") == null) || (mylogCpdlc.match("NUMERO PLN: " + plnid) !== null)));
          }


        } while ((mylogCpdlc.match("Separateur d'impression") == null) && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null)) && ((mylogCpdlc.match("NUMERO PLN:") == null) || (mylogCpdlc.match("NUMERO PLN: " + plnid) !== null)));
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);

    return datesFichier;
  }


  public grepArcidFromPlnid(plnid: number, fichierSourceLpln: string): string {
    console.log("Classe ParseurLPLN Fonction grepArcidFromPlnid");

    let fichierSource = fichierSourceLpln;
    //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /(.*)(NUMERO PLN: )(.*)(INDICATIF: )(.*)(NOM SL: AIX)(.*)/;
    let arcid = "";
    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      var mylogCpdlc = this.readLine.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match(motif);
      let info2Lpln = mylogCpdlc.match(Math.round(plnid));
      if ((info1Lpln !== null) && (info2Lpln !== null)) {
        arcid = mylogCpdlc.toString().replace(motif, "$5").trim();

        break;
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);

    return arcid;
  }



  public grepPlnidFromArcid(arcid: string, fichierSourceLpln: string): number {
    console.log("Classe ParseurLPLN Fonction grepPlnidFromArcid");

    let fichierSource = fichierSourceLpln;
    //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /(.*)(NUMERO PLN: )(.*)(INDICATIF: )(.*)(NOM SL: AIX)(.*)/;
    let plnid = 0;
    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      var mylogCpdlc = this.readLine.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match(motif);
      let info2Lpln = mylogCpdlc.match(arcid);
      if ((info1Lpln !== null) && (info2Lpln !== null)) {
        plnid = mylogCpdlc.toString().replace(motif, "$3").trim();
        break;
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);

    return plnid;
  }

  /**
   * Fonction qui rechercher dans le fichier LPLN passé en paramètre 
   * les identifiants (plnid, arcid) des vols loggés dans le fichier 
   * @param fichierSource nom du fichier le log LPLN rentré par l'utilisateur
   * @returns {[plnid,arcid]} un tableau des identifiants trouvés
   */
  public grepPlnidAndArcid(fichierSource: string): Identifiants[] {
    console.log("Classe ParseurLPLN Fonction grepPlnidAndArcid");


    let tabPlnid = [];
    let tabArcid = [];
    let tabId = [];

    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /(.*)(NUMERO PLN: )(.*)(INDICATIF: )(.*)(NOM SL: AIX)(.*)/;
    let arcidTemp;

    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      var mylogCpdlc = this.readLine.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match(motif);
      if (info1Lpln !== null) {
        let id = <Identifiants>{};
        id.arcid = "";
        id.plnid = 0;
        arcidTemp = this.split.splitString(mylogCpdlc.toString().replace(motif, "$5").trim(), " ");
        id.arcid = arcidTemp[0];
        id.plnid = mylogCpdlc.toString().replace(motif, "$3").trim();

        if (!(tabArcid.includes(id.arcid)) || !(tabPlnid.includes(id.plnid))) {

          tabArcid.push(id.arcid);
          tabPlnid.push(id.plnid);
          tabId.push(id)
        }
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);


    tabId.forEach(element => {
      console.log("tabId finale : ", element.arcid, " ", element.plnid);
    });



    return tabId;
  }



  public isArcid(arcid: string, fichierSourceLpln: string): boolean {
    console.log("Classe ParseurLPLN Fonction isArcid");

    let result: boolean = false;
    let fichierSource = fichierSourceLpln;

    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /(.*)(NUMERO PLN: )(.*)(INDICATIF: )(.*)(NOM SL: AIX)(.*)/;
    let plnid = 0;
    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      var mylogCpdlc = this.readLine.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match(motif);
      let info2Lpln = mylogCpdlc.match(arcid);

      if ((info1Lpln !== null) && (info2Lpln !== null)) {
        let arcidTrouve: string;
        arcidTrouve = mylogCpdlc.toString().replace(motif, "$5").trim();
        if (arcid == arcidTrouve) {
          result = true;
          break;
        }
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);

    return result;
  }

  public isPlnid(plnidSource: number, fichierSourceLpln: string): boolean {
    console.log("Classe ParseurLPLN Fonction isPlnid");
    console.log("plnidSource:", plnidSource);

    let plnid = Math.round(plnidSource);
    console.log("plnid:", plnid);
    let result: boolean = false;
    let fichierSource = fichierSourceLpln;

    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /(.*)(NUMERO PLN: )(.*)(INDICATIF: )(.*)(NOM SL: AIX)(.*)/;
    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      var mylogCpdlc = this.readLine.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match(motif);
      let info2Lpln = mylogCpdlc.match(plnid);
      if ((info1Lpln !== null) && (info2Lpln !== null)) {

        let plnidTrouve: number;
        plnidTrouve = mylogCpdlc.toString().replace(motif, "$3").trim();
        console.log("plnidTrouve", plnidTrouve);

        if (plnid == plnidTrouve) {
          result = true;
          break;
        }
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);

    return result;
  }
}




