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




  //Initialisation du vol issu des donnees VEMGSA
  let monvolVemgsa = volVemgsa;
  //let pv = new parseurVemgsa();
  //pv.identification(arcid, plnid, fichierSourceVemgsa);

  //monvolVemgsa = pv.parseur(arcid, plnid, fichierSourceVemgsa);

  //Initialisation du vol issu des donnees LPLN
  let monvolLpln = volLpln;
  //let pl = new parseurLpln();
  //pl.identification(arcid, plnid, fichierSourceLpln);
  //monvolLpln = pl.parseur(arcid, plnid, fichierSourceLpln);

  //Initialisation du vol final issu des donnees LPLN et VEMGSA
  let monvolFinal = new Vol(arcid, plnid);
  const uneMinute: number = 60000;




  monvolVemgsa.getListeLogs().forEach((elt, key) => {
    let heureTransfert = "";
    let positionTransfert = "";
    monvolFinal.addElt(elt);
    //console.log("elt VEMGSA", elt.getTitle(), "date : ", elt.getHeure());

    //Si transfert Datalink Initié, recherche dans les logs LPLN de la fréquence et des information associées
    if (elt.getTitle() == 'CPCFREQ') {

      monvolLpln.getListeLogs().forEach((eltL, keyL) => {
        if (eltL.getTitle() == 'CPCFREQ') {
          if (dates.isHeuresLplnVemgsaEgales(elt.getHeure(), eltL.getHeure())) {
            // console.log("date vemgsa : ", elt.getDate(), "date lpln : ", eltL.getDate(), "freq vemgsa: ", elt.getDetail("FREQ"));
            heureTransfert = eltL.getHeure();
            // console.log("freq lpln: ", eltL.getDetaillog()["FREQ"], " heure lpln: ", heureTransfert);



          }

          //si une frequence a bien ete trouvee a cette heure là on recupere le nom de la position et les infos suivantes
          monvolLpln.getListeLogs().forEach((eltL, keyL) => {

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
  /** console.log("debut logs collectes non tries");
  monvolFinal.getListeLogs().forEach(etatCpdlc => {
    //console.log("contenu  map before: ",etatCpdlc.getDetaillog());
    console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
  });
  console.log("fin logs collectes non tries"); */
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


  console.log("debut logs LPLN collectes et tries");

  monvolLpln.getListeLogs().forEach(etatCpdlc => {
    if (etatCpdlc.getTitle() == 'CPCASREQ') {
      monvolLpln.setLogonInitie(true);
    }
    if ((etatCpdlc.getTitle() == 'CPCASRES')  && (etatCpdlc.getDetaillog()['ATNASSOC'] == 'S')){
      monvolLpln.setLogonAccepte(true);
    }
    console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
    console.log("LogLPLN: ", etatCpdlc.getLog());
  });
    
console.log("LogonInitie: ",monvolLpln.getLogonInitie(),"\nLogonAccepte: ",monvolLpln.getLogonAccepte(),
"\nAdep: ",monvolLpln.getAdep(), "\nAdes: ",monvolLpln.getAdes());

  console.log("fin logs LPLN collectes et tries");




  return monvolLpln;


}

export function InfosVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[]): Vol {




  //Initialisation du vol issu des donnees VEMGSA
  let monvolVemgsa = new Vol(arcid, plnid);
  let pv = new parseurVemgsa();
  //pv.identification(arcid, plnid, fichierSourceVemgsa);

  monvolVemgsa = pv.parseur(arcid, plnid, fichierSourceVemgsa);



  console.log("debut logs VEMGSA collectes et tries");

  monvolVemgsa.getListeLogs().forEach(etatCpdlc => {
    if (etatCpdlc.getTitle() == 'CPCASREQ') {
      monvolVemgsa.setAdep(etatCpdlc.getDetail('ADEP'));
      monvolVemgsa.setAdes(etatCpdlc.getDetail('ADES'));
      monvolVemgsa.setAdrDeposee(etatCpdlc.getDetail('ARCADDR'));
      monvolVemgsa.setArcid(etatCpdlc.getDetail('ARCID'));
      monvolVemgsa.setLogonInitie(true);
    }
    
    if ((etatCpdlc.getTitle() == 'CPCASRES') && ( (etatCpdlc.getDetail('ATNASSOC') == 'S') ||  (etatCpdlc.getDetail('ATNASSOC') == 'L'))){
      monvolVemgsa.setLogonAccepte(true);
    }

    console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
    console.log("LogVEMGSA: ", etatCpdlc.getLog());

  });

    
console.log("ARCADDR: ",monvolVemgsa.getAdrDeposee(),"\nARCID: ",monvolVemgsa.getArcid(),
"\nAdep: ",monvolVemgsa.getAdep(), "\nAdes: ",monvolVemgsa.getAdes(), "\nLogonInitie: ",
monvolVemgsa.getLogonInitie(), "\nLogonAccepte: ",monvolVemgsa.getLogonAccepte() );


  console.log("fin logs VEMGSA collectes et tries");
  return monvolVemgsa;
}


//TODO : tester le fichier en entrée : existance, dates de validité pour savoir si l'aircraft id est bien dans le vemgsa ...
