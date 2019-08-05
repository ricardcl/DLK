/*
OBJECTIF DE CETTE FONCTION :
Lire le contenu d un fichier LPLN donne en entree
recuperer uniquement les informations relatives a un PLNID
copier le resultat dans un fichier texte
*/

const fs = require('fs');
let readline = require("../scripts/node-readline/node-readline");
const p = require('path');
//console.log('path: '+path);

//console.log("path.outputPath: "+path.outputPath);

export class GrepLPLN {
  private userPath : string;

  constructor (userPath : string) {
    this.userPath = userPath;
  }

  public getUserPath () : string {
    return this.userPath;
  }
  
  public grepLogLPLN(arcid: string, plnid: number, fichierSourceLpln: string): void {
    let fichierDestination = p.resolve(this.userPath, "resultLPLN.htm");
    let fichierSource = fichierSourceLpln;
    //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
    let w = fs.openSync(fichierDestination, "w");

    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      let mylogCpdlc = readline.fgets(r);
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
          mylogCpdlc = readline.fgets(r);
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

              mylogCpdlc = readline.fgets(r);
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
              mylogCpdlc = readline.fgets(r);
              if (mylogCpdlc === false) { break; }

              let info3Lpln = mylogCpdlc.match(/RECEPTION MSG CPC|ENVOI MSG CPC|TRFDL|FPCRD   EVT TRFSEC|TRARTV|VTR  SECTEUR|EVENEMENT DATE: FIN VOL|FPCLOSE EVT END/);
              if (info3Lpln !== null) {
                fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
                //console.log(mylogCpdlc);
              }
            } while ((mylogCpdlc.match("Separateur d'impression") == null) && (mylogCpdlc.match("FIN DES DEPOUILLEMENTS") == null)
              && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null)));
          }


        } while ((mylogCpdlc.match("Separateur d'impression") == null) && ((mylogCpdlc.match("NOM SL:") == null) || (mylogCpdlc.match("AIX") !== null)));
      }

    } while (!readline.eof(r));
    readline.fclose(r);
    fs.closeSync(w);
  }




  public grepArcidFromPlnid(plnid: number, fichierSourceLpln: string): string {
    let fichierSource = fichierSourceLpln;
    //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
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
      var mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match(motif);
      let info2Lpln = mylogCpdlc.match(Math.round(plnid));
      if ((info1Lpln !== null) && (info2Lpln !== null)) {
        arcid = mylogCpdlc.toString().replace(motif, "$5").trim();

        break;
      }

    } while (!readline.eof(r));
    readline.fclose(r);

    return arcid;
  }


  public grepPlnidFromArcid(arcid: string, fichierSourceLpln: string): number {
    let fichierSource = fichierSourceLpln;
    //let fichierSource = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
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
      var mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break; }
      //Test du début des logs concernant le vol dans le SL AIX
      let info1Lpln = mylogCpdlc.match(motif);
      let info2Lpln = mylogCpdlc.match(arcid);
      if ((info1Lpln !== null) && (info2Lpln !== null)) {
        plnid = mylogCpdlc.toString().replace(motif, "$3").trim();
        break;
      }

    } while (!readline.eof(r));
    readline.fclose(r);

    return plnid;
  }


  public isArcid(arcid: string, fichierSourceLpln: string): boolean {
    let result: boolean = false;
    let fichierSource = fichierSourceLpln;

    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
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
      var mylogCpdlc = readline.fgets(r);
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

    } while (!readline.eof(r));
    readline.fclose(r);

    return result;
  }

  public isPlnid(plnidSource: number, fichierSourceLpln: string): boolean {
    console.log("plnidSource:", plnidSource);

    let plnid = Math.round(plnidSource);
    console.log("plnid:", plnid);
    let result: boolean = false;
    let fichierSource = fichierSourceLpln;

    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /(.*)(NUMERO PLN: )(.*)(INDICATIF: )(.*)(NOM SL: AIX)(.*)/;
    //Test de l'ouverture du fichier
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    //Traitement du fichier
    do {
      //Test de la fin de fichier
      var mylogCpdlc = readline.fgets(r);
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

    } while (!readline.eof(r));
    readline.fclose(r);

    return result;
  }
}




