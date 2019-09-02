import { datesFile } from "../Parseur/date";
import { Identifiants } from "./identifiants";

export interface checkAnswerInitial {
    valeurRetour: number;
    arcid: string;
    plnid: number;
    tabId?: Identifiants[];
    tabHoraires?: datesFile[];
    datesFichierVemgsa?: datesFile;
}

export interface checkAnswer {
    analysePossible: boolean;
    plnid?: number;
    arcid?: string;
    checkLPLN?: checkAnswerInitial;
    checkVEMGSA?: checkAnswerInitial;   
}