import { datesFile } from "../Parseur/date";

export interface checkAnswer {
    valeurRetour: number;
    messageRetour: string
    plnid?: number;
    arcid?: string;
    creneauHoraire?: datesFile; 
}