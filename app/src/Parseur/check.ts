import { Vol } from '../Modele/vol';
import { parseurLpln } from './parseurLpln';
import { parseurVemgsa } from './parseur';
import { Identifiants, sameIdent } from '../Modele/identifiants';
import * as dates from './date';
import * as grepV from "./grep";
import * as grepL from "./grepLPLN";
import { Contexte } from '../Modele/enumContexte';
import { checkAnswer } from '../Modele/checkAnswer';





/**
 * Fonction permettant de déterminer le contexte d'étude en fonction des fichiers de logs fournis
 * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur ("" par défaut)
 * @param fichierSourceVemgsa : fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max)
 * @returns :   LPLN si uniquement le fichier LPLN est fourni
 *              VEMGSA si uniquement un ou deux fichiers VEMGSA sont fournis
 *              LPLNVEMGSA si le fichier LPLN est fourni avec un ou deux fichiers VEMGSA 
 *              NONE sinon
 */
export function evaluationContexte(fichierSourceLpln: string, fichierSourceVemgsa: string[]): Contexte {

    let contexte: Contexte = Contexte.NONE;

    if ((fichierSourceLpln != "")) { // et test que le fichier s'ouvre
        if ((fichierSourceVemgsa.length !== 0)) {
            contexte = Contexte.LPLNVEMGSA;
        }
        else {
            contexte = Contexte.LPLN;
        }
    }
    else {
        if ((fichierSourceVemgsa.length !== 0)) {
            contexte = Contexte.VEMGSA;
        }

    }
    return contexte;
}


/**
 * Fonction permettant de déterminer la validité des données rentrées par l'utilisateur 
 * Elle vérifie que les fichiers donnés en entree existent et s'ouvrent et les valeurs rentrees (arcid, plnid ) existent dans le fichier
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur ("" par défaut)
 * @param fichierSourceVemgsa : fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max)
 * @param contexte : le contexte d'exécution lié aux types de fichiers logs en entrée
 * @returns {valeurRetour,messageRetour } 
 *   où valeurRetour indique si le checkInitial s'est bien déroulé :
 *   0: arcid et plnid trouvés, 
 *   1 : arcid ou plnid non trouvé 
 *   2 : arcid ou plnid trouvés dans des plages horaires distinctes
 *   3 : probleme d'ouverture de fichier,  
 *   4 : format arcid ou plnid invalide
 *   et où messageRetour donne une explication en cas d'echec
 */
export function checkInitial(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], contexte: Contexte): checkAnswer {
    let regexpPlnid: RegExp = /^\d{4}$/;
    let regexpArcid: RegExp = /^[a-z][a-z|0-9]{1,6}$/i;
    let id = <Identifiants>{};
    let result = <dates.arrayDatesFile>{};
    let answer = <checkAnswer>{};
    answer.valeurRetour = 1;
    answer.messageRetour = "arcid ou plnid non trouvé";

    console.log("fichierSourceVemgsa: ", fichierSourceVemgsa);


    if (((arcid !== "") && (plnid == 0) && (!arcid.match(regexpArcid))) || ((arcid == "") && (plnid !== 0) && (!plnid.toString().match(regexpPlnid)))) {
        answer.valeurRetour = 4;
        answer.messageRetour = "format arcid ou plnid invalide";
        return answer;
    }

    switch (contexte) {
        case Contexte.LPLN:
            //   try {
            console.log(" Contexte.LPLN ");
            if ((arcid !== "") && (plnid == 0)) {
                if (grepL.isArcid(arcid, fichierSourceLpln) == true) {
                    answer.valeurRetour = 0;
                    answer.messageRetour = "Vol trouve";
                }
            }
            if ((arcid == "") && (plnid !== 0)) {
                if (grepL.isPlnid(plnid, fichierSourceLpln) == true) {
                    answer.valeurRetour = 0;
                    answer.messageRetour = "Vol trouve";
                }
            }
            /**  } catch (exception) {
                  console.log("erreur lors de l'ouverture du fichier LPLN:", exception.code);
                  answer.valeurRetour = 3;
                  answer.messageRetour = "Erreur lors de l'ouverture du fichier LPLN";
              }*/
            break;
        case Contexte.VEMGSA:
            try {
                console.log(" Contexte.VEMGSA ");
                result.dates = new Array;
                if ((arcid !== "") && (plnid == 0)) {
                    result = grepV.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa);
                    if (result.existe == true) {
                        let creneau = new Array(<dates.datesFile>{});
                        console.log("creneaux trouves:", result.dates);
                        if (result.dates.length > 1) {
                            answer.valeurRetour = 2;
                            answer.messageRetour = "trop de creneaux trouves: " + creneau;
                        }
                        else {
                            answer.valeurRetour = 0;
                            answer.messageRetour = "Vol trouve";
                            answer.creneauHoraire = creneau[0];
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
                            answer.messageRetour = "trop de creneaux trouves: " + creneau;
                        }
                        else {
                            answer.valeurRetour = 0;
                            answer.messageRetour = "Vol trouve";
                            answer.creneauHoraire = creneau[0];
                        }
                    }
                }
            } catch (exception) {
                console.log("erreur lors de l'ouverture du fichier VEMGSA:", exception.code);
                answer.valeurRetour = 3;
                answer.messageRetour = "Erreur lors de l'ouverture du fichier VEMGSA";
            }
            break;
        case Contexte.LPLNVEMGSA:
            try {
                console.log(" Contexte.LPLNVEMGSA ");
                result.dates = new Array;
                if ((arcid !== "") && (plnid == 0)) {
                    result = grepV.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa);
                    console.log("result", result);

                    if ((grepL.isArcid(arcid, fichierSourceLpln) == true) && (result.existe == true)) {
                        let creneau = new Array(<dates.datesFile>{});
                        console.log("creneaux trouves:", result.dates);
                        if (result.dates.length > 1) {
                            answer.valeurRetour = 2;
                            answer.messageRetour = "trop de creneaux trouves: " + creneau;
                        }
                        else {
                            answer.valeurRetour = 0;
                            answer.messageRetour = "Vol trouve";
                            answer.creneauHoraire = creneau[0];
                        }
                    }
                }
                if ((arcid == "") && (plnid !== 0)) {
                    result = grepV.isPlnidAndPlageHoraire(plnid, fichierSourceVemgsa);


                    if ((grepL.isPlnid(plnid, fichierSourceLpln) == true) && (result.existe == true)) {
                        let creneau = new Array(<dates.datesFile>{});
                        creneau = dates.getCreneaux(result.dates);
                        if (creneau.length > 1) {
                            answer.valeurRetour = 2;
                            answer.messageRetour = "trop de creneaux trouves: " + creneau;
                        }
                        else {
                            answer.valeurRetour = 0;
                            answer.messageRetour = "Vol trouve";
                            answer.creneauHoraire = creneau[0];
                        }
                    }
                }
            } catch (exception) {
                console.log("erreur lors de l'ouverture des fichiers LPLN et VEMGSA:", exception.code);
                answer.valeurRetour = 3;
                answer.messageRetour = "Erreur lors de l'ouverture des fichiers LPLN et VEMGSA";
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


/**
 * 
 * Fonction permettant de déterminer le couple (arcid, plnid) en fonction des données rentrées par l'utilisateur  (arcid ou plnid)
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur ("" par défaut)
 * @param fichierSourceVemgsa : fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max)
 * @param horaire : horaire permettant de restreindre les informations à traiter dans les fichiers de logs fournis (facultatif) 
 * @returns { valeurRetour,messageRetour,arcid, plnid } 
 *   où valeurRetour indique si le check s'est bien déroulé : 0: COUPLE TROUVE, 1 : COUPLE NON TROUVE, 2: creneau horaire necessaire
 *   et où messageRetour donne une explication en cas d'echec
 */
export function check(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], contexte: Contexte, horaire?: dates.datesFile): checkAnswer {

    let id = <Identifiants>{};
    let answer = <checkAnswer>{};
    answer.arcid = arcid;
    answer.plnid = plnid;
    answer.valeurRetour = 1;
    answer.messageRetour = "Vol non trouve";

    id = identificationF(arcid, plnid, fichierSourceLpln, fichierSourceVemgsa, contexte, horaire);

    answer.arcid = id.arcid;
    answer.plnid = id.plnid;
    answer.valeurRetour = 0;
    answer.messageRetour = "cas non etudie"
    if (id.identifie == true) {
        answer.valeurRetour = 0;
        answer.messageRetour = "Vol trouve";
    }
    if (id.identifie == false) {
        answer.valeurRetour = 1;
        answer.messageRetour = "Pas de vol correspondant trouve"
    }
    console.log("check: ", answer);
    return answer;
}


/**
 * Fonction permettant d'identifier le couple (arcid,plnid) dans le fichier LPLN fourni
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur 
 * @returns :     {plnid,arcid, identifie} ou identifie = true si le couple a été identifié et false sinon
 *                  et où plnid, arcid représent le couple s'il a pu être identifié
 */
export function identificationLpln(arcid: string, plnid: number, fichierSourceLpln: string): Identifiants {
    //Initialisation du vol issu des donnees LPLN
    let monvolLpln = new Vol(arcid, plnid);
    let pl = new parseurLpln();
    let idL = <Identifiants>{};
    idL = pl.identification(arcid, plnid, fichierSourceLpln);
    return idL;
}

/**
 * Fonction permettant d'identifier le couple (arcid,plnid) dans le fichier VEMGSA fourni
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceVemgsa : fichier(s) VEMGSA rentré par l'utilisateur 
 * @param horaire : l'horaire rentré par l'utilisateur (facultatif)
 * @returns :     {plnid,arcid, identifie} ou identifie = true si le couple a été identifié et false sinon
 *                  et où plnid, arcid représent le couple s'il a pu être identifié
 */
export function identificationVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[], horaire?: dates.datesFile): Identifiants {
    //Initialisation du vol issu des donnees VEMGSA
    let monvolVemgsa = new Vol(arcid, plnid);
    let pv = new parseurVemgsa();
    let idV = <Identifiants>{};
    idV = pv.identification(arcid, plnid, fichierSourceVemgsa, horaire);
    return idV;
}

/**
 * Fonction permettant d'identifier le couple (arcid,plnid) dans l'ensemble des fichiers de logs fournis
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur 
 * @param fichierSourceVemgsa : fichier(s) VEMGSA rentré par l'utilisateur
 * @param horaire : l'horaire rentré par l'utilisateur (facultatif)
 * @returns :     {plnid,arcid, identifie} ou identifie = true si le couple a été identifié et false sinon
 *                  et où plnid, arcid représent le couple s'il a pu être identifié
 */
export function identificationF(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], contexte: Contexte, horaire?: dates.datesFile): Identifiants {
    let idL, idV = <Identifiants>{};

    switch (contexte) {
        case Contexte.LPLN:
            console.log("cas 2")
            idL = identificationLpln(arcid, plnid, fichierSourceLpln);
            return idL;

            break;
        case Contexte.VEMGSA:
            console.log("cas 3")
            idV = identificationVemgsa(arcid, plnid, fichierSourceVemgsa, horaire);
            return idV;

            break;
        case Contexte.LPLNVEMGSA:
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
            break;
        default:
            console.log("cas 4")
            idL.identifie = false;
            return idL;
            break;

    }


}

