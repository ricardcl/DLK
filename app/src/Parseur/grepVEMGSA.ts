const fs = require('fs');
const p = require('path');
let readline = require("../scripts/node-readline/node-readline");


import { Dates, datesFile, arrayDatesFile } from './date';


export class GrepVEMGSA {
  private userPath: string;
  private dates: Dates;
  private uneMinute: number;
  private diffMax: number;

  constructor(userPath: string) {
    this.userPath = userPath;
    this.dates = new Dates();
    this.uneMinute = 60000;
    this.diffMax = 10 * this.uneMinute;
  }

  public getUserPath(): string {
    return this.userPath;
  }

  /*
OBJECTIF DE CETTE FONCTION :
Lire le contenu d un fichier VEMGSA donne en entree
recuperer uniquement les informations relatives a un PLNID et un ARCID donne
copier le resultat dans un fichier texte en enlevant les caracteres speciaux et verifiant que le format est correct
*/
  public grepLog(arcid: string, plnid: number, fichierSourceVemgsa: string[], horaire?: string): void {
    console.log("Je rentre dans grepLog de grepVEMGSA");
    console.log("arcid: ", arcid);
    console.log("plnid: ", plnid);
    console.log("fichierSourceVemgsa: ", fichierSourceVemgsa);
    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let w = fs.openSync(fichierDestination, "w");
    let reqid: number = 0;
    let motifPlnid: string;

    for (let fichier of fichierSourceVemgsa) {
      console.log("fichier : ", fichier);
      let fichierSource = fichier;
      let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
      let motif = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
      console.log("motifPlnid: ", motifPlnid);
      if (plnid < 1000) {
        motifPlnid = "-PLNID " + "0" + plnid;
      }
      else {
        motifPlnid = "-PLNID " + plnid;
      }

      let motifArcid = "-ARCID " + arcid;
      if (r === false) {
        console.log("Error, can't open ", fichierSource);
        process.exit(1);
      }
      else {
        if (plnid == 0) {
          reqid = this.grepReqidFromArcid(arcid, fichier);
          console.log("-----------------> reqid ", reqid);
        }
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

                if ((plnid == 0) && (reqid !== 0) && (mylogCpdlc.toString().match("-REQID ") !== null) && (mylogCpdlc.toString().match(reqid) !== null)) {
                  let motifREQID = /(.*)(CPCASRES)(.*)(-REQID)(.*)/;
                  let reqidTrouve = mylogCpdlc.toString().replace(motifREQID, "$5").trim();
                  let reqidTest = Number(String(reqidTrouve).substr(1));
                  console.log("-----------------> reqidTest ", reqidTest);
                  if (reqidTest == reqid) {
                    fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
                  }
                  else {
                    console.log("pas pareil: reqid", reqid, " reqidtset : ", reqidTest);

                  }

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

  public grepArcidFromPlnid(plnid: number, fichierSourceVemgsa: string, horaire?: datesFile): string {

    let fichierSource = fichierSourceVemgsa;
    //"../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let reqid = 0;
    let arcid = "";

    const uneMinute: number = 60000;
    const diffMax: number = 10 * uneMinute;

    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
    let motif1 = /(.*)(CPCASRES)(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-PLNID)(.*)/;
    let motif2 = /(.*)(CPCASRES)(.*)(-PLNID )(.*)(-REQID)(.*)/;
    console.log('horaire: ', horaire);


    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = readline.fgets(r);
        mylogCpdlc = mylogCpdlc.toString();
        if (mylogCpdlc === false) { break; }

        if ((horaire == undefined) || ((horaire != undefined) && (this.dates.isInCreneauxVemgsa(horaire, mylogCpdlc, diffMax) == true))) {

          if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif1) !== null) && (mylogCpdlc.match(plnid) !== null)) {
            mylogCpdlc = mylogCpdlc.match(motifVemgsa);
            let plnidTrouve: number;
            plnidTrouve = mylogCpdlc.toString().replace(motif1, "$9").trim();
            if (Number(plnid) == Number(plnidTrouve)) {
              arcid = mylogCpdlc.toString().replace(motif1, "$5").trim();
              break;
            }
          }

          else if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif2) !== null) && (mylogCpdlc.match(plnid) !== null)) {
            mylogCpdlc = mylogCpdlc.match(motifVemgsa);
            let plnidTrouve: number;
            plnidTrouve = mylogCpdlc.toString().replace(motif2, "$5").trim();
            if (Number(plnid) == Number(plnidTrouve)) {
              reqid = mylogCpdlc.toString().replace(motif2, "$7").trim();
              reqid = Number(String(reqid).substr(1));
              console.log("reqid trouve: ", reqid);

              arcid = this.grepArcidFromReqid(reqid, fichierSourceVemgsa, horaire);
              break;
            }
          }
        }


      } while (!readline.eof(r));
    }
    readline.fclose(r);
    return arcid;
  }

  private grepArcidFromReqid(reqid: number, fichierSourceVemgsa: string, horaire?: datesFile): string {
    let fichierSource = fichierSourceVemgsa;
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let arcid = "";
    let reqidTest = 0
    const uneMinute: number = 60000;
    const diffMax: number = 60 * uneMinute;

    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
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

        if ((horaire == undefined) || ((horaire != undefined) && (this.dates.isInCreneauxVemgsa(horaire, mylogCpdlc, diffMax) == true))) {

          if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(reqid) !== null) && (mylogCpdlc.match(motif1) !== null)) {
            mylogCpdlc = mylogCpdlc.match(motifVemgsa);

            reqidTest = mylogCpdlc.toString().replace(motif1, "$9").trim();
            if (reqidTest == reqid) {
              arcid = mylogCpdlc.toString().replace(motif1, "$3").trim();
              break;
            }

          }
          else if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(reqid) !== null) && (mylogCpdlc.match(motif2) !== null)) {

            mylogCpdlc = mylogCpdlc.match(motifVemgsa);

            reqidTest = mylogCpdlc.toString().replace(motif2, "$7").trim();
            if (reqidTest == reqid) {
              arcid = mylogCpdlc.toString().replace(motif2, "$3").trim();
              break;
            }

          }
        }
      } while (!readline.eof(r));
    }

    readline.fclose(r);
    return arcid;


  }



  public grepPlnidFromArcid(arcid: string, fichierSourceVemgsa: string, horaire?: datesFile): number {
    let fichierSource = fichierSourceVemgsa;
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let reqid = 0;
    let plnid = 0;

    const uneMinute: number = 60000;
    const diffMax: number = 60 * uneMinute;

    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
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
          console.log("infolpln 1 :" + infoLpln1);
          console.log("horaire:", horaire);
          console.log("test :", horaire == undefined);
          if ((horaire == undefined) || ((horaire != undefined) && (this.dates.isInCreneauxVemgsaHoraire(horaire, mylogCpdlc, diffMax) == true))) {
            console.log("test1");

            //CAS 1 : arcid envoye en meme temps que le reqId dans le CPCASREQ
            // on en deduit le reqid
            if (mylogCpdlc.match("CPCASREQ") !== null) {
              reqid = infoLpln1.toString().replace(motifCPCASREQ, "$5").trim();
              console.log("cas 1");
              console.log("reqid : " + reqid);
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

  public grepReqidFromArcid(arcid: string, fichierSourceVemgsa: string, horaire?: datesFile): number {
    let fichierSource = fichierSourceVemgsa;
    let reqid = 0;

    const uneMinute: number = 60000;
    const diffMax: number = 60 * uneMinute;

    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;


    let motifCPCASREQ = /(.*)(CPCASREQ)(.*)(-REQID)(.*)/;
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
          console.log("infolpln 1 :" + infoLpln1);
          console.log("horaire:", horaire);
          console.log("test :", horaire == undefined);
          if ((horaire == undefined) || ((horaire != undefined) && (this.dates.isInCreneauxVemgsa(horaire, mylogCpdlc, diffMax) == true))) {
            console.log("test1");

            //CAS 1 : arcid envoye en meme temps que le reqId dans le CPCASREQ
            // on en deduit le reqid
            if (mylogCpdlc.match("CPCASREQ") !== null) {
              reqid = infoLpln1.toString().replace(motifCPCASREQ, "$5").trim();
              break;
            }
          }
        }
      } while (!readline.eof(r));
    }

    readline.fclose(r);
    return reqid;


  }

  public grepPlagesHorairesFichiers(fichierSourceVemgsa: string[]): datesFile {

    let creneau = <datesFile>{};
    creneau.dateMin = "";
    creneau.dateMax = "";

    let creneauTemp = <datesFile>{};
    for (let fichier of fichierSourceVemgsa) {

      creneauTemp = this.grepPlageHoraireFichier(fichier);



      if ((creneau.dateMin == "") || (this.dates.isDateSup(creneau.dateMin, creneauTemp.dateMin))) {
        creneau.dateMin = creneauTemp.dateMin;

      }

      if ((creneau.dateMax == "") || (this.dates.isDateSup(creneauTemp.dateMax, creneau.dateMax))) {
        creneau.dateMax = creneauTemp.dateMax;
      }


    }
    return creneau;
  }

  private grepPlageHoraireFichier(fichierSourceVemgsa: string): datesFile {

    let fichierSource = fichierSourceVemgsa;
    let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

    //26/09/2018 07H54'11" -TITLE CPCCLOSLNK-PLNID 7466  	,
    //  let motif2 = /(\d\d)(\/)(\d\d)(\/)(\d\d\d\d )(\d\d)(H)(\d\d)(')(\d\d)(.*)/;
    let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
    let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;

    let creneau = <datesFile>{};


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

  /* Fonction qui prend en entrée deux fichiers Vemgsa et renvoie les deux fichiers en les classant par date 
  en s'appuyant sur les dates du premier et du dernier log contenu dans le fichier*/
  public orderVemgsa(list: string[]): string[] {

    let datesFichier1: datesFile;
    let datesFichier2: datesFile;
    datesFichier1 = this.grepPlageHoraireFichier(list[0]);
    datesFichier2 = this.grepPlageHoraireFichier(list[1]);
    console.log("datesFichier1: ", datesFichier1);
    console.log("datesFichier2: ", datesFichier2);
    if (this.dates.isDateSup(datesFichier1.dateMin, datesFichier2.dateMin)) {
      console.log("ordre fichiers: ", list[1], list[0]);

      return [list[1], list[0]];
    }
    else {
      console.log("ordre fichiers: ", list[0], list[1]);
      return list;
    }
  }





  public isPlnidAndPlageHoraire(plnid: number, fichierSourceVemgsa: string[], horaire?: datesFile): arrayDatesFile {
    let result = <arrayDatesFile>{};
    result.dates = new Array;
    result.existe = false;

    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
    let motifPlnid: string;
    let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
    let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;

    console.log("motifPlnid: ", motifPlnid);
    if (plnid < 1000) {
      motifPlnid = "-PLNID " + "0" + plnid;
    }
    else {
      motifPlnid = "-PLNID " + plnid;
    }


    for (let fichier of fichierSourceVemgsa) {
      let fichierSource = fichier;
      let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");

      if (r === false) {
        console.log("Error, can't open ", fichierSource);
        process.exit(1);
      }
      else {
        do {
          let mylogCpdlc = readline.fgets(r);
          if (mylogCpdlc === false) { break; }

          if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motifPlnid) !== null)) {
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

                if ((horaire !== undefined) && (this.dates.isInCreneauxVemgsaHoraire(horaire, dateToStore, this.diffMax) == true)) {
                  console.log("---------------->dateToStore horaire", horaire);
                  console.log("---------------->dateToStore horaire.dateMin", horaire.dateMin);
                  console.log("---------------->dateToStore horaire.dateMax", horaire.dateMax);
                  result.dates.push(dateToStore);
                }
                if (horaire == undefined) {
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



  public isArcidAndPlageHoraire(arcid: string, fichierSourceVemgsa: string[], horaire?: datesFile): arrayDatesFile {


    let result = <arrayDatesFile>{};
    result.dates = new Array;
    result.existe = false;

    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
    let motifArcid1 = /(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-ATNLOGON)(.*)/;
    let motifArcid2 = /(.*)(-ARCID )(.*)(-ATNLOGON)(.*)/;


    let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
    let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;

    for (let fichier of fichierSourceVemgsa) {
      let fichierSource = fichier;
      let r = readline.fopen(p.resolve(this.userPath, fichierSource), "r");

      if (r === false) {
        console.log("Error, can't open ", fichierSource);
        process.exit(1);
      }
      else {
        do {
          let mylogCpdlc = readline.fgets(r);
          if (mylogCpdlc === false) { break; }

          if ((mylogCpdlc.match(motifVemgsa) !== null) && ((mylogCpdlc.match(arcid) !== null))) {

            let arcidTrouve: string = "";

            if (mylogCpdlc.match(motifArcid1) !== null) {

              mylogCpdlc = mylogCpdlc.match(motifVemgsa);
              arcidTrouve = mylogCpdlc.toString().replace(motifArcid1, "$3").trim();
            }
            else if (mylogCpdlc.match(motifArcid2) !== null) {
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
                  console.log("---------------->dateToStore ", dateToStore);
                  //TODO gerer le creneau horaire


                  if ((horaire !== undefined) && (this.dates.isInCreneauxVemgsaHoraire(horaire, dateToStore, this.diffMax) == true)) {
                    console.log("---------------->dateToStore horaire", horaire);
                    console.log("---------------->dateToStore horaire.dateMin", horaire.dateMin);
                    console.log("---------------->dateToStore horaire.dateMax", horaire.dateMax);
                    result.dates.push(dateToStore);
                  }
                  if (horaire == undefined) {
                    result.dates.push(dateToStore);
                  }

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


}

