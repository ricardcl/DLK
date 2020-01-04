import * as moment from 'moment';
import { Split } from './split';

export interface creneauHoraire {
    dateMin: string;
    dateMax: string;
}

export interface arrayCreneauHoraire {
    existe: boolean;
    dates: string[];
}


export class Dates {

    private split: Split;

    constructor() {
        this.split = new Split();
    }

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
        let momentDate1 = moment(d1, 'DD-MM HH mm ss');
        if (!momentDate1.isValid()) {
            momentDate1 = moment(d1, 'DD-MM HH mm');
        }
        let momentDate2 = moment(d2, 'DD-MM HH mm ss');
        if (!momentDate2.isValid()) {
            momentDate2 = moment(d1, 'DD-MM HH mm');
        }
        const diff: number = momentDate1.diff(momentDate2); //Rmq : diff renvoie un resultat en ms
        //console.log("isDateSup momentDate1",momentDate1, "momentDate2",momentDate2, "diff",diff);
        if (diff > 0) { return true; }
        else { return false; }
    }

    public diffDates(d1: string, d2: string): number {
        let momentDate1 = moment(d1, 'DD-MM HH mm ss');
        if (!momentDate1.isValid()) {
            momentDate1 = moment(d1, 'DD-MM HH mm');
        }
        let momentDate2 = moment(d2, 'DD-MM HH mm ss');
        if (!momentDate2.isValid()) {
            momentDate2 = moment(d1, 'DD-MM HH mm');
        }
        const diff: number = momentDate1.diff(momentDate2); //Rmq : diff renvoie un resultat en ms
        //console.log("momentDate1",momentDate1, "momentDate2",momentDate2, "diff",diff, "Math.abs(diff)",Math.abs(diff));
        return Math.abs(diff);
    }



    /**
     * Fonction qui détermine des différentes dates VEMGSA passées en paramètre les différents créneaux horaires
     * @param dates 
     */
    public getCreneaux(dates: string[]): creneauHoraire[] {
        let arrayHeuresTrouvees: string[] = dates;
        let creneauHoraire = new Array;
        const uneMinute: number = 60000;
        const uneHeure: number = 60 * uneMinute;
        let troisHeures = 3 * uneHeure;
        let i: number = 0;

        creneauHoraire[i] = <arrayCreneauHoraire>{};
        creneauHoraire[i].dateMin = dates[0];

        for (let index = 1; index < dates.length; index++) {
            const element = dates[index];
            const elementPrec = dates[index - 1];
            if (index == dates.length - 1) {
                if (this.diffHeuresVemgsaEgales(element, elementPrec) > troisHeures) {
                    creneauHoraire[i].dateMax = elementPrec;
                    creneauHoraire[i + 1] = <arrayCreneauHoraire>{};
                    creneauHoraire[i + 1].dateMin = element;
                    creneauHoraire[i + 1].dateMax = element;
                }
                else {
                    creneauHoraire[i].dateMax = element;
                }
            }
            else {
                if (this.diffHeuresVemgsaEgales(element, elementPrec) > troisHeures) {
                    creneauHoraire[i].dateMax = elementPrec;
                    i++;
                    creneauHoraire[i] = <arrayCreneauHoraire>{};
                    creneauHoraire[i].dateMin = element;
                }
            }
        }
        console.log("creneauHorairex trouves :", creneauHoraire);
        return creneauHoraire;
    }

    //log : ligne brut récupérée du fichier VEMGSA
    public isInCreneauxVemgsa(dates: creneauHoraire, log: string, diffMax: number): boolean {
        let isIn: boolean = false;

        //console.log("dates.dateMin",dates.dateMin);
        
        const momentDate1 = moment(dates.dateMin, 'DD-MM-YYYY HH mm ss');
        //console.log("momentDate1",momentDate1);

        if (dates.dateMax == undefined) {
            dates.dateMax = dates.dateMin;
        }
        const momentDate2 = moment(dates.dateMax, 'DD-MM-YYYY HH mm ss');


        let motif = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d")(\s.*-[A-Z]+\s+[A-Z|\d]+)/;
        let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)(")(.*)/;

        if (log.toString().match(motif) !== null) {

            let date = log.toString().replace(motif, "$1");

            if (date.match(motifDateHeure) !== null) {
                //console.log("date",date);
                
               
                const momentDate = moment(this.vlogtoString(date), 'DD-MM-YYYY HH mm ss'); 
 

                const diff1: number = momentDate.diff(momentDate1);
                const diff2: number = momentDate.diff(momentDate2);


                if (((diff1 >= 0) || (diff1 >= -diffMax)) && ((diff2 <= 0) || (diff2 <= diffMax))) {
                    isIn = true;
                }
                // console.log("momentDate",momentDate,"momentDate1",momentDate1, "momentDate2",momentDate2, "diff1",diff1,"diff2",diff2,"isIn",isIn);

            }
        }

        return isIn;
    }


    // dateToStore au format = jour + " " + heure + " " + minutes + " " + secondes;
    public isIncreneauHorairexVemgsaHoraire(dates: creneauHoraire, dateToStore: string, diffMax: number): boolean {




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

   
    /**
     * Transforme une date moment.Moment (lpln ou vemgsa avec le champ YYYY)  en string au format 'DD-MM-YYYY HH mm ss'
     * @param date 
     */
    public momenttoString(date: moment.Moment): string {
        const annee = date.format('YYYY');
        const jour = date.format('DD');
        const mois = date.format('MM');
        const heure = date.format('HH');
        const minute = date.format('mm');
        const seconde = date.format('ss');
        const dateToStore = jour + "-" + mois + "-" + annee + " " + heure + " " + minute + " " + seconde;
        return dateToStore;
    }

    /**
     * Transforme la date brut issue d'un fichier VEMGSA en string au format 'DD-MM-YYYY HH mm ss'
     * @param date 
     */
    public vlogtoString(date: string): string {
        let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)/;
        let jma = this.split.splitString(date.toString().replace(motifDateHeure, "$1"), '/');
        const jour = jma[0];
        const mois = jma[1];
        const annee = jma[2];
        const heure = date.toString().replace(motifDateHeure, "$3");
        const minutes = date.toString().replace(motifDateHeure, "$5");
        const secondes = date.toString().replace(motifDateHeure, "$7");
        const dateToStore = jour + "-" + mois + "-" + annee + " " + heure + " " + minutes + " " + secondes;
        return dateToStore;
    }


    /**
     * Fonction qui ajoute l'annee passée en paramètre à une date issue d'un fichier LPLN
     * @param dateLpln 
     * @param anneeVemgsa 
     */
    public addYearToLpln(dateLpln: moment.Moment, anneeVemgsa: string): moment.Moment {

        const jour = dateLpln.format('DD');
        const mois = dateLpln.format('MM');
        const heure = dateLpln.format('HH');
        const minute = dateLpln.format('mm');
        const dateToStore = jour + "-" + mois + "-" + anneeVemgsa + " " + heure + " " + minute + " OO";
        const momentDate = moment(dateToStore, 'DD-MM-YYYY HH mm ss');

        return momentDate;
    }

    /**
     * Fonction qui compare pour un vol les créneaux horaires LPLN et VEMGSA 
     * @param cL : creneauHoraire horaire du vol dans le fichier LPLN
     * @param cV : creneauHoraire horaire du vol dans le fichier VEMGSA
     * @returns {creneauHoraire} 
     * Si les deux créneaux sont compatibles ( dans la même plage horaire à plus ou moins trois heures)
     * la fonction renvoie le créneau global 
     * sinon elle renvoie null
     */
    public isCreneauxCompatibles(cL: creneauHoraire, cV: creneauHoraire): creneauHoraire {
        //TO DO : gerer le cas ou les dates VEMGSA sont sur deux années différentes
        const uneMinute = 60000;
        const uneHeure = 60 * uneMinute;
        const troisHeures = 3 * uneHeure;

        // console.log("cL1", cL.dateMin, "cL2", cL.dateMax, "cV1", cV.dateMin, "cV2", cV.dateMax);

        let result = <creneauHoraire>{};


        let cL1 = moment(cL.dateMin, 'DD-MM HH mm');
        let cL2 = moment(cL.dateMax, 'DD-MM HH mm');
        let cV1 = moment(cV.dateMin, 'DD-MM-YYYY HH mm ss');
        let cV2 = moment(cV.dateMax, 'DD-MM-YYYY HH mm ss');

        const moisL1 = cL1.format('MM');
        const moisL2 = cL2.format('MM');
        const moisV1 = cV1.format('MM');
        const moisV2 = cV2.format('MM');


        if (moisL1 == moisV1) {
            cL1 = this.addYearToLpln(cL1, cV1.format('YYYY'));
        }
        else if (moisL1 == moisV2) {
            cL1 = this.addYearToLpln(cL1, cV2.format('YYYY'));
        }
        if (moisL2 == moisV1) {
            cL2 = this.addYearToLpln(cL2, cV1.format('YYYY'));
        }
        else if (moisL2 == moisV2) {
            cL2 = this.addYearToLpln(cL2, cV2.format('YYYY'));
        }


        // }

        const diff1: number = cV1.diff(cL1); //cV1 - cL1  => diff1 > 0 si cV1>cL1
        const diff2: number = cV2.diff(cL2); //cV2 - cL2  => diff2 >0 si cV2>cL2

        // |cV1 -cL1| < 3heure ET  |cV2 -cL2|< 3heure


        const condition = ((Math.abs(diff1) < troisHeures) && (Math.abs(diff2) < troisHeures));

        if (condition) {
            if (diff1 >= 0) {
                result.dateMin = this.momenttoString(cL1);
            }
            else {
                result.dateMin = this.momenttoString(cV1);
            }
            if (diff2 >= 0) {
                result.dateMax = this.momenttoString(cV2);
            }
            else {
                result.dateMax = this.momenttoString(cL2);
            }
        }
        else {
            result = null;
        }
       // console.log("cL1", cL1, "cL2", cL2, "cV1", cV1, "cV2", cV2);
        //console.log("(Math.abs(diff1) < troisHeures)", (Math.abs(diff1) < troisHeures), "(Math.abs(diff1)", Math.abs(diff1), "troisHeures",troisHeures);
        //console.log("(Math.abs(diff2) < troisHeures)", (Math.abs(diff2) < troisHeures), "(Math.abs(diff2)", Math.abs(diff2), "troisHeures",troisHeures);
        //console.log("(Math.abs(diff3) < troisHeures)", (Math.abs(diff3) < troisHeures), "(Math.abs(diff3)", Math.abs(diff3), "troisHeures",troisHeures);
        //console.log("(Math.abs(diff4) < troisHeures)", (Math.abs(diff4) < troisHeures), "(Math.abs(diff4)", Math.abs(diff4), "troisHeures",troisHeures);

        //console.log("diff1", diff1, "diff2", diff2, "diff3", "condition", condition);


        return result;


    }
}