import { Vol } from '../Modele/vol';
import { parseurLpln } from './parseurLpln';
import { parseurVemgsa } from './parseur';
import { grapheEtat } from './grapheEtat';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Identifiants, sameIdent } from '../Modele/identifiants';
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


export function identificationLpln(arcid: string, plnid: number, fichierSourceLpln: string): Identifiants {
  //Initialisation du vol issu des donnees LPLN
  let monvolLpln = new Vol(arcid, plnid);
  let pl = new parseurLpln();
  let idL = <Identifiants>{};
  idL = pl.identification(arcid, plnid, fichierSourceLpln);
  monvolLpln = pl.parseur(arcid, plnid, fichierSourceLpln);
  return idL;
}

export function identificationVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[]): Identifiants {
  //Initialisation du vol issu des donnees VEMGSA
  let monvolVemgsa = new Vol(arcid, plnid);
  let pv = new parseurVemgsa();
  let idV = <Identifiants>{};
  idV = pv.identification(arcid, plnid, fichierSourceVemgsa);

  monvolVemgsa = pv.parseur(arcid, plnid, fichierSourceVemgsa);
  return idV;
}


export function identificationF(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[]): Identifiants {
  let idL, idV = <Identifiants>{};

  if ((fichierSourceLpln != "") && (fichierSourceVemgsa[0] != "")) {
    console.log("cas 1")
    idL = identificationLpln(arcid, plnid, fichierSourceLpln);
    idV = identificationVemgsa(arcid, plnid, fichierSourceVemgsa);
    if (sameIdent(idL, idV) == true) {
      return idL;
    }
    else {
      idL.identifie = false;
      return idL;
    }
  }
  else {
    if (fichierSourceLpln != "") {
      console.log("cas 2")
      idL = identificationLpln(arcid, plnid, fichierSourceLpln);
      return idL;
    }
    if (fichierSourceVemgsa[0] != "") {
      console.log("cas 3")
      idV = identificationVemgsa(arcid, plnid, fichierSourceVemgsa);
      return idV;
    }
    else {
      console.log("cas 4")
      idL.identifie = false;
      return idL;
    }
  }

}



//Fonction a utiliser si fichiers LPLN ET VEMGSA definis  !!!!!!!!!!!!!!!!!!!!
export function mixInfos(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[]): Vol {


  console.log("identification : ", identificationF(arcid, plnid, fichierSourceLpln, fichierSourceVemgsa));

  if ((fichierSourceLpln != "") && (fichierSourceVemgsa[0] != "")) {

    //Initialisation du vol issu des donnees VEMGSA
    let monvolVemgsa = new Vol(arcid, plnid);
    let pv = new parseurVemgsa();
    //pv.identification(arcid, plnid, fichierSourceVemgsa);

    monvolVemgsa = pv.parseur(arcid, plnid, fichierSourceVemgsa);

    //Initialisation du vol issu des donnees LPLN
    let monvolLpln = new Vol(arcid, plnid);
    let pl = new parseurLpln();
    //pl.identification(arcid, plnid, fichierSourceLpln);
    monvolLpln = pl.parseur(arcid, plnid, fichierSourceLpln);

    //Initialisation du vol final issu des donnees LPLN et VEMGSA
    let monvolFinal = new Vol(arcid, plnid);
    const uneMinute: number = 60000;

    


    monvolVemgsa.getListeLogs().forEach((elt, key) => {
      let heureTransfert = "";
      let positionTransfert = "";
      monvolFinal.addElt(elt);

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

                }
              }
              if (eltL.getTitle() == 'FIN TRFDL') {
                if (dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2*uneMinute) {
                  //console.log("eltL", eltL.getTitle());
                  //console.log("eltL", eltL);
                  monvolFinal.addElt(eltL);
                }
              }
              if ((eltL.getTitle() == 'TRARTV') && (eltL.getDetaillog()['POSITION'] == positionTransfert)) {
                if (dates.diffHeuresLplnEgales(eltL.getHeure(), heureTransfert) <= 2*uneMinute) {
                  //console.log("eltL", eltL.getTitle());
                  //console.log("eltL", eltL);
                  monvolFinal.addElt(eltL);
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
    monvolFinal.setListeLogs(arrayLogTemp);

    monvolFinal = graphe.grapheMix(monvolFinal);

    

    monvolFinal.getListeLogs().forEach(etatCpdlc => {
      //console.log("contenu  map before: ",etatCpdlc.getDetaillog());
      console.log("heure: ", etatCpdlc.getHeure(), "msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
    });

    return monvolFinal;
  }


}









//TODO : tester le fichier en entrée : existance, dates de validité pour savoir si l'aircraft id est bien dans le vemgsa ...
