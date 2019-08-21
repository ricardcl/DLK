import { Vol } from '../Modele/vol';
import { parseurLpln } from './parseurLpln';
import { parseurVemgsa } from './parseurVEMGSA';
import { Identifiants, sameIdent } from '../Modele/identifiants';
import * as dates from './date';
import * as grepV from "./grepVEMGSA";
import * as grepL from "./grepLPLN";
import { Contexte } from '../Modele/enumContexte';
import { checkAnswer, checkAnswerInitial } from '../Modele/checkAnswer';





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
 * Fonction permettant d'identifier le couple (arcid,plnid) dans le fichier LPLN fourni
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur 
 * @returns :     {plnid,arcid, identifie} ou identifie = true si le couple a été identifié et false sinon
 *                  et où plnid, arcid représent le couple s'il a pu être identifié
 */
export function identificationLpln(arcid: string, plnid: number, fichierSourceLpln: string, grepLPLN: grepL.GrepLPLN): Identifiants {
    //Initialisation du vol issu des donnees LPLN
    let pl = new parseurLpln(grepLPLN);
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
export function identificationVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[], grepVEMGSA: grepV.GrepVEMGSA, horaire?: dates.datesFile): Identifiants {
    //Initialisation du vol issu des donnees VEMGSA 
    let pv = new parseurVemgsa(grepVEMGSA);
    let idV = <Identifiants>{};
    idV = pv.identification(arcid, plnid, fichierSourceVemgsa, horaire);
    return idV;
}


/**
 * Fonction permettant de déterminer la validité des données LPLN rentrées par l'utilisateur 
 * Elle vérifie que les fichiers donnés en entree existent et s'ouvrent et les valeurs rentrees (arcid, plnid ) existent dans le fichier
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur ("" par défaut)
 * @param contexte : le contexte d'exécution lié aux types de fichiers logs en entrée
 * @returns {valeurRetour,messageRetour } 
 *   où valeurRetour indique si le checkInitial s'est bien déroulé :
 *   0: LPLN OK
 *   1 : LPLN incomplet 
 *   2 : LPLN KO 
 *   et où messageRetour donne une explication en cas d'echec
 */
function checkLPLN(arcid: string, plnid: number, fichierSourceLpln: string, contexte: Contexte, grepLPLN: grepL.GrepLPLN): checkAnswerInitial {
    let regexpPlnid: RegExp = /^\d{4}$/;
    let regexpArcid: RegExp = /^[a-z][a-z|0-9]{1,6}$/i;
    let id = <Identifiants>{};
    //let result = <dates.arrayDatesFile>{};
    let answer = <checkAnswerInitial>{};
    answer.valeurRetour = 2;
    answer.messageRetour = "arcid ou plnid non trouvé";
    answer.creneauHoraire = undefined;


    if (((arcid !== "") && (plnid == 0) && (!arcid.match(regexpArcid))) || ((arcid == "") && (plnid !== 0) && (!plnid.toString().match(regexpPlnid)))) {
        answer.valeurRetour = 2;
        answer.messageRetour = "format arcid ou plnid invalide";
        return answer;
    }

    try {
        console.log(" Contexte.LPLN ");
        if ((arcid !== "") && (plnid == 0)) {
            answer.arcid=arcid;
            if (grepLPLN.isArcid(arcid, fichierSourceLpln) == true) {
                id = identificationLpln(arcid, plnid, fichierSourceLpln,grepLPLN);
                if(id.identifie){
                    answer.plnid=id.plnid;
                    answer.valeurRetour = 0;
                    answer.messageRetour = "Vol trouve: "+id.arcid+" "+id.plnid;                      
                }
                else{
                    answer.valeurRetour = 1;
                    answer.messageRetour = "Vol Incomplet: "+id.arcid;                      
                }
            }
            else {
                answer.valeurRetour = 2;
                answer.messageRetour = "Arcid " + arcid + " non trouvé ";
            }
        }
        if ((arcid == "") && (plnid !== 0)) {
            answer.plnid=plnid;
            if (grepLPLN.isPlnid(plnid, fichierSourceLpln) == true) {
                id = identificationLpln(arcid, plnid, fichierSourceLpln,grepLPLN);
                if(id.identifie){
                    answer.arcid=id.arcid;
                    answer.valeurRetour = 0;
                    answer.messageRetour = "Vol trouve: "+id.arcid+" "+id.plnid;                      
                }
                else{
                    answer.valeurRetour = 1;
                    answer.messageRetour = "Vol Incomplet: "+id.plnid;                      
                }
            }
            else {
                answer.valeurRetour = 2;
                answer.messageRetour = "Plnid " + plnid + " non trouvé ";
            }
        }
    } catch (exception) {
        console.log("erreur lors de l'ouverture du fichier LPLN:", exception.code);
        answer.valeurRetour = 2;
        answer.messageRetour = "Erreur lors de l'ouverture du fichier LPLN";
    }
    console.log("CHECK LPLN");
    console.log("answer.arcid", answer.arcid);
    console.log("answer.plnid", answer.plnid);
    console.log("answer.valeurRetour", answer.valeurRetour);
    console.log("answer.messageRetour", answer.messageRetour);  
    return answer;
}

/**
 * Fonction permettant de déterminer la validité des données VEMGSA rentrées par l'utilisateur 
 * Elle vérifie que les fichiers donnés en entree existent et s'ouvrent et les valeurs rentrees (arcid, plnid ) existent dans le fichier
 * @param arcid : arcid rentré par l'utilisateur ("" par défaut)
 * @param plnid : plnid rentré par l'utilisateur (0 par défaut)
 * @param fichierSourceVemgsa : fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max)
 * @param contexte : le contexte d'exécution lié aux types de fichiers logs en entrée
 * @returns {valeurRetour,messageRetour } 
 *   où valeurRetour indique si le checkInitial s'est bien déroulé :
 *   0: VEMGSA complet
 *   1 : VEMGSA incomplet ( trop de créneaux VEMGSA trouvés )
 *   2 : VEMGSA NOK
 *   3 : VEMGSA OK mais creneau horaire à définir
 *   et où messageRetour donne une explication en cas d'echec
 */
function checkVEMGSA(arcid: string, plnid: number, fichierSourceVemgsa: string[], contexte: Contexte, grepVEMGSA: grepV.GrepVEMGSA, horaire?: dates.datesFile ): checkAnswerInitial {
    console.log(" Check VEMGSA ");
    let regexpPlnid: RegExp = /^\d{4}$/;
    let regexpArcid: RegExp = /^[a-z][a-z|0-9]{1,6}$/i;
    let id = <Identifiants>{};
    let result = <dates.arrayDatesFile>{};
    result.dates = new Array;
    let answer = <checkAnswerInitial>{};
    answer.valeurRetour = 2;
    answer.messageRetour = "arcid ou plnid non trouvé";
    answer.creneauHoraire = undefined;


    if (((arcid !== "") && (plnid == 0) && (!arcid.match(regexpArcid))) || ((arcid == "") && (plnid !== 0) && (!plnid.toString().match(regexpPlnid)))) {
        answer.valeurRetour = 2;
        answer.messageRetour = "format arcid ou plnid invalide";
        return answer;
    }

    try {
        if ((arcid !== "") && (plnid == 0)) {
            answer.arcid=arcid;
            //Recherche de l'ARCID dans le fichier VEMGSA
            result = grepVEMGSA.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa);
            if (result.existe == true) {
                let creneau = new Array(<dates.datesFile>{});
                creneau = dates.getCreneaux(result.dates);
                console.log("creneaux trouves 1:", creneau);

                console.log("creneaux trouves 2 :", result.dates);
                if (result.dates.length > 1) {
                    answer.valeurRetour = 4;
                    answer.messageRetour = "trop de creneaux trouves: " + creneau;
                }
                else {
                    id = identificationVemgsa(arcid, plnid, fichierSourceVemgsa, grepVEMGSA, horaire);
                    if (id.identifie){
                        answer.plnid=id.plnid;
                        answer.valeurRetour = 0;
                        answer.messageRetour = "Vol trouve: "+id.arcid+" "+id.plnid;
                        //  answer.creneauHoraire = creneau[0];
                        //  console.log("creneaux trouves [0]:",creneau);
                    }
                    else {
                        answer.valeurRetour = 1;
                        answer.messageRetour = "Vol Incomplet: "+id.arcid;     
                    }

                }
            }
            else {
                console.log("arcid non trouvé");
                answer.valeurRetour = 2;
                answer.messageRetour = "arcid " + arcid + " non trouvé ";
            }
        }
        if ((arcid == "") && (plnid !== 0)) {
            answer.plnid=plnid;
            result = grepVEMGSA.isPlnidAndPlageHoraire(plnid, fichierSourceVemgsa);
            if (result.existe == true) {
                let creneau = new Array(<dates.datesFile>{});
                creneau = dates.getCreneaux(result.dates);
                if (creneau.length > 1) {
                    answer.valeurRetour = 4;
                    answer.messageRetour = "trop de creneaux trouves: " + creneau;
                }
                else {
                    id = identificationVemgsa(arcid, plnid, fichierSourceVemgsa, grepVEMGSA, horaire);
                    if (id.identifie){
                        answer.arcid=id.arcid;
                        answer.valeurRetour = 0;
                        answer.messageRetour = "Vol trouve: "+id.arcid+" "+id.plnid;
                        //  answer.creneauHoraire = creneau[0];
                        //  console.log("creneaux trouves [0]:",creneau);
                    }
                    else {
                        answer.valeurRetour = 1;
                        answer.messageRetour = "Vol Incomplet: "+id.plnid;     
                    }
                }
            }
            else {
                console.log("plnid non trouvé");
                answer.valeurRetour = 2;
                answer.messageRetour = "plnid " + plnid + " non trouvé ";
            }
        }
    } catch (exception) {
        console.log("erreur lors de l'ouverture du fichier VEMGSA:", exception.code);
        answer.valeurRetour = 2;
        answer.messageRetour = "Erreur lors de l'ouverture du fichier VEMGSA";
    }
    console.log("CHECK VEMGSA");
    console.log("answer.arcid", answer.arcid);
    console.log("answer.plnid", answer.plnid);
    console.log("answer.valeurRetour", answer.valeurRetour);
    console.log("answer.messageRetour", answer.messageRetour);  
    return answer;
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
 *   0: LPLN ET VEMGSA OK
 *   1 : LPLN OK ET VEMGSA incomplet ( trop de créneaux VEMGSA trouvés )
 *   2 : LPLN OK ET VEMGSA NOK
 *   3 : LPLN NOK ET VEMGSA complet
 *   4 : LPLN NOK ET VEMGSA incomplet
 *   5 : LPLN NOK ET VEMGSA NOK
 *   et où messageRetour donne une explication en cas d'echec
 */
export function check(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], contexte: Contexte, grepLPLN: grepL.GrepLPLN, grepVEMGSA: grepV.GrepVEMGSA, horaire?: dates.datesFile): checkAnswer {

    let id = <Identifiants>{};
    let result = <dates.arrayDatesFile>{};
    let answer = <checkAnswer>{};
    answer.analysePossible=false;
    answer.checkLPLN = <checkAnswerInitial>{};
    answer.checkVEMGSA = <checkAnswerInitial>{};
    answer.creneauHoraire = undefined;

    switch (contexte) {
        case Contexte.LPLN:
                answer.checkLPLN = checkLPLN(arcid, plnid, fichierSourceLpln, contexte, grepLPLN);
                console.log("Contexte LPLN");
                console.log("resultat du check : "+answer.checkLPLN );
                console.log("arcid : "+answer.checkLPLN.arcid );
                console.log("plnid : "+answer.checkLPLN.plnid );
                console.log("messageRetour : "+answer.checkLPLN.messageRetour );
                console.log("valeurRetour : "+answer.checkLPLN.valeurRetour );
               if (answer.checkLPLN.valeurRetour != 2){
                   answer.analysePossible = true;
               }                 
            break;
        case Contexte.VEMGSA:
            answer.checkVEMGSA = checkVEMGSA(arcid, plnid, fichierSourceVemgsa, contexte, grepVEMGSA);
            console.log("Contexte VEMGSA");
            console.log("resultat du check : "+answer.checkVEMGSA );
           if (answer.checkVEMGSA.valeurRetour < 2){
               answer.analysePossible = true;
           }  
            break;
        case Contexte.LPLNVEMGSA:
            answer.checkLPLN = checkLPLN(arcid, plnid, fichierSourceLpln, contexte, grepLPLN);
            answer.checkVEMGSA = checkVEMGSA(arcid, plnid, fichierSourceVemgsa, contexte, grepVEMGSA);
            console.log("Contexte LPLN et VEMGSA");
            console.log("resultat du check LPLN: "+answer.checkLPLN );
            console.log("resultat du check VEMGSA: "+answer.checkVEMGSA );
            if((answer.checkLPLN.valeurRetour != 2) || (answer.checkVEMGSA.valeurRetour < 2)){
                answer.analysePossible = true;
            }
            break;
        case Contexte.NONE:
            console.log(" Contexte NONE ");
            break;
        default:
            console.log(" Contexte.default ");
            break;
    }

console.log("Analyse Possible ? : ",+answer.analysePossible);

    return answer;
}








