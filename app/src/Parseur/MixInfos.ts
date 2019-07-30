import { Vol } from '../Modele/vol';
import { parseurLpln } from './parseurLpln';
import { parseurVemgsa } from './parseur';
import { grapheEtat } from './grapheEtat';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import * as moment from 'moment';
import * as dates from './date';

export function getListeVols(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[]): Vol[] {
  let monvolFinal: Vol;
  let monvolVemgsa: Vol;
  let monvolLpln: Vol;
  let pl = new parseurLpln();
  console.log(pl.grepListeVolFromLpln(fichierSourceLpln));
  return pl.grepListeVolFromLpln(fichierSourceLpln);
}



//Fonction a utiliser si fichiers LPLN ET VEMGSA definis  !!!!!!!!!!!!!!!!!!!!
export function mixInfos(volLpln: Vol, volVemgsa: Vol, arcid: string, plnid: number): Vol {

  //Initialisation du vol final issu des donnees LPLN et VEMGSA
  let monvolFinal = new Vol(arcid, plnid);
  const uneMinute: number = 60000;

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
          if (dates.isHeuresLplnVemgsaEgales(elt.getHeure(), eltL.getHeure())) {
            // console.log("date vemgsa : ", elt.getDate(), "date lpln : ", eltL.getDate(), "freq vemgsa: ", elt.getDetail("FREQ"));
            heureTransfert = eltL.getHeure();
            // console.log("freq lpln: ", eltL.getDetaillog()["FREQ"], " heure lpln: ", heureTransfert);



          }

          //si une frequence a bien ete trouvee a cette heure là on recupere le nom de la position et les infos suivantes
          volLpln.getListeLogs().forEach((eltL, keyL) => {

            if (eltL.getTitle() == 'TRFDL') {
              if (dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= uneMinute) {
                //console.log("eltL", eltL.getTitle());
                positionTransfert = eltL.getDetaillog()['POSITION'];
                //console.log("Position", positionTransfert);
                //console.log(" heure de transfert: ", heureTransfert);
                monvolFinal.addElt(eltL);
                //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure());

              }
            }
            if (eltL.getTitle() == 'FIN TRFDL') {
              if (dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2 * uneMinute) {
                //console.log("eltL", eltL.getTitle());
                //console.log("eltL", eltL.getTitle(), "date : ", eltL.getHeure());
                monvolFinal.addElt(eltL);
              }
            }
            if ((eltL.getTitle() == 'TRARTV') && (eltL.getDetaillog()['POSITION'] == positionTransfert)) {
              if (dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2 * uneMinute) {
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

  console.log("resultat vol final : ");
  let graphe = new grapheEtat();
  let arrayLogTemp: EtatCpdlc[] = monvolFinal.getListeLogs();

  let trie: boolean = false;
  let changement: boolean;

  if (arrayLogTemp.length > 1) {
    while (!trie) {

      for (let i = 0; i < arrayLogTemp.length - 1; i++) {
        changement = false;

        const element = arrayLogTemp[i];
        const elementNext = arrayLogTemp[i + 1];
        if (dates.isHeureSup(element.getHeure(), elementNext.getHeure())) {
          arrayLogTemp[i] = elementNext;
          arrayLogTemp[i + 1] = element;
          changement = true;
          //console.log("inversion: elementNext"+elementNext+" element : "+element);

        }
      }
      if (changement == false) { trie = true; }
    }
  }
  monvolFinal.setListeLogs(arrayLogTemp);



  monvolFinal = graphe.grapheMix(monvolFinal);
  console.log("debut logs collectes et tries");

  monvolFinal.getListeLogs().forEach(etatCpdlc => {
    //console.log("contenu  map before: ",etatCpdlc.getDetaillog());
    console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
  });
  console.log("fin logs collectes et tries");

  return monvolFinal;
}





export function InfosLpln(arcid: string, plnid: number, fichierSourceLpln: string): Vol {

  //Initialisation du vol issu des donnees LPLN
  let monvolLpln = new Vol(arcid, plnid);
  let pl = new parseurLpln();
  monvolLpln = pl.parseur(arcid, plnid, fichierSourceLpln);



  //RECUPERATION DES ATTRIBUTS

  if (monvolLpln.getAdrDeposee() == monvolLpln.getAdrModeSInf()) {
    monvolLpln.setCmpAdrModeS("OK");
  } else { monvolLpln.setCmpAdrModeS("KO"); }


  if (monvolLpln.getLogonAccepte()) {
    monvolLpln.setConditionsLogon("OK");
  }





  console.log("debut logs LPLN collectes et tries");

  monvolLpln.getListeLogs().forEach(etatCpdlc => {
    if (etatCpdlc.getTitle() == 'CPCASREQ') {
      monvolLpln.setLogonInitie("OK");
    }
    if ((etatCpdlc.getTitle() == 'CPCASRES') && (etatCpdlc.getDetaillog()['ATNASSOC'] == 'S')) {
      monvolLpln.setLogonAccepte("OK");
    } else { monvolLpln.setLogonAccepte("KO"); }

    console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
    console.log("LogLPLN: ", etatCpdlc.getLog());
  });

  console.log("LogonInitie: ", monvolLpln.getLogonInitie(), "\nLogonAccepte: ", monvolLpln.getLogonAccepte(),
    "\nAdep: ", monvolLpln.getAdep(), "\nAdes: ", monvolLpln.getAdes());

  console.log("fin logs LPLN collectes et tries");




  return monvolLpln;


}

export function InfosVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[]): Vol {




  //Initialisation du vol issu des donnees VEMGSA
  let monvolVemgsa = new Vol(arcid, plnid);
  let pv = new parseurVemgsa();
  //pv.identification(arcid, plnid, fichierSourceVemgsa);

  monvolVemgsa = pv.parseur(arcid, plnid, fichierSourceVemgsa);


  //RECUPERATION DES ATTRIBUTS

  if (monvolVemgsa.getLogonAccepte()) {
    monvolVemgsa.setConditionsLogon("OK")
  }
  else { monvolVemgsa.setConditionsLogon("KO"); }

  console.log("debut logs VEMGSA collectes et tries");

  monvolVemgsa.getListeLogs().forEach(etatCpdlc => {
    if (etatCpdlc.getTitle() == 'CPCASREQ') {
      monvolVemgsa.setAdep(etatCpdlc.getDetail('ADEP'));
      monvolVemgsa.setAdes(etatCpdlc.getDetail('ADES'));
      monvolVemgsa.setAdrDeposee(etatCpdlc.getDetail('ARCADDR'));
      monvolVemgsa.setArcid(etatCpdlc.getDetail('ARCID'));
      monvolVemgsa.setLogonInitie("OK");
    }

    if ((etatCpdlc.getTitle() == 'CPCASRES') && ((etatCpdlc.getDetail('ATNASSOC') == 'S') || (etatCpdlc.getDetail('ATNASSOC') == 'L'))) {
      monvolVemgsa.setLogonAccepte("OK");
    } else { monvolVemgsa.setLogonAccepte("KO"); }

    console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
    console.log("LogVEMGSA: ", etatCpdlc.getLog());

  });


  console.log("ARCADDR: ", monvolVemgsa.getAdrDeposee(), "\nARCID: ", monvolVemgsa.getArcid(),
    "\nAdep: ", monvolVemgsa.getAdep(), "\nAdes: ", monvolVemgsa.getAdes(), "\nLogonInitie: ",
    monvolVemgsa.getLogonInitie(), "\nLogonAccepte: ", monvolVemgsa.getLogonAccepte());


  console.log("fin logs VEMGSA collectes et tries");
  return monvolVemgsa;
}


//TODO : tester le fichier en entrée : existance, dates de validité pour savoir si l'aircraft id est bien dans le vemgsa ...
