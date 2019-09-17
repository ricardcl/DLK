import { Vol } from '../Modele/vol';
import { ParseurLPLN } from './ParseurLPLN';
import { ParseurVEMGSA } from './ParseurVEMGSA';
import { GrapheEtat } from './grapheEtat';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Dates, datesFile } from './date';
import { etatTransfertFrequence } from '../Modele/checkAnswer';

export class MixInfos {

  private dates: Dates;
  private grapheEtat: GrapheEtat;
  private uneMinute: number = 60000;
  private timeout: number = 2 * 60000;

  constructor() {
    console.log("Je rentre dans le constructor MixInfos ");
    this.dates = new Dates();
    this.grapheEtat = new GrapheEtat();
  }

  //Fonction a utiliser si fichiers LPLN ET VEMGSA definis  !!!!!!!!!!!!!!!!!!!! 
  public mixInfos(volLpln: Vol, volVemgsa: Vol, arcid: string, plnid: number): Vol {
    console.log("Classe MixInfos Fonction mixInfos");

    //Initialisation du vol final issu des donnees LPLN et VEMGSA 
    let monvolFinal = new Vol(arcid, plnid);


    //RECUPERATION DES ATTRIBUTS 
    if (volLpln.getAdep() == volVemgsa.getAdep()) {
      monvolFinal.setAdep(volLpln.getAdep());
      monvolFinal.setCmpAdep("OK");
    }
    else { monvolFinal.setCmpAdep("KO"); }

    if (volLpln.getAdes() == volVemgsa.getAdes()) {
      monvolFinal.setAdes(volLpln.getAdes());
      monvolFinal.setCmpAdes("OK");
    }
    else { monvolFinal.setCmpAdes("KO"); }

    if (volLpln.getArcid() == volVemgsa.getArcid()) {
      monvolFinal.setCmpArcid("OK");
    }
    else { monvolFinal.setCmpArcid("KO"); }

    if (volLpln.getEquipementCpdlc() == "EQUIPE") {
      monvolFinal.setEquipementCpdlc("EQUIPE");
    }
    else {
      monvolFinal.setEquipementCpdlc("NON EQUIPE");
    }

    if (volLpln.getAdrDeposee() == volLpln.getAdrModeSInf()) {
      monvolFinal.setAdrDeposee(volLpln.getAdrDeposee());
      monvolFinal.setAdrModeSInf(volLpln.getAdrModeSInf());
      monvolFinal.setCmpAdrModeS("OK");
    }
    else {
      monvolFinal.setAdrDeposee(volLpln.getAdrDeposee());
      monvolFinal.setAdrModeSInf(volLpln.getAdrModeSInf());
      monvolFinal.setCmpAdrModeS("KO");
    }

    if ((volLpln.getLogonInitie()) || (volVemgsa.getLogonInitie())) {
      monvolFinal.setLogonInitie("OK");
    }
    else { monvolFinal.setLogonInitie("KO"); }

    if ((volLpln.getLogonAccepte()) || (volVemgsa.getLogonAccepte())) {
      monvolFinal.setLogonAccepte("OK");
    }
    else {
      monvolFinal.setLogonAccepte("KO");
    }

    if ((monvolFinal.getLogonAccepte()) || (monvolFinal.getCmpAdep() && monvolFinal.getCmpAdes()
      && monvolFinal.getCmpAdrModeS() && monvolFinal.getCmpArcid() && monvolFinal.getEquipementCpdlc())) {
      monvolFinal.setConditionsLogon("OK");
    }
    else {
      monvolFinal.setConditionsLogon("KO");
    }

    if (volVemgsa.getHaslogCpdlc() || volLpln.getHaslogCpdlc()) {
      monvolFinal.setHaslogCpdlc(true);
    }
    if (volVemgsa.getIslogCpdlcComplete() || volLpln.getIslogCpdlcComplete()) {
      monvolFinal.setIslogCpdlcComplete(true);
    }


    //RECUPERATION DES LOGS 
    volVemgsa.getListeLogs().forEach((elt, key) => {
      let heureTransfert = "";
      let positionTransfert = "";
      monvolFinal.addElt(elt);
      //console.log("elt VEMGSA", elt.getTitle(), "date : ", elt.getHeure()); 

      //Si transfert Datalink Initié, recherche dans les logs LPLN de la fréquence et des information associées 
      if (elt.getTitle() == 'CPCFREQ') {

        volLpln.getListeLogs().forEach((eltL, keyL) => {
          if (eltL.getTitle() == 'CPCFREQ') {
            if (this.dates.isHeuresLplnVemgsaEgales(elt.getHeure(), eltL.getHeure())) {
              // console.log("date vemgsa : ", elt.getDate(), "date lpln : ", eltL.getDate(), "freq vemgsa: ", elt.getDetail("FREQ")); 
              heureTransfert = eltL.getHeure();
              // console.log("freq lpln: ", eltL.getDetaillog()["FREQ"], " heure lpln: ", heureTransfert); 
            }

            //si une frequence a bien ete trouvee a cette heure là on recupere le nom de la position et les infos suivantes 
            volLpln.getListeLogs().forEach((eltL, keyL) => {

              if (eltL.getTitle() == 'TRFDL') {
                if (this.dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= this.uneMinute) {
                  //console.log("eltL", eltL.getTitle()); 
                  positionTransfert = eltL.getDetaillog()['POSITION'];
                  //console.log("Position", positionTransfert); 
                  //console.log(" heure de transfert: ", heureTransfert); 
                  monvolFinal.addElt(eltL);
                  //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure()); 

                }
              }
              if (eltL.getTitle() == 'FIN TRFDL') {
                if (this.dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2 * this.uneMinute) {
                  //console.log("eltL", eltL.getTitle()); 
                  //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure()); 
                  monvolFinal.addElt(eltL);
                }
              }
              if ((eltL.getTitle() == 'TRARTV') && (eltL.getDetaillog()['POSITION'] == positionTransfert)) {
                if (this.dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2 * this.uneMinute) {
                  //console.log("eltL", eltL.getTitle()); 
                  //console.log("eltL", eltL); 
                  monvolFinal.addElt(eltL);
                  //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure()); 
                }
              }
            })

          }

        })


      }

    })

    //RECUPERATION DES INFOS LPLN QUI SONT DATEES AVANT OU APRES LES LOGS VEMGSA 
    let creneau = <datesFile>{};

    creneau.dateMin = volVemgsa.getListeLogs()[0].getHeure();
    creneau.dateMax = volVemgsa.getListeLogs()[volVemgsa.getListeLogs().length - 1].getHeure();
   // console.log("creneau.dateMin: ", creneau.dateMin);
   // console.log("creneau.dateMax: ", creneau.dateMax);
    volLpln.getListeLogs().forEach((eltL, key) => {
      if ((this.dates.isHeureInf(eltL.getHeure(), creneau.dateMin)) || (this.dates.isHeureSup(eltL.getHeure(), creneau.dateMax))) {
        monvolFinal.addElt(eltL);
       // console.log("ajout supp LPLN: ", eltL.getEtat());

      }
    });

    //console.log("resultat vol final : ");
    monvolFinal = this.sortLogs(monvolFinal);



    monvolFinal = this.grapheEtat.grapheMix(monvolFinal);

   // console.log("debut logs collectes et tries");
    monvolFinal.getListeLogs().forEach(etatCpdlc => {
      //console.log("contenu  map before: ",etatCpdlc.getDetaillog()); 
     // console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
    });
   // console.log("fin logs collectes et tries");


   console.log("--------TEST DETAIL LOG ---------------");
   console.log("volLpln.getListeLogs()", volLpln.getListeLogs());

   console.log("volVemgsa.getListeLogs()", volVemgsa.getListeLogs());

   console.log("--------FIN TEST DETAIL LOG ---------------");
    return monvolFinal;
  }





  public InfosLpln(arcid: string, plnid: number, fichierSourceLpln: string, parseurLPLN: ParseurLPLN): Vol {
    console.log("Classe MixInfos Fonction InfosLpln");
    //Initialisation du vol issu des donnees LPLN 
    let monvolLpln = new Vol(arcid, plnid);
    monvolLpln = parseurLPLN.parseur(arcid, plnid);

    let nbLogsCpdlc: number = 0;
    let hasCPASREQ: boolean = false;
    let hasCPCEND: boolean = false;

    //RECUPERATION DES ATTRIBUTS 

    if (monvolLpln.getAdrDeposee() == monvolLpln.getAdrModeSInf()) {
      monvolLpln.setCmpAdrModeS("OK");
    } else { monvolLpln.setCmpAdrModeS("KO"); }


    if (monvolLpln.getLogonAccepte()) {
      monvolLpln.setConditionsLogon("OK");
    }




    //console.log("debut logs LPLN collectes et tries");

    monvolLpln.getListeLogs().forEach(etatCpdlc => {
      if (etatCpdlc.getTitle() == 'CPCASREQ') {
        monvolLpln.setLogonInitie("OK");
        hasCPASREQ = true;
      }

      if ((etatCpdlc.getTitle() == 'CPCASRES') && ((etatCpdlc.getDetaillog()['ATNASSOC'] == 'S') || (etatCpdlc.getDetaillog()['ATNASSOC'] == 'L'))) {
        monvolLpln.setLogonAccepte("OK");

      }
      if ((etatCpdlc.getTitle() == 'CPCASRES') && (etatCpdlc.getDetaillog()['ATNASSOC'] == 'F')) {
        monvolLpln.setLogonAccepte("KO");
      }
      if (etatCpdlc.getTitle() == 'CPCEND') {
        hasCPCEND = true;
      }

      if (etatCpdlc.getIsTypeCPC() == true) {
        nbLogsCpdlc++;
      }

     // console.log("date: ", etatCpdlc.getDate(), "jour: ", etatCpdlc.getJour(), "heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
      //console.log("LogLPLN: ", etatCpdlc.getLog());
    });

    if (nbLogsCpdlc != 0) {
      monvolLpln.setHaslogCpdlc(true);
    }
    if (hasCPASREQ && hasCPCEND) {
      monvolLpln.setIslogCpdlcComplete(true);
    }




    monvolLpln.setListeEtatTransfertFrequence(this.evaluationEtatsTransfertsFrequenceLPLN(monvolLpln.getListeLogs()));
    console.log("array tabEtatsTransfertFrequences: ");
    monvolLpln.getListeEtatTransfertFrequence().forEach(element => {
      console.log(element.frequence, element.dateTransfert, element.isTRARTV);
    });



    //console.log("LogonInitie: ", monvolLpln.getLogonInitie(), "\nLogonAccepte: ", monvolLpln.getLogonAccepte(),
    //  "\nAdep: ", monvolLpln.getAdep(), "\nAdes: ", monvolLpln.getAdes());

    //console.log("fin logs LPLN collectes et tries");




    return monvolLpln;


  }

  public InfosVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[], ParseurVEMGSA: ParseurVEMGSA, creneau: datesFile, chosenHoraire?: datesFile): Vol {
    console.log("Classe MixInfos Fonction InfosVemgsa");

    //console.log("Je rentre dans InfosVemgsa de MixInfo creneau", creneau);
    //console.log("fichierSourceVemgsa: ", fichierSourceVemgsa);
    //Initialisation du vol issu des donnees VEMGSA 
    let monvolVemgsa = new Vol(arcid, plnid);
    //pv.identification(arcid, plnid, fichierSourceVemgsa); 

    monvolVemgsa = ParseurVEMGSA.parseur(arcid, plnid, fichierSourceVemgsa, creneau, chosenHoraire);
    let nbLogsCpdlc: number = 0;
    let hasCPASREQ: boolean = false;
    let hasCPCEND: boolean = false;

    //RECUPERATION DES ATTRIBUTS 

    if (monvolVemgsa.getLogonAccepte()) {
      monvolVemgsa.setConditionsLogon("OK")
    }
    else { monvolVemgsa.setConditionsLogon("KO"); }

    //console.log("debut logs VEMGSA collectes et tries"); 

    monvolVemgsa.getListeLogs().forEach(etatCpdlc => {
      if (etatCpdlc.getTitle() == 'CPCASREQ') {
        monvolVemgsa.setAdep(etatCpdlc.getDetaillog()['ADEP']);
        monvolVemgsa.setAdes(etatCpdlc.getDetaillog()['ADES']);
        monvolVemgsa.setAdrDeposee(etatCpdlc.getDetaillog()['ARCADDR']);
        monvolVemgsa.setArcid(etatCpdlc.getDetaillog()['ARCID']);
        monvolVemgsa.setLogonInitie("OK");
        hasCPASREQ = true;
      }

      if (etatCpdlc.getTitle() == 'CPCEND') {
        hasCPCEND = true;
      }
      if ((etatCpdlc.getTitle() == 'CPCASRES') && ((etatCpdlc.getDetaillog()['ATNASSOC'] == 'S') || (etatCpdlc.getDetaillog()['ATNASSOC'] == 'L'))) {
        monvolVemgsa.setLogonAccepte("OK");
      } else { monvolVemgsa.setLogonAccepte("KO"); }

      //console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat()); 
      //console.log("LogVEMGSA: ", etatCpdlc.getLog()); 

      if (etatCpdlc.getIsTypeCPC() == true) {
        nbLogsCpdlc++;
      }

    });
    if (nbLogsCpdlc != 0) {
      monvolVemgsa.setHaslogCpdlc(true);
    }
    if (hasCPASREQ && hasCPCEND) {
      monvolVemgsa.setIslogCpdlcComplete(true);
    }

    //console.log("ARCADDR: ", monvolVemgsa.getAdrDeposee(), "\nARCID: ", monvolVemgsa.getArcid(),"\nAdep: ", monvolVemgsa.getAdep(), "\nAdes: ", monvolVemgsa.getAdes(), "\nLogonInitie: ",monvolVemgsa.getLogonInitie(), "\nLogonAccepte: ", monvolVemgsa.getLogonAccepte()); 


    //console.log("fin logs VEMGSA collectes et tries"); 


    
    monvolVemgsa.setListeEtatTransfertFrequence(this.evaluationEtatsTransfertsFrequenceVEMGSA(monvolVemgsa.getListeLogs()));
    console.log("array tabEtatsTransfertFrequences: ");
    monvolVemgsa.getListeEtatTransfertFrequence().forEach(element => {
      console.log(element.frequence, element.dateTransfert, element.isTRARTV);
    });


    monvolVemgsa = this.sortLogs(monvolVemgsa);

    return monvolVemgsa;
  }

  public sortLogs(vol: Vol): Vol {
    console.log("Classe MixInfos Fonction sortLogs");


    let arrayLogTemp: EtatCpdlc[] = vol.getListeLogs();

    let trie: boolean = false;
    let changement: boolean;



    if (arrayLogTemp.length > 1) {

      while (!trie) {
        changement = false;
        for (let i = 0; i < arrayLogTemp.length - 1; i++) {


          const element = arrayLogTemp[i];
          const elementNext = arrayLogTemp[i + 1];
          //console.log("sortLogs element.Heure", element.getHeure(), " eNext.Heure", elementNext.getHeure(), "result:", this.dates.isHeureSup(element.getHeure(), elementNext.getHeure())); 
          if (this.dates.isDateSup(element.getDate(), elementNext.getDate())) {
            arrayLogTemp[i] = elementNext;
            arrayLogTemp[i + 1] = element;
            changement = true;

            //console.log("inversion: elementNext"+elementNext+" element : "+element); 

          }
        }
        if (changement == false) { trie = true; }

      }
    }


    vol.setListeLogs(arrayLogTemp);

    return vol;
  }
  //TODO : tester le fichier en entrée : existance, dates de validité pour savoir si l'aircraft id est bien dans le vemgsa ... 


  private evaluationEtatsTransfertsFrequenceLPLN(listeLogs: EtatCpdlc[]): etatTransfertFrequence[] {
    let dateFreq: string;
    let dateTemp: string;
    let tabEtatsTransfertFrequences: etatTransfertFrequence[] = [];

    listeLogs.forEach(etatCpdlc => {
      let etatTransfertFreq = <etatTransfertFrequence>{};
      if (etatCpdlc.getTitle() == 'CPCFREQ') {

        console.log("--------Test transfert Frequence----------");
        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;
        etatTransfertFreq.frequence = etatCpdlc.getDetaillog()["FREQ"];

        console.log("date transfert:", etatTransfertFreq.dateTransfert);
        console.log("frequence transfert:", etatTransfertFreq.frequence);

        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();

          if ((etatCpdlcTemp.getTitle() == "TRFDL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            console.log("date TRFDL timeout:", dateTemp);
            console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.positionTransfert = etatCpdlcTemp.getDetaillog()["POSITION"];
            console.log("etatTransfertFreq.positionTransfert", etatTransfertFreq.positionTransfert);

          }

          if ((etatCpdlcTemp.getTitle() == "FIN TRFDL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            console.log("date FIN TRFDL timeout:", dateTemp);
            console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "TRARTV") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout) && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"])) {
            console.log("date TRARTV timeout:", dateTemp);
            console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isTRARTV = true;
            etatTransfertFreq.dateTRARTV = dateTemp;
            console.log("etatTransfertFreq.isTRARTV:", etatTransfertFreq.isTRARTV);
            console.log("etatTransfertFreq.dateTRARTV", etatTransfertFreq.dateTRARTV);
          }
        });
        console.log("------------------------------------------");

        //cas possibles

        //RTV
        //8H01 ENVOI MSG CPCFREQ : 127.180 AU SERVEUR AIR
        //EVENEMENT DATE: FIN TRFDL HEURE:08h02                                                                            *
        // 120  08H03 *   TRAITEMENT TRANSACTION TRARTV POSITION ORIGINE P17 
        tabEtatsTransfertFrequences.push(etatTransfertFreq);
      }

    });
    return tabEtatsTransfertFrequences;
  }

  private evaluationEtatsTransfertsFrequenceVEMGSA(listeLogs: EtatCpdlc[]): etatTransfertFrequence[] {
    let dateFreq: string;
    let dateTemp: string;
    let tabEtatsTransfertFrequences: etatTransfertFrequence[] = [];

    listeLogs.forEach(etatCpdlc => {
      let etatTransfertFreq = <etatTransfertFrequence>{};
      if (( etatCpdlc.getTitle() == 'CPCFREQ') || ((etatCpdlc.getTitle() == 'CPCCLOSLNK') && (etatCpdlc.getDetaillog()["FREQ"] !== undefined ))) {

        console.log("--------Test transfert Frequence----------");
        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;
        etatTransfertFreq.frequence = etatCpdlc.getDetaillog()["FREQ"];

        console.log("date transfert:", etatTransfertFreq.dateTransfert);
        console.log("frequence transfert:", etatTransfertFreq.frequence);

        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();


          if ((etatCpdlcTemp.getTitle() == "CPDLCMSGDOWN") && (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] !== "UNA" ) && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            console.log("date FIN TRFDL timeout:", dateTemp);
            console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "CPDLCMSGDOWN") && (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] !== "WIL" ) && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            console.log("date CPDLCMSGDOWN WIL:", dateTemp);
            console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isTransfertAcq = true;
            etatTransfertFreq.dateTranfertAcq = dateTemp;
            console.log("etatTransfertFreq.isTransfertAcq:", etatTransfertFreq.isTransfertAcq);
            console.log("etatTransfertFreq.dateTranfertAcq", etatTransfertFreq.dateTranfertAcq);
          }
        });
        console.log("------------------------------------------");

        //cas possibles

        //RTV
        //8H01 ENVOI MSG CPCFREQ : 127.180 AU SERVEUR AIR
        //EVENEMENT DATE: FIN TRFDL HEURE:08h02                                                                            *
        // 120  08H03 *   TRAITEMENT TRANSACTION TRARTV POSITION ORIGINE P17 
        tabEtatsTransfertFrequences.push(etatTransfertFreq);
      }

    });
    return tabEtatsTransfertFrequences;
  }





}