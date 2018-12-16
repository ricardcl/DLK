import {etatCpdlc} from './etatCpdlc';
import {TSMap} from "typescript-map";

export class vol {
    /** identifiant echange entre le serveur air et le STPV pour designer un vol */
     reqid: number;
     /**Identifiant du vol (code OACI ?) */
     arcid: string;
     /**Identifiant plan de vol (numero cautra) */
     plnid: number;
     listeLogs: TSMap<number,etatCpdlc>;

    constructor( arcid: string,plnid : number) {
        this.plnid = plnid ;
        this.listeLogs = new TSMap();
    }

    setReqid(vol : vol, reqid : number):void {
        vol.reqid = reqid;
    }

    getVol(vol : vol):string {
        console.log(vol.reqid);
        return "InfosVol :  " + vol.reqid;
    }

}
