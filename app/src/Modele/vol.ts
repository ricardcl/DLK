import { EtatCpdlc } from './etatCpdlc';

export class Vol {
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
    /*liste des logs concernant le vol */
    private listeLogs: EtatCpdlc[];
    /**Adresse  Mode S vide si route ifps = NON ... inutile a traiter -> a supprimer */


    // PARAMETRES LIES AU LOGON
    private adrModeS: string;
    /**Adresse Mode S envoyee par l'equipement bord */
    private adrModeSInf: string;
    /**Adresse deposee par le pilote dans son plan de vol */
    private adrDeposee: string;
    /**Indique si le vol est declare equipe cpdlc */
    private equipementCpdlc: string;
    /**Reception d'une demande de logon */
    private logonInitie: boolean;
    /**Acceptation du logon par le STPV*/
    private logonAccepte: boolean;

    constructor(arcid: string, plnid: number) {
        this.arcid = arcid;
        this.plnid = plnid;
        this.listeLogs = [];
        this.logonInitie = false;
        this.logonAccepte = false;
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

    public setLogonInitie(logonInitie: boolean): void {
        this.logonInitie = logonInitie;
    }

    public setLogonAccepte(logonAccepte: boolean): void {
        this.logonAccepte = logonAccepte;
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

    public getEdrDeposee(): string {
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

    public getLogonInitie(): boolean {
        return this.logonInitie;
    }

    public getLogonAccepte(): boolean {
        return this.logonAccepte;
    }




}
