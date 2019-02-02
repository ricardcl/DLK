import {etatCpdlc} from './etatCpdlc';

export class vol {
    /** identifiant echange entre le serveur air et le STPV pour designer un vol */
     private reqid: number;
     /**Identifiant du vol (code OACI ?) */
     private arcid: string;
     /**Identifiant plan de vol (numero cautra) */
     private plnid: number;
     /**nom du secteur logique traverse */
     private sl:string;
      /*liste des logs concernant le vol */
     private listeLogs: Array<etatCpdlc>;



    constructor( arcid: string,plnid : number) {
        this.arcid = arcid ;
        this.plnid = plnid ;
        this.listeLogs = [];
    }

    public setSL( sl : string):void {
        this.sl = sl;
    }

    public setArcid( arcid : string):void {
        this.arcid = arcid;
    }

    public setReqid(vol : vol, reqid : number):void {
        vol.reqid = reqid;
    }



     getVol(vol : vol):string {
        console.log(vol.reqid);
        return "InfosVol :  " + vol.reqid;
    }

    public getListeVol():Array<etatCpdlc>{
        return this.listeLogs;
    }

}
