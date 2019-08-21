import { datesFile } from "../Parseur/date";

export interface checkAnswerInitial {
    valeurRetour: number;
    messageRetour: string
    plnid?: number;
    arcid?: string;
    creneauHoraire?: datesFile; 
}

export interface checkAnswer {
    analysePossible: boolean;
    plnid?: number;
    arcid?: string;
    checkLPLN?: checkAnswerInitial;
    checkVEMGSA?: checkAnswerInitial;   
    creneauHoraire?: datesFile; 
}