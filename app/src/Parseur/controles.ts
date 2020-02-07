import { Identifiants } from '../Modele/identifiants';
import { Contexte } from '../Modele/enumContexte';
import { checkAnswer, checkAnswerInitial } from '../Modele/checkAnswer';
import { Dates, creneauHoraire, arrayCreneauHoraire } from './date';
import { ParseurVEMGSA } from './parseurVEMGSA';
import { ParseurLPLN } from './parseurLPLN';


/**
 * Cette classe stocke toutes les fonctions permettant de s'assurer de la validité des données rentrées par l'utilisateur
 * 
 * Elle permet nottament de vérifier que les identifiants rentrés sont présents dans les fichiers de logs fournis 
 * 
 * et renvoie les identifiants complets trouvés 
 */
export class Controles {
    /**Lien vers l'objet dates pour pouvoir appeler les fonction de la classe Dates*/
    private dates: Dates;

    constructor(dates: Dates) {
        console.log("Je rentre dans le constructor Controles ");
        this.dates = dates;
    }
    /** 
     * Fonction permettant de déterminer le contexte d'étude en fonction des fichiers de logs fournis 
     * 
     * @param fichierSourceLpln Fichier LPLN rentré par l'utilisateur ("" par défaut) 
     * @param fichierSourceVemgsa Fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max) 
     * @returns LPLN si uniquement le fichier LPLN est fourni 
     * 
     * VEMGSA si uniquement un ou deux fichiers VEMGSA sont fournis 
     * 
     * LPLNVEMGSA si le fichier LPLN est fourni avec un ou deux fichiers VEMGSA  
     * 
     * NONE sinon 
     */
    public evaluationContexte(fichierSourceLpln: string, fichierSourceVemgsa: string[]): Contexte {
        console.log("Classe controle Fonction evaluationContexte");

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
     * 
     * @param arcid Arcid rentré par l'utilisateur ("" par défaut) 
     * @param plnid Plnid rentré par l'utilisateur (0 par défaut) 
     * @param fichierSourceLpln Fichier LPLN rentré par l'utilisateur  
     * @param parseurLPLN Le parseurLPLN du fichier LPLN
     * @returns  
     * Si le vol est trouvé renvoie : 
     * identifie = true,
     * plnid = plnid trouvé,
     * arcid = arcid trouvé,
     * dates = créneau horaire du vol
     * 
     * Si le vol n'est pas trouvé : 
     * identifie = false,
     * tabId = l'ensemble des autres couples (plnid, arcid )
     * 
     */
    public identificationLpln(arcid: string, plnid: number, fichierSourceLpln: string, parseurLPLN: ParseurLPLN): Identifiants {
        //Initialisation du vol issu des donnees LPLN 
        console.log("Classe controle Fonction identificationLpln");


        let tabId: Identifiants[];
        let id = <Identifiants>{};
        id.arcid = "";
        id.plnid = 0;
        id.identifie = false;
        id.dates = <creneauHoraire>{};

        tabId = parseurLPLN.grepPlnidAndArcid(fichierSourceLpln);
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
            id.dates = parseurLPLN.parseDatesLogLPLN(id.arcid, id.plnid, fichierSourceLpln);
        }
        else {
            id.tabId = tabId;
        }
        console.log("Fonction Check LPLN tests dates");

        console.log(" id.arcid: ", id.arcid, " id.plnid: ", id.plnid, " id.identifie: ", id.identifie);
        console.log(" id.dates.dateMin: ", id.dates.dateMin, " id.dates.dateMax: ", id.dates.dateMax);
        console.log(" id.tabId: ", id.tabId);
        return id;
    }




    /** 
     * Fonction permettant d'identifier dans le fichier VEMGSA fourni 
     * les vols (arcid, plnid, dates) liés à l'identifiant rentré par l'utilisateur 
     * @param arcid Arcid rentré par l'utilisateur ("" par défaut) 
     * @param plnid Plnid rentré par l'utilisateur (0 par défaut) 
     * @param fichierSourceVemgsa Fichier(s) VEMGSA rentré par l'utilisateur  
     * @param creneau Le creneau horaire lié à l'identifiant choisi par l'utilisateur
     * @param parseurVEMGSA Le parseurVEMGSA du fichier VEMGSA
     * @param creneaux Les différents creneaux horaires de l'identifiant rentré par l'utilisateur 
     * @returns  La liste des {plnid, arcid, dates} trouvés pour l'identifiants rentré par l'utilisateur
     */
    private identificationVemgsa(arcid: string, plnid: number, fichierSourceVemgsa: string[], parseurVEMGSA: ParseurVEMGSA, creneaux: arrayCreneauHoraire): Identifiants {
        //Initialisation du vol issu des donnees VEMGSA  
        console.log("Classe check Fonction identificationVemgsa");
        let creneau = new Array(<creneauHoraire>{});
        creneau = this.dates.getCreneaux(creneaux.dates);

        let id = <Identifiants>{};
        id.identifie = false;
        id.tabId = [];


        for (let index = 0; index < creneau.length; index++) {
            const creneauLocal = creneau[index];
            console.log("index: ", index, "creneau local: ", creneauLocal);

            if ((arcid == "") && (plnid !== 0)) {
                let idLocal = <Identifiants>{};
                idLocal.dates = <creneauHoraire>{};
                idLocal.plnid = plnid;
                idLocal.dates = creneauLocal;
                idLocal.arcid = "";
                idLocal.identifie = false;
                for (let fichier of fichierSourceVemgsa) {
                    console.log("fichier ", fichier);
                    idLocal.arcid = parseurVEMGSA.grepArcidFromPlnid(plnid, fichier, creneauLocal);
                    console.log("arcid trouve : " + idLocal.arcid);
                    if (idLocal.arcid !== "") {
                        idLocal.identifie = true;
                        break;
                    }
                }
                id.tabId.push(idLocal);
            }
            if ((arcid !== "") && (plnid == 0)) {
                let idLocal = <Identifiants>{};
                idLocal.dates = <creneauHoraire>{};
                idLocal.arcid = arcid;
                idLocal.dates = creneauLocal;
                idLocal.plnid = 0;
                idLocal.identifie = false;
                for (let fichier of fichierSourceVemgsa) {

                    idLocal.plnid = parseurVEMGSA.grepPlnidFromArcid(arcid, fichier, creneauLocal);
                    console.log("plnid trouve : " + idLocal.plnid);
                    if (idLocal.plnid !== 0) {
                        idLocal.identifie = true;
                        break;
                    }
                }
                id.tabId.push(idLocal);

            }
        }

        //console.log("arcid : "+arcid); 
        //console.log("plnid : "+plnid); 


        /**  for (let index = 0; index < id.tabId.length; index++) {
              console.log(" element.arcid: ", id.tabId[index].arcid, " element.plnid: ", id.tabId[index].plnid, " element.identifie: ", id.tabId[index].identifie);
              console.log(" element.dateMin: ", id.tabId[index].dates.dateMin, " element.dateMax: ", id.tabId[index].dates.dateMax);
  
          }
          console.log(" id.arcid: ", id.arcid, " id.plnid: ", id.plnid, " id.identifie: ", id.identifie);*/
        return id;
    }




    /** 
     * Fonction permettant de déterminer la validité des données LPLN rentrées par l'utilisateur  
     * 
     * Elle vérifie que les fichiers donnés en entree existent et s'ouvrent et les valeurs rentrees (arcid, plnid ) existent dans le fichier 
     * @param arcid Arcid rentré par l'utilisateur ("" par défaut) 
     * @param plnid Plnid rentré par l'utilisateur (0 par défaut) 
     * @param fichierSourceLpln Fichier LPLN rentré par l'utilisateur ("" par défaut) 
     * @param contexte Le contexte d'exécution lié aux types de fichiers logs en entrée 
     * @param parseurLPLN  Le parseurLPLN du fichier LPLN
     * @returns
     *   La valeurRetour indique si le checkInitial s'est bien déroulé : 
     *   0 : LPLN OK : arcid et plnid identifies ,
     *   1 : LPLN incomplet , arcid ou plnid non trouve ,
     *   2 : format arcid ou plnid invalide ,
     *   3 : erreur a louverture du fichier LPLN 
     * 
     * creneauHoraire: creneau Horaire du vol si le couple (arcid,plnid) est identifié
     * 
     * tabId : l'ensemble des autres couples (plnid, arcid ) si le vol n'est pas trouvé
     */
    private controleLPLN(arcid: string, plnid: number, fichierSourceLpln: string, contexte: Contexte, parseurLPLN: ParseurLPLN): checkAnswerInitial {
        console.log("Classe controles Fonction controleLPLN");


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

                id = this.identificationLpln(arcid, plnid, fichierSourceLpln, parseurLPLN);
                if (id.identifie) { // SI COUPLE PLNID ARCID TROUVE A PARTIR DE L ARCID 

                    //RECUPERATION DES LOGS CPDLC 
                    parseurLPLN.parseLogLPLN(arcid, id.plnid, fichierSourceLpln);
                    // TEST VOL DECLARE CPDLC 
                    //TODO 
                    answer.plnid = id.plnid;
                    answer.creneauHoraire = id.dates;
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
                id = this.identificationLpln(arcid, plnid, fichierSourceLpln, parseurLPLN);
                if (id.identifie) {
                    //RECUPERATION DES LOGS CPDLC 
                    answer.creneauHoraire = id.dates;
                    parseurLPLN.parseLogLPLN(id.arcid, plnid, fichierSourceLpln);
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
            answer.valeurRetour = 3;
        }
        console.log("CHECK LPLN");
        console.log("answer.arcid", answer.arcid);
        console.log("answer.plnid", answer.plnid);
        console.log("answer.valeurRetour", answer.valeurRetour);
        console.log("answer.creneauHoraire", answer.creneauHoraire);

        return answer;
    }

    /** 
     * Fonction permettant de déterminer la validité des données VEMGSA rentrées par l'utilisateur  
     * Elle vérifie que les fichiers donnés en entree existent et s'ouvrent et les valeurs rentrees (arcid, plnid ) existent dans le fichier 
     * @param arcid Arcid rentré par l'utilisateur ("" par défaut) 
     * @param plnid Plnid rentré par l'utilisateur (0 par défaut) 
     * @param fichierSourceVemgsa Fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max) 
     * @param parseurVEMGSA Le parseurVEMGSA du fichier VEMGSA
     * @returns 
     *   La valeurRetour indique si le checkInitial s'est bien déroulé : 
     *   0: VEMGSA complet, 
     *   1 : VEMGSA incomplet ( arcid trouvé mais plnid non trouve ), 
     *   2 : VEMGSA incomplet ( plnid trouvé mais arcid non trouve), 
     *   3 : VEMGSA incomplet ( plnid non trouve car connexion refusee ), 
     *   4 : VEMGSA incomplet ( arcid non trouve car ...), 
     *   5 : VEMGSA NOK ( pas d'info trouvé pour l'id donné), 
     *   6 : VEMGSA NOK ( erreur format identifiant), 
     *   7 : VEMGSA NOK ( pbm ouverture du fichier) 
     * 
     *   Le messageRetour donne une explication en cas d'echec 
     */
    public controleVEMGSA(arcid: string, plnid: number, fichierSourceVemgsa: string[], parseurVEMGSA: ParseurVEMGSA): checkAnswerInitial {
        console.log("Classe controle Fonction controleVEMGSA");
        //TODO gérer le contexte passé en entrée
        let regexpPlnid: RegExp = /^\d{1,4}$/;
        let regexpArcid: RegExp = /^[a-z][a-z|0-9]{1,6}$/i;
        let id = <Identifiants>{};
        let plageHoraire = <arrayCreneauHoraire>{};
        plageHoraire.dates = new Array;
        let answer = <checkAnswerInitial>{};
        answer.valeurRetour = 6;
        answer.plnid = 0;
        answer.arcid = "";


        if (((arcid !== "") && (plnid == 0) && (!arcid.match(regexpArcid))) || ((arcid == "") && (plnid !== 0) && (!plnid.toString().match(regexpPlnid)))) {
            return answer;
        }

        try {
            if ((arcid !== "") && (plnid == 0)) {
                //TODO cas 3 ou 4 à analyse !!! 
                answer.arcid = arcid;
                //Recherche de l'ARCID dans le fichier VEMGSA 
                plageHoraire = parseurVEMGSA.isArcidAndPlageHoraire(arcid, fichierSourceVemgsa);
                //  console.log(" result   :", result);
                if (plageHoraire.existe == true) {
                    answer.valeurRetour = 0;
                    //  console.log(" check VEMGSA A");
                    id = this.identificationVemgsa(arcid, plnid, fichierSourceVemgsa, parseurVEMGSA, plageHoraire);
                    // console.log("id.tabId.length ", id.tabId.length);
                    id.tabId.forEach(element => {
                        if (!element.identifie) {
                            //       console.log(" couple VEMGSA non complet");
                            answer.valeurRetour = 1;
                        }
                    });
                    answer.tabId = id.tabId;
                }
                else {
                    // console.log(" check VEMGSA C");
                    // console.log("arcid non trouvé");
                    answer.valeurRetour = 5;
                    //  console.log("answer.datesFichierVemgsa", answer.datesFichierVemgsa);
                }
            }
            if ((arcid == "") && (plnid !== 0)) {
                //TODO cas 3 ou 4 à analyse !!! 
                answer.plnid = plnid;
                //console.log(" check VEMGSA E");
                plageHoraire = parseurVEMGSA.isPlnidAndPlageHoraire(plnid, fichierSourceVemgsa);
                //console.log(" result   :", result);
                if (plageHoraire.existe == true) {
                    answer.valeurRetour = 0;
                    //  console.log(" check VEMGSA F");
                    id = this.identificationVemgsa(arcid, plnid, fichierSourceVemgsa, parseurVEMGSA, plageHoraire);
                    //console.log("id.tabId.length ", id.tabId.length);
                    id.tabId.forEach(element => {
                        if (!element.identifie) {
                            //      console.log(" couple VEMGSA non complet");
                            answer.valeurRetour = 2;
                        }
                    });
                    answer.tabId = id.tabId;
                }
                else {
                    //console.log(" check VEMGSA H");
                    answer.valeurRetour = 5;
                }
            }
        } catch (exception) {
            console.log("erreur lors de l'ouverture du fichier VEMGSA:", exception.code);
            answer.valeurRetour = 7;
        }
        console.log("CHECK VEMGSA");
        console.log("answer.arcid", answer.arcid);
        console.log("answer.plnid", answer.plnid);
        console.log("answer.valeurRetour", answer.valeurRetour);
        console.log("answer.tabId", answer.tabId);
        //Test avec testVemgsa, arcid SWR204K
        return answer;
    }

    /** 
     * Fonction permettant de déterminer la validité des données rentrées par l'utilisateur  
     * Elle vérifie que les fichiers donnés en entree existent et s'ouvrent et les valeurs rentrees (arcid, plnid ) existent dans le fichier 
     * @param arcid Arcid rentré par l'utilisateur ("" par défaut) 
     * @param plnid Plnid rentré par l'utilisateur (0 par défaut) 
     * @param fichierSourceLpln Fichier LPLN rentré par l'utilisateur ("" par défaut) 
     * @param fichierSourceVemgsa Fichier VEMGSA rentré par l'utilisateur ("" par défaut, et deux fichiers max) 
     * @param contexte Le contexte d'exécution lié aux types de fichiers logs en entrée 
     * @param parseurLPLN Le parseurLPLN du fichier LPLN
     * @param parseurVEMGSA Le parseurVEMGSA du fichier VEMGSA
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
    public controle(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[], contexte: Contexte, parseurLPLN: ParseurLPLN, parseurVEMGSA: ParseurVEMGSA): checkAnswer {
        console.log("Classe controle Fonction controle");

        let answer = <checkAnswer>{};
        answer.analysePossible = false;
        answer.listeIdentifiants = [];


        switch (contexte) {
            case Contexte.LPLN:
                answer.checkLPLN = <checkAnswerInitial>{};
                answer.checkLPLN = this.controleLPLN(arcid, plnid, fichierSourceLpln, contexte, parseurLPLN);

                if (answer.checkLPLN.valeurRetour == 0) {
                    let idLocal = <Identifiants>{};
                    idLocal.dates = <creneauHoraire>{};
                    idLocal.arcid = answer.checkLPLN.arcid;
                    idLocal.plnid = answer.checkLPLN.plnid;
                    idLocal.dates = answer.checkLPLN.creneauHoraire;
                    idLocal.inLpln = true;
                    idLocal.identifie = true;
                    answer.listeIdentifiants.push(idLocal);
                    answer.analysePossible = true;
                }
                //answer.arcid = answer.checkLPLN.arcid;
                //answer.plnid = answer.checkLPLN.plnid;
                console.log("Contexte LPLN");
                console.log("valeurRetour : " + answer.checkLPLN.valeurRetour);
                console.log("answer.analysePossible : " + answer.analysePossible);
                break;
            case Contexte.VEMGSA:
                answer.checkVEMGSA = <checkAnswerInitial>{};
                answer.checkVEMGSA = this.controleVEMGSA(arcid, plnid, fichierSourceVemgsa, parseurVEMGSA);
                answer.listeIdentifiants = answer.checkVEMGSA.tabId;
                if (answer.checkVEMGSA.valeurRetour <= 2) {
                    answer.analysePossible = true;
                    answer.listeIdentifiants.forEach(element => {
                        element.inVemgsa = true;
                    });
                }
                else {
                    answer.analysePossible = false;
                }
                //answer.arcid = answer.checkVEMGSA.arcid;
                //answer.plnid = answer.checkVEMGSA.plnid;
                console.log("Contexte VEMGSA");
                console.log("valeurRetour : " + answer.checkVEMGSA.valeurRetour);
                console.log("answer.analysePossible : " + answer.analysePossible);
                break;
            case Contexte.LPLNVEMGSA:
                answer.checkLPLN = <checkAnswerInitial>{};
                answer.checkVEMGSA = <checkAnswerInitial>{};
                answer.checkLPLN = this.controleLPLN(arcid, plnid, fichierSourceLpln, contexte, parseurLPLN);
                answer.checkVEMGSA = this.controleVEMGSA(arcid, plnid, fichierSourceVemgsa, parseurVEMGSA);

                console.log("Contexte LPLN et VEMGSA");
                //si couple trouvé entier dans LPLN ou trouvé au moins en partie dans VEMGSA
                if ((answer.checkLPLN.valeurRetour == 0) || (answer.checkVEMGSA.valeurRetour <= 2)) {
                    answer.analysePossible = true;
                }
                //si couple trouvé au moins en partie dans VEMGSA on recupere les identifants trouves
                if (answer.checkVEMGSA.valeurRetour <= 2) {
                    answer.listeIdentifiants = answer.checkVEMGSA.tabId;
                    answer.listeIdentifiants.forEach(element => {
                        element.inVemgsa = true;
                    });
                }
                //si couple trouvé entier dans LPLN  on recupere les identifants trouves
                if (answer.checkLPLN.valeurRetour == 0) {
                    let idLocal = <Identifiants>{};
                    idLocal.dates = <creneauHoraire>{};
                    idLocal.arcid = answer.checkLPLN.arcid;
                    idLocal.plnid = answer.checkLPLN.plnid;
                    idLocal.dates = answer.checkLPLN.creneauHoraire;
                    idLocal.identifie = true;
                    idLocal.inLpln = true;
                    let isCompatible: boolean = false;

                    //comparaison des identifiants trouvés dans LPLN avec ceux trouvés dans VEMGSA
                    if (answer.listeIdentifiants!== undefined){
                        answer.listeIdentifiants.forEach(element => {
                            let creneauLocal = this.dates.isCreneauxCompatibles(idLocal.dates, element.dates);
                            //si les creneaux sont compatibles et les identifiant trouves totalement identique
                            //ajout du LPLN                        
                            if ((creneauLocal !== null) && (((idLocal.arcid == element.arcid) || (idLocal.plnid == element.plnid)))) {
                                isCompatible = true;
                                element.inLpln = true;
                                console.log("compatible");
                                element.dates = creneauLocal;
                                if(element.arcid == ''){
                                    element.arcid =idLocal.arcid;
                                }
                                if(element.plnid == 0){
                                    element.plnid =idLocal.plnid;
                                }
                            }
                        });
                    }
                    //si les creneaux ne sont pas compatibles ou les identifiant trouves non identiques
                    // ou si pas de resultat vemgsa
                    //ajout du LPLN
                    if (!isCompatible) {
                        answer.listeIdentifiants.push(idLocal);
                    }
                }
                console.log("listeIdentifiants : " + answer.listeIdentifiants);
                console.log("answer.analysePossible : " + answer.analysePossible);
                break;
            case Contexte.NONE:
                console.log(" Contexte NONE ");
                break;
            default:
                console.log(" Contexte.default ");
                break;
        }

        console.log("Analyse Possible ? : ", +answer.analysePossible);
        if (answer.analysePossible) {
            answer.listeIdentifiants.forEach(id => {
                console.log(" id.arcid: ", id.arcid, " id.plnid: ", id.plnid, " id.identifie: ", id.identifie);
                console.log(" id.dates.dateMin: ", id.dates.dateMin, " id.dates.dateMax: ", id.dates.dateMax);

            });
        }
        return answer;
    }



    /**
     * Fonction qui détermine si le fichier LPLN rentré par l'utilisateur est complet - 
     * c'est à dire si le plan de vol est terminé pour le centre d'AIX
     * @param arcid arcid du vol
     * @param plnid plnid du vol
     * @param parseurLPLN Le parseurLPLN du fichier LPLN
     * @returns true si le plan est terminé, false sinon
     */
    public isFileLPLNComplete(arcid: string, plnid: number, parseurLPLN: ParseurLPLN): boolean {
        console.log("Classe controle Fonction isFileLPLNComplete");

        //TO DO
        return true;
    }




}




