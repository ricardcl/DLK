import { TSMap } from "typescript-map";
import { Etat } from './enumEtat';
import { DetailCpdlc } from "./detailCpdlc";

export class EtatCpdlc {
  private id: number = 0;
  private title: string = "";
  private date: string = "";
  private heure: string = "";
  private etat: Etat = Etat.NonLogue;
  private associable: boolean = false;
  private infoMap: TSMap<string, string>;
  private detailLog : DetailCpdlc[];




  constructor(id: number) {
    this.id = id;
    this.infoMap = new TSMap();
    this.detailLog = new Array();
  }

  /*getLogCpdlc() {

    return "\n InfoLog :  \n id = " +this.id + "\n date = " + this.date +  "\n heure = " + this.heure + "\n associable = " + this.associable +  this.etat.getEtatCpdlc();
  }*/


  getInfoMap(): TSMap<string, string> {
    return this.infoMap;
  }
  getEtatCpdlc(): string {

    return "\nINfos EtatCpdlc :\n id = " + this.id + "\n title = " + this.title + "\n info = " + this.getMapCpdlc();
  }

  getMapCpdlc(): string {
    var infoString = "";
    this.infoMap.forEach((value, key, info) => {
      infoString += key + ':' + value + "\n";
    })
    //console.log(this.info.keys()); // [1, [2], true]
    //console.log(this.info.values()); // ["hello", "ts", "map"]

    return infoString;

  }

  getFrequence(): string {



    if (this.infoMap["FREQ"] !== undefined) {
      return this.infoMap["FREQ"];
    }
    else {
      return null;
    }

  }

  getFrequence2(): string {

    this.detailLog.forEach(element => {
      if (element.key === "FREQ") {
        return element.value;
      }
    });

    return null;
  }

  isDetail(key : string){
    this.detailLog.forEach(element => {
      if ( key === element.key) return true;
    });
    return null;
  }

  getDetail(key : string){
    this.detailLog.forEach(element => {
      if ( key === element.key) return element.value;
    });
    return null;
  }

  setDetail(array : DetailCpdlc[]){
    this.detailLog = array;

  }

  //GETTERS
  getTitle(): string {
    return this.title;
  }
  getDate(): string {
    return this.date;
  }
  getHeure(): string {
    return this.date
  }

  //SETTERS
  setTitle(title: string) {
    this.title = title;
  }
  setDate(date: string) {
    this.date = date;
  }
  setHeure(heure: string) {
    this.heure = heure;
  }
  setInfoMap(infoMap: TSMap<string, string>) {
    this.infoMap = infoMap;
  }
  setEtat(etat: Etat) {
    this.etat = etat;
  }
  setAssociable(associable: boolean) {
    this.associable = associable;
  }

  setDetailLog(){
    console.log("debut set detail log");
    console.log("contenu map: ",this.infoMap);
  console.log("contenu map title: ",this.infoMap['TITLE']);
  let detail = <DetailCpdlc>{};
  detail.key = 'TITLE';
  detail.value = this.infoMap['TITLE'];
  this.detailLog.push(detail);
  console.log("contenu map longueur: ",this.detailLog.length);



  }

  getDetaillog(){
    return this.detailLog;
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
