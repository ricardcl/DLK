import { Etat } from './enumEtat';


export interface DetailCpdlc {
  key: string ;
  value: string;
}

export class EtatCpdlc {
  private id: number;
  private title: string;
  private jour: string;
  private heure: string;
  private date: string;
  private etat: Etat;
  private associable: boolean;
  private log: string;
  private detailLog: DetailCpdlc[];
  private explication: string;
  private isTypeCPC: boolean; // VAUT 1 si CPDLC et 0 si  STPV 



  constructor(id: number) {
    this.id = id;
    this.title = "";
    this.jour = "";
    this.heure = "";
    this.date = "";
    this.etat = Etat.NonLogue;
    this.associable = false;
    this.log = "";
    this.detailLog = [];
    this.explication = "";
    this.isTypeCPC = false;
  }

  /*getLogCpdlc() {

    return "\n InfoLog :  \n id = " +this.id + "\n date = " + this.date +  "\n heure = " + this.heure + "\n associable = " + this.associable +  this.etat.getEtatCpdlc();
  }*/



  getEtatCpdlc(): string {

    return "\nINfos EtatCpdlc :\n id = " + this.id + "\n title = " + this.title + "\n info = " + this.getDetaillog();
  }



  isDetail(key: string): boolean {


    let trouve: boolean = false;

    this.detailLog.forEach(element => {
      if (key === element.key) {
        trouve = true;
      }


    });

    return trouve;
  }


  getDetaillog() {
    return this.detailLog;
  }



  setDetailLog(array: DetailCpdlc[]) {
    this.detailLog = array;
  }

  addDetail(detail: DetailCpdlc) {
    if (this.isDetail(detail.key)) {

      this.detailLog.forEach((element, index) => {
        if (detail.key === element.key) {
          delete this.detailLog[index];
        }
      });
    }
    this.detailLog.push(detail);

  }

  //GETTERS
  getTitle(): string {
    return this.title;
  }
  getJour(): string {
    return this.jour;
  }
  getHeure(): string {
    return this.heure
  }

  getDate(): string {
    return this.date;
  }

  getEtat(): Etat {
    return this.etat;
  }

  getLog(): string {
    return this.log;
  }

  getIsTypeCPC(): boolean {
    return this.isTypeCPC;
  }
  getExplication():string{
    return this.explication;
  }

  //SETTERS
  setTitle(title: string) {
    this.title = title;
  }
  setJour(jour: string) {
    this.jour = jour;
  }
  setDate(date: string) {
    this.date = date;
  }
  setHeure(heure: string) {
    this.heure = heure;
  }
  setExplication(explication: string) {
    this.explication = explication;
  }
  setIsTypeCPC(isTypeCPC: boolean) {
    this.isTypeCPC = isTypeCPC;
  }
  setEtat(etat: Etat) {
    this.etat = etat;
  }
  setAssociable(associable: boolean) {
    this.associable = associable;
  }

  setLog(log: string) {
    this.log = log;
  }




}

