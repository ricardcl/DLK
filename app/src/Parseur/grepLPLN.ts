import { Identifiants } from "../Modele/identifiants";
import {  Split } from './split';
import { ReadLine } from "../scripts/node-readline/node-readline";
const fs = require('fs');
const p = require('path');


/**
 * Classe regroupant les fonctions qui accedent directement au fichier LPLN en lecture
 * Soit pour récuperer des infos ponctuelles ( lors du check ini comme l'arcid ou le plnid)
 * soit pour recuperer l'ensemble des logs a stocker dans un fichier destination
 */
export class GrepLPLN {
  private userPath: string;
  private split: Split;
  private readLine: ReadLine;

  constructor(userPath: string) {
    console.log("Je rentre dans le constructor GrepLPLN ");

    this.userPath = userPath;
    this.split = new Split ();
    this.readLine = new ReadLine();
  }


  public getUserPath(): string {
    return this.userPath;
  }

  public grepLogLPLN(arcid: string, plnid: number, fichierSourceLpln: string): void {
    console.log("Classe grepLpln Fonction grepLogLPLN", "plnid",plnid,"arcid",arcid);

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

              let info3Lpln = mylogCpdlc.match(/RECEPTION MSG CPC|ENVOI MSG CPC|TRFDL|FPCRD   EVT TRFSEC|TRARTV|VTR  SECTEUR|EVENEMENT DATE: FIN VOL|FPCLOSE EVT END/);
              if (info3Lpln !== null) {
                fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
                //console.log(mylogCpdlc);
              }
            } while ((mylogCpdlc.match("Separateur d'impression") == null) && (mylogCpdlc.match("FIN DES DEPOUILLEMENTS") == null)
              && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null))&& ((mylogCpdlc.match("NUMERO PLN:") == null) || (mylogCpdlc.match("NUMERO PLN: " + plnid) !== null)));
          }


        } while ((mylogCpdlc.match("Separateur d'impression") == null) && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null))&& ((mylogCpdlc.match("NUMERO PLN:") == null) || (mylogCpdlc.match("NUMERO PLN: " + plnid) !== null)));
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);
    fs.closeSync(w);
  }




  public grepArcidFromPlnid(plnid: number, fichierSourceLpln: string): string {
    console.log("Classe grepLpln Fonction grepArcidFromPlnid");

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
    console.log("Classe grepLpln Fonction grepPlnidFromArcid");

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

  public grepPlnidAndArcid(fichierSource: string): Identifiants[] {
    console.log("Classe grepLpln Fonction grepPlnidAndArcid");


    let tabPlnid= [];
    let tabArcid= [];
    let tabId=[];

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
        arcidTemp = this.split.splitString( mylogCpdlc.toString().replace(motif, "$5").trim(), " ");       
        id.arcid = arcidTemp[0];
        id.plnid = mylogCpdlc.toString().replace(motif, "$3").trim();
        if (!(tabArcid.includes( id.arcid)) || !(tabPlnid.includes( id.plnid))) {
          
          tabArcid.push( id.arcid);
          tabPlnid.push( id.plnid);
          tabId.push(id)        
        }
      }

    } while (!this.readLine.eof(r));
    this.readLine.fclose(r);

    tabId.forEach(element => {
      console.log("tabId finale : ", element.arcid, " " , element.plnid); 
    });


    return tabId;
  }



  public isArcid(arcid: string, fichierSourceLpln: string): boolean {
    console.log("Classe grepLpln Fonction isArcid");

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
    console.log("Classe grepLpln Fonction isPlnid");
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




