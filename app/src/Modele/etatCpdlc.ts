import { TSMap } from "typescript-map";
import {Etat} from '../Parseur/enumEtat';

export class etatCpdlc {
  id: number;
  title: string;
  date: string;
  heure: string;
  etat: Etat;
  associable :boolean;
  infoMap: TSMap<string,string>;


  constructor( id : number) {
    this.id = id ;
    this.infoMap = new TSMap();
  }

  /*getLogCpdlc() {

    return "\n InfoLog :  \n id = " +this.id + "\n date = " + this.date +  "\n heure = " + this.heure + "\n associable = " + this.associable +  this.etat.getEtatCpdlc();
  }*/


  getEtatCpdlc():string {

    return "\nINfos EtatCpdlc :\n id = " +this.id + "\n title = " + this.title +  "\n info = " + this.getMapCpdlc()  ;
  }

  getMapCpdlc():string {
    var infoString="";
    this.infoMap.forEach((value, key, info) => {
    infoString +=key+ ':'+ value+"\n";
    })
    //console.log(this.info.keys()); // [1, [2], true]
    //console.log(this.info.values()); // ["hello", "ts", "map"]

    return infoString  ;

  }

  getFrequence():string{
    if (this.infoMap.get("FREQ") !== undefined) {
      var freq = this.infoMap.get("FREQ");
      return freq;
    }
    else {
      return null;
    }

  }

  getHeureLogCpdlc():string {

    return "heure = " + this.heure ;
  }

}



/*

exemples utilisation map
map.get(1) // "hello"
map.get(k2) // "world"
map.size // 3
map.keys() // [1, [2], true]
map.values() // ["hello", "ts", "map"]


map.forEach((value, key, map) => {
  console.log(key, ':', value)
})*/
