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
    /*liste des logs concernant le vol */
    private listeLogs: EtatCpdlc[];
    /**Adresse  Mode S envoyee par ?? */
    private adrModeS: string;
    /**Adresse Mode S envoyee par l'equipement bord */
    private adrModeSInf: string;
    /**Adresse deposee par le pilote dans son plan de vol */
    private adrDeposee: string;

    constructor(arcid: string, plnid: number) {
        this.arcid = arcid;
        this.plnid = plnid;
        this.listeLogs = [];
    }

    public setadrModeS(adrModeS: string): void {
        this.adrModeS = adrModeS;
    }

    public setadrModeSInf(adrModeSInf: string): void {
        this.adrModeSInf = adrModeSInf;
    }

    public setadrDeposee(adrDeposee: string): void {
        this.adrDeposee = adrDeposee;
    }

    public setSL(sl: string): void {
        this.sl = sl;
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

    public getadrModeS(): string {
        return this.adrModeS;
    }

    public getadrModeSInf(): string {
        return this.adrModeSInf;
    }

    public getadrDeposee(): string {
        return this.adrDeposee;
    }



    public addElt(elt: EtatCpdlc): void {
        this.getListeLogs().push(elt);
    }

}
