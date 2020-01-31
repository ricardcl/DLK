import { creneauHoraire } from "../Parseur/date";


export interface Identifiants {
    plnid?: number ;
    arcid?: string;
    dates?: creneauHoraire;
    inLpln?: boolean;
    inVemgsa?: boolean;
    identifie?: boolean;
    tabId?: Identifiants[];
}


export function sameIdent( idL : Identifiants, idV : Identifiants) : boolean{
    if ( (idL.identifie == idV.identifie) && (idL.arcid == idV.arcid) && (idL.plnid == idV.plnid) ){
        return true;
    }
    else return false;

}

export interface inputData{
    identifiant:Identifiants;
    lplnfilename:string;
    vemgsafilename:string;
}


