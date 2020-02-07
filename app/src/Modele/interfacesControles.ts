import { creneauHoraire } from "../Parseur/date"; 
import { Identifiants } from "./identifiants"; 
import { Etat } from "./enumEtat";
 

/**
 * Interface utilisée pour indiquer les informations essentielles d'un vol 
 * à partir du fichier LPLN ou du fichier VEMGSA 
 * 
 * valeurRetour: indique si le couple arcid, plnid a été trouvé partiellement ou totalement
 * 
 * arcid : arcid rentré par l'utilisateur ou l'arcid identifié
 *
 * plnid : plnid rentré par l'utilisateur ou plnid identifié
 * 
 * tabId :les différents couples [arcid, plnid] trouvés dans le fichier LPLN 
 * 
 * creneauHoraire : les différents créneaux horaires trouvés dans le fichier VEMGSA pour l'identifiant rentré par l'utilisateur 
 */
export interface checkAnswerInitial { 
    valeurRetour: number; 
    arcid?: string; 
    plnid?: number; 
    tabId?: Identifiants[]; // pour LPLN 
    creneauHoraire?: creneauHoraire; //pour VEMGSA  ou LPLN

} 
 

 /**
 * Interface utilisée pour indiquer les informations essentielles d'un vol 
 * à partir du fichier LPLN,  du fichier VEMGSA , ou des deux
 * 
 * analysePossible: indique si les données trouvées ont permis d'identifier au moins un vol affichable
 * 
 * arcid : arcid rentré par l'utilisateur ou l'arcid identifié
 *
 * plnid : plnid rentré par l'utilisateur ou plnid identifié
 * 
 * listeIdentifiants :les différents vols trouvés [arcid, plnid, date, inLpln, inVemga] dans le fichier LPLN et/ou VEMGSA
 * 
 * checkLPLN : le résultat de la recherche LPLN
 * 
 * checkVEMGSA : le résultat de la recherche VEMGSA
 * 
 */
export interface checkAnswer { 
    analysePossible: boolean; 
    plnid?: number; 
    arcid?: string; 
    listeIdentifiants?: Identifiants[];
    checkLPLN?: checkAnswerInitial; 
    checkVEMGSA?: checkAnswerInitial;    
}


 /**
 * Interface utilisée pour indiquer le détail de chaque transfert de fréquence réalisé pour un vol 
 * 
 * frequence: la  fréquence du secteur suivant,
 * positionTransfert: position du secteur suivant,
 * dateTransfert : date du transfert,
 * isFinTRFDL : true si timeout du transfert de fréquence,false sinon ,
 * dateFinTRFDL: date du timeout,
 * isTRARTV : true si un retour à la voix est demandé au contrôleur,false sinon ,
 * dateTRARTV: date de la demande de retour à la voix,
 * isTransfertAcq : true si le contrôleur a acquitté un retour à la voix,false sinon ,
 * dateTranfertAcq: date de l'acquittement du retour à la voix,
 * delaT : valeur du timeout en cas de timeout
 */
export interface etatTransfertFrequence { 
    frequence: string; 
    dateTransfert: string; 
    positionTransfert?: string; 
    isFinTRFDL?: boolean; 
    dateFinTRFDL ?:string;
    isTRARTV?: boolean; 
    dateTRARTV ?:string;
    isTransfertAcq?: boolean; 
    dateTranfertAcq ?:string;  
    deltaT?:number;
}


 /**
 * Interface utilisée pour indiquer l'état du vol correspondant à un log  
 * -> Utilisé pour les graphes d'états des onglets LPLN, VEMGSA, MIX
 * 
 * dateChgtEtat: date du changement d'état,
 * etat : nouvel état ( logué, non logué, connnecté, transfert en cours ,...),
 * infoEtat: explication en un mot du log analysé, 
 * log : le log ayant servi au calcul du nouvel état
 */
export interface etatLogonConnexion {  
    dateChgtEtat: string; 
    etat: Etat;
    infoEtat: string;
    log: string;
}


 /**
 * Interface utilisée pour indiquer les différentes états du vol  -> Utilisé pour la timeline fréquence
 * 
 * fromDate: date du début de l'état,
 * toDate : date de fin de l'état,
 * name : indique si l'état est de type connexion, logon, fréquence
 * infoEtat: explication en un mot du log analysé, 
 * log : le log ayant servi au calcul du nouvel état
 */
export interface etatLogonConnexionSimplifiee {  
    fromDate: string; 
    toDate: string;
    name: string; //connexion/logon/frequence
    infoEtat?: string; //logue, non logue , connecte, non connecte
    logs?:string[];
}

 /**
 * Interface utilisée pour indiquer une erreur survenu sur un vol 
 * -> Utilisé pour le tableau des erreurs de l'onglet principal du vol
 * 
 * date: date du problème,
 * type  Problème de type logon, connexion, fréquence ...,
 * infos : explication du Problème
 */
export interface erreurVol {
    date: string;
    type : string;
    infos : string;
}
