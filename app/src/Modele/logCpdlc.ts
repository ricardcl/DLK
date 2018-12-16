import {etatCpdlc} from './etatCpdlc';


export class logCpdlc {
  id : number;
  date: string;
  heure: string;
  associable :boolean;
  etat: etatCpdlc;

  constructor( id :number) {
    this.id = id ;
    this.etat = new etatCpdlc(id);
  }

  getLogCpdlc() {

    return "\n InfoLog :  \n id = " +this.id + "\n date = " + this.date +  "\n heure = " + this.heure + "\n associable = " + this.associable +  this.etat.getEtatCpdlc();
  }


  getDateHeureLogCpdlc() {

    return "\ndate = " + this.date +  " heure = " + this.heure ;
  }

  getHeureLogCpdlc() {

    return "heure = " + this.heure ;
  }

  /*function setEtat(log : logCpdlc, heure : string) {
  log.heure = heure;
}*/

/*
function setHeure( heure : string) {
this.heure = heure;
}

function getHeure() {
return this.heure;
}

function setDate(date: string) {
this.date = date;
}
*/


}
