import {etatCpdlc} from './etatCpdlc';
import {TSMap} from "typescript-map";

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
     private listeLogs: TSMap<number,etatCpdlc>;



    constructor( arcid: string,plnid : number) {
        this.arcid = arcid ;
        this.plnid = plnid ;
        this.listeLogs = new TSMap();
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

    public getListeVol():TSMap<number,etatCpdlc>{
        return this.listeLogs;
    }

}
