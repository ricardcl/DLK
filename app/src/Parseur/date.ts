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
    private uneMinute: number;
    private uneHeure: number;
    private troisHeures: number;

    constructor(split: Split) {
        console.log("Je rentre dans le constructor Dates ");
        this.split = split;
        this.uneMinute = 60000;
        this.uneHeure = 60 * this.uneMinute;
        this.troisHeures = 3 * this.uneHeure;
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


        const momentDateV = moment(hV, 'HH mm');
        const momentDateL = moment(hL, 'HH mm');
        /**
        console.log(hV);
        console.log(hL);    
        console.log(momentDateV);
        console.log(momentDateL);
        */

        const diff: number = Math.abs(momentDateV.diff(momentDateL)); //Rmq : diff renvoie un resultat en ms
        if (diff <= this.uneMinute) { return true; }
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

    /**
     * Fonction qui compare la date d'un  log VEMGSA et d'un date VEMGSA  au format DD-MM-YYYY HH mm ss
     * @param log  : date brut d'un log VEMGSA
     * @param creneauLimite : date VEMGSA  au format DD-MM-YYYY HH mm ss
     * @param diff : la différence en minutes
     * @returns true si (Date log - creneau limite) >= diff
     */
    public diffDateV(log: string, creneauLimite: string, diff: number): boolean {
        let result: boolean = false;
        const momentDateCreneau = moment(creneauLimite, 'DD-MM-YYYY HH mm ss');

        let motif = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d")(\s.*-[A-Z]+\s+[A-Z|\d]+)/;
        let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)(")(.*)/;
        //console.log("log:",log);

        if (log.toString().match(motif) !== null) {
            let date = log.toString().replace(motif, "$1");
            //   console.log("date", date);
            if (date.match(motifDateHeure) !== null) {
                const momentDateLog = moment(this.vlogtoString(date), 'DD-MM-YYYY HH mm ss');
                const diffMoment: number = momentDateLog.diff(momentDateCreneau);
                // console.log("momentDateLog", momentDateLog, "momentDateCreneau", momentDateCreneau);

                const diffMS = diff * this.uneMinute;
                // console.log("diffMS", diffMS, "diffMoment", diffMoment);

                if (diffMoment >= diffMS) {
                    result = true;
                }
            }
        }
        return result;
    }

    public diffDateVTest(log: string, creneauLimite: string, diff: number): boolean {
        let result: boolean = false;
        const momentDateCreneau = moment(creneauLimite, 'DD-MM-YYYY HH mm ss');

        let motif = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d")(\s.*-[A-Z]+\s+[A-Z|\d]+)/;
        let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)(")(.*)/;
        //console.log("log:",log);

        if (log.toString().match(motif) !== null) {
            let date = log.toString().replace(motif, "$1");
            // console.log("date", date);
            if (date.match(motifDateHeure) !== null) {
                const momentDateLog = moment(this.vlogtoString(date), 'DD-MM-YYYY HH mm ss');
                const diffMoment: number = momentDateLog.diff(momentDateCreneau);

                const diffMS = diff * this.uneMinute;
                console.log("diffMS", diffMS, "diffMoment", diffMoment);

                if (diffMoment >= diffMS) {
                    result = true;
                    console.log("log", momentDateLog, "c", momentDateCreneau, "diffMoment", diffMoment, "result", result);

                }

            }
        }

        return result;
    }

    /**
 * Fonction qui compare la date d'un  log VEMGSA et d'un date VEMGSA  au format DD-MM-YYYY HH mm ss
 * @param log  : date brut d'un log VEMGSA
 * @param creneauLimite : date VEMGSA  au format DD-MM-YYYY HH mm ss
 * @param diff : la différence en minutes
 * @returns true si (Date log - creneau limite) > diff
 */
    public diffDateVstrict(log: string, creneauLimite: string, diff: number): boolean {
        let result: boolean = false;
        const momentDateCreneau = moment(creneauLimite, 'DD-MM-YYYY HH mm ss');

        let motif = /(\d\d\/\d\d\/\d\d\d\d \d\dH\d\d'\d\d")(\s.*-[A-Z]+\s+[A-Z|\d]+)/;
        let motifDateHeure = /(.*)( )(.*)(H)(.*)(')(.*)(")(.*)/;
        if (log.toString().match(motif) !== null) {
            let date = log.toString().replace(motif, "$1");


            if (date.match(motifDateHeure) !== null) {

                const momentDateLog = moment(this.vlogtoString(date), 'DD-MM-YYYY HH mm ss');
                const diffMoment: number = momentDateLog.diff(momentDateCreneau);

                const diffMS = diff * this.uneMinute;
                if (diffMoment > diffMS) {
                    result = true;
                }
            }
        }
        return result;
    }
    /**
     * Fonction qui renvoie la valeur absolue de la difference de temps en ms entre deux dates passées en paramètre
     * @param d1 
     * @param d2 
     */
    public diffDatesAbs(d1: string, d2: string): number {
        return Math.abs(this.diffDates(d1, d2));
    }

    /**
 * Fonction qui renvoie la difference de temps en ms entre deux dates passées en paramètre
 * @param d1 
 * @param d2 
 */
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
        return diff;
    }

        /**
 * Fonction qui indique si la difference en ms entre deux dates est bien dans les limites passees en paramètre
 * renvoie true si diffMin <= d1-d2 <= diffMax
 * @param d1 
 * @param d2 
 * @param diffMin 
 * @param diffMax 
 * 
 */
public diffDatesInBornes(d1: string, d2: string, diffMin:number, diffMax:number ): boolean {
    let result:boolean=false;
   if ( (this.diffDates(d1,d2) <= diffMax) && (this.diffDates(d1,d2) >= diffMin)){
    result= true;   
   }
   return result;
}


    /**
     * Fonction qui détermine des différentes dates VEMGSA passées en paramètre les différents créneaux horaires
     * @param dates 
     */
    public getCreneaux(dates: string[]): creneauHoraire[] {
        let arrayHeuresTrouvees: string[] = dates;
        let creneauHoraire = new Array;

        let i: number = 0;

        creneauHoraire[0] = <arrayCreneauHoraire>{};
        creneauHoraire[0].dateMin = dates[0];
        creneauHoraire[0].dateMax = dates[0];

        for (let index = 1; index < dates.length; index++) {
            const element = dates[index];
            const elementPrec = dates[index - 1];
            if (index == dates.length - 1) {
                if (this.diffHeuresVemgsaEgales(element, elementPrec) > this.troisHeures) {
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
                if (this.diffHeuresVemgsaEgales(element, elementPrec) > this.troisHeures) {
                    creneauHoraire[i].dateMax = elementPrec;
                    i++;
                    creneauHoraire[i] = <arrayCreneauHoraire>{};
                    creneauHoraire[i].dateMin = element;
                }
            }
        }

        // console.log("creneauHorairex trouves :", creneauHoraire);
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


        const condition = ((Math.abs(diff1) < this.troisHeures) && (Math.abs(diff2) < this.troisHeures));

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