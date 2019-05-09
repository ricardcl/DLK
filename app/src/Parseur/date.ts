import * as moment from 'moment';



export interface datesFile {
    dateMin: string ;
    dateMax: string;
}


export function MonthLetterToNumber(month: string): string {
    let monthNumber: string = "00";
    switch (month) {
        case 'JANVIER': { monthNumber = "01"; break; }
        case 'FEVRIER': { monthNumber = "02"; break; }
        case 'MARS': { monthNumber = "03"; break; }
        case 'AVRIL': { monthNumber = "04"; break; }
        case 'MAI': { monthNumber = "05"; break; }
        case 'JUIN': { monthNumber = "06"; break; }
        case 'JUILLET': { monthNumber = "07"; break; }
        case 'AOUT': { monthNumber = "08"; break; }
        case 'SEPTEMBRE': { monthNumber = "09"; break; }
        case 'OCTOBRE': { monthNumber = "10"; break; }
        case 'NOVEMBRE': { monthNumber = "11"; break; }
        case 'DECEMBRE': { monthNumber = "12"; break; }
        default: { break; }
    }
    return monthNumber;
}

//Fonction pour comparer des heures VEMGSA et des heures LPLN uniquement !!!!
//Pas pour comparer des heures LPLN entre elles ou des heures VEMGSA entre elles
export function isHeuresLplnVemgsaEgales(hV: string, hL: string): boolean {
    const uneMinute: number = 60000;
    const momentDateV = moment(hV, 'HH mm');
    const momentDateL = moment(hL, 'HH mm');
    /**
    console.log(hV);
    console.log(hL);    
    console.log(momentDateV);
    console.log(momentDateL);
    */
    
    const diff: number = Math.abs(momentDateV.diff(momentDateL)); //Rmq : diff renvoie un resultat en ms
    if (diff <= uneMinute) { return true; }
    else { return false; }
}

//Fonction pour comparer des heures LPLN  entre elles : renvoie la difference de temps entre les deux
export function diffHeuresLplnEgales(hL1: string, hL2: string): number {
    const momentDateL1 = moment(hL1, 'HH mm');
    const momentDateL2 = moment(hL2, 'HH mm');  
    const diff: number = Math.abs(momentDateL1.diff(momentDateL2)); //Rmq : diff renvoie un resultat en ms
    
    return diff;

  
  }

  export function isHeureSup(h1: string, h2: string): boolean {
    const momentDate1 = moment(h1, 'HH mm ss');
    const momentDate2 = moment(h2, 'HH mm ss');
    const diff: number =momentDate1.diff(momentDate2); //Rmq : diff renvoie un resultat en ms
    if (diff > 0) { return true; }
    else { return false; }
}

export function isDateSup(d1: string, d2: string): boolean {
    const momentDate1 = moment(d1, 'DD-MM-YYYY HH mm ss');
    const momentDate2 = moment(d2, 'DD-MM-YYYY HH mm ss');
    const diff: number =momentDate1.diff(momentDate2); //Rmq : diff renvoie un resultat en ms
    if (diff > 0) { return true; }
    else { return false; }
}