import { EtatCpdlc } from './etatCpdlc'; 
import moment = require('moment'); 
 
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
    /*liste des logs concernant le vol */ 
    private listeLogs: EtatCpdlc[]; 
    /*Presence de logs CPDLC */
    private haslogCpdlc:  boolean;
    /*Presence de logs CPDLC complets */
    private islogCpdlcComplete:  boolean;
 
 
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
    /** */ 
 
 
 
    constructor(arcid: string, plnid: number) { 
        this.id=moment().format();  
        this.arcid = arcid; 
        this.plnid = plnid; 
        this.listeLogs = []; 
        this.logonInitie = "NA"; 
        this.logonAccepte = "NA"; 
        this.cmpAdrModeS = "NA"; 
        this.cmpAdep = "NA"; 
        this.cmpAdes = "NA";       
        this.cmpArcid = "NA"; 
        this.conditionsLogon = "NA";   
        this.haslogCpdlc=false;
        this.islogCpdlcComplete=false;    
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
 
    public setLogonInitie(logonInitie: string): void { 
        this.logonInitie = logonInitie; 
    } 
 
    public setLogonAccepte(logonAccepte: string): void { 
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
 
    public getLogonInitie(): string { 
        return this.logonInitie; 
    } 
 
    public getLogonAccepte(): string { 
        return this.logonAccepte; 
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
 
 
} 
