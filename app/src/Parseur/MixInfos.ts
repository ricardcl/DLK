import { Vol } from '../Modele/vol';
import { ParseurLPLN } from './ParseurLPLN';
import { ParseurVEMGSA } from './ParseurVEMGSA';
import { GrapheEtat } from './grapheEtat';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Dates, datesFile } from './date';
import { etatTransfertFrequence, etatLogonConnexion } from '../Modele/checkAnswer';
import { Frequences } from './frequences';
import { Etat } from '../Modele/enumEtat';

export class MixInfos {

  private dates: Dates;
  private grapheEtat: GrapheEtat;
  private uneMinute: number = 60000;
  private timeout: number = 2 * this.uneMinute;
  private frequences: Frequences;

  constructor() {
    console.log("Je rentre dans le constructor MixInfos ");
    this.dates = new Dates();
    this.grapheEtat = new GrapheEtat();
    this.frequences = new Frequences();
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
                  monvolFinal.addElt(eltL); //TODO?? Vérifier que ce n'est pas utile : raisonnement : redondant avec le CPCFREQ ??
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

    creneau.dateMin = volVemgsa.getListeLogs()[0].getDate();
    creneau.dateMax = volVemgsa.getListeLogs()[volVemgsa.getListeLogs().length - 1].getDate();
    // console.log("creneau.dateMin: ", creneau.dateMin);
    // console.log("creneau.dateMax: ", creneau.dateMax);

    let vemgsaMinVsLpln: boolean;
    let vemgsaMaxVsLpln: boolean;
    let diffVemgsaMinLpln: number;
    let diffVemgsaMaxLpln: number;

    volLpln.getListeLogs().forEach((eltL, key) => {
      // console.log("ajout supp LPLN: ", eltL.getTitle(), eltL.getDate());

      diffVemgsaMinLpln = this.dates.diffDates(creneau.dateMin, eltL.getDate());
      diffVemgsaMaxLpln = this.dates.diffDates(eltL.getDate(), creneau.dateMax);
      vemgsaMinVsLpln = this.dates.isDateSup(creneau.dateMin, eltL.getDate());
      vemgsaMaxVsLpln = this.dates.isDateSup(eltL.getDate(), creneau.dateMax);

      // console.log("diffVemgsaMinLpln",diffVemgsaMinLpln,"diffVemgsaMaxLpln", diffVemgsaMaxLpln,"vemgsaMinVsLpln",vemgsaMinVsLpln,"vemgsaMaxVsLpln",vemgsaMaxVsLpln );

      if (((diffVemgsaMinLpln > this.uneMinute) && vemgsaMinVsLpln) || ((diffVemgsaMaxLpln > 2 * this.uneMinute) && vemgsaMaxVsLpln)) {
        monvolFinal.addElt(eltL);
        // console.log("ajout supp LPLN: ", eltL.getDate());

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




    monvolFinal.setListeEtatTransfertFrequence(this.evaluationEtatsTransfertsFrequenceMIX(monvolFinal.getListeLogs()));
    console.log("array tabEtatsTransfertFrequences: ");
    monvolFinal.getListeEtatTransfertFrequence().forEach(element => {
      console.log(element.frequence, element.dateTransfert, element.isTRARTV);
    });



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


    /** Recuperation des infos de transfert de frequence */

    monvolLpln.setListeEtatTransfertFrequence(this.evaluationEtatsTransfertsFrequenceLPLN(monvolLpln.getListeLogs()));
    /**  console.log("array tabEtatsTransfertFrequences: ");
 
     monvolLpln.getListeEtatTransfertFrequence().forEach(element => {
       console.log(element.frequence, element.dateTransfert, element.isTRARTV);
     });*/


    /** Recuperation des infos de cheangement d'état */

    monvolLpln.setListeEtatLogonConnexion(this.evaluationEtatsLogonConnexionLPLN(monvolLpln.getListeLogs()));
    /** console.log("array tabEtatLogonConnexionLPLNs: ");
    monvolLpln.getListeEtatLogonConnexion().forEach(element => {
      console.log(element.dateChgtEtat, element.etat, element.infoEtat, element.log);
    });*/
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
      if ((etatCpdlc.getTitle() == 'CPCFREQ') || (etatCpdlc.getTitle() == 'TRFDL')) {

        console.log("--------Test transfert Frequence----------");
        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;
        console.log("date transfert:", etatTransfertFreq.dateTransfert);

        if (etatCpdlc.getTitle() == 'CPCFREQ') {
          etatTransfertFreq.frequence = etatCpdlc.getDetaillog()["FREQ"];
          console.log("frequence transfert:", etatTransfertFreq.frequence);
        }


        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();

          if ((etatCpdlcTemp.getTitle() == "TRFDL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("date TRFDL timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.positionTransfert = etatCpdlcTemp.getDetaillog()["POSITION"];
            //console.log("etatTransfertFreq.positionTransfert", etatTransfertFreq.positionTransfert);

          }

          if ((etatCpdlcTemp.getTitle() == "FIN TRFDL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("date FIN TRFDL timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            //console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            //console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "TRARTV") && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"]) && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"])) {
            //console.log("date TRARTV timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isTRARTV = true;
            etatTransfertFreq.dateTRARTV = dateTemp;
            //console.log("etatTransfertFreq.isTRARTV:", etatTransfertFreq.isTRARTV);
            //console.log("etatTransfertFreq.dateTRARTV", etatTransfertFreq.dateTRARTV);
          }
        });
        console.log("------------------------------------------");


        if (etatCpdlc.getTitle() == 'TRFDL') {
          let trouve: boolean = false;
          tabEtatsTransfertFrequences.forEach(element => {
            if (element.dateTransfert == etatCpdlc.getDate()) {
              trouve = true;
            }
          });
          if (!trouve) {
            tabEtatsTransfertFrequences.push(etatTransfertFreq);
          }

        }
        else {
          tabEtatsTransfertFrequences.push(etatTransfertFreq);
        }
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
      if ((etatCpdlc.getTitle() == 'CPCFREQ') || ((etatCpdlc.getTitle() == 'CPCCLOSLNK') && (etatCpdlc.getDetaillog()["FREQ"] !== undefined))) {

        console.log("--------Test transfert Frequence----------");
        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;
        etatTransfertFreq.frequence = this.frequences.conversionFreq(etatCpdlc.getDetaillog()["FREQ"]);

        console.log("date transfert:", etatTransfertFreq.dateTransfert);
        console.log("frequence transfert:", etatTransfertFreq.frequence);

        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();


          if ((etatCpdlcTemp.getTitle() == "CPDLCMSGDOWN") && (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] !== "UNA") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("date FIN TRFDL timeout:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            // console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            // console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "CPDLCMSGDOWN") && (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] !== "WIL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            // console.log("date CPDLCMSGDOWN WIL:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isTransfertAcq = true;
            etatTransfertFreq.dateTranfertAcq = dateTemp;
            //  console.log("etatTransfertFreq.isTransfertAcq:", etatTransfertFreq.isTransfertAcq);
            // console.log("etatTransfertFreq.dateTranfertAcq", etatTransfertFreq.dateTranfertAcq);
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

  private evaluationEtatsTransfertsFrequenceMIX(listeLogs: EtatCpdlc[]): etatTransfertFrequence[] {
    let dateFreq: string;
    let dateTemp: string;
    let tabEtatsTransfertFrequences: etatTransfertFrequence[] = [];

    listeLogs.forEach(etatCpdlc => {
      let etatTransfertFreq = <etatTransfertFrequence>{};

      if ((etatCpdlc.getTitle() == 'CPCFREQ') || ((etatCpdlc.getTitle() == 'CPCCLOSLNK') && (etatCpdlc.getDetaillog()["FREQ"] !== undefined))) {

        // console.log("--------Test transfert Frequence----------");
        //console.log("test !!!!!!!!!! freq mix recuperee", etatCpdlc.getDetaillog()["FREQ"]);

        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;


        etatTransfertFreq.frequence = this.frequences.conversionFreq(etatCpdlc.getDetaillog()["FREQ"]);
        console.log("frequence transfert:", etatTransfertFreq.frequence);



        //console.log("date transfert:", etatTransfertFreq.dateTransfert);
        //console.log("frequence transfert:", etatTransfertFreq.frequence);

        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();

          if ((etatCpdlcTemp.getTitle() == "TRFDL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("date TRFDL timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.positionTransfert = etatCpdlcTemp.getDetaillog()["POSITION"];
            // console.log("etatTransfertFreq.positionTransfert", etatTransfertFreq.positionTransfert);

          }

          if ((etatCpdlcTemp.getTitle() == "CPDLCMSGDOWN") && (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] !== "UNA") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("date FIN TRFDL timeout:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            // console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            // console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "FIN TRFDL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            // console.log("date FIN TRFDL timeout:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            //  console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            // console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "TRARTV") && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"]) && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"])) {
            // console.log("date TRARTV timeout:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isTRARTV = true;
            etatTransfertFreq.dateTRARTV = dateTemp;
            // console.log("etatTransfertFreq.isTRARTV:", etatTransfertFreq.isTRARTV);
            // console.log("etatTransfertFreq.dateTRARTV", etatTransfertFreq.dateTRARTV);
          }



          if ((etatCpdlcTemp.getTitle() == "CPDLCMSGDOWN") && (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] !== "WIL") && (this.dates.diffDates(dateFreq, dateTemp) <= this.timeout)) {
            // console.log("date CPDLCMSGDOWN WIL:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDates(dateFreq, dateTemp));
            etatTransfertFreq.isTransfertAcq = true;
            etatTransfertFreq.dateTranfertAcq = dateTemp;
            // console.log("etatTransfertFreq.isTransfertAcq:", etatTransfertFreq.isTransfertAcq);
            // console.log("etatTransfertFreq.dateTranfertAcq", etatTransfertFreq.dateTranfertAcq);
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




  private evaluationEtatsLogonConnexionLPLN(listeLogs: EtatCpdlc[]): etatLogonConnexion[] {
    let tabEtatLogonConnexionTemp: etatLogonConnexion[] = [];
    let infoSupp: boolean;

    listeLogs.forEach(log => {
      let etatLogonConnexion = <etatLogonConnexion>{};
      etatLogonConnexion.dateChgtEtat = log.getDate();
      etatLogonConnexion.log = log.getTitle();
      infoSupp = false;
      //automate a etat sur la variable etat 
      switch (log.getTitle()) {
        case 'CPCASREQ': {

          etatLogonConnexion.etat = Etat.NonLogue;
          etatLogonConnexion.infoEtat = "DemandeLogonEnCours";
          infoSupp = true;
          break;
        }
        case 'CPCASRES': {
          if ((log.getDetaillog()["ATNASSOC"] == "S") || (log.getDetaillog()["ATNASSOC"] == "L")) {
            etatLogonConnexion.etat = Etat.NonLogue;
            etatLogonConnexion.infoEtat = "DemandeLogonEncoursAutoriseeParStpv";
            infoSupp = true;
          }
          else if (log.getDetaillog()["ATNASSOC"] == "F") {
            etatLogonConnexion.etat = Etat.NonLogue;
            etatLogonConnexion.infoEtat = "DemandeLogonRefuseeParStpv";
            infoSupp = true;
          }
          break;
        }
        case 'CPCVNRES': {
          if (log.getDetaillog()["GAPPSTATUS"] == "A") {
            etatLogonConnexion.etat = Etat.Logue;
            etatLogonConnexion.infoEtat = "LogonAcceptee";
            infoSupp = true;
          }
          else if (log.getDetaillog()["GAPPSTATUS"] == "F") {
            etatLogonConnexion.etat = Etat.NonLogue;
            etatLogonConnexion.infoEtat = "EchecLogon";
            infoSupp = true;
          }
          break;
        }
        case 'CPCOPENLNK': {
          //console.log('CPCOPENLNK'); 
          etatLogonConnexion.etat = Etat.Logue;
          etatLogonConnexion.infoEtat = "DemandeConnexion";
          infoSupp = true
          break;
        }
        case 'CPCCOMSTAT': {
          //console.log('CPCCOMSTAT'); 
          if (log.getDetaillog()["CPDLCCOMSTATUS"] == "A") {
            etatLogonConnexion.etat = Etat.Associe;
            etatLogonConnexion.infoEtat = "Connecte/associe";
            infoSupp = true
          }
          else if (log.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
            etatLogonConnexion.etat = Etat.Logue;
            etatLogonConnexion.infoEtat = "Déconnexion";
            infoSupp = true
          }
          break;
        }
        case 'CPCEND': {
          //console.log('CPCEND'); 
          etatLogonConnexion.etat = Etat.NonLogue;
          etatLogonConnexion.infoEtat = "Fin du vol";
          infoSupp = true
          break;
        }
        case 'CPCCLOSLNK': {
          //console.log('CPCCLOSLNK'); 
          etatLogonConnexion.etat = Etat.Logue;
          etatLogonConnexion.infoEtat = "DemandeDeconnexion";
          infoSupp = true
          break;
        }
        case 'FIN VOL': {
          // console.log("je passe dans FIN VOL !!!!!!!!!!!!!!!!!!!!");
          etatLogonConnexion.etat = Etat.NonLogue;
          etatLogonConnexion.infoEtat = "Fin du vol";
          infoSupp = true
          break;
        }
        case 'FPCLOSE': {
          etatLogonConnexion.etat = Etat.NonLogue;
          etatLogonConnexion.infoEtat = "Fin du vol";
          infoSupp = true
          break;
        }
        default: {
          // console.log("je passe dans default",log.getTitle()); 
          break;
        }
      }
      if (infoSupp) {
        tabEtatLogonConnexionTemp.push(etatLogonConnexion);

      }

    });
    console.log("BEFORE array tabEtatLogonConnexionLPLNs: ");
    tabEtatLogonConnexionTemp.forEach(element => {
      console.log(element.dateChgtEtat, element.etat, element.infoEtat, element.log);
    });
    let tabEtatLogonConnexion: etatLogonConnexion[] = [];

    for (let index = 0; index < tabEtatLogonConnexionTemp.length; index++) {

      const element = tabEtatLogonConnexionTemp[index];
      tabEtatLogonConnexion.push(element);

      if (index > 0) {
        const elementPrevious = tabEtatLogonConnexionTemp[index - 1];
        if (((element.etat == Etat.NonLogue) || (element.etat == Etat.Logue)) && (element.infoEtat == elementPrevious.infoEtat)) {
          tabEtatLogonConnexion.pop();
          tabEtatLogonConnexion.pop();
          tabEtatLogonConnexion.push(element);
        }
      }

    }
    console.log("AFTER array tabEtatLogonConnexionLPLNs: ");
    tabEtatLogonConnexion.forEach(element => {
      console.log(element.dateChgtEtat, element.etat, element.infoEtat, element.log);
    });
    return tabEtatLogonConnexion;
  }

}