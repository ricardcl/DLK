import { datesFile } from "../Parseur/date";
import { Identifiants } from "./identifiants";

export interface checkAnswerInitial {
    valeurRetour: number;
    arcid: string;
    plnid: number;
}

export interface checkAnswerInitialLPLN {
    checkAnswerInitial: checkAnswerInitial
    tabId?: Identifiants[]; // pour LPLN
}

export interface checkAnswerInitialLPLN {
    checkAnswerInitial: checkAnswerInitial
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