import { EtatCpdlc } from './etatCpdlc';
import moment = require('moment');
import { etatTransfertFrequence, etatLogonConnexion, etatLogonConnexionSimplifiee, erreurVol } from './checkAnswer'
import { Etat } from './enumEtat';

export class Vol {
    /** identifiant unique d'un vol (heure en ms ?) */
    private id: string;
    /** identifiant echange entre le serveur air et le STPV pour designer un vol */
    private reqid: number;
    /**Identifiant du vol (code OACI ?) */
    private arcid: string;
    /**Identifiant plan de vol (numero cautra) */
    private plnid: number;
    /**nom du secteur logique traverse */
    private sl: string;
    /**Aeroport de depart*/
    private adep: string;
    /**Aeroport de destination*/
    private ades: string;
    /**Date du vol */
    private date: string;
    /*liste des logs concernant le vol */
    private listeLogs: EtatCpdlc[];
    /*Presence de logs CPDLC */
    private haslogCpdlc: boolean;
    /*Presence de logs CPDLC complets */
    private islogCpdlcComplete: boolean;
    /*etat des differents transferts de frequence*/
    private listeEtatTransfertFrequence: etatTransfertFrequence[];
    /*etat des differents transferts de frequence*/
    private listeEtatLogonConnexion: etatLogonConnexion[];
    /*etat des differents transferts de frequence*/
    private timelineEtatLogonConnexion: etatLogonConnexionSimplifiee[];

    // PARAMETRES LIES AU LOGON 
    /**Adresse  Mode S vide si route ifps = NON ... inutile a traiter -> a supprimer */
    private adrModeS: string;
    /**Adresse Mode S envoyee par l'equipement bord */
    private adrModeSInf: string;
    /**Adresse deposee par le pilote dans son plan de vol */
    private adrDeposee: string;
    /**Indique si le vol est declare equipe cpdlc */
    private equipementCpdlc: string;
    /**Reception d'une demande de logon */
    private logonInitie: string;   //0: NA, 1:true , 2:false 
    /**Acceptation du logon par le STPV*/
    private logonAccepte: string;
    /**adrDeposee et cmpAdrModeSInf identique (entre Lpln et Vemgsa)  */
    private cmpAdrModeS: string;
    /**adep identique entre Lpln et Vemgsa  */
    private cmpAdep: string;
    /**ades identique entre Lpln et Vemgsa  */
    private cmpAdes: string;
    /**arcid identique entre Lpln et Vemgsa  */
    private cmpArcid: string;
    /**conditions du logon remplies/ logon effectue  */
    private conditionsLogon: string;
    /* */


    /** */

    // PARAMETRES LIES A LA CONNEXION
    /**Connexion initiee par le STPV vers l aeronef  */
    private isConnexionInitiee: boolean;
    /**Connexion etablie vers l aeronef  */
    private isConnexionEtablie: boolean;
    /**Perte de connexion avec l aeronef  */
    private isConnexionPerdue: boolean;


    /**Attributs utilisés côté client */
    private listeErreurs: erreurVol[];



    constructor(arcid: string, plnid: number) {
        this.id = moment().format();
        this.arcid = arcid;
        this.plnid = plnid;
        this.date = "";
        this.listeLogs = [];
        this.logonInitie = "NA";
        this.logonAccepte = "NA";
        this.isConnexionInitiee = false;
        this.isConnexionEtablie = false;
        this.isConnexionPerdue = false;
        this.cmpAdrModeS = "NA";
        this.cmpAdep = "NA";
        this.cmpAdes = "NA";
        this.cmpArcid = "NA";
        this.conditionsLogon = "NA";
        this.haslogCpdlc = false;
        this.islogCpdlcComplete = false;
        this.listeEtatTransfertFrequence = [];
        this.listeEtatLogonConnexion = [];
        this.timelineEtatLogonConnexion = [];
        this.listeErreurs = [];

    }


    //SETTERS 
    public setAdrModeS(adrModeS: string): void {
        this.adrModeS = adrModeS;
    }

    public setAdrModeSInf(adrModeSInf: string): void {
        this.adrModeSInf = adrModeSInf;
    }

    public setAdrDeposee(adrDeposee: string): void {
        this.adrDeposee = adrDeposee;
    }

    public setEquipementCpdlc(equipementCpdlc: string): void {
        this.equipementCpdlc = equipementCpdlc;
    }

    public setAdep(adep: string): void {
        this.adep = adep;
    }

    public setAdes(ades: string): void {
        this.ades = ades;
    }

    public setDate(date: string): void {
        this.date = date;
    }

    public setLogonInitie(logonInitie: string): void {
        this.logonInitie = logonInitie;
    }

    public setLogonAccepte(logonAccepte: string): void {
        this.logonAccepte = logonAccepte;
    }

    public setIsConnexionInitiee(isConnexionInitiee: boolean): void {
        this.isConnexionInitiee = isConnexionInitiee;
    }

    public setIsConnexionEtablie(isConnexionEtablie: boolean): void {
        this.isConnexionEtablie = isConnexionEtablie;
    }

    public setIsConnexionPerdue(isConnexionPerdue: boolean): void {
        this.isConnexionPerdue = isConnexionPerdue;
    }

    public setArcid(arcid: string): void {
        this.arcid = arcid;
    }

    public setReqid(vol: Vol, reqid: number): void {
        vol.reqid = reqid;
    }

    public setListeLogs(listeLogs: EtatCpdlc[]): void {
        this.listeLogs = listeLogs;
    }

    public setSL(sl: string): void {
        this.sl = sl;
    }

    public setCmpAdrModeS(cmpAdrModeS: string): void {
        this.cmpAdrModeS = cmpAdrModeS;
    }

    public setCmpAdep(cmpAdep: string): void {
        this.cmpAdep = cmpAdep;
    }

    public setCmpAdes(cmpAdes: string): void {
        this.cmpAdes = cmpAdes;
    }

    public setCmpArcid(cmpArcid: string): void {
        this.cmpArcid = cmpArcid;
    }

    public setConditionsLogon(conditionsLogon: string): void {
        this.conditionsLogon = conditionsLogon;
    }

    public setHaslogCpdlc(haslogCpdlc: boolean): void {
        this.haslogCpdlc = haslogCpdlc;
    }
    public setIslogCpdlcComplete(islogCpdlcComplete: boolean): void {
        this.islogCpdlcComplete = islogCpdlcComplete;
    }
    public setListeEtatTransfertFrequence(listeEtatTransfertFrequence: etatTransfertFrequence[]): void {
        this.listeEtatTransfertFrequence = listeEtatTransfertFrequence;
    }

    public setListeEtatLogonConnexion(listeEtatLogonConnexion: etatLogonConnexion[]): void {
        this.listeEtatLogonConnexion = listeEtatLogonConnexion;
    }
    public setTimelineEtatLogonConnexion(timelineEtatLogonConnexion: etatLogonConnexionSimplifiee[]): void {
        this.timelineEtatLogonConnexion = timelineEtatLogonConnexion;
    }





    public addElt(elt: EtatCpdlc): void {
        this.getListeLogs().push(elt);
    }


    //GETTERS 
    public getVol(vol: Vol): string {
        console.log(vol.reqid);
        return "InfosVol :  " + vol.reqid;
    }

    public getListeLogs(): EtatCpdlc[] {
        return this.listeLogs;
    }

    public getArcid(): string {
        return this.arcid;
    }

    public getAdrModeS(): string {
        return this.adrModeS;
    }

    public getAdrModeSInf(): string {
        return this.adrModeSInf;
    }

    public getAdrDeposee(): string {
        return this.adrDeposee;
    }

    public getEquipementCpdlc(): string {
        return this.equipementCpdlc;
    }

    public getAdep(): string {
        return this.adep;
    }

    public getAdes(): string {
        return this.ades;
    }

    public getDate(): string {
        return this.date;
    }

    public getLogonInitie(): string {
        return this.logonInitie;
    }

    public getLogonAccepte(): string {
        return this.logonAccepte;
    }

    public getIsConnexionInitiee(): boolean {
        return this.isConnexionInitiee;
    }

    public getIsConnexionEtablie(): boolean {
        return this.isConnexionEtablie;
    }

    public getIsConnexionPerdue(): boolean {
        return this.isConnexionPerdue;
    }

    public getCmpAdrModeS(): string {
        return this.cmpAdrModeS;
    }

    public getCmpAdep(): string {
        return this.cmpAdep;
    }

    public getCmpAdes(): string {
        return this.cmpAdes;
    }

    public getCmpArcid(): string {
        return this.cmpArcid;
    }

    public getConditionsLogon(): string {
        return this.conditionsLogon;
    }

    public getHaslogCpdlc(): boolean {
        return this.haslogCpdlc;
    }
    public getIslogCpdlcComplete(): boolean {
        return this.islogCpdlcComplete;
    }
    public getListeEtatTransfertFrequence(): etatTransfertFrequence[] {
        return this.listeEtatTransfertFrequence;
    }

    public getListeEtatLogonConnexion(): etatLogonConnexion[] {
        return this.listeEtatLogonConnexion;
    }
    public getTimelineEtatLogonConnexion(): etatLogonConnexionSimplifiee[] {
        return this.timelineEtatLogonConnexion;
    }

    public getListeErreurs(): erreurVol[] {
        return this.listeErreurs;
    }






    private evaluationEtatsLogonConnexion(): void {
        let tabEtatLogonConnexionTemp: etatLogonConnexion[] = [];
        let infoSupp: boolean;

        this.listeLogs.forEach(log => {
            let etatLogonConnexion = <etatLogonConnexion>{};
            etatLogonConnexion.dateChgtEtat = log.getDate();
            etatLogonConnexion.log = log.getTitle();
            infoSupp = false;
            //automate a etat sur la variable etat 
            switch (log.getTitle()) {
                case 'CPCASREQ': {

                    etatLogonConnexion.etat = Etat.NonLogue;
                    etatLogonConnexion.infoEtat = "DemandeLogonEnCours";
                    infoSupp = true;
                    break;
                }
                case 'CPCASRES': {
                    if ((log.getDetaillog()["ATNASSOC"] == "S") || (log.getDetaillog()["ATNASSOC"] == "L")) {
                        etatLogonConnexion.etat = Etat.NonLogue;
                        etatLogonConnexion.infoEtat = "DemandeLogonEncoursAutoriseeParStpv";
                        infoSupp = true;
                    }
                    else if (log.getDetaillog()["ATNASSOC"] == "F") {
                        etatLogonConnexion.etat = Etat.NonLogue;
                        etatLogonConnexion.infoEtat = "DemandeLogonRefuseeParStpv";
                        infoSupp = true;
                    }
                    break;
                }
                case 'CPCVNRES': {
                    if (log.getDetaillog()["GAPPSTATUS"] == "A") {
                        etatLogonConnexion.etat = Etat.Logue;
                        etatLogonConnexion.infoEtat = "LogonAcceptee";
                        infoSupp = true;
                    }
                    else if (log.getDetaillog()["GAPPSTATUS"] == "F") {
                        etatLogonConnexion.etat = Etat.NonLogue;
                        etatLogonConnexion.infoEtat = "EchecLogon";
                        infoSupp = true;
                    }
                    break;
                }
                case 'CPCOPENLNK': {
                    //console.log('CPCOPENLNK'); 
                    etatLogonConnexion.etat = Etat.Logue;
                    etatLogonConnexion.infoEtat = "DemandeConnexion";
                    infoSupp = true
                    break;
                }
                case 'CPCCOMSTAT': {
                    //console.log('CPCCOMSTAT'); 
                    if (log.getDetaillog()["CPDLCCOMSTATUS"] == "A") {
                        etatLogonConnexion.etat = Etat.Connecte;
                        etatLogonConnexion.infoEtat = "Connecte";
                        infoSupp = true
                    }
                    else if (log.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
                        etatLogonConnexion.etat = Etat.Logue;
                        etatLogonConnexion.infoEtat = "Deconnexion";
                        infoSupp = true
                    }
                    break;
                }
                case 'CPCEND': {
                    //console.log('CPCEND'); 
                    etatLogonConnexion.etat = Etat.NonLogue;
                    etatLogonConnexion.infoEtat = "Fin du vol";
                    infoSupp = true
                    break;
                }
                case 'CPCCLOSLNK': {
                    //console.log('CPCCLOSLNK'); 
                    etatLogonConnexion.etat = Etat.Logue;
                    etatLogonConnexion.infoEtat = "DemandeDeconnexion";
                    infoSupp = true
                    break;
                }
                case 'FIN VOL': {
                    // console.log("je passe dans FIN VOL !!!!!!!!!!!!!!!!!!!!");
                    etatLogonConnexion.etat = Etat.NonLogue;
                    etatLogonConnexion.infoEtat = "Fin du vol";
                    infoSupp = true
                    break;
                }
                case 'FPCLOSE': {
                    etatLogonConnexion.etat = Etat.NonLogue;
                    etatLogonConnexion.infoEtat = "Fin du vol";
                    infoSupp = true
                    break;
                }
                default: {
                    // console.log("je passe dans default",log.getTitle()); 
                    break;
                }
            }
            if (infoSupp) {
                tabEtatLogonConnexionTemp.push(etatLogonConnexion);

            }

        });
        /**console.log("BEFORE array tabEtatLogonConnexionLPLNs: ");
        tabEtatLogonConnexionTemp.forEach(element => {
          console.log(element.dateChgtEtat, element.etat, element.infoEtat, element.log);
        });*/
        let tabEtatLogonConnexion: etatLogonConnexion[] = [];

        for (let index = 0; index < tabEtatLogonConnexionTemp.length; index++) {

            const element = tabEtatLogonConnexionTemp[index];
            tabEtatLogonConnexion.push(element);

            if (index > 0) {
                const elementPrevious = tabEtatLogonConnexionTemp[index - 1];

                if ((element.etat == Etat.Logue) && (element.infoEtat == "DemandeDeconnexion") && (elementPrevious.infoEtat == "Deconnexion")) {
                    tabEtatLogonConnexion.pop();
                }
                else if (((element.etat == Etat.NonLogue) || ((element.etat == Etat.Logue) && (element.etat == Etat.Logue))) && (element.infoEtat == elementPrevious.infoEtat)) {
                    tabEtatLogonConnexion.pop();
                    tabEtatLogonConnexion.pop();
                    tabEtatLogonConnexion.push(element);
                }
            }

        }
        /**console.log("AFTER array tabEtatLogonConnexionLPLNs: ");
        tabEtatLogonConnexion.forEach(element => {
          console.log(element.dateChgtEtat, element.etat, element.infoEtat, element.log);
        });*/

        this.setListeEtatLogonConnexion(tabEtatLogonConnexion);


    }


    private evaluationEtatsLogonConnexionSimplifie(): void {
        let tabEtatLogonConnexionSimplifie: etatLogonConnexionSimplifiee[] = [];
        let tabEtatConnexion: etatLogonConnexionSimplifiee[] = [];
        let tabEtatLogon: etatLogonConnexionSimplifiee[] = [];
        let tabEtatLogonTemp: etatLogonConnexionSimplifiee[] = [];
        let tabLog: etatLogonConnexionSimplifiee[] = [];


        let tabEtatLogonConnexion: etatLogonConnexion[] = this.getListeEtatLogonConnexion();

        //RECUPERATION DES INFORMATION DE LOGON
        for (let index = 0; index < tabEtatLogonConnexion.length; index++) {
            const element = tabEtatLogonConnexion[index];
            let newElement = <etatLogonConnexionSimplifiee>{};
            newElement.fromDate = element.dateChgtEtat;
            newElement.toDate = element.dateChgtEtat;
            newElement.name = "logon";
            newElement.infoEtat = element.etat;

            if (index == 0) {
                if (element.etat == Etat.Connecte) {
                    newElement.infoEtat = Etat.Logue;
                }
                tabEtatLogonTemp.push(newElement);
            }
            else {
                const elementPrevious = tabEtatLogonConnexion[index - 1];
                //cas ou on passe de logue a non logue
                if ((elementPrevious.etat !== element.etat) && (element.etat == Etat.NonLogue)) {
                    tabEtatLogonTemp[tabEtatLogonTemp.length - 1].toDate = element.dateChgtEtat;
                    tabEtatLogonTemp.push(newElement);
                }
                //cas ou on passe de non logue a logue
                else if ((elementPrevious.etat !== element.etat) && (elementPrevious.etat == Etat.NonLogue)) {
                    tabEtatLogonTemp[tabEtatLogonTemp.length - 1].toDate = element.dateChgtEtat;
                    tabEtatLogonTemp.push(newElement);
                }
            }
            if (index == tabEtatLogonConnexion.length - 1) {
                tabEtatLogonTemp[tabEtatLogonTemp.length - 1].toDate = tabEtatLogonConnexion[tabEtatLogonConnexion.length - 1].dateChgtEtat;
            }
        }
        //suppression des changements d etat immediats
        tabEtatLogonTemp.forEach(element => {
            if (element.fromDate !== element.toDate) {
                tabEtatLogon.push(element);
            }

        });

        //RECUPERATION DES INFORMATION DE CONNEXION
        for (let index = 0; index < tabEtatLogonConnexion.length; index++) {
            const element = tabEtatLogonConnexion[index];
            let newElement = <etatLogonConnexionSimplifiee>{};
            newElement.fromDate = element.dateChgtEtat;
            newElement.toDate = element.dateChgtEtat;
            newElement.name = "connexion";
            newElement.infoEtat = element.etat;
            if (index == 0) {
                if (element.etat == Etat.Connecte) {
                    tabEtatConnexion.push(newElement);
                }
            }
            else {
                const elementPrevious = tabEtatLogonConnexion[index - 1];
                if ((elementPrevious.etat !== element.etat) && (element.etat == Etat.Connecte)) {
                    tabEtatConnexion.push(newElement);
                }
                else if ((elementPrevious.etat !== element.etat) && (elementPrevious.etat == Etat.Connecte)) {
                    tabEtatConnexion[tabEtatConnexion.length - 1].toDate = element.dateChgtEtat;
                }
            }
        }

        //RECUPERATION DES INFORMATION de LOG IMPORTANT POUR  L UTILISATEUR tabLog
        for (let index = 0; index < tabEtatLogonConnexion.length; index++) {
            const element = tabEtatLogonConnexion[index];
            let newElement = <etatLogonConnexionSimplifiee>{};
            newElement.fromDate = element.dateChgtEtat;
            newElement.name = "logs";
            newElement.logs = element.infoEtat;
            // newElement.fromDate= String(moment(newElement.fromDate).format('DD-MM HH mm'));
            // newElement.toDate= String(moment(newElement.toDate).format('DD-MM HH mm'));


            if (index == 0) {
                tabLog.push(newElement);
            }
            else {
                const elementPrevious = tabLog[tabLog.length - 1];
                if (elementPrevious.fromDate == element.dateChgtEtat) {
                    tabLog[tabLog.length - 1].logs += "\n" + element.infoEtat;
                }
                else {
                    tabLog.push(newElement);
                }
            }
        }


        //REMPLISSAGE DU TABLEAU DE LOGON CONNEXION EN RESPECTANT L ORDRE SUIVANT :
        //INFOS DE LOGS
        //INFOS DE CONNEXION
        //INFOS DE LOGON

        tabLog.forEach(element => {
            tabEtatLogonConnexionSimplifie.push(element);
        });

        tabEtatConnexion.forEach(element => {
            tabEtatLogonConnexionSimplifie.push(element);
        });

        tabEtatLogon.forEach(element => {
            tabEtatLogonConnexionSimplifie.push(element);
        });

        tabEtatLogonConnexionSimplifie.forEach(element => {
            console.log("element.fromDate", element.fromDate);
            const momentDate1 = moment(element.fromDate, 'DD-MM-yyyy HH mm ss');
            if (momentDate1.isValid()) {
                element.fromDate = moment(momentDate1).format('DD-MM HH mm ss')
            }
            console.log("element.fromDate after", element.fromDate);

            console.log("element.toDate", element.toDate);
            const momentDate2 = moment(element.toDate, 'DD-MM-yyyy HH mm ss');
            if (momentDate2.isValid()) {
                element.toDate = moment(momentDate2).format('DD-MM HH mm ss')
            }
            console.log("element.toDate after", element.toDate);
        });


        this.setTimelineEtatLogonConnexion(tabEtatLogonConnexionSimplifie);

    }


    private setListeErreurs() {

        //ERREURS DE LOGON
        if (this.getLogonAccepte() !== "OK") {
            this.listeErreurs.push({ date: this.getDate(), type: "logon NOK", infos: this.evaluateEtatLogon() });
        }

        //ERREURS DE CONNEXION
        let resultConnexion: { connexion: string, explication: string } = this.evaluateEtatConnexion();

        if (resultConnexion.connexion == "KO") {
            this.listeErreurs.push({ date: this.getDate(), type: "connexion NOK", infos: resultConnexion.explication });
        }

        //ERREURS DE TRANSFERT DE FREQUENCE
        this.getListeEtatTransfertFrequence().forEach(element => {
            if (element.isTransfertAcq !== true) {
                let infos:string = "timeout"  ;
                let deltaTSecondes:number = element.deltaT / 1000;
           if ((deltaTSecondes > 0) && (deltaTSecondes <60)){
            infos += " delta T: "+deltaTSecondes+" secondes"+" hyp : délai de reception par le bord";
           }
           else if ((deltaTSecondes >= 60) && (deltaTSecondes <100)){
            infos += " delta T: "+deltaTSecondes+" secondes"+" hyp : délai reception réponse bord";
        }
                this.listeErreurs.push({ date: element.dateTransfert, type: "echec de transfert", infos: infos});
            }
        });
        console.log("nb erreurs : ", this.getListeErreurs().length);
        this.getListeErreurs().push()

    }

     

    /**
 * Evalue a partir des information de logon si un message d'erreur doit être affiche  l utilisateur
 */
    private evaluateEtatLogon(): string {

        let explication: string;


        if (this.getLogonInitie() === "OK") {
            explication = "Logon Rejeté par le STPV";
        }
        else {
            if (this.getConditionsLogon() === "OK") {
                explication = "Pas de logon Initié par le bord";
            }
            else {
                if (this.getEquipementCpdlc() !== "EQUIPE") {
                    explication = "Vol non déclaré CPDLC";
                }
                else {
                    explication = "l'un des paramètres déclarés dans le plan de vol n'est pas cohérent avec celui envoyé par le bord ";
                    explication += "adep: " + this.getAdep() + "ades: " + this.getAdes() + "arcid: " + this.getArcid() + "adrDeposee: " + this.getAdrDeposee() + "adrModeS: " + this.getAdrModeSInf();
                }
            }
        }


        return explication;
    }

    /**
     * Evalue a partir des information de connexion si un message d'erreur doit être affiche  l utilisateur
     */
    private evaluateEtatConnexion(): { connexion: string, explication: string } {
        let connexion: string;
        let explication: string;
        if (this.getLogonAccepte() !== "OK") {
            if (!this.getIsConnexionInitiee() && !this.getIsConnexionEtablie()) {
                connexion = "KO";
                explication = "Pas de connexion possible car vol non logue ";
            }
        }
        else {

            if (!this.getIsConnexionInitiee()) {
                connexion = "KO";
                explication = "Pas de connexion initiée par le STPV ";
            }
            else if (!this.getIsConnexionEtablie()) {
                connexion = "KO";
                explication = "Echec de connexion avec l'aeronef ";
            }
            else if (this.getIsConnexionPerdue()) {
                connexion = "KO";
                explication = "Perte de connexion avec l'aeronef ";
            }

        }

        return { connexion, explication };
    }



    /**
     * Evalue a partir des messages echanges s'il y a eu une connecion initiee, etablie ou perdue
     */
    private evaluationConnexion(): void {


        let isConnexionInitiee: boolean = false;
        let isConnexionEtablie: boolean = false;
        let isConnexionPerdue: boolean = false;
        let isDeconnexionDemandee: boolean = false;

        this.listeLogs.forEach(log => {
            //automate a etat sur la variable etat 
            switch (log.getTitle()) {
                case 'CPCOPENLNK': {
                    //console.log('CPCOPENLNK'); 
                    isConnexionInitiee = true;
                    break;
                }
                case 'CPCCOMSTAT': {
                    //console.log('CPCCOMSTAT'); 
                    if (log.getDetaillog()["CPDLCCOMSTATUS"] == "A") {
                        isConnexionEtablie = true;
                    }
                    else if (log.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
                        if (isConnexionEtablie && !isDeconnexionDemandee) {
                            isConnexionPerdue = true;
                        }
                    }
                    break;
                }
                case 'CPCCLOSLNK': {
                    //console.log('CPCCLOSLNK'); 
                    isDeconnexionDemandee = true;
                    break;
                }
                default: {
                    // console.log("je passe dans default",log.getTitle()); 
                    break;
                }
            }


        });
        this.setIsConnexionInitiee(isConnexionInitiee);
        this.setIsConnexionEtablie(isConnexionEtablie);
        this.setIsConnexionPerdue(isConnexionPerdue);
    }

    public initLogonConnexionResults(): void {
        this.evaluationEtatsLogonConnexion();
        this.evaluationEtatsLogonConnexionSimplifie();
        //Evalue a partir des messages echanges s'il y a eu une connecion initiee, etablie ou perdue
        this.evaluationConnexion();
        this.setListeErreurs();
    }


} 
