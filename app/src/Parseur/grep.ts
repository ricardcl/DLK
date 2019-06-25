


const fs = require('fs');
import { path } from '../main';
import * as moment from 'moment';

const p = require('path');
let readline = require("../scripts/node-readline/node-readline");

import { split } from './split';
import * as dates from './date';
let fsplit = new split();


/*
OBJECTIF DE CETTE FONCTION :
Lire le contenu d un fichier VEMGSA donne en entree
recuperer uniquement les informations relatives a un PLNID et un ARCID donne
copier le resultat dans un fichier texte en enlevant les caracteres speciaux et verifiant que le format est correct
*/
export function grepLog(arcid: string, plnid: number, fichierSourceVemgsa: string[], horaire?: string): void {

  let fichierDestination = p.resolve(path.outputPath, "result.htm");
  let w = fs.openSync(fichierDestination, "w");

  for (let fichier of fichierSourceVemgsa) {
    let fichierSource = fichier;

    let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");



    /* regex a utiliser pour enlever les caracteres speciaux
    en utilisant mylogCpdlc = mylogCpdlc.replace(regex);*/
    //let regex = /|||||||�|@|.||%|\(|\)|,|ZZZZ|]\|þ|Ô|Ç|â|Á|||[a-z]/g;

    /* regex a utiliser pour ne garder que les caracteres autorises
    en utilisant mylogCpdlc = mylogCpdlc.match(regex1);*/
    //let regex1 = /[^A-Z0-9-/'"]/g;


    /*format attendu d un fichier  VEMGSA
    avec /\d\d\/\d\d\d\d\/\d\d = motif de la date
    et \s = espace
    */

    let motif = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;


    let motifPlnid = "-PLNID " + plnid;
    let motifArcid = "-ARCID " + arcid;


    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = readline.fgets(r);
        //mylogCpdlc=mylogCpdlc.toString();
        if (mylogCpdlc === false) { break; }

        if (mylogCpdlc.match(motif) !== null) {
          mylogCpdlc = mylogCpdlc.match(motif);

          if (!horaire) {
            if ((mylogCpdlc.toString().match(motifPlnid) !== null) && (plnid !== 0)) {
              fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
            }
            else { //Cas ou la meme ligne contient l'arcid et le plnid, on copie la ligne une seule fois
              if ((mylogCpdlc.toString().match(motifArcid) !== null) && (arcid !== "")) {
                fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
              }
            }

          }
          else {
            //TODO cas ou un horaire de recherche est defini
          }

        }

      } while (!readline.eof(r));

    }


    readline.fclose(r);


  }
  fs.closeSync(w);
}


export function grepArcidFromPlnid(plnid: number, fichierSourceVemgsa: string, horaire?: dates.datesFile): string {

  let fichierSource = fichierSourceVemgsa;
  //"../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  let fichierDestination = p.resolve(path.outputPath, "result.htm");
  let reqid = 0;
  let arcid = "";

  const uneMinute: number = 60000;
  const diffMax: number = 10 * uneMinute;

  let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");
  let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
  let motif1 = /(.*)(CPCASRES)(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-PLNID)(.*)/;
  let motif2 = /(.*)(CPCASRES)(.*)(-PLNID )(.*)(-REQID)(.*)/;
  console.log('horaire: ',horaire);
  

  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      mylogCpdlc = mylogCpdlc.toString();
      if (mylogCpdlc === false) { break; }

      if ((horaire == undefined) || ((horaire != undefined) && (dates.isInCreneauxVemgsa(horaire, mylogCpdlc, diffMax) == true))) {
        
        if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif1) !== null) && (mylogCpdlc.match(plnid) !== null)) {
          mylogCpdlc = mylogCpdlc.match(motifVemgsa);
          let plnidTrouve: number;
          plnidTrouve = mylogCpdlc.toString().replace(motif1, "$9").trim();
          if (plnid == plnidTrouve) {
            arcid = mylogCpdlc.toString().replace(motif1, "$5").trim();
            break;
          }
        }

        else if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif2) !== null) && (mylogCpdlc.match(plnid) !== null)) {
          mylogCpdlc = mylogCpdlc.match(motifVemgsa);
          let plnidTrouve: number;
          plnidTrouve = mylogCpdlc.toString().replace(motif2, "$5").trim();
          if (plnid == plnidTrouve) {
            reqid = mylogCpdlc.toString().replace(motif2, "$7").trim();
            reqid = Number(String(reqid).substr(1));
            arcid = grepArcidFromReqid(reqid, fichierSourceVemgsa, horaire);
            break;
          }
        }
      }


    } while (!readline.eof(r));
  }
  //console.log("plnid : "+plnid);
  //console.log("reqid : "+reqid);
  //console.log("arcid : "+arcid);
  readline.fclose(r);
  return arcid;


}


export function grepArcidFromReqid(reqid: number, fichierSourceVemgsa: string, horaire?: dates.datesFile): string {
  let fichierSource = fichierSourceVemgsa;
  //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  let fichierDestination = p.resolve(path.outputPath, "result.htm");
  let arcid = "";

  const uneMinute: number = 60000;
  const diffMax: number = 60 * uneMinute;

  //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
  let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");
  let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

  let motif1 = /(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-ATNLOGON)(.*)(-REQID)(.*)/;
  let motif2 = /(.*)(-ARCID )(.*)(-ATNLOGON)(.*)(-REQID)(.*)/;


  
  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      mylogCpdlc = mylogCpdlc.toString();
      if (mylogCpdlc === false) { break; }

      if ((horaire == undefined) || ((horaire != undefined) && (dates.isInCreneauxVemgsa(horaire, mylogCpdlc, diffMax) == true))) {

        if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(reqid) !== null)  && (mylogCpdlc.match(motif1) !== null)) {
          mylogCpdlc = mylogCpdlc.match(motifVemgsa);
          arcid = mylogCpdlc.toString().replace(motif1, "$3").trim();
          break;
        }
        else if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(reqid) !== null)  && (mylogCpdlc.match(motif2) !== null)) {
          mylogCpdlc = mylogCpdlc.match(motifVemgsa);
          arcid = mylogCpdlc.toString().replace(motif2, "$3").trim();
          break;
        }
      }
    } while (!readline.eof(r));
  }

  readline.fclose(r);
  return arcid;


}



export function grepPlnidFromArcid(arcid: string, fichierSourceVemgsa: string, horaire?: dates.datesFile): number {
  let fichierSource = fichierSourceVemgsa;
  //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  let fichierDestination = p.resolve(path.outputPath, "result.htm");
  let reqid = 0;
  let plnid = 0;

  const uneMinute: number = 60000;
  const diffMax: number = 60 * uneMinute;

  let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");
  let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;


  let motifCPCASREQ = /(.*)(CPCASREQ)(.*)(-REQID)(.*)/;
  let motifCPCASRES = /(.*)(CPCASRES)(.*)(-PLNID)(.*)/;
  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break; }

      let infoLpln1 = mylogCpdlc.match(motifVemgsa);
      let infoLpln2 = mylogCpdlc.match(arcid);
      if ((infoLpln1 !== null) && (infoLpln2 !== null)) {
        console.log("infolpln 1 :"+infoLpln1);
        console.log("horaire:",horaire);
        console.log("test :",horaire == undefined);
        if ((horaire == undefined) || ((horaire != undefined) && (dates.isInCreneauxVemgsa(horaire, mylogCpdlc, diffMax) == true))) {
          console.log("test1");
          
          //CAS 1 : arcid envoye en meme temps que le reqId dans le CPCASREQ
          // on en deduit le reqid
          if (mylogCpdlc.match("CPCASREQ") !== null) {
            reqid = infoLpln1.toString().replace(motifCPCASREQ, "$5").trim();
            console.log("cas 1");
            console.log("reqid : " + reqid);
            //reqid = "".concat("0", String(reqid));
            //console.log("reqid : "+reqid);

            do {
              mylogCpdlc = readline.fgets(r);
              mylogCpdlc = mylogCpdlc.toString();
              if ((mylogCpdlc.match("REQID") !== null) && (mylogCpdlc.match(reqid) !== null) && (mylogCpdlc.match("PLNID") !== null)) {
                console.log("cas 1A");
                infoLpln1 = mylogCpdlc.match(motifVemgsa);
                //CAS 1A :  reqid et plnid en info  ex : GMI39SL PLNID 7893-REQID 01099
                let motif = /(.*)(-PLNID)(.*)(-REQID)(.*)/;
                reqid = infoLpln1.toString().replace(motif, "$5").trim();
                plnid = infoLpln1.toString().replace(motif, "$3").trim();
                //console.log("plnid : "+plnid);
                //console.log("reqid : "+reqid);
                break;
              }
              if ((mylogCpdlc.match("REQID") !== null) && (mylogCpdlc.match(reqid) !== null) && (mylogCpdlc.match("PLNID") == null)) {
                console.log("cas 1B");
                infoLpln1 = mylogCpdlc.match(motifVemgsa);
                //CAS 1B: que le reqid comme information  ex : EZY928J
                let motif = /(.*)(-REQID)(.*)/;
                reqid = infoLpln1.toString().replace("$5").trim();
                //console.log("reqid : "+reqid);
                break;
              }

            } while (!readline.eof(r));

            break;
          }
          //CAS 2 : arcid envoye en meme temps que le plnid dans le CPCASRES (ex AFR6006)
          // on en deduit le reqid
          else {
            console.log("cas 2");
            plnid = infoLpln1.toString().replace(motifCPCASRES, "$5").trim();
            //console.log("plnid : "+plnid);
            break;
          }
        }


      }


    } while (!readline.eof(r));
  }

  readline.fclose(r);


  return plnid;


}


export function grepPlageHoraireFichier(fichierSourceVemgsa: string): dates.datesFile {

  let fichierSource = fichierSourceVemgsa;
  let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");
  let motif = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

  //26/09/2018 07H54'11" -TITLE CPCCLOSLNK-PLNID 7466  	,
  //  let motif2 = /(\d\d)(\/)(\d\d)(\/)(\d\d\d\d )(\d\d)(H)(\d\d)(')(\d\d)(.*)/;
  let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
  let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;

  let creneau = <dates.datesFile>{};


  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break; }

      if (mylogCpdlc.match(motif) !== null) {
        mylogCpdlc = mylogCpdlc.match(motif);

        if (mylogCpdlc.toString().match(motifDate) !== null) {

          let date = mylogCpdlc.toString().replace(motifDate, "$1");
          //  console.log("date: ",date);
          if (date.match(motifDateHeure) !== null) {
            const jour = date.toString().replace(motifDateHeure, "$1");
            const heure = date.toString().replace(motifDateHeure, "$3");
            const minutes = date.toString().replace(motifDateHeure, "$5");
            const secondes = date.toString().replace(motifDateHeure, "$7");
            const dateToStore = jour + " " + heure + " " + minutes + " " + secondes;
            if (creneau.dateMin == undefined) {
              creneau.dateMin = dateToStore;
            }
            creneau.dateMax = dateToStore;
          }
        }
      }
    } while (!readline.eof(r));
    readline.fclose(r);

  }


  return creneau;
}









export function grepDifferentsLogsVemgsaTrouvesAvecLePlnid(fichierSourceVemgsa: string[], plnid: number): number {

  let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
  let motifPlnid1 = /(.*)(CPCASRES)(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-PLNID)(.*)/;
  let motifPlnid2 = /(.*)(CPCASRES)(.*)(-PLNID )(.*)(-REQID)(.*)/;


  let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
  //26/09/2018 07H54'11" -TITLE CPCCLOSLNK-PLNID 7466  	,
  //  let motif2 = /(\d\d)(\/)(\d\d)(\/)(\d\d\d\d )(\d\d)(H)(\d\d)(')(\d\d)(.*)/;
  let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;



  let arrayHeuresTrouvees: string[] = new Array;

  for (let fichier of fichierSourceVemgsa) {
    let fichierSource = fichier;
    let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");


    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = readline.fgets(r);
        if (mylogCpdlc === false) { break; }

        if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(plnid) !== null) && ((mylogCpdlc.match(motifPlnid1) !== null) || (mylogCpdlc.match(motifPlnid2) !== null))) {
          mylogCpdlc = mylogCpdlc.match(motifVemgsa);

          if (mylogCpdlc.toString().match(motifDate) !== null) {
            let date = mylogCpdlc.toString().replace(motifDate, "$1");
            //  console.log("date a: ",date);

            if (date.match(motifDateHeure) !== null) {
              const jour = date.toString().replace(motifDateHeure, "$1");
              const heure = date.toString().replace(motifDateHeure, "$3");
              const minutes = date.toString().replace(motifDateHeure, "$5");
              const secondes = date.toString().replace(motifDateHeure, "$7");
              const dateToStore = jour + " " + heure + " " + minutes + " " + secondes;
              arrayHeuresTrouvees.push(dateToStore);
            }
          }
        }
      } while (!readline.eof(r));
    }
    readline.fclose(r);
  }
  arrayHeuresTrouvees.forEach(element => { console.log(element); });
  return 3;
}





/* Fonction qui prend en entrée deux fichiers Vemgsa et renvoie les deux fichiers en les classant par date 
en s'appuyant sur les dates du premier et du dernier log contenu dans le fichier*/
export function orderVemgsa(list: string[]): string[] {

  let datesFichier1: dates.datesFile;
  let datesFichier2: dates.datesFile;
  datesFichier1 = grepPlageHoraireFichier(list[0]);
  datesFichier2 = grepPlageHoraireFichier(list[1]);
  console.log("datesFichier1: ", datesFichier1);
  console.log("datesFichier2: ", datesFichier2);
  if (dates.isDateSup(datesFichier1.dateMin, datesFichier2.dateMin)) {
    console.log("ordre fichiers: ", list[1], list[0]);

    return [list[1], list[0]];
  }
  else {
    console.log("ordre fichiers: ", list[0], list[1]);
    return list;
  }
}




export function isPlnidAndPlageHoraire(plnid: number, fichierSourceVemgsa: string[]): dates.arrayDatesFile {

  let result = <dates.arrayDatesFile>{};
  result.dates = new Array;
  result.existe = false;

  let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
  let motifPlnid = "-PLNID " + plnid;
  let regexPlnid = /\d\d\d\d/;
  let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
  let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;

  for (let fichier of fichierSourceVemgsa) {
    let fichierSource = fichier;
    let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");

    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = readline.fgets(r);
        if (mylogCpdlc === false) { break; }

        if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motifPlnid) !== null) && (plnid.toString().match(regexPlnid))) {
          mylogCpdlc = mylogCpdlc.match(motifVemgsa);
          result.existe = true;

          if (mylogCpdlc.toString().match(motifDate) !== null) {
            let date = mylogCpdlc.toString().replace(motifDate, "$1");
            //  console.log("date a: ",date);

            if (date.match(motifDateHeure) !== null) {
              const jour = date.toString().replace(motifDateHeure, "$1");
              const heure = date.toString().replace(motifDateHeure, "$3");
              const minutes = date.toString().replace(motifDateHeure, "$5");
              const secondes = date.toString().replace(motifDateHeure, "$7");
              const dateToStore = jour + " " + heure + " " + minutes + " " + secondes;
              result.dates.push(dateToStore);
            }
          }
        }
      } while (!readline.eof(r));
    }
    readline.fclose(r);
  }
  result.dates.forEach(element => { console.log(element); });
  return result;
}



export function isArcidAndPlageHoraire(arcid: string, fichierSourceVemgsa: string[]): dates.arrayDatesFile {


  let result = <dates.arrayDatesFile>{};
  result.dates = new Array;
  result.existe = false;

  let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
  let motifArcid1 = /(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-ATNLOGON)(.*)/;
  let motifArcid2 = /(.*)(-ARCID )(.*)(-ATNLOGON)(.*)/;


  let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
  let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;

  for (let fichier of fichierSourceVemgsa) {
    let fichierSource = fichier;
    let r = readline.fopen(p.resolve(path.userPath, fichierSource), "r");

    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = readline.fgets(r);
        if (mylogCpdlc === false) { break; }

        if ((mylogCpdlc.match(motifVemgsa) !== null) && ((mylogCpdlc.match(arcid) !== null))) {
          
          let arcidTrouve: string="";      
          
          if (mylogCpdlc.match(motifArcid1) !== null){
            
            mylogCpdlc = mylogCpdlc.match(motifVemgsa);
            arcidTrouve = mylogCpdlc.toString().replace(motifArcid1, "$3").trim();
          }
          else if (mylogCpdlc.match(motifArcid2) !== null){
            mylogCpdlc = mylogCpdlc.match(motifVemgsa);
            arcidTrouve = mylogCpdlc.toString().replace(motifArcid2, "$3").trim();
          }

          if (arcid == arcidTrouve) {
            result.existe = true;

            if (mylogCpdlc.toString().match(motifDate) !== null) {
              let date = mylogCpdlc.toString().replace(motifDate, "$1");
              //  console.log("date a: ",date);

              if (date.match(motifDateHeure) !== null) {
                const jour = date.toString().replace(motifDateHeure, "$1");
                const heure = date.toString().replace(motifDateHeure, "$3");
                const minutes = date.toString().replace(motifDateHeure, "$5");
                const secondes = date.toString().replace(motifDateHeure, "$7");
                const dateToStore = jour + " " + heure + " " + minutes + " " + secondes;
                result.dates.push(dateToStore);
              }
            }

          }


        }
      } while (!readline.eof(r));
    }
    readline.fclose(r);
  }
  result.dates.forEach(element => { console.log(element); });
  return result;
}
//grepPlageHoraireFichier("../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742");



