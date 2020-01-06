import { Dates, creneauHoraire, arrayCreneauHoraire } from './date';
import { ReadLine } from '../scripts/node-readline/node-readline';
import { Split } from './split';
import moment = require('moment');
import { log } from 'util';
const fs = require('fs');
const p = require('path');

/**
 * Classe regroupant les fonctions qui accedent directement au fichier VEMGSA en lecture
 * Soit pour récuperer des infos ponctuelles ( lors du check ini comme l'arcid ou le plnid)
 * soit pour recuperer l'ensemble des logs a stocker dans un fichier destination
 */
export class GrepVEMGSA {
  private userPath: string;
  private dates: Dates;
  private uneMinute: number;
  private uneHeure: number;
  private troisHeures: number;
  private readLine: ReadLine;
  //private diffMax: number;

  constructor(userPath: string, dates: Dates) {
    console.log("Je rentre dans le constructor GrepVEMGSA ");

    this.userPath = userPath;
    this.dates = dates;
    this.uneMinute = 60000;
    //this.diffMax = 10 * this.uneMinute;
    this.uneHeure = 60 * this.uneMinute;
    this.troisHeures = 3 * this.uneHeure;
    this.readLine = new ReadLine();

  }

  public getUserPath(): string {
    return this.userPath;
  }


  /**
   * Fonction qui récupère l'ensemble des logs liés aux identifiants arcid, plnid  dans le fichier fichierSourceVemgsa, 
   * à condition qu'ils rentrent dans la plage horaire du creneau précisé en paramètre (plus ou moins trois heures)
   * Si le format d'un log est correct, il est copié dans un fichier "result.thm" sans les caracteres speciaux
   * @param arcid : arcid du vol("" si non trouvé) 
   * @param plnid : plnid du vol (0 si non trouvé) 
   * @param fichierSourceVemgsa : fichier(s) VEMGSA rentré par l'utilisateur  
   * @param creneau : creneau horaire de l'identifiant spécifié par l'utilisateur dans le fichier de log
   */
  public grepLog(arcid: string, plnid: number, fichierSourceVemgsa: string[], creneau: creneauHoraire): void {
    console.log("Classe grepVemgsa Fonction grepLog");


    console.log(" creneau", creneau);

    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let w = fs.openSync(fichierDestination, "w");
    let reqid: number = 0;
    let motifPlnid: string;

    for (let fichier of fichierSourceVemgsa) {
      console.log("fichier : ", fichier);
      let fichierSource = fichier;
      let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
      let motif = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

      if (plnid < 1000) {
        motifPlnid = "-PLNID " + "0" + plnid;
      }
      else {
        motifPlnid = "-PLNID " + plnid;
      }
      //console.log("motifPlnid: ", motifPlnid);
      let motifArcid = "-ARCID " + arcid;
      if (r === false) {
        console.log("Error, can't open ", fichierSource);
        process.exit(1);
      }
      else {
        if (plnid == 0) {


          reqid = this.grepReqidFromArcid(arcid, fichier, creneau);
          console.log("-----------------> reqid ", reqid);
        }
        do {
          let mylogCpdlc = this.readLine.fgets(r);
          if (mylogCpdlc === false) {
            break;
          }
          if (mylogCpdlc.match(motif) !== null) {
            //si les logs VEMGSA ont plus de trois heures que le creneau,  on sort du fichier
            if (this.dates.diffDateV(mylogCpdlc, creneau.dateMax, 180) == true) {
              break;
            }
            //on ne regarde que les logs à plus ou moins trois heures du creneau
            if (this.dates.isInCreneauxVemgsa(creneau, mylogCpdlc.toString(), this.troisHeures) == true) {
              mylogCpdlc = mylogCpdlc.match(motif);

              if ((mylogCpdlc.toString().match(motifPlnid) !== null) && (plnid !== 0)) {
                // console.log("grepLog : ", mylogCpdlc);
                fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
              }
              else { //Cas ou la meme ligne contient l'arcid et le plnid, on copie la ligne une seule fois
                if ((mylogCpdlc.toString().match(motifArcid) !== null) && (arcid !== "")) {
                  // console.log("grepLog : ", mylogCpdlc);
                  fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
                }

                if ((plnid == 0) && (reqid !== 0) && (mylogCpdlc.toString().match("-REQID ") !== null) && (mylogCpdlc.toString().match(reqid) !== null)) {
                  let motifREQID = /(.*)(CPCASRES)(.*)(-REQID)(.*)/;
                  let reqidTrouve = mylogCpdlc.toString().replace(motifREQID, "$5").trim();
                  let reqidTest = Number(String(reqidTrouve).substr(1));
                  // console.log("-----------------> reqidTest ", reqidTest);
                  if (reqidTest == reqid) {
                    console.log("grepLog : ", mylogCpdlc);
                    fs.writeSync(w, mylogCpdlc + "\n", null, 'utf8');
                  }
                  else {
                    console.log("pas pareil: reqid", reqid, " reqidtset : ", reqidTest);
                  }
                }
              }
            }

          }
        } while (!this.readLine.eof(r));

      }
      this.readLine.fclose(r);
    }
    fs.closeSync(w);
  }

  public grepArcidFromPlnid(plnid: number, fichierSourceVemgsa: string, creneau: creneauHoraire): string {
    console.log("Classe grepVemgsa Fonction grepArcidFromPlnid");

    let fichierSource = fichierSourceVemgsa;
    //"../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let reqid = 0;
    let arcid = "";


    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
    let motif1 = /(.*)(CPCASRES)(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-PLNID)(.*)/;
    let motif2 = /(.*)(CPCASRES)(.*)(-PLNID )(.*)(-REQID)(.*)/;


    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = this.readLine.fgets(r);
        mylogCpdlc = mylogCpdlc.toString();
        if (mylogCpdlc === false) { break; }

        //l'arcid est toujours present dans les logs vemgsa avant le plnid 
        //=> on ne cherche que dans la plage horaire avant le creneau des plnids donné en pramètre
        if (this.dates.diffDateVstrict(mylogCpdlc, creneau.dateMin, 0) == true) {
          break;
        }
        //l'arcid est present au maximum une heure avant le plnid 
        if (this.dates.diffDateV(mylogCpdlc, creneau.dateMin, -5) == true) {
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

              arcid = this.grepArcidFromReqid(reqid, fichierSourceVemgsa, creneau);
              break;
            }
          }
        }



      } while (!this.readLine.eof(r));
    }
    this.readLine.fclose(r);
    return arcid;
  }

  private grepArcidFromReqid(reqid: number, fichierSourceVemgsa: string, creneau: creneauHoraire): string {
    console.log("Classe grepVemgsa Fonction grepArcidFromReqid");

    let fichierSource = fichierSourceVemgsa;
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let arcid = "";
    let reqidTest = 0


    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

    let motif1 = /(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-ATNLOGON)(.*)(-REQID)(.*)/;
    let motif2 = /(.*)(-ARCID )(.*)(-ATNLOGON)(.*)(-REQID)(.*)/;


    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = this.readLine.fgets(r);
        mylogCpdlc = mylogCpdlc.toString();
        if (mylogCpdlc === false) { break; }


        //l'arcid est toujours present dans les logs vemgsa avant le plnid 
        //=> on ne cherche que dans la plage horaire avant le creneau des plnids donné en pramètre
        if (this.dates.diffDateVstrict(mylogCpdlc, creneau.dateMin, 0) == true) {
          break;
        }
        //l'arcid est present au maximum une heure avant le plnid 
        if (this.dates.diffDateV(mylogCpdlc, creneau.dateMin, -1) == true) {
          // if (this.dates.isInCreneauxVemgsa(creneau, mylogCpdlc, this.troisHeures) == true) {

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
      } while (!this.readLine.eof(r));

    }

    this.readLine.fclose(r);
    return arcid;


  }



  public grepPlnidFromArcid(arcid: string, fichierSourceVemgsa: string, creneau: creneauHoraire): number {
    console.log("Classe grepVemgsa Fonction grepPlnidFromArcid");

    let fichierSource = fichierSourceVemgsa;
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
    let fichierDestination = p.resolve(this.userPath, "result.htm");
    let reqid = 0;
    let plnid = 0;
    //console.log("--------------->grepPlnidFromArcid : ","fichier",fichierSourceVemgsa, "creneau ", creneau);

    //console.log("--------------->grepPlnidFromArcid :  arcid ", arcid);
    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;


    let motifCPCASREQ = /(.*)(CPCASREQ)(.*)(-REQID)(.*)/;
    let motifCPCASRES = /(.*)(CPCASRES)(.*)(-PLNID)(.*)/;
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = this.readLine.fgets(r);
        if (mylogCpdlc === false) { break; }
        //si les logs VEMGSA ont plus de trois heures que l'arcid,  on sort du fichier
        if (this.dates.diffDateV(mylogCpdlc, creneau.dateMax, 180) == true) {
          break;
        }
        //on ne regarde que les logs datés après la date de l'arcid précisée dane le creneau    
        if (this.dates.diffDateV(mylogCpdlc, creneau.dateMax, 0) == true) {
          //console.log("grepPlnidFromArcid test", mylogCpdlc);
          
          let infoLpln1 = mylogCpdlc.match(motifVemgsa);
          let infoLpln2 = mylogCpdlc.match(arcid);
          if ((infoLpln1 !== null) && (infoLpln2 !== null)) {
            // console.log("test1");
            // console.log("--------------->grepPlnidFromArcid :  on rentre dans le coeur ", mylogCpdlc);
            //CAS 1 : arcid envoye en meme temps que le reqId dans le CPCASREQ
            // on en deduit le reqid
            if (mylogCpdlc.match("CPCASREQ") !== null) {
              reqid = infoLpln1.toString().replace(motifCPCASREQ, "$5").trim();
              //  console.log("cas 1");
              // console.log("reqid : " + reqid);
              do {
                mylogCpdlc = this.readLine.fgets(r);
                mylogCpdlc = mylogCpdlc.toString();
                if ((mylogCpdlc.match("REQID") !== null) && (mylogCpdlc.match(reqid) !== null) && (mylogCpdlc.match("PLNID") !== null)) {
                  // console.log("cas 1A");
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
                  //  console.log("cas 1B");
                  infoLpln1 = mylogCpdlc.match(motifVemgsa);
                  //CAS 1B: que le reqid comme information  ex : EZY928J
                  let motif = /(.*)(-REQID)(.*)/;
                  reqid = infoLpln1.toString().replace("$5").trim();
                  //console.log("reqid : "+reqid);
                  break;
                }

              } while (!this.readLine.eof(r));

              break;
            }
            //CAS 2 : arcid envoye en meme temps que le plnid dans le CPCASRES (ex AFR6006)
            // on en deduit le reqid
            else {
              // console.log("cas 2");
              plnid = infoLpln1.toString().replace(motifCPCASRES, "$5").trim();
              //console.log("plnid : "+plnid);
              break;
            }
          }

        }

        //}


      } while (!this.readLine.eof(r));
    }

    this.readLine.fclose(r);


    return plnid;


  }

  public grepReqidFromArcid(arcid: string, fichierSourceVemgsa: string, creneau: creneauHoraire): number {
    console.log("Classe grepVemgsa Fonction grepReqidFromArcid");

    let fichierSource = fichierSourceVemgsa;
    let reqid = 0;

    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;


    let motifCPCASREQ = /(.*)(CPCASREQ)(.*)(-REQID)(.*)/;
    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = this.readLine.fgets(r);
        if (mylogCpdlc === false) { break; }

        //Si les logs ont plus de 5 minutes par rapoort à l'arcid on sort du fichier
        if (this.dates.diffDateV(mylogCpdlc, creneau.dateMax, 5) == false) {
          break;
        }

        //on n'étudie que les logs arrivés après l'arcid
        if (this.dates.diffDateVstrict(mylogCpdlc, creneau.dateMax, 0) == true) {
          console.log("test1");


          let infoLpln1 = mylogCpdlc.match(motifVemgsa);
          let infoLpln2 = mylogCpdlc.match(arcid);
          if ((infoLpln1 !== null) && (infoLpln2 !== null)) {
            console.log("infolpln 1 :" + infoLpln1);

            //CAS 1 : arcid envoye en meme temps que le reqId dans le CPCASREQ
            // on en deduit le reqid
            if (mylogCpdlc.match("CPCASREQ") !== null) {
              reqid = infoLpln1.toString().replace(motifCPCASREQ, "$5").trim();
              break;
            }
          }

        }
      } while (!this.readLine.eof(r));
    }

    this.readLine.fclose(r);
    return reqid;


  }

  public grepPlagesHorairesFichiers(fichierSourceVemgsa: string[]): creneauHoraire {
    console.log("Classe grepVemgsa Fonction grepPlagesHorairesFichiers");

    let creneau = <creneauHoraire>{};
    creneau.dateMin = "";
    creneau.dateMax = "";

    let creneauTemp = <creneauHoraire>{};
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

  private grepPlageHoraireFichier(fichierSourceVemgsa: string): creneauHoraire {
    console.log("Classe grepVemgsa Fonction grepPlageHoraireFichier");

    let fichierSource = fichierSourceVemgsa;
    let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");
    let motif = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

    //26/09/2018 07H54'11" -TITLE CPCCLOSLNK-PLNID 7466  	,
    //  let motif2 = /(\d\d)(\/)(\d\d)(\/)(\d\d\d\d )(\d\d)(H)(\d\d)(')(\d\d)(.*)/;
    let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
    let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;
    let creneau = <creneauHoraire>{};

    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = this.readLine.fgets(r);
        if (mylogCpdlc === false) { break; }

        if (mylogCpdlc.match(motif) !== null) {
          mylogCpdlc = mylogCpdlc.match(motif);

          if (mylogCpdlc.toString().match(motifDate) !== null) {

            let date = mylogCpdlc.toString().replace(motifDate, "$1");
            //  console.log("date: ",date);
            if (date.match(motifDateHeure) !== null) {

              const dateToStore = this.dates.vlogtoString(date);
              if (creneau.dateMin == undefined) {
                creneau.dateMin = dateToStore;
              }
              creneau.dateMax = dateToStore;
            }
          }
        }
      } while (!this.readLine.eof(r));
      this.readLine.fclose(r);
    }
    return creneau;
  }

  /* Fonction qui prend en entrée deux fichiers Vemgsa et renvoie les deux fichiers en les classant par date 
  en s'appuyant sur les dates du premier et du dernier log contenu dans le fichier*/
  public orderVemgsa(list: string[]): string[] {
    console.log("Classe grepVemgsa Fonction orderVemgsa");

    let datesFichier1: creneauHoraire;
    let datesFichier2: creneauHoraire;
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





  public isPlnidAndPlageHoraire(plnid: number, fichierSourceVemgsa: string[]): arrayCreneauHoraire {
    console.log("Classe grepVemgsa Fonction isPlnidAndPlageHoraire");

    let result = <arrayCreneauHoraire>{};
    result.dates = new Array;
    result.existe = false;

    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
    let motifPlnid: string;
    let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
    let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;


    if (plnid < 1000) {
      motifPlnid = "-PLNID " + "0" + plnid;
    }
    else {
      motifPlnid = "-PLNID " + plnid;
    }
    console.log("motifPlnid: ", motifPlnid);

    for (let fichier of fichierSourceVemgsa) {

      let fichierSource = fichier;
      console.log("test", "fic", fichierSource, "plnid", plnid);

      let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");

      if (r === false) {
        console.log("Error, can't open ", fichierSource);
        process.exit(1);
      }
      else {
        do {
          let mylogCpdlc = this.readLine.fgets(r);
          if (mylogCpdlc === false) { break; }
          // console.log((mylogCpdlc.match(motifVemgsa) !== null),(mylogCpdlc.match(motifPlnid) !== null));

          if ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motifPlnid) !== null)) {
            // console.log("mylogCpdlc", mylogCpdlc);

            mylogCpdlc = mylogCpdlc.match(motifVemgsa);
            result.existe = true;


            if (mylogCpdlc.toString().match(motifDate) !== null) {
              let date = mylogCpdlc.toString().replace(motifDate, "$1");
              //   console.log("date a: ",date);

              if (date.match(motifDateHeure) !== null) {
                result.dates.push(this.dates.vlogtoString(date));
              }
            }
          }
        } while (!this.readLine.eof(r));
      }
      this.readLine.fclose(r);
    }
    //result.dates.forEach(element => { console.log("isPlnidAndPlageHoraire", element); });
    return result;
  }



  public isArcidAndPlageHoraire(arcid: string, fichierSourceVemgsa: string[]): arrayCreneauHoraire {
    console.log("Classe grepVemgsa Fonction isArcidAndPlageHoraire");


    let result = <arrayCreneauHoraire>{};
    result.dates = new Array;
    result.existe = false;

    let motifVemgsa = /\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
    let motifArcid1 = /(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-ATNLOGON)(.*)/;
    let motifArcid2 = /(.*)(-ARCID )(.*)(-ATNLOGON)(.*)/;


    let motifDate = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d)(.*)/;
    let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;

    for (let fichier of fichierSourceVemgsa) {
      let fichierSource = fichier;
      let r = this.readLine.fopen(p.resolve(this.userPath, fichierSource), "r");

      if (r === false) {
        console.log("Error, can't open ", fichierSource);
        process.exit(1);
      }
      else {
        do {
          let mylogCpdlc = this.readLine.fgets(r);
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
                  result.dates.push(this.dates.vlogtoString(date));
                }
              }

            }


          }
        } while (!this.readLine.eof(r));
      }
      this.readLine.fclose(r);
    }
    return result;
  }


}

