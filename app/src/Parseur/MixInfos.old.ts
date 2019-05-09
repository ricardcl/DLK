import {Vol} from '../Modele/vol';
import {parseurLpln} from './parseurLpln';
import {parseurVemgsa} from './parseur';
import {grapheEtat} from './grapheEtat';
import {EtatCpdlc} from '../Modele/etatCpdlc';



export  function getListeVols( arcid : string, plnid : number,fichierSourceLpln : string, fichierSourceVemgsa : string[] ):Vol[] {
  let monvolFinal:Vol; 
  let monvolVemgsa:Vol; 
  let monvolLpln:Vol; 
  let pl = new parseurLpln();
  console.log(pl.grepListeVolFromLpln(fichierSourceLpln));
  return pl.grepListeVolFromLpln(fichierSourceLpln);
}

export  function mixInfos( arcid : string, plnid : number,fichierSourceLpln : string, fichierSourceVemgsa : string[] ):Vol {





  //Initialisation du vol issu des donnees VEMGSA
   let monvolVemgsa = new Vol(arcid,plnid);
  let pv = new parseurVemgsa();
  monvolVemgsa = pv.parseur(arcid,plnid,fichierSourceVemgsa );

 /**
  * console.log("monvolVemgsa: ",monvolVemgsa);
  *for (let index = 0; index < monvolVemgsa.getListeLogs().length; index++) {
   * console.log("monvolVemgsa Logs: ",index," ",monvolVemgsa.getListeLogs()[index].getMapCpdlc());
   *   }
    */ 

  


  //Initialisation du vol issu des donnees LPLN
  let monvolLpln = new Vol(arcid,plnid);
  let pl = new parseurLpln();
  monvolLpln = pl.parseur(arcid,plnid, fichierSourceLpln);
  /**
   *   console.log("monvolLpln: ",monvolLpln);
   */





  let monvolFinal = new Vol(arcid,plnid);




  monvolVemgsa.getListeLogs().forEach((elt) => {
    console.log(" heure : " +elt.getHeure() +" info Vemgsa : "  +elt.getTitle());

  })
  monvolLpln.getListeLogs().forEach((elt) => {
    //  console.log("key : "+key);
    console.log(" heure : " + elt.getHeure() +" info Lpln : "  +elt.getTitle());
  })



  let key3=0;
  let key2=0;
  monvolVemgsa.getListeLogs().forEach((elt, key) => {

    key2 = key+7 +key3;


//{(0,CPCA),
//(1,CPCB)
//(2,CPCD)}

//(value, key,map)

    if ( monvolLpln.getListeLogs().length <= key2 ){

      console.log("\nComparaison :\ninfo Vemgsa : "  + elt.getTitle());
      console.log("info Lpln : " , monvolLpln.getListeLogs()[key2].getTitle());


      while (elt.getTitle() !==  monvolLpln.getListeLogs()[key2].getTitle() )  {


        if ( (elt.getTitle() == 'CPCMSGDOWN' ) && (monvolLpln.getListeLogs()[key-1].getTitle() == 'CPCCLOSLNK' )){
          console.log("cpccloselink suivi de cpcmsgdown  : "  +"info Vemgsa : "  +elt.getTitle());

          key3 = key3-1;
          break;
        }
        if (( elt.getTitle() == 'CPCMSGDOWN' ) && (monvolLpln.getListeLogs()[key-1].getTitle() == 'CPCMSGUP' )){
          console.log("cpcmsgup suivi de cpcmsgdown  : "  +"info Vemgsa : "  + elt.getTitle());

          key3 = key3-1;
          break;
        }
        if ( (elt.getTitle() == 'CPCMSGDOWN' ) && (monvolLpln.getListeLogs()[key-1].getTitle() == 'CPCFREQ')){
          console.log("cpcfreq suivi de cpcmsgdown  : "  +"info Vemgsa : "  +elt.getTitle());

          key3 = key3-1;
          break;
        }
        console.log("info Lpln unique : "  +monvolLpln.getListeLogs()[key2].getTitle())
        addElt(monvolLpln.getListeLogs()[key2]  );
        key2 = key2+1;
        key3 = key3+1;

        if ( monvolLpln.getListeLogs().length < key2){
          key2 = key2-1;
          break;
        }

      }
      if (elt.getTitle() ==monvolLpln.getListeLogs()[key2].getTitle() ){
        console.log("Couple trouvé : \ninfo Vemgsa : "  +elt.getTitle());
        addElt(elt);
        console.log("info Lpln : "  +monvolLpln.getListeLogs()[key2].getTitle());
      }

    }
    else {
     // console.log("info Vemgsa unique : "  +elt.getTitle());
      addElt(elt);
    }
  })

  key2=key2+1;
  while ( monvolLpln.getListeLogs().length == key2 ){
    console.log("info Lpln supp: "  +monvolLpln.getListeLogs()[key2].getTitle());
    key2=key2+1;
  
  }



  function addElt(elt : EtatCpdlc):void {
   console.log("elt ajoute: ",elt);
    
    monvolFinal.getListeLogs().push(elt);
  }





  


  /*monvolLpln.getListeLogs().forEach((value, key, map) => {

  if (monvolLpln.getListeLogs().get(key).etat)
  console.log(monvolLpln.getListeLogs().get(key).etat);

})
console.log(monvolVemgsa.getListeLogs().get(0).heure);
*/
/*
monvolLpln.getListeLogs().forEach((value, key, map) => {
console.log(monvolLpln.etat);
console.log(key, ':', value);
})*/


/**
 * monvolFinal.getListeLogs().forEach(etat => {
  console.log("contenu  map before: ",etat.getDetaillog());
});
 */

//console.log("date 0 : ",monvolFinal.getListeLogs()[0].getDate());
//console.log("detaillog 0 : ",monvolFinal.getListeLogs()[0].getDetaillog());

console.log("resultat vol final : ");
let graphe = new grapheEtat();

monvolFinal = graphe.grapheMix(monvolFinal);

monvolFinal.getListeLogs().forEach(etatCpdlc => {
  //console.log("contenu  map before: ",etatCpdlc.getDetaillog());
  console.log("msg: ", etatCpdlc.getTitle()," etat: ",etatCpdlc.getEtat());
});

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
