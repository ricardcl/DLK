import * as moment from 'moment';



export interface datesFile {
    dateMin: string;
    dateMax: string;
}

export interface arrayDatesFile {
    existe: boolean;
    dates: string[];
}


export class Dates {

    public MonthLetterToNumber(month: string): string {

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
    public isHeuresLplnVemgsaEgales(hV: string, hL: string): boolean {

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
    public diffHeuresLplnEgales(hL1: string, hL2: string): number {
        const momentDateL1 = moment(hL1, 'HH mm');
        const momentDateL2 = moment(hL2, 'HH mm');
        const diff: number = Math.abs(momentDateL1.diff(momentDateL2)); //Rmq : diff renvoie un resultat en ms
        return diff;


    }

    //Fonction pour comparer des heures VEMGSA  entre elles : renvoie la difference de temps entre les deux
    public diffHeuresVemgsaEgales(hV1: string, hV2: string): number {
        const momentDateV1 = moment(hV1, 'DD-MM-YYYY HH mm ss');
        const momentDateV2 = moment(hV2, 'DD-MM-YYYY HH mm ss');
        const diff: number = Math.abs(momentDateV1.diff(momentDateV2)); //Rmq : diff renvoie un resultat en ms
        return diff;
    }

    public isHeureSup(h1: string, h2: string): boolean {
        const momentDate1 = moment(h1, 'HH mm ss');
        const momentDate2 = moment(h2, 'HH mm ss');
        const diff: number = momentDate1.diff(momentDate2); //Rmq : diff renvoie un resultat en ms
        if (diff > 0) { return true; }
        else { return false; }
    }

    public isHeureInf(h1: string, h2: string): boolean {
        const momentDate1 = moment(h1, 'HH mm ss');
        const momentDate2 = moment(h2, 'HH mm ss');
        const diff: number = momentDate1.diff(momentDate2); //Rmq : diff renvoie un resultat en ms
        if (diff < 0) { return true; }
        else { return false; }
    }

    //Renvoie true si d1 > d2
    public isDateSup(d1: string, d2: string): boolean {
        const momentDate1 = moment(d1, 'DD-MM-YYYY HH mm ss');
        const momentDate2 = moment(d2, 'DD-MM-YYYY HH mm ss');
        const diff: number = momentDate1.diff(momentDate2); //Rmq : diff renvoie un resultat en ms
        if (diff > 0) { return true; }
        else { return false; }
    }


    public getCreneaux(dates: string[]): datesFile[] {
        let arrayHeuresTrouvees: string[] = dates;
        let creneau = new Array;
        const uneMinute: number = 60000;
        const uneHeure: number = 60 * uneMinute;
        let diffMax = 3 * uneHeure;
        let i: number = 0;

        creneau[i] = <arrayDatesFile>{};
        creneau[i].dateMin = dates[0];

        for (let index = 1; index < dates.length; index++) {
            const element = dates[index];
            const elementPrec = dates[index - 1];
            if (index == dates.length - 1) { creneau[i].dateMax = element; }
            else {
                if (this.diffHeuresVemgsaEgales(element, elementPrec) > diffMax) {
                    creneau[i].dateMax = elementPrec;
                    i++;
                    creneau[i] = <arrayDatesFile>{};
                    creneau[i].dateMin = element;
                }
            }
        }
        console.log("creneaux trouves :", creneau);
        return creneau;
    }

    public isInCreneauxVemgsa(dates: datesFile, log: string, diffMax: number): boolean {




        let isIn: boolean = false;

        const momentDate1 = moment(dates.dateMin, 'DD-MM-YYYY HH mm ss');
        const momentDate2 = moment(dates.dateMax, 'DD-MM-YYYY HH mm ss');


        let motif = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d")(\s.*-[A-Z]+\s+[A-Z|\d]+)/;
        let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)(")(.*)/;

        if (log.toString().match(motif) !== null) {

            let date = log.toString().replace(motif, "$1");

            if (date.match(motifDateHeure) !== null) {
                const jour = date.toString().replace(motifDateHeure, "$1");
                const heure = date.toString().replace(motifDateHeure, "$3");
                const minutes = date.toString().replace(motifDateHeure, "$5");
                const secondes = date.toString().replace(motifDateHeure, "$7");
                const dateToStore = jour + " " + heure + " " + minutes + " " + secondes;
                const momentDate = moment(dateToStore, 'DD-MM-YYYY HH mm ss');


                const diff1: number = momentDate.diff(momentDate1);
                const diff2: number = momentDate.diff(momentDate2);


                if (((diff1 >= 0) || (diff1 >= -diffMax)) && ((diff2 <= 0) || (diff2 <= diffMax))) {
                    isIn = true;
                }
            }
        }
        return isIn;
    }

    public isInCreneauxVemgsaHoraire(dates: datesFile, dateToStore: string, diffMax: number): boolean {




        let isIn: boolean = false;

        const momentDate1 = moment(dates.dateMin, 'DD-MM-YYYY HH mm ss');
        const momentDate2 = moment(dates.dateMax, 'DD-MM-YYYY HH mm ss');

        const momentDate = moment(dateToStore, 'DD-MM-YYYY HH mm ss');


        const diff1: number = momentDate.diff(momentDate1);
        const diff2: number = momentDate.diff(momentDate2);


        if (((diff1 >= 0) || (diff1 >= -diffMax)) && ((diff2 <= 0) || (diff2 <= diffMax))) {
            isIn = true;
        }
      
        return isIn;
    }

}