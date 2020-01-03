import { Identifiants } from '../Modele/identifiants'; 
import { Contexte } from '../Modele/enumContexte'; 
import { checkAnswer, checkAnswerInitial } from '../Modele/checkAnswer'; 
import { Dates, datesFile, arrayDatesFile } from './date'; 
import { GrepVEMGSA } from './grepVEMGSA'; 
import { GrepLPLN } from './grepLPLN'; 
 
 
 
export class Check { 
 
    private dates: Dates; 
 
    constructor() { 
        console.log("Je rentre dans le constructor Check "); 
 
        this.dates = new Dates(); 
    } 
    /** 
     * Fonction permettant de déterminer le contexte d'étude en fonction des fichiers de logs fournis 
     * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur ("" par défaut) 
     * @param fichierSourceVemgsa : fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max) 
     * @returns :   LPLN si uniquement le fichier LPLN est fourni 
     *              VEMGSA si uniquement un ou deux fichiers VEMGSA sont fournis 
     *              LPLNVEMGSA si le fichier LPLN est fourni avec un ou deux fichiers VEMGSA  
     *              NONE sinon 
     */ 
 
    public evaluationContexte(fichierSourceLpln: string, fichierSourceVemgsa: string[]): Contexte { 
        console.log("Classe check Fonction evaluationContexte"); 
 
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
    public identificationLpln(arcid: string, plnid: number, fichierSourceLpln: string, grepLPLN: GrepLPLN): Identifiants { 
        //Initialisation du vol issu des donnees LPLN 
        console.log("Classe check Fonction identificationLpln"); 
 
 
        let tabId: Identifiants[]; 
        let id = <Identifiants>{}; 
        id.arcid = ""; 
        id.plnid = 0; 
        id.identifie = false; 
        id.dates=<datesFile>{};
 
        tabId = grepLPLN.grepPlnidAndArcid(fichierSourceLpln); 
        tabId.forEach(element => { 
            if (element.arcid == arcid) { 
                id.arcid = arcid; 
                id.plnid = element.plnid; 
                id.identifie = true; 
            } 
            else if (element.plnid == plnid) { 
                id.plnid = plnid; 
                id.arcid = element.arcid; 
                id.identifie = true; 
            } 
        }); 
        if (id.identifie) { 
            id.dates = grepLPLN.grepDatesLogLPLN(id.arcid,id.plnid,fichierSourceLpln); 
        }
        else { 
            id.tabId = tabId; 
        } 
        console.log("Fonction Check LPLN tests dates");
        
        console.log(" id.arcid: ", id.arcid, " id.plnid: ", id.plnid, " id.identifie: ", id.identifie);
        console.log( " id.dates.dateMin: ",id.dates.dateMin, " id.dates.dateMax: ",id.dates.dateMax);
        console.log(" id.tabId: ", id.tabId); 
        return id; 
    } 
 
 
 
 
    /** 
     * Fonction permettant d'identifier le couple (arcid,plnid) dans le fichier VEMGSA fourni 
     * @param arcid : arcid rentré par l'utilisateur ("" par défaut) 
     * @param plnid : plnid rentré par l'utilisateur (0 par défaut) 
     * @param fichierSourceVemgsa : fichier(s) VEMGSA rentré par l'utilisateur  
     * @param creneau : l'horaire du log de l'arcid ou du plnid précédemment trouvé 
     * @param horaire : l'horaire rentré par l'utilisateur (facultatif) 
     * @returns :     {plnid,arcid, identifie} ou identifie = true si le couple a été identifié et false sinon 
     *                  et où plnid, arcid représent le couple s'il a pu être identifié 
     */ 
    private identificationVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[], grepVEMGSA: GrepVEMGSA, creneau: datesFile, horaire?: datesFile): Identifiants { 
        //Initialisation du vol issu des donnees VEMGSA  
        console.log("Classe check Fonction identificationVemgsa"); 
 
        let id = <Identifiants>{}; 
        id.identifie = false; 
 
        //console.log("arcid : "+arcid); 
        //console.log("plnid : "+plnid); 
        if ((arcid == "") && (plnid !== 0)) { 
 
            for (let fichier of fichierSourceVemgsa) { 
                //console.log("fichier : ", fichier); 
                //console.log("fichierSourceVemgsa : ", fichierSourceVemgsa); 
 
                arcid = grepVEMGSA.grepArcidFromPlnid(plnid, fichier, creneau, horaire); 
 
                if (arcid !== "") { 
                    //console.log("arcid trouve : "+arcid); 
                    id.identifie = true; 
                    break; 
                } 
            } 
 
 
        } 
        if ((arcid !== "") && (plnid == 0)) { 
            for (let fichier of fichierSourceVemgsa) { 
                plnid = grepVEMGSA.grepPlnidFromArcid(arcid, fichier, creneau, horaire); 
                if (plnid !== 0) { 
                    //console.log("plnid trouve : "+plnid); 
                    id.identifie = true; 
                    break; 
                } 
            } 
        } 
 
 
        id.plnid = plnid; 
        id.arcid = arcid; 
 
 
        console.log(" id.arcid: ", id.arcid, " id.plnid: ", id.plnid, " id.identifie: ", id.identifie); 
        return id; 
    } 
 
 
 
 
    /** 
     * Fonction permettant de déterminer la validité des données LPLN rentrées par l'utilisateur  
     * Elle vérifie que les fichiers donnés en entree existent et s'ouvrent et les valeurs rentrees (arcid, plnid ) existent dans le fichier 
     * @param arcid : arcid rentré par l'utilisateur ("" par défaut) 
     * @param plnid : plnid rentré par l'utilisateur (0 par défaut) 
     * @param fichierSourceLpln : fichier LPLN rentré par l'utilisateur ("" par défaut) 
     * @param contexte : le contexte d'exécution lié aux types de fichiers logs en entrée 
     * @returns {valeurRetour,arcid, plnid }  
     *   où valeurRetour indique si le checkInitial s'est bien déroulé : 
     *   0 : LPLN OK : arcid et plnid identifies 
     *   1 : LPLN incomplet , arcid ou plnid non trouve 
     *   2 : format arcid ou plnid invalide 
     *   3 : erreur a louverture du fichier LPLN 
     *   et où messageRetour donne une explication en cas d'echec 
     */ 
    private checkLPLN(arcid: string, plnid: number, fichierSourceLpln: string, contexte: Contexte, grepLPLN: GrepLPLN): checkAnswerInitial { 
        console.log("Classe check Fonction checkLPLN"); 
 
        let regexpPlnid: RegExp = /^\d{1,4}$/; 
        let regexpArcid: RegExp = /^[a-z][a-z|0-9]{1,6}$/i; 
        let id = <Identifiants>{}; 
        //let result = <dates.arrayDatesFile>{}; 
        let answer = <checkAnswerInitial>{}; 
        answer.valeurRetour = 2; 
        answer.arcid = ""; 
        answer.plnid = 0; 
 
 
        if (((arcid !== "") && (plnid == 0) && (!arcid.match(regexpArcid))) || ((arcid == "") && (plnid !== 0) && (!plnid.toString().match(regexpPlnid)))) { 
            return answer; 
        } 
 
        try { 
            console.log(" Contexte.LPLN "); 
            if ((arcid !== "") && (plnid == 0)) { 
                answer.arcid = arcid; 
 
                id = this.identificationLpln(arcid, plnid, fichierSourceLpln, grepLPLN); 
                if (id.identifie) { // SI COUPLE PLNID ARCID TROUVE A PARTIR DE L ARCID 
 
                    //RECUPERATION DES LOGS CPDLC 
                    grepLPLN.grepLogLPLN(arcid, id.plnid, fichierSourceLpln); 
                    // TEST VOL DECLARE CPDLC 
                    //TODO 
                    answer.plnid = id.plnid; 
                    answer.valeurRetour = 0; 
                } 
                else {  // COUPLE PLNID ARCID NON TROUVE A PARTIR DE L ARCID 
                    answer.valeurRetour = 1; 
                    answer.tabId = id.tabId; 
                    console.log("answer.tabId trouvee : ", answer.tabId); 
                } 
 
            } 
            if ((arcid == "") && (plnid !== 0)) { 
                answer.plnid = plnid; 
                id = this.identificationLpln(arcid, plnid, fichierSourceLpln, grepLPLN); 
                if (id.identifie) { 
                    //RECUPERATION DES LOGS CPDLC 
                    grepLPLN.grepLogLPLN(id.arcid, plnid, fichierSourceLpln); 
                    // TEST VOL DECLARE CPDLC 
                    //TODO 
                    answer.arcid = id.arcid; 
                    answer.valeurRetour = 0; 
                } 
                else { 
                    answer.valeurRetour = 1; 
                    answer.tabId = id.tabId; 
                    console.log("answer.tabId trouvee : ", answer.tabId); 
                } 
            } 
        } catch (exception) { 
            console.log("erreur lors de l'ouverture du fichier LPLN:", exception.code); 
            answer.valeurRetour = 2; 
        } 
        console.log("CHECK LPLN"); 
        console.log("answer.arcid", answer.arcid); 
        console.log("answer.plnid", answer.plnid); 
        console.log("answer.valeurRetour", answer.valeurRetour); 
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
     *   1 : VEMGSA incomplet ( arcid trouvé mais plnid non trouve ) 
     *   2 : VEMGSA incomplet ( plnid trouvé mais arcid non trouve) 
     *   3 : VEMGSA incomplet ( plnid non trouve car connexion refusee ) 
     *   4 : VEMGSA incomplet ( arcid non trouve car ...) 
     *   5 : VEMGSA NOK ( trop de creneaux horaires trouves) 
     *   6 : VEMGSA NOK ( pas d'info trouvé pour l'id donné) 
     *   7 : VEMGSA NOK ( erreur format identifiant) 
     *   8 : VEMGSA NOK ( pbm ouverture du fichier) 
     *   et où messageRetour donne une explication en cas d'echec 
     */ 
    public checkVEMGSA(arcid: string, plnid: number, fichierSourceVemgsa: string[], contexte: Contexte, grepVEMGSA: GrepVEMGSA, horaire?: datesFile): checkAnswerInitial { 
        console.log("Classe check Fonction checkVEMGSA"); 
 
        let regexpPlnid: RegExp = /^\d{1,4}$/; 
        let regexpArcid: RegExp = /^[a-z][a-z|0-9]{1,6}$/i; 
        let id = <Identifiants>{}; 
        let result = <arrayDatesFile>{}; 
        result.dates = new Array; 
        let answer = <checkAnswerInitial>{}; 
        answer.valeurRetour = 7; 
        answer.plnid = 0; 
        answer.arcid = ""; 
 
 
        if (((arcid !== "") && (plnid == 0) && (!arcid.match(regexpArcid))) || ((arcid == "") && (plnid !== 0) && (!plnid.toString().match(regexpPlnid)))) { 
            return answer; 
        } 
 
        try { 
            if ((arcid !== "") && (plnid == 0)) { 
                answer.arcid = arcid; 
                //Recherche de l'ARCID dans le fichier VEMGSA 
                if (horaire === undefined) { 
                    result = grepVEMGSA.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa); 
                    console.log(" result   :", result); 
                    if (result.existe == true) { 
                        let creneau = new Array(<datesFile>{}); 
                        creneau = this.dates.getCreneaux(result.dates); 
 
                        console.log("cas A1 : result.dates.length", result.dates.length); 
                        console.log("cas A1 : creneau", creneau); 
                        creneau.length 
                        if (creneau.length > 1) { 
                            answer.valeurRetour = 5; 
                            answer.tabHoraires = creneau; 
                            console.log("cas A: creneaux: ", creneau); 
 
                            //TODO renvoyer les creneaux trouves 
                        } 
                        else { 
                            id = this.identificationVemgsa(arcid, plnid, fichierSourceVemgsa, grepVEMGSA, creneau[0], horaire); 
                            if (id.identifie) { 
                                answer.plnid = id.plnid; 
                                answer.valeurRetour = 0; 
                                answer.creneauVemgsa = creneau[0]; 
                                //  answer.creneauHoraire = creneau[0]; 
                                //  console.log("creneaux trouves [0]:",creneau); 
                            } 
                            else { 
                                //TODO cas 1 ou 3 à analyse !!! 
                                answer.valeurRetour = 1; 
                                answer.datesFichierVemgsa = grepVEMGSA.grepPlagesHorairesFichiers(fichierSourceVemgsa); 
                                console.log("answer.datesFichierVemgsa", answer.datesFichierVemgsa); 
                                answer.creneauVemgsa = creneau[0]; 
 
                                //TODO renvoyer la plage horaire etudiee 
                            } 
 
                        } 
                    } 
                    else { 
                        console.log("arcid non trouvé"); 
                        answer.valeurRetour = 6; 
                        answer.datesFichierVemgsa = grepVEMGSA.grepPlagesHorairesFichiers(fichierSourceVemgsa); 
                        console.log("answer.datesFichierVemgsa", answer.datesFichierVemgsa); 
                        //TODO renvoyer la plage horaire etudiee 
                    } 
                } 
                else { 
                    //Analyse a partir de l'horaire fourni 
                    result = grepVEMGSA.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa, horaire); 
                    if (result.existe == true) { 
                        let creneau = new Array(<datesFile>{}); 
                        creneau = this.dates.getCreneaux(result.dates); 
 
 
                        if (creneau.length > 1) { 
                            answer.valeurRetour = 5; 
                            answer.tabHoraires = creneau; 
                            console.log("cas B: creneaux: ", creneau); 
 
                            //TODO renvoyer les creneaux trouves 
                        } 
                        else { 
                            id = this.identificationVemgsa(arcid, plnid, fichierSourceVemgsa, grepVEMGSA, creneau[0], horaire); 
                            if (id.identifie) { 
                                answer.plnid = id.plnid; 
                                answer.valeurRetour = 0; 
                                answer.creneauVemgsa = creneau[0]; 
                                //  answer.creneauHoraire = creneau[0]; 
                                //  console.log("creneaux trouves [0]:",creneau); 
                            } 
                            else { 
                                //TODO cas 1 ou 3 à analyse !!! 
                                answer.valeurRetour = 1; 
                                answer.creneauVemgsa = creneau[0]; 
                                //TODO renvoyer la plage horaire etudiee 
                            } 
 
                        } 
                    } 
                    else { 
                        console.log("arcid non trouvé"); 
                        answer.valeurRetour = 6; 
                        answer.datesFichierVemgsa = grepVEMGSA.grepPlagesHorairesFichiers(fichierSourceVemgsa); 
                        console.log("answer.datesFichierVemgsa", answer.datesFichierVemgsa); 
                        //TODO renvoyer la plage horaire etudiee 
                    } 
 
                } 
 
            } 
            if ((arcid == "") && (plnid !== 0)) { 
 
                answer.plnid = plnid; 
                if (horaire === undefined) { 
 
                    result = grepVEMGSA.isPlnidAndPlageHoraire(plnid, fichierSourceVemgsa); 
 
                    if (result.existe == true) { 
                        let creneau = new Array(<datesFile>{}); 
                        creneau = this.dates.getCreneaux(result.dates); 
                        console.log("cas C1 : result", result); 
                        console.log("cas C1 : result.dates.length", result.dates.length); 
 
                        console.log("cas C1 : creneau", creneau); 
                        if (creneau.length > 1) { 
                            answer.tabHoraires = creneau; 
                            answer.valeurRetour = 5; 
                            console.log("cas C: creneaux: ", creneau); 
 
                            //TODO renvoyer les creneaux trouves 
                        } 
                        else { 
                            id = this.identificationVemgsa(arcid, plnid, fichierSourceVemgsa, grepVEMGSA, creneau[0], horaire); 
                            console.log("--------> id", id); 
                            if (id.identifie) { 
                                answer.arcid = id.arcid; 
                                answer.valeurRetour = 0; 
                                answer.creneauVemgsa = creneau[0]; 
                                //  answer.creneauHoraire = creneau[0]; 
                                //  console.log("creneaux trouves [0]:",creneau); 
                            } 
                            else { 
                                //TODO cas 2 ou 4 à analyse !!! 
                                answer.valeurRetour = 2; 
                                answer.creneauVemgsa = creneau[0]; 
                                //TODO renvoyer la plage horaire etudiee 
                            } 
                        } 
                    } 
                    else { 
                        console.log("plnid non trouvé"); 
                        answer.valeurRetour = 6; 
                        answer.datesFichierVemgsa = grepVEMGSA.grepPlagesHorairesFichiers(fichierSourceVemgsa); 
                        console.log("answer.datesFichierVemgsa", answer.datesFichierVemgsa); 
 
                        //TODO renvoyer la plage horaire etudiee 
                    } 
                } 
                else { 
                    console.log("---------------> horaire du client", horaire); 
 
                    result = grepVEMGSA.isPlnidAndPlageHoraire(plnid, fichierSourceVemgsa, horaire); 
                    console.log("--------------->  resultat horaire du client", result); 
                    if (result.existe == true) { 
                        let creneau = new Array(<datesFile>{}); 
                        creneau = this.dates.getCreneaux(result.dates); 
                        if (creneau.length > 1) { 
                            answer.tabHoraires = creneau; 
                            answer.valeurRetour = 5; 
                            console.log("cas D: creneaux: ", creneau); 
 
                            //TODO renvoyer les creneaux trouves 
                        } 
                        else { 
                            id = this.identificationVemgsa(arcid, plnid, fichierSourceVemgsa, grepVEMGSA, creneau[0], horaire); 
                            if (id.identifie) { 
                                answer.arcid = id.arcid; 
                                answer.valeurRetour = 0; 
                                answer.creneauVemgsa = creneau[0]; 
                                //  answer.creneauHoraire = creneau[0]; 
                                //  console.log("creneaux trouves [0]:",creneau); 
                            } 
                            else { 
                                //TODO cas 2 ou 4 à analyse !!! 
                                answer.valeurRetour = 2; 
                                answer.creneauVemgsa = creneau[0]; 
                                //TODO renvoyer la plage horaire etudiee 
                            } 
                        } 
                    } 
                    else { 
                        console.log("plnid non trouvé"); 
                        answer.valeurRetour = 6; 
                        answer.datesFichierVemgsa = grepVEMGSA.grepPlagesHorairesFichiers(fichierSourceVemgsa); 
                        console.log("answer.datesFichierVemgsa", answer.datesFichierVemgsa); 
                        //TODO renvoyer la plage horaire etudiee 
                    } 
                } 
            } 
        } catch (exception) { 
            console.log("erreur lors de l'ouverture du fichier VEMGSA:", exception.code); 
            answer.valeurRetour = 8; 
        } 
        console.log("CHECK VEMGSA"); 
        console.log("answer.arcid", answer.arcid); 
        console.log("answer.plnid", answer.plnid); 
        console.log("answer.valeurRetour", answer.valeurRetour); 
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
 
    public check(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], contexte: Contexte, grepLPLN: GrepLPLN, grepVEMGSA: GrepVEMGSA, horaire?: datesFile): checkAnswer { 
        console.log("Classe check Fonction check"); 
 
        let answer = <checkAnswer>{}; 
        answer.analysePossible = false; 
 
 
 
        switch (contexte) { 
            case Contexte.LPLN: 
                answer.checkLPLN = <checkAnswerInitial>{}; 
                answer.checkLPLN = this.checkLPLN(arcid, plnid, fichierSourceLpln, contexte, grepLPLN); 
                answer.arcid = answer.checkLPLN.arcid; 
                answer.plnid = answer.checkLPLN.plnid; 
                console.log("Contexte LPLN"); 
                console.log("resultat du check : " + answer.checkLPLN); 
                console.log("arcid : " + answer.checkLPLN.arcid); 
                console.log("plnid : " + answer.checkLPLN.plnid); 
                console.log("valeurRetour : " + answer.checkLPLN.valeurRetour); 
                if (answer.checkLPLN.valeurRetour == 0) { 
                    answer.analysePossible = true; 
                } 
                break; 
            case Contexte.VEMGSA: 
                answer.checkVEMGSA = <checkAnswerInitial>{}; 
                answer.checkVEMGSA = this.checkVEMGSA(arcid, plnid, fichierSourceVemgsa, contexte, grepVEMGSA, horaire); 
                answer.arcid = answer.checkVEMGSA.arcid; 
                answer.plnid = answer.checkVEMGSA.plnid; 
                console.log("Contexte VEMGSA"); 
                console.log("resultat du check : " + answer.checkVEMGSA); 
                if (answer.checkVEMGSA.valeurRetour <= 4) { 
                    answer.analysePossible = true; 
                } 
                break; 
            case Contexte.LPLNVEMGSA: 
                answer.checkLPLN = <checkAnswerInitial>{}; 
                answer.checkVEMGSA = <checkAnswerInitial>{}; 
                answer.checkLPLN = this.checkLPLN(arcid, plnid, fichierSourceLpln, contexte, grepLPLN); 
                answer.checkVEMGSA = this.checkVEMGSA(arcid, plnid, fichierSourceVemgsa, contexte, grepVEMGSA, horaire); 
                console.log("Contexte LPLN et VEMGSA"); 
                console.log("resultat du check LPLN: " + answer.checkLPLN); 
                console.log("resultat du check VEMGSA: " + answer.checkVEMGSA); 
                if ((answer.checkLPLN.valeurRetour == 0) || (answer.checkVEMGSA.valeurRetour <= 4)) { 
                    answer.analysePossible = true; 
                } 
                if (answer.checkLPLN.valeurRetour == 0) { 
                    answer.arcid = answer.checkLPLN.arcid; 
                    answer.plnid = answer.checkLPLN.plnid; 
                    console.log("cas LPLN et VEMGSA : arcid et plnid du LPLN OK"); 
 
                } 
                else { 
                    if ((answer.checkLPLN.valeurRetour !== 0) && (answer.checkVEMGSA.valeurRetour == 0)) { 
                        answer.arcid = answer.checkVEMGSA.arcid; 
                        answer.plnid = answer.checkVEMGSA.plnid; 
                        console.log("cas LPLN et VEMGSA : arcid et plnid du LPLN KO    et arcid et plnid du VEMGSA OK   "); 
                    } 
                    else { 
                        answer.arcid = answer.checkLPLN.arcid; 
                        answer.plnid = answer.checkLPLN.plnid; 
                        console.log("cas LPLN et VEMGSA : arcid et plnid du LPLN  et du VEMGSA KO"); 
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
 
        console.log("Analyse Possible ? : ", +answer.analysePossible); 
 
        return answer; 
    } 
 
 
 
    public isFileLPLNComplete(arcid: string, plnid: number, grepLPLN: GrepLPLN): boolean { 
        return true; 
    } 
 
 
 
 
} 
 
 
 
 
