

export interface Identifiants {
    plnid: number ;
    arcid: string;
    identifie?: boolean;
    tabId?: Identifiants[];
}


export function sameIdent( idL : Identifiants, idV : Identifiants) : boolean{
    if ( (idL.identifie == idV.identifie) && (idL.arcid == idV.arcid) && (idL.plnid == idV.plnid) ){
        return true;
    }
    else return false;

}


