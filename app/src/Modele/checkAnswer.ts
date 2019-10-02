import { datesFile } from "../Parseur/date"; 
import { Identifiants } from "./identifiants"; 
import { Etat } from "./enumEtat";
 
export interface checkAnswerInitial { 
    valeurRetour: number; 
    arcid: string; 
    plnid: number; 
    tabId?: Identifiants[]; // pour LPLN 
    tabHoraires?: datesFile[]; //pour VEMGSA 
    creneauVemgsa?: datesFile; //pour VEMGSA 
    datesFichierVemgsa?: datesFile; //pour VEMGSA 
} 
 

 
export interface checkAnswer { 
    analysePossible: boolean; 
    plnid?: number; 
    arcid?: string; 
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
}

export interface etatLogonConnexion {  
    dateChgtEtat: string; 
    etat: Etat;
    infoEtat: string;
    log: string;
}