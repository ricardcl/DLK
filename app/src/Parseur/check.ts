import { Vol } from '../Modele/vol';
import { parseurLpln } from './parseurLpln';
import { parseurVemgsa } from './parseur';
import { Identifiants, sameIdent } from '../Modele/identifiants';
import * as dates from './date';
import * as grep from "./grep";

export interface checkAnswer {
    valeurRetour: number; // 0: PAS TROUVE, 1 : TROUVE, 2: creneau horaire necessaire
    MessageRetour?: string
    plnid: number;
    arcid: string;
    // creneauHoraire?:dates.datesFile;
}


//Verifie que les fichiers donnes en entree existent et s'ouvre et les valeurs rentrees (arcid, plnid ) existent dans le fichier
export function checkInitial(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], horaire?: dates.datesFile): checkAnswer {

    let id = <Identifiants>{};
    let answer = <checkAnswer>{};
    answer.arcid = arcid;
    answer.plnid = plnid;
    answer.valeurRetour = 0;
    answer.MessageRetour = "Vol non trouve";



    if ((fichierSourceLpln == "") && (fichierSourceVemgsa[0] != "")) {

        let result = <dates.arrayDatesFile>{};
        result.dates = new Array;
       // if ((arcid !== "") && (plnid == 0)) {
       // }
        if ((arcid == "") && (plnid !== 0)) {
            
            result= grep.isPlnidAndPlageHoraire(fichierSourceVemgsa,plnid);
            if (result.existe == true){
                let creneau = new Array (<dates.datesFile>{});
                creneau = dates.getCreneaux(result.dates);
                if (creneau.length > 1){
                    answer.valeurRetour = 2;
                    answer.MessageRetour = "trop de creneaux trouves";     
                }
                else{
                    answer.valeurRetour = 1;
                    answer.MessageRetour = "Vol trouve";
                }
            }

        }
    }
    console.log("answer: ",answer);
    
return answer;
}
export function check(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[],  horaire?: dates.datesFile): checkAnswer {

    let id = <Identifiants>{};
    let answer = <checkAnswer>{};
    answer.arcid = arcid;
    answer.plnid = plnid;
    answer.valeurRetour = 0;
    answer.MessageRetour = "Vol non trouve";



    id = identificationF(arcid, plnid, fichierSourceLpln, fichierSourceVemgsa, horaire);

    answer.arcid = id.arcid;
    answer.plnid = id.plnid;
    if (id.identifie == true) {
        answer.valeurRetour = 1;
    }
    if (id.identifie == false) {
        answer.valeurRetour = 0;
        answer.MessageRetour = "Pas de vol correspondant trouve"
    }

    else {
        answer.valeurRetour = 0;
        answer.MessageRetour = "cas non etudie"
    }


    return answer;
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

export function identificationVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[], horaire?: dates.datesFile): Identifiants {
    //Initialisation du vol issu des donnees VEMGSA
    let monvolVemgsa = new Vol(arcid, plnid);
    let pv = new parseurVemgsa();
    let idV = <Identifiants>{};
    idV = pv.identification(arcid, plnid, fichierSourceVemgsa, horaire);

    monvolVemgsa = pv.parseur(arcid, plnid, fichierSourceVemgsa);
    return idV;
}


export function identificationF(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[],  horaire?: dates.datesFile): Identifiants {
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
            idV = identificationVemgsa(arcid, plnid, fichierSourceVemgsa,horaire);
            return idV;
        }
        else {
            console.log("cas 4")
            idL.identifie = false;
            return idL;
        }
    }

}

