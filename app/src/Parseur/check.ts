import { Vol } from '../Modele/vol';
import { parseurLpln } from './parseurLpln';
import { parseurVemgsa } from './parseur';
import { Identifiants, sameIdent } from '../Modele/identifiants';
import * as dates from './date';
import * as grepV from "./grep";
import * as grepL from "./grepLPLN";
import { Contexte } from '../Modele/enumContexte';

export interface checkAnswer {
    valeurRetour: number; // 0: PAS TROUVE, 1 : TROUVE, 2: creneau horaire necessaire
    MessageRetour?: string
    plnid: number;
    arcid: string;
    // creneauHoraire?:dates.datesFile;
}

export function evaluationContexte(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[]): Contexte {


    let contexte: Contexte = Contexte.NONE;

    if ((fichierSourceLpln != "")) { // et test que le fichier s'ouvre
        if ((fichierSourceVemgsa[0] != "")) {
            contexte = Contexte.LPLNVEMGSA;
        }
        else {
            contexte = Contexte.LPLN;
        }
    }
    else {
        if ((fichierSourceVemgsa[0] != "")) {
            contexte = Contexte.VEMGSA;
        }

    }
    return contexte;
}
//Verifie que les fichiers donnes en entree existent et s'ouvre et les valeurs rentrees (arcid, plnid ) existent dans le fichier
export function checkInitial(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], contexte: Contexte): checkAnswer {

    let id = <Identifiants>{};
    let result = <dates.arrayDatesFile>{};
    let answer = <checkAnswer>{};
    answer.arcid = arcid;
    answer.plnid = plnid;
    answer.valeurRetour = 0;
    answer.MessageRetour = "Vol non trouve";


    switch (contexte) {
        case Contexte.LPLN:
            console.log(" Contexte.LPLN ");
            if ((arcid !== "") && (plnid == 0)) {
                if (grepL.isArcid(arcid, fichierSourceLpln) == true) {
                    answer.valeurRetour = 1;
                    answer.MessageRetour = "Vol trouve";
                }
            }
            if ((arcid == "") && (plnid !== 0)) {
                if (grepL.isPlnid(plnid, fichierSourceLpln) == true) {
                    answer.valeurRetour = 1;
                    answer.MessageRetour = "Vol trouve";
                }
            }
            break;
        case Contexte.VEMGSA:
            console.log(" Contexte.VEMGSA ");
            result.dates = new Array;
            if ((arcid !== "") && (plnid == 0)) {
                result = grepV.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa);
                if (result.existe == true) {
                    let creneau = new Array(<dates.datesFile>{});
                    console.log("creneaux trouves:", result.dates);
                    if (result.dates.length > 1) {
                        answer.valeurRetour = 2;
                        answer.MessageRetour = "trop de creneaux trouves";
                    }
                    else {
                        answer.valeurRetour = 1;
                        answer.MessageRetour = "Vol trouve";
                    }
                }
            }
            if ((arcid == "") && (plnid !== 0)) {
                result = grepV.isPlnidAndPlageHoraire(plnid, fichierSourceVemgsa);
                if (result.existe == true) {
                    let creneau = new Array(<dates.datesFile>{});
                    creneau = dates.getCreneaux(result.dates);
                    if (creneau.length > 1) {
                        answer.valeurRetour = 2;
                        answer.MessageRetour = "trop de creneaux trouves";
                    }
                    else {
                        answer.valeurRetour = 1;
                        answer.MessageRetour = "Vol trouve";
                    }
                }
            }
            break;
        case Contexte.LPLNVEMGSA:
            console.log(" Contexte.LPLNVEMGSA ");
            result.dates = new Array;
            if ((arcid !== "") && (plnid == 0)) {
                result = grepV.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa);

                if ((grepL.isArcid(arcid, fichierSourceLpln) == true) && (result.existe == true)) {
                    let creneau = new Array(<dates.datesFile>{});
                    console.log("creneaux trouves:", result.dates);
                    if (result.dates.length > 1) {
                        answer.valeurRetour = 2;
                        answer.MessageRetour = "trop de creneaux trouves";
                    }
                    else {
                        answer.valeurRetour = 1;
                        answer.MessageRetour = "Vol trouve";
                    }
                }
            }
            if ((arcid == "") && (plnid !== 0)) {
                result = grepV.isPlnidAndPlageHoraire(plnid, fichierSourceVemgsa);


                if ((grepL.isPlnid(plnid, fichierSourceLpln) == true) && (result.existe == true) ) {
                    let creneau = new Array(<dates.datesFile>{});
                    creneau = dates.getCreneaux(result.dates);
                    if (creneau.length > 1) {
                        answer.valeurRetour = 2;
                        answer.MessageRetour = "trop de creneaux trouves";
                    }
                    else {
                        answer.valeurRetour = 1;
                        answer.MessageRetour = "Vol trouve";
                    }
                }
            }
            break;
            case Contexte.NONE:
            console.log(" Contexte NONE ");
            break;
        default:
            console.log(" Contexte.default ");
            break;
    }


    console.log("checkInitial: ", answer);
    return answer;
}
export function check(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], horaire?: dates.datesFile): checkAnswer {

    let id = <Identifiants>{};
    let answer = <checkAnswer>{};
    answer.arcid = arcid;
    answer.plnid = plnid;
    answer.valeurRetour = 0;
    answer.MessageRetour = "Vol non trouve";



    id = identificationF(arcid, plnid, fichierSourceLpln, fichierSourceVemgsa, horaire);
    
    answer.arcid = id.arcid;
    answer.plnid = id.plnid;
    answer.valeurRetour = 0;
    answer.MessageRetour = "cas non etudie"
    if (id.identifie == true) {
        answer.valeurRetour = 1;
        answer.MessageRetour = "Vol trouve";
    }
    if (id.identifie == false) {
        answer.valeurRetour = 0;
        answer.MessageRetour = "Pas de vol correspondant trouve"
    }
    console.log("check: ", answer);
    return answer;
}


export function identificationLpln(arcid: string, plnid: number, fichierSourceLpln: string): Identifiants {
    //Initialisation du vol issu des donnees LPLN
    let monvolLpln = new Vol(arcid, plnid);
    let pl = new parseurLpln();
    let idL = <Identifiants>{};
    idL = pl.identification(arcid, plnid, fichierSourceLpln);
    return idL;
}

export function identificationVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[], horaire?: dates.datesFile): Identifiants {
    //Initialisation du vol issu des donnees VEMGSA
    let monvolVemgsa = new Vol(arcid, plnid);
    let pv = new parseurVemgsa();
    let idV = <Identifiants>{};
    idV = pv.identification(arcid, plnid, fichierSourceVemgsa, horaire);
    return idV;
}


export function identificationF(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], horaire?: dates.datesFile): Identifiants {
    let idL, idV = <Identifiants>{};

    if ((fichierSourceLpln != "") && (fichierSourceVemgsa[0] != "")) {
        console.log("cas 1")
        idL = identificationLpln(arcid, plnid, fichierSourceLpln);
        idV = identificationVemgsa(arcid, plnid, fichierSourceVemgsa, horaire);
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
            idV = identificationVemgsa(arcid, plnid, fichierSourceVemgsa, horaire);
            return idV;
        }
        else {
            console.log("cas 4")
            idL.identifie = false;
            return idL;
        }
    }

}

