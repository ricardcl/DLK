import { Vol } from '../Modele/vol';
import { AnalyseLPLN } from './analyseLPLN';
import { AnalyseVEMGSA } from './analyseVEMGSA';
import { GrapheEtat } from './grapheEtat';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Dates, creneauHoraire } from './date';
import { etatTransfertFrequence } from '../Modele/interfacesControles';
import { Frequences } from './frequences';
import * as moment from 'moment';


/**
 * Classe regroupant les fonctions permettant d'élaborer les informations du vol final à envoyer a client
 * 
 * Les fonctions permettent de calculer le vol final à partir de fichiers de logs LPN, VEMGSA, ou les deux
 */
export class Conception {

  private dates: Dates;
  private grapheEtat: GrapheEtat;
  private uneMinute: number = 60000;
  private timeout: number = 2 * this.uneMinute;
  private frequences: Frequences;

  constructor(dates: Dates, frequences: Frequences) {
    console.log("Je rentre dans le constructor MixInfos ");
    this.dates = dates;
    this.frequences = frequences;
    this.grapheEtat = new GrapheEtat(this.frequences);

  }

  //Fonction a utiliser si fichiers LPLN ET VEMGSA definis  !!!!!!!!!!!!!!!!!!!! 
  public mixInfos(volLpln: Vol, volVemgsa: Vol, arcid: string, plnid: number, creneauHoraire: creneauHoraire): Vol {
    console.log("Classe MixInfos Fonction mixInfos");


    //Initialisation du vol final issu des donnees LPLN et VEMGSA 
    let monvolFinal = new Vol(arcid, plnid);

    //RECUPERATION DES ATTRIBUTS 
    if (volVemgsa.getDate() !== "") {
      monvolFinal.setDate(volVemgsa.getDate());
    }
    else {
      monvolFinal.setDate(volLpln.getDate());
    }

    monvolFinal.setAdep(volLpln.getAdep());
    monvolFinal.setAdepBord(volVemgsa.getAdepBord());
    monvolFinal.setCmpAdep((volLpln.getAdep() == volVemgsa.getAdepBord()));

    monvolFinal.setAdes(volLpln.getAdes());
    monvolFinal.setAdesBord(volVemgsa.getAdesBord());
    monvolFinal.setCmpAdes((volLpln.getAdes() == volVemgsa.getAdesBord()));


    if (volLpln.getArcid() == volVemgsa.getArcid()) {
      monvolFinal.setCmpArcid(true);
    }
    else { monvolFinal.setCmpArcid(false); }

    if (volLpln.getEquipementCpdlc() == "EQUIPE") {
      monvolFinal.setEquipementCpdlc("EQUIPE");
    }
    else {
      monvolFinal.setEquipementCpdlc("NON EQUIPE");
    }

    if (volLpln.getAdrDeposee() == volLpln.getAdrModeSBord()) {
      monvolFinal.setAdrDeposee(volLpln.getAdrDeposee());
      monvolFinal.setAdrModeSBord(volLpln.getAdrModeSBord());
      monvolFinal.setCmpAdrModeS(true);
    }
    else {
      monvolFinal.setAdrDeposee(volLpln.getAdrDeposee());
      monvolFinal.setAdrModeSBord(volLpln.getAdrModeSBord());
      monvolFinal.setCmpAdrModeS(false);
    }

    if ((volLpln.getLogonInitie() == true) || (volVemgsa.getLogonInitie() == true)) {
      monvolFinal.setLogonInitie(true);
    }
    else { monvolFinal.setLogonInitie(false); }

    if ((volLpln.getLogonAccepte() == true) || (volVemgsa.getLogonAccepte() == true)) {
      monvolFinal.setLogonAccepte(true);
    }
    else {
      monvolFinal.setLogonAccepte(false);
    }

    if ((monvolFinal.getLogonAccepte() == true) || (monvolFinal.getCmpAdep() && monvolFinal.getCmpAdes()
      && monvolFinal.getCmpAdrModeS() && monvolFinal.getCmpArcid() && monvolFinal.getEquipementCpdlc())) {
      monvolFinal.setConditionsLogon(true);
    }
    else {
      monvolFinal.setConditionsLogon(false);
    }

    if (volVemgsa.getHaslogCpdlc() || volLpln.getHaslogCpdlc()) {
      monvolFinal.setHaslogCpdlc(true);
    }
    if (volVemgsa.getIslogCpdlcComplete() || volLpln.getIslogCpdlcComplete()) {
      monvolFinal.setIslogCpdlcComplete(true);
    }

    if (monvolFinal.getLogonAccepte() == true) {
      monvolFinal.setCmpAdep(true);
      monvolFinal.setCmpAdes(true);
      monvolFinal.setCmpArcid(true);
      monvolFinal.setCmpAdrModeS(true);

    }
    //RECUPERATION DES LOGS 
    volVemgsa.getListeLogs().forEach((elt, key) => {
      let heureTransfert = "";
      let positionTransfert = "";
      let isLplnParcouru: boolean = false; /* Le fichier LPLN peut contenir deux CPCLOSLINK pour un seul côté VEMGSA, 
      pour éviter qu'il soit traité deux fois, la variable isLplnParcouru permet de s'assure qu'on associe qu'une fois 
      les infos LPLN à un transfert VEMGSA
      */
      monvolFinal.addElt(elt);
      //   console.log("elt VEMGSA", elt.getTitle(), "date : ", elt.getHeure());

      //Si transfert Datalink Initié, recherche dans les logs LPLN de la fréquence et des information associées 
      if ((elt.getTitle() == 'CPCFREQ') || ((elt.getTitle() == 'CPCCLOSLNK') && (elt.getDetaillog()["FREQ"] !== undefined))) {

        isLplnParcouru = false;
        volLpln.getListeLogs().forEach((eltL, keyL) => {

          if ((((eltL.getTitle() == 'CPCFREQ') || (eltL.getTitle() == 'CPCCLOSLNK')) && !isLplnParcouru)
            && this.dates.isHeuresLplnVemgsaEgales(elt.getHeure(), eltL.getHeure())) {
            // console.log("comparaison lpln, vemgsa", " heure lpln: ", eltL.getHeure(), " heure vemgsa: ", elt.getHeure());

            //if (this.dates.isHeuresLplnVemgsaEgales(elt.getHeure(), eltL.getHeure())) {
            // console.log("date vemgsa : ", elt.getDate(), "date lpln : ", eltL.getDate(), "freq vemgsa: ", elt.getDetail("FREQ")); 
            heureTransfert = eltL.getHeure();
            //console.log("freq lpln: ", eltL.getDetaillog()["FREQ"], " heure lpln: ", heureTransfert, " heure vemgsa: ", elt.getHeure());
            // }

            //si une frequence a bien ete trouvee a cette heure là on recupere le nom de la position et les infos suivantes 
            volLpln.getListeLogs().forEach((eltL, keyL) => {

              // console.log("eltL", eltL.getTitle(),"eltL.getHeure()",eltL.getHeure(),"heureTransfert",heureTransfert,"elt position", eltL.getDetaillog()['POSITION'] ,'positionTransfert', positionTransfert );
              //console.log("!!! eltL", eltL.getDetaillog());
              if ((eltL.getTitle() == 'TRFDL')
                && (this.dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= this.uneMinute)) {
                //  console.log("eltL TRFDL", eltL.getTitle());
                positionTransfert = eltL.getDetaillog()['POSITION'];
                // console.log("Position", positionTransfert);
                //console.log(" heure de transfert: ", heureTransfert); 
                // console.log("Log TRFDL - heureTransfert", heureTransfert);
                monvolFinal.addElt(eltL); //TODO?? Vérifier que ce n'est pas utile : raisonnement : redondant avec le CPCFREQ ??
                //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure()); 
              }
              if ((eltL.getTitle() == 'FIN TRFDL')
                && (this.dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2 * this.uneMinute)) {
                //   console.log("eltL FIN TRFDL", eltL.getTitle());
                //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure()); 
                monvolFinal.addElt(eltL);
              }

              if ((eltL.getTitle() == 'TRARTV') && (eltL.getDetaillog()['POSITION'] == positionTransfert)) {
                //console.log("eltL TRARTV", eltL.getTitle(), "positionTransfert", positionTransfert);
                // console.log("eltL TRARTV", eltL.getTitle());
                // console.log("eltL", eltL.getHeure(), "heureTransfert", heureTransfert);
                if (this.dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 3 * this.uneMinute) {
                  // console.log("eltL TRARTV", eltL.getTitle());
                  //console.log("eltL", eltL); 
                  monvolFinal.addElt(eltL);
                  //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure()); 
                }
              }

              if ((eltL.getTitle() == 'ETATDL') && (eltL.getDetaillog()['POSITION'] == positionTransfert)) {
                if (this.dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2 * this.uneMinute) {
                  //   console.log("eltL ETATDL", eltL.getTitle());
                  //console.log("eltL", eltL); 
                  monvolFinal.addElt(eltL);
                  //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure()); 
                }
              }
            })
            isLplnParcouru = true;
          }


        })


      }

    })

    //si des logs vemgsa ont été trouvé 
    if (volVemgsa.getListeLogs().length !== 0) {
      //RECUPERATION DES INFOS LPLN QUI SONT DATEES AVANT OU APRES LES LOGS VEMGSA 
      let creneau = <creneauHoraire>{};
      //creneau = creneauHoraire;
      creneau.dateMin = volVemgsa.getListeLogs()[0].getDate();
      creneau.dateMax = volVemgsa.getListeLogs()[volVemgsa.getListeLogs().length - 1].getDate();
      console.log("creneau.dateMin: ", creneau.dateMin);
      console.log("creneau.dateMax: ", creneau.dateMax);

      let vemgsaMinVsLpln: boolean;
      let vemgsaMaxVsLpln: boolean;
      let diffVemgsaMinLpln: number;
      let diffVemgsaMaxLpln: number;

      volLpln.getListeLogs().forEach((eltL, key) => {
        // console.log("ajout supp LPLN: ", eltL.getTitle(), eltL.getDate());

        diffVemgsaMinLpln = this.dates.diffDatesAbs(creneau.dateMin, eltL.getDate());
        diffVemgsaMaxLpln = this.dates.diffDatesAbs(eltL.getDate(), creneau.dateMax);
        vemgsaMinVsLpln = this.dates.isDateSup(creneau.dateMin, eltL.getDate());
        vemgsaMaxVsLpln = this.dates.isDateSup(eltL.getDate(), creneau.dateMax);

        // console.log("diffVemgsaMinLpln",diffVemgsaMinLpln,"diffVemgsaMaxLpln", diffVemgsaMaxLpln,"vemgsaMinVsLpln",vemgsaMinVsLpln,"vemgsaMaxVsLpln",vemgsaMaxVsLpln );

        if (((diffVemgsaMinLpln > this.uneMinute) && vemgsaMinVsLpln) || ((diffVemgsaMaxLpln > 2 * this.uneMinute) && vemgsaMaxVsLpln)) {
          monvolFinal.addElt(eltL);
          // console.log("ajout supp LPLN: ", eltL.getDate());

        }
      });
    }


    //console.log("resultat vol final : ");
    monvolFinal = this.sortLogs(monvolFinal);



    monvolFinal = this.grapheEtat.evaluateGrapheEtat(monvolFinal);

    // console.log("debut logs collectes et tries");
    monvolFinal.getListeLogs().forEach(etatCpdlc => {
      //console.log("contenu  map before: ",etatCpdlc.getDetaillog()); 
      // console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
    });
    // console.log("fin logs collectes et tries");




    monvolFinal.setListeEtatTransfertFrequence(this.evaluationEtatsTransfertsFrequenceMIX(monvolFinal.getListeLogs()));
    //console.log("array tabEtatsTransfertFrequences: ");
    monvolFinal.getListeEtatTransfertFrequence().forEach(element => {
      //console.log(element.frequence, element.dateTransfert, element.isTRARTV);
    });

    //this.evaluationEtatsLogonConnexionSimplifie(this.evaluationEtatsLogonConnexion(monvolFinal.getListeLogs()));


    monvolFinal.initLogonConnexionResults();

    return monvolFinal;
  }





  public InfosLpln(arcid: string, plnid: number, fichierSourceLpln: string, analyseLPLN: AnalyseLPLN): Vol {
    console.log("Classe MixInfos Fonction InfosLpln");
    //Initialisation du vol issu des donnees LPLN 
    let monvolLpln = new Vol(arcid, plnid);
    monvolLpln = analyseLPLN.analyse(arcid, plnid);


    let nbLogsCpdlc: number = 0;
    let hasCPASREQ: boolean = false;
    let hasCPCEND: boolean = false;

    //RECUPERATION DES ATTRIBUTS 

    if (monvolLpln.getAdrDeposee() == monvolLpln.getAdrModeSBord()) {
      monvolLpln.setCmpAdrModeS(true);
    } else { monvolLpln.setCmpAdrModeS(false); }





    //console.log("debut logs LPLN collectes et tries");

    monvolLpln.getListeLogs().forEach(etatCpdlc => {
      if (etatCpdlc.getTitle() == 'CPCASREQ') {
        monvolLpln.setLogonInitie(true);
        hasCPASREQ = true;
      }

      if ((etatCpdlc.getTitle() == 'CPCASRES') && ((etatCpdlc.getDetaillog()['ATNASSOC'] == 'S') || (etatCpdlc.getDetaillog()['ATNASSOC'] == 'L'))) {
        monvolLpln.setLogonAccepte(true);
        monvolLpln.setLogonInitie(true);

      }
      if ((etatCpdlc.getTitle() == 'CPCASRES') && (etatCpdlc.getDetaillog()['ATNASSOC'] == 'F')) {
        monvolLpln.setLogonInitie(true);
        monvolLpln.setLogonAccepte(false);
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

    if (monvolLpln.getLogonAccepte() == true) {
      monvolLpln.setConditionsLogon(true);
    }

    if (monvolLpln.getLogonAccepte() == true) {
      monvolLpln.setCmpAdep(true);
      monvolLpln.setCmpAdes(true);
      monvolLpln.setCmpArcid(true);
      monvolLpln.setCmpAdrModeS(true);
    }
    /** Recuperation des infos de transfert de frequence */

    monvolLpln.setListeEtatTransfertFrequence(this.evaluationEtatsTransfertsFrequenceLPLN(monvolLpln.getListeLogs()));
    /**  console.log("array tabEtatsTransfertFrequences: ");
 
     monvolLpln.getListeEtatTransfertFrequence().forEach(element => {
       console.log(element.frequence, element.dateTransfert, element.isTRARTV);
     });*/



    monvolLpln.initLogonConnexionResults();
    monvolLpln = this.grapheEtat.evaluateGrapheEtat(monvolLpln);
    return monvolLpln;


  }

  public InfosVemgsa(arcid: string, plnid: number, creneau: creneauHoraire, fichierSourceVemgsa: string[], analyseVEMGSA: AnalyseVEMGSA): Vol {
    console.log("Classe MixInfos Fonction InfosVemgsa");


    //console.log("Je rentre dans InfosVemgsa de MixInfo creneau", creneau);
    //console.log("fichierSourceVemgsa: ", fichierSourceVemgsa);
    //Initialisation du vol issu des donnees VEMGSA 
    let monvolVemgsa = new Vol(arcid, plnid);
    //pv.identification(arcid, plnid, fichierSourceVemgsa); 

    monvolVemgsa = analyseVEMGSA.analyse(arcid, plnid, creneau, fichierSourceVemgsa);
    let nbLogsCpdlc: number = 0;
    let hasCPASREQ: boolean = false;
    let hasCPCEND: boolean = false;
    let isLogue: boolean = false;
    //RECUPERATION DES ATTRIBUTS 



    //console.log("debut logs VEMGSA collectes et tries"); 

    monvolVemgsa.getListeLogs().forEach(etatCpdlc => {
      if (etatCpdlc.getTitle() == 'CPCASREQ') {
        monvolVemgsa.setAdrModeSBord(etatCpdlc.getDetaillog()['ARCADDR']);
        monvolVemgsa.setAdepBord(etatCpdlc.getDetaillog()['ADEP']);
        monvolVemgsa.setAdesBord(etatCpdlc.getDetaillog()['ADES']);
        monvolVemgsa.setArcid(etatCpdlc.getDetaillog()['ARCID']);
        monvolVemgsa.setLogonInitie(true);
        hasCPASREQ = true;
      }

      if ((etatCpdlc.getTitle() == 'CPCASRES') && !hasCPASREQ) {
        monvolVemgsa.setAdrModeSBord(etatCpdlc.getDetaillog()['ARCADDR']);
        monvolVemgsa.setAdepBord(etatCpdlc.getDetaillog()['ADEP']);
        monvolVemgsa.setAdesBord(etatCpdlc.getDetaillog()['ADES']);
        monvolVemgsa.setArcid(etatCpdlc.getDetaillog()['ARCID']);
      }

      if (etatCpdlc.getTitle() == 'CPCEND') {
        hasCPCEND = true;
      }

      //pour determiner si le vol a depasse le stade du logon
      //permet de traiter le cas ou : le fichier VEMGSA est incomplet, debut des logs apres le logon 
      if ((etatCpdlc.getTitle() == 'CPCOPENLNK') || (etatCpdlc.getTitle() == 'CPCCOMSTAT')
        || (etatCpdlc.getTitle() == 'CPCCLOSLNK') || (etatCpdlc.getTitle() == 'CPCMSGDOWN') || (etatCpdlc.getTitle() == 'CPCMSGUP')) {
        isLogue = true;
      }

      if (etatCpdlc.getTitle() == 'CPCASRES') {
        monvolVemgsa.setLogonInitie(true);
        if ((etatCpdlc.getDetaillog()['ATNASSOC'] == 'S') || (etatCpdlc.getDetaillog()['ATNASSOC'] == 'L')) {
          monvolVemgsa.setLogonAccepte(true);
        }
        else {
          monvolVemgsa.setLogonAccepte(false);
        }
      }

      //console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat()); 
      //console.log("LogVEMGSA: ", etatCpdlc.getLog()); 

      if (etatCpdlc.getIsTypeCPC() == true) {
        nbLogsCpdlc++;
      }

    });

    if (monvolVemgsa.getLogonAccepte() == true) {
      monvolVemgsa.setConditionsLogon(true)
    }
    else { monvolVemgsa.setConditionsLogon(false); }


    if (nbLogsCpdlc != 0) {
      monvolVemgsa.setHaslogCpdlc(true);
    }
    if (hasCPASREQ && hasCPCEND) {
      monvolVemgsa.setIslogCpdlcComplete(true);
    }
console.log("isLogue",isLogue);

    if (isLogue) {
      monvolVemgsa.setLogonInitie(true);
      monvolVemgsa.setConditionsLogon(true);
      monvolVemgsa.setLogonAccepte(true);
      monvolVemgsa.setCmpAdep(true);
      monvolVemgsa.setCmpAdes(true);
      monvolVemgsa.setCmpArcid(true);
      monvolVemgsa.setCmpAdrModeS(true);
    }


    //console.log("ARCADDR: ", monvolVemgsa.getAdrDeposee(), "\nARCID: ", monvolVemgsa.getArcid(),"\nAdep: ", monvolVemgsa.getAdep(), "\nAdes: ", monvolVemgsa.getAdes(), "\nLogonInitie: ",monvolVemgsa.getLogonInitie(), "\nLogonAccepte: ", monvolVemgsa.getLogonAccepte()); 


    //console.log("fin logs VEMGSA collectes et tries"); 



    monvolVemgsa.setListeEtatTransfertFrequence(this.evaluationEtatsTransfertsFrequenceVEMGSA(monvolVemgsa.getListeLogs()));
    //console.log("array tabEtatsTransfertFrequences: ");
    monvolVemgsa.getListeEtatTransfertFrequence().forEach(element => {
      //console.log(element.frequence, element.dateTransfert, element.isTRARTV);
    });


    monvolVemgsa = this.sortLogs(monvolVemgsa);




    monvolVemgsa.initLogonConnexionResults();
    monvolVemgsa = this.grapheEtat.evaluateGrapheEtat(monvolVemgsa);


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
    //TODO vérifier l'algo pour les focntion  evaluationEtatsTransfertsFrequence LPLN VEMGSA et MIX
    //TODO vérifier que les creneaux de dates sont bons cf cas du TRFDL doit etre entre et 0 et 2 min apres le CPCPFREQ
    //utiliser pour ca la fonction diffDatesInBornes
    let dateFreq: string;
    let dateTemp: string;
    let tabEtatsTransfertFrequences: etatTransfertFrequence[] = [];

    listeLogs.forEach(etatCpdlc => {
      let etatTransfertFreq = <etatTransfertFrequence>{};
      if ((etatCpdlc.getTitle() == 'CPCFREQ') || (etatCpdlc.getTitle() == 'TRFDL')) {

        // console.log("--------Test transfert Frequence----------");
        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;
        //console.log("date transfert:", etatTransfertFreq.dateTransfert);

        if (etatCpdlc.getTitle() == 'CPCFREQ') {
          etatTransfertFreq.frequence = etatCpdlc.getDetaillog()["FREQ"];
          //console.log("frequence transfert:", etatTransfertFreq.frequence);
        }


        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();


          if ((etatCpdlcTemp.getTitle() == "TRFDL") && (this.dates.diffDatesAbs(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("date TRFDL timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.positionTransfert = etatCpdlcTemp.getDetaillog()["POSITION"];
            //console.log("etatTransfertFreq.positionTransfert", etatTransfertFreq.positionTransfert);

          }

          if ((etatCpdlcTemp.getTitle() == "FIN TRFDL") && (this.dates.diffDatesInBornes(dateFreq, dateTemp, -this.timeout, 0))) {
            // console.log("2 etatCpdlcTemp", etatCpdlcTemp);
            //console.log("date FIN TRFDL timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.isTransfertAcq = false;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            //console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            //console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "TRARTV") && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"]) && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"])) {
            //console.log("date TRARTV timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isTRARTV = true;
            etatTransfertFreq.isTransfertAcq = false;
            etatTransfertFreq.dateTRARTV = dateTemp;
            //console.log("etatTransfertFreq.isTRARTV:", etatTransfertFreq.isTRARTV);
            //console.log("etatTransfertFreq.dateTRARTV", etatTransfertFreq.dateTRARTV);
          }

          if ((etatCpdlcTemp.getTitle() == "CPCMSGDOWN") && (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] !== "WIL") && (this.dates.diffDatesInBornes(dateFreq, dateTemp, -this.timeout, 0))) {
            //  console.log("3 etatCpdlcTemp", etatCpdlcTemp);
            //  console.log("dateFreq", dateFreq, "dateTemp", dateTemp, "diff", this.dates.diffDates(dateFreq, dateTemp), "diff boolean", this.dates.diffDatesInBornes(dateFreq, dateTemp, -this.timeout, 0));
            if (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] === "STB") {
              etatTransfertFreq.isStandby = true;
            }
            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.isTransfertAcq = false;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            // console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            // console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);
            etatTransfertFreq.deltaT = this.dates.diffDatesAbs(dateFreq, dateTemp);

          }

          else if ((etatCpdlcTemp.getTitle() == "CPCMSGDOWN") && (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] == "WIL") && (this.dates.diffDatesAbs(dateFreq, dateTemp) <= this.timeout)) {
            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isTransfertAcq = true;
            etatTransfertFreq.dateTranfertAcq = dateTemp;
            //  console.log("etatTransfertFreq.isTransfertAcq:", etatTransfertFreq.isTransfertAcq);
            // console.log("etatTransfertFreq.dateTranfertAcq", etatTransfertFreq.dateTranfertAcq);
            etatTransfertFreq.deltaT = this.dates.diffDatesAbs(dateFreq, dateTemp);
          }
        });
        //  console.log("------------------------------------------");


        if (etatCpdlc.getTitle() == 'TRFDL') {
          let trouve: boolean = false;
          tabEtatsTransfertFrequences.forEach(element => {
            if (element.dateTransfert == etatCpdlc.getDate()) {
              trouve = true;
            }
          });
          if (!trouve) {
            this.removeYear(etatTransfertFreq);
            tabEtatsTransfertFrequences.push(etatTransfertFreq);
          }

        }
        else {
          this.removeYear(etatTransfertFreq);
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
      let isCPDLCMSGDOWN: boolean = false; // indique si on a deja recu une reponse pour le transfert de frequence
      //objectif traiter le cas ou on recoit un UNABLE  puis WILCO pour un meme transfert 

      let etatTransfertFreq = <etatTransfertFrequence>{};
      if ((etatCpdlc.getTitle() == 'CPCFREQ') || ((etatCpdlc.getTitle() == 'CPCCLOSLNK') && (etatCpdlc.getDetaillog()["FREQ"] !== undefined))) {

        //   console.log("--------Test transfert Frequence----------");
        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;
        etatTransfertFreq.frequence = this.frequences.conversionFreq(etatCpdlc.getDetaillog()["FREQ"]);

        // console.log("date transfert:", etatTransfertFreq.dateTransfert);
        // console.log("frequence transfert:", etatTransfertFreq.frequence);

        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();

          if ((etatCpdlcTemp.getTitle() == "CPCMSGDOWN") && (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] !== "WIL") && (this.dates.diffDatesInBornes(dateFreq, dateTemp, -this.timeout, 0)) && (!isCPDLCMSGDOWN)) {
            // console.log("4 etatCpdlcTemp", etatCpdlcTemp);
            if (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] === "STB") {
              etatTransfertFreq.isStandby = true;
            }
            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.isTransfertAcq = false;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            // console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            // console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);
            etatTransfertFreq.deltaT = this.dates.diffDatesAbs(dateFreq, dateTemp);
            isCPDLCMSGDOWN = true;
          }

          else if ((etatCpdlcTemp.getTitle() == "CPCMSGDOWN") && (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] == "WIL") && (this.dates.diffDatesAbs(dateFreq, dateTemp) <= this.timeout) && (!isCPDLCMSGDOWN)) {
            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isTransfertAcq = true;
            etatTransfertFreq.dateTranfertAcq = dateTemp;
            //  console.log("etatTransfertFreq.isTransfertAcq:", etatTransfertFreq.isTransfertAcq);
            // console.log("etatTransfertFreq.dateTranfertAcq", etatTransfertFreq.dateTranfertAcq);
            etatTransfertFreq.deltaT = this.dates.diffDatesAbs(dateFreq, dateTemp);
          }


        });
        // console.log("------------------------------------------");

        //cas possibles

        //RTV
        //8H01 ENVOI MSG CPCFREQ : 127.180 AU SERVEUR AIR
        //EVENEMENT DATE: FIN TRFDL HEURE:08h02                                                                            *
        // 120  08H03 *   TRAITEMENT TRANSACTION TRARTV POSITION ORIGINE P17 

        this.removeYear(etatTransfertFreq);
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

      let isCPDLCMSGDOWN: boolean = false; // indique si on a deja recu une reponse pour le transfert de frequence
      //objectif traiter le cas ou on recoit un UNABLE  puis WILCO pour un meme transfert 

      let etatTransfertFreq = <etatTransfertFrequence>{};

      if ((etatCpdlc.getTitle() == 'CPCFREQ') || ((etatCpdlc.getTitle() == 'CPCCLOSLNK') && (etatCpdlc.getDetaillog()["FREQ"] !== undefined))) {

        // console.log("--------Test transfert Frequence----------");
        //console.log("test !!!!!!!!!! freq mix recuperee", etatCpdlc.getDetaillog()["FREQ"]);

        dateFreq = etatCpdlc.getDate();
        etatTransfertFreq.dateTransfert = dateFreq;


        etatTransfertFreq.frequence = this.frequences.conversionFreq(etatCpdlc.getDetaillog()["FREQ"]);
        //console.log("frequence transfert:", etatTransfertFreq.frequence);



        //console.log("date transfert:", etatTransfertFreq.dateTransfert);
        //console.log("frequence transfert:", etatTransfertFreq.frequence);

        listeLogs.forEach(etatCpdlcTemp => {
          dateTemp = etatCpdlcTemp.getDate();

          if ((etatCpdlcTemp.getTitle() == "TRFDL") && (this.dates.diffDatesAbs(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("date TRFDL timeout:", dateTemp);
            //console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.positionTransfert = etatCpdlcTemp.getDetaillog()["POSITION"];
            // console.log("etatTransfertFreq.positionTransfert", etatTransfertFreq.positionTransfert);

          }


          if ((etatCpdlcTemp.getTitle() == "FIN TRFDL") && (this.dates.diffDatesAbs(dateFreq, dateTemp) <= this.timeout)) {
            //console.log("5 etatCpdlcTemp", etatCpdlcTemp);

            // console.log("date FIN TRFDL timeout:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.isTransfertAcq = false;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            //  console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            // console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          if ((etatCpdlcTemp.getTitle() == "TRARTV") && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"]) && (etatTransfertFreq.positionTransfert == etatCpdlcTemp.getDetaillog()["POSITION"])) {
            // console.log("date TRARTV timeout:", dateTemp);
            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isTRARTV = true;
            etatTransfertFreq.isTransfertAcq = false;
            etatTransfertFreq.dateTRARTV = dateTemp;
            // console.log("etatTransfertFreq.isTRARTV:", etatTransfertFreq.isTRARTV);
            // console.log("etatTransfertFreq.dateTRARTV", etatTransfertFreq.dateTRARTV);
          }


          //attention : le message CPCMSGDOWN doit etre post daté au transfert de fréquence
          if ((etatCpdlcTemp.getTitle() == "CPCMSGDOWN") && (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] !== "WIL") && (this.dates.diffDatesInBornes(dateFreq, dateTemp, -this.timeout, 0))) {
            if (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] === "STB") {
              etatTransfertFreq.isStandby = true;
            }
            // console.log("1 etatCpdlcTemp", etatCpdlcTemp);

            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isFinTRFDL = true;
            etatTransfertFreq.isTransfertAcq = false;
            etatTransfertFreq.dateFinTRFDL = dateTemp;
            etatTransfertFreq.deltaT = this.dates.diffDatesAbs(dateFreq, dateTemp);
            isCPDLCMSGDOWN = true;
            // console.log("etatTransfertFreq.isFinTRFDL", etatTransfertFreq.isFinTRFDL);
            // console.log("etatTransfertFreq.dateFinTRFDL", etatTransfertFreq.dateFinTRFDL);

          }

          else if ((etatCpdlcTemp.getTitle() == "CPCMSGDOWN") && (etatCpdlcTemp.getDetaillog()["CPDLCMSGDOWN"] == "WIL") && (this.dates.diffDatesAbs(dateFreq, dateTemp) <= this.timeout) && (!isCPDLCMSGDOWN)) {
            // console.log("diff de temps:", this.dates.diffDatesAbs(dateFreq, dateTemp));
            etatTransfertFreq.isTransfertAcq = true;
            etatTransfertFreq.dateTranfertAcq = dateTemp;
            //  console.log("etatTransfertFreq.isTransfertAcq:", etatTransfertFreq.isTransfertAcq);
            // console.log("etatTransfertFreq.dateTranfertAcq", etatTransfertFreq.dateTranfertAcq);
            etatTransfertFreq.deltaT = this.dates.diffDatesAbs(dateFreq, dateTemp);
          }


        });
        // console.log("------------------------------------------");

        //cas possibles

        //RTV
        //8H01 ENVOI MSG CPCFREQ : 127.180 AU SERVEUR AIR
        //EVENEMENT DATE: FIN TRFDL HEURE:08h02                                                                            *
        // 120  08H03 *   TRAITEMENT TRANSACTION TRARTV POSITION ORIGINE P17 
        this.removeYear(etatTransfertFreq);

        tabEtatsTransfertFrequences.push(etatTransfertFreq);


      }

    });
    return tabEtatsTransfertFrequences;
  }






  private removeYear(etatTransfertFreq: etatTransfertFrequence): void {
    // console.log("elt.dateTransfert", etatTransfertFreq.dateTransfert);
    const momentDate1 = moment(etatTransfertFreq.dateTransfert, 'DD-MM-yyyy HH mm ss');
    if (momentDate1.isValid()) {
      etatTransfertFreq.dateTransfert = moment(momentDate1).format('DD-MM HH mm ss')
    }
    // console.log("etatTransfertFreq.dateTransfert after", etatTransfertFreq.dateTransfert);
  }



}