import {vol} from '../Modele/vol';
import {parseurLpln} from './parseurLpln';
import {parseurVemgsa} from './parseur';
import {etatCpdlc} from '../Modele/etatCpdlc';



export  function getListeVols( arcid : string, plnid : number,fichierSourceLpln : string, fichierSourceVemgsa : string[] ):vol[] {
  let monvolFinal:vol; 
  let monvolVemgsa:vol; 
  let monvolLpln:vol; 
  let pl = new parseurLpln();
  //let arcid = "EWG6LB";
  //let plnid = 6461;
  console.log(pl.grepListeVolFromLpln(fichierSourceLpln));
  return pl.grepListeVolFromLpln(fichierSourceLpln);
}

export  function mixInfos( arcid : string, plnid : number,fichierSourceLpln : string, fichierSourceVemgsa : string[] ):vol {


  //let arcid = "EWG6LB";
  //let plnid = 6461;


  //Initialisation du vol issu des donnees VEMGSA
   let monvolVemgsa = new vol(arcid,plnid);
  let pv = new parseurVemgsa();
  monvolVemgsa = pv.parseur(arcid,plnid,fichierSourceVemgsa );
  console.log("monvolVemgsa: ",monvolVemgsa);


  //Initialisation du vol issu des donnees LPLN
  let monvolLpln = new vol(arcid,plnid);
  let pl = new parseurLpln();
  monvolLpln = pl.parseur(arcid,plnid, fichierSourceLpln);
  console.log("monvolLpln: ",monvolLpln);




  let monvolFinal = new vol(arcid,plnid);




  monvolVemgsa.getListeVol().forEach((elt) => {
    console.log(" heure : " +elt.heure +" info Vemgsa : "  +elt.title);

  })
  monvolLpln.getListeVol().forEach((elt) => {
    //  console.log("key : "+key);
    console.log(" heure : " + elt.heure +" info Lpln : "  +elt.title);
  })



  let key3=0;
  let key2=0;
  monvolVemgsa.getListeVol().forEach((elt, key) => {
    //console.log(monvolLpln.getListeVol().get(key).title);
    //if ((monvolLpln.getListeVol().get(key).title == "CPCASREQ") && (monvolLpln.getListeVol().get(key+1).title == "CPCASRES") ){
    key2 = key+7 +key3;
    //  console.log("key2 : " + key2);
    //console.log("key2 : "+key2);

//{(0,CPCA),
//(1,CPCB)
//(2,CPCD)}

//(value, key,map)

    if ( monvolLpln.getListeVol().length <= key2 ){

      console.log("\nComparaison :\ninfo Vemgsa : "  + elt.title);
      console.log("info Lpln : " , monvolLpln.getListeVol()[key2].title);


      while (elt.title !==  monvolLpln.getListeVol()[key2].title )  {


        if ( (elt.title == 'CPCMSGDOWN' ) && (monvolLpln.getListeVol()[key-1].title == 'CPCCLOSLNK' )){
          console.log("cpccloselink suivi de cpcmsgdown  : "  +"info Vemgsa : "  +elt.title);

          key3 = key3-1;
          break;
        }
        if (( elt.title == 'CPCMSGDOWN' ) && (monvolLpln.getListeVol()[key-1].title == 'CPCMSGUP' )){
          console.log("cpcmsgup suivi de cpcmsgdown  : "  +"info Vemgsa : "  + elt.title);

          key3 = key3-1;
          break;
        }
        if ( (elt.title == 'CPCMSGDOWN' ) && (monvolLpln.getListeVol()[key-1].title == 'CPCFREQ')){
          console.log("cpcfreq suivi de cpcmsgdown  : "  +"info Vemgsa : "  +elt.title);

          key3 = key3-1;
          break;
        }
        // if (cmpHeureElt(monvolVemgsa.getListeVol().get(key).heure ,  monvolLpln.getListeVol().get(key2).heure) == false )
        console.log("info Lpln unique : "  +monvolLpln.getListeVol()[key2].title)
        addElt(monvolLpln.getListeVol()[key2]  );
        //console.log("ca match pas");
        key2 = key2+1;
        key3 = key3+1;

        if ( monvolLpln.getListeVol().length < key2){
          key2 = key2-1;
          break;
        }

      }
      if (elt.title ==monvolLpln.getListeVol()[key2].title ){
        console.log("Couple trouvé : \ninfo Vemgsa : "  +elt.title);
        addElt(elt);
        //  console.log("key2 : "+key2);
        console.log("info Lpln : "  +monvolLpln.getListeVol()[key2].title);
      }

    }
    else {
      console.log("info Vemgsa unique : "  +elt.title);
      addElt(elt);
    }
  })

  key2=key2+1;
  while ( monvolLpln.getListeVol().length == key2 ){
    //  console.log("key2 : "+key2);
    console.log("info Lpln supp: "  +monvolLpln.getListeVol()[key2].title);
    key2=key2+1;
  
  }



  function addElt(elt : etatCpdlc):void {
    monvolFinal.getListeVol().push(elt);
  }



  function cmpHeureElt(hV : string, hL : string):boolean {
    //h1 : heure VEMGSA précise
    //h2 : heure LPLN arrondie
    let h1,h2,m1,m2: number;

    let motif1 = /(.*)(H)(.*)(')(.*)/;
    let motif2 = /(.*)(H)(.*)/;
    if (hV.match(motif1) !== null ){
      h1 = Number(hV.replace(motif1, "$1"));
      m1 = Number(hV.replace(motif1, "$3"));
    }
    if (hL.match(motif2) !== null ){
      h2 = Number(hL.replace(motif2, "$1"));
      m2 = Number(hL.replace(motif2, "$3"));
    }
    //console.log("h1 :"+h1) ;
    //console.log("m1 :"+m1) ;
    //console.log("h2 :"+h2) ;
    //console.log("m2 :"+m2) ;

    if ((h1 == h2 )&& (( m2 == m1) || ( m2 == (m1+1))) ){
      //console.log("match") ;
      return true;
    }
    else {
      //console.log("match pas") ;
      return false;
    }

  }

  
  /**let hV = monvolVemgsa.getListeVol().get(1).heure;
  console.log("heure HV : "+hV);
  let hL = monvolLpln.getListeVol().get(10).heure;
  console.log("heure HL : "+hL);
  //let result1 = cmpHeureElt("04H25\'01\"","04H26" );
  let result1 = cmpHeureElt(hV,hL);


*/

  /*monvolLpln.getListeVol().forEach((value, key, map) => {

  if (monvolLpln.getListeVol().get(key).etat)
  console.log(monvolLpln.getListeVol().get(key).etat);

})
console.log(monvolVemgsa.getListeVol().get(0).heure);
*/
/*
monvolLpln.getListeVol().forEach((value, key, map) => {
console.log(monvolLpln.etat);
console.log(key, ':', value);
})*/
return monvolFinal;
}

/* Fonction qui prend en entrée deux fichiers Vemgsa et renvoie les deux fichiers en les classant par date */
function orderVemgsa(list : string[]):string[] {
  let f1 :string = list[0];
  let f2 :string = list[1];
  let d1,d2,d1_supp,d2_supp :number;
  let temp:string="";

  let motif = /(.*)(VEMGSA)(.*)(stpv)(.*)(_)(.*)(_)(.*)(_)(.*)(_)(.*)/;
  if (f1.match(motif) !== null ){
    d1 = Number(f1.replace(motif, "$7"));
  }
  if (f2.match(motif) !== null ){
    d2 = Number(f2.replace(motif, "$7"));
  }
  if (d1 < d2){
  }
  if (d1 > d2){
    temp = list[0];
    list[0]=list[1];
    list[1]=temp;
  }
  if (d1 == d2){
    if (f1.match(motif) !== null ){
      d1_supp = Number(f1.replace(motif, "$9"));
    }
    if (f2.match(motif) !== undefined ){
      d2_supp = Number(f2.replace(motif, "$9"));
    }
    if (d1_supp < d2_supp){
    }
    if (d1_supp > d2_supp){
      temp = list[0];
      list[0]=list[1];
      list[1]=temp;
    }


  }
/*  console.log("d1"+d1);
  console.log("d2"+d2);
  console.log("d1supp"+d1_supp);
  console.log("d2supp"+d2_supp);
  console.log("1"+list[0]);
  console.log("2"+list[1]);*/
  return list;
}


/** export function appelMixInfos(){
  let fichierSourceLpln = "./Input/LPLN_8474";
  let fichierSourceVemgsa = "./Input/VEMGSA2.OPP.stpv3_260918_0742_270918_0721";
  let fichierSourceVemgsaNext = "./Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  let list: string[] = [fichierSourceVemgsa, fichierSourceVemgsaNext];
  //let list: string[] = [fichierSourceVemgsaNext, fichierSourceVemgsa];
  //orderVemgsa(list);
  console.log("process"+process.cwd());
  //let r = readline.fopen(fichierSource, "r");
  mixInfos("CFG6TH",0,fichierSourceLpln,orderVemgsa(list));
  //main("",8474,fichierSourceLpln,fichierSourceVemgsa );

}*/





//TODO : tester le fichier en entrée : existance, dates de validité pour savoir si l'aircraft id est bien dans le vemgsa ...
/*let fichierSourceLpln = "../Input/7183_6461_pb_datalink-180926-stpv3-OPP.log";
let fichierSourceVemgsa = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
main("EZY51AM",0,fichierSourceLpln,fichierSourceVemgsa);
main("EWG6LB",0,fichierSourceLpln,fichierSourceVemgsa);*/



/*let fichierSourceLpln = "../Input/LPLN_8981";
let fichierSourceVemgsa = "../Input/VEMGSA5.OPP.stpv3_240918_0615_250918_0610"
main("SAS41P",0,fichierSourceLpln,fichierSourceVemgsa);/*

/*let fichierSourceLpln = "../Input/LPLN_9851";
//let fichierSourceLpln = "../Input/AFR22VR_pbCPDLC-180924-stpv3-OPP.log";
let fichierSourceVemgsa = "../Input/VEMGSA5.OPP.stpv3_240918_0615_250918_0610"
main("AFR22VR",0,fichierSourceLpln,fichierSourceVemgsa);*/
