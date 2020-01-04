import { creneauHoraire } from "../Parseur/date"; 
import { Identifiants } from "./identifiants"; 
import { Etat } from "./enumEtat";
 
export interface checkAnswerInitial { 
    valeurRetour: number; 
    arcid?: string; 
    plnid?: number; 
    tabId?: Identifiants[]; // pour LPLN 
    creneauHoraire?: creneauHoraire; //pour VEMGSA  ou LPLN
    datesFichierVemgsa?: creneauHoraire; //pour VEMGSA 
} 
 

 
export interface checkAnswer { 
    analysePossible: boolean; 
    plnid?: number; 
    arcid?: string; 
    creneauHoraire?: creneauHoraire;
    listeIdentifiants?: Identifiants[];
    checkLPLN?: checkAnswerInitial; 
    checkVEMGSA?: checkAnswerInitial;    
}

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

export interface etatLogonConnexion {  
    dateChgtEtat: string; 
    etat: Etat;
    infoEtat: string;
    log: string;
}

export interface etatLogonConnexionSimplifiee {  
    fromDate: string; 
    toDate: string;
    name: string; //connexion/logon/frequence
    infoEtat?: string; //logue, non logue , connecte, non connecte
    logs?:string;
}

export interface erreurVol {
    date: string;
    type : string;
    infos : string;
}
