import { Vol } from '../Modele/vol';
import { parseurLpln } from './parseurLpln';
import { parseurVemgsa } from './parseur';
import { grapheEtat } from './grapheEtat';
import { EtatCpdlc } from '../Modele/etatCpdlc';



export function getListeVols(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[]): Vol[] {
  let monvolFinal: Vol;
  let monvolVemgsa: Vol;
  let monvolLpln: Vol;
  let pl = new parseurLpln();
  console.log(pl.grepListeVolFromLpln(fichierSourceLpln));
  return pl.grepListeVolFromLpln(fichierSourceLpln);
}

export function mixInfos(arcid: string, plnid: number, fichierSourceLpln: string, fichierSourceVemgsa: string[]): Vol {


  //Initialisation du vol issu des donnees VEMGSA
  let monvolVemgsa = new Vol(arcid, plnid);
  let pv = new parseurVemgsa();
  monvolVemgsa = pv.parseur(arcid, plnid, fichierSourceVemgsa);

  //Initialisation du vol issu des donnees LPLN
  let monvolLpln = new Vol(arcid, plnid);
  let pl = new parseurLpln();
  monvolLpln = pl.parseur(arcid, plnid, fichierSourceLpln);

  //Initialisation du vol final issu des donnees LPLN et VEMGSA
  let monvolFinal = new Vol(arcid, plnid);





   monvolVemgsa.getListeLogs().forEach((elt, key) => {
    
    if (elt.getTitle() == 'CPCFREQ') {
      monvolLpln.getListeLogs().forEach((eltL, keyL) => {
        if (eltL.getTitle() == 'CPCFREQ') {
          if (isHeuresEgales(elt.getHeure(),eltL.getHeure())){     
            console.log("date vemgsa : ", elt.getDate(),"date lpln : ", eltL.getDate());
            console.log("freq: ", elt.getDetail("FREQ")," heure: ",elt.getHeure());
          }
        }
      })
    }
  })


  monvolLpln.getListeLogs().forEach((elt, key) => {

    console.log("date lpln: ",elt.getDate());
    //console.log("heure vemgsa: ",elt.getHeure());


  })





  function addElt(elt: EtatCpdlc): void {
    //   console.log("elt ajoute: ",elt);

    monvolFinal.getListeLogs().push(elt);
  }



  function isHeuresEgales(hV: string, hL: string): boolean {
    //h1 : heure VEMGSA précise
    //h2 : heure LPLN arrondie
    let h1, h2, m1, m2: number;

    let motif1 = /(.*)(H)(.*)(')(.*)/;
    let motif2 = /(.*)(H)(.*)/;
    if (hV.match(motif1) !== null) {
      h1 = Number(hV.replace(motif1, "$1"));
      m1 = Number(hV.replace(motif1, "$3"));
    }
   // console.log("hL :"+hL) ;
    if (hL.match(motif2) !== null) {
      h2 = Number(hL.replace(motif2, "$1"));
      m2 = Number(hL.replace(motif2, "$3"));
    }
    //console.log("h1 :"+h1) ;
   // console.log("m1 :"+m1) ;
   // console.log("h2 :"+h2) ;
   // console.log("m2 :"+m2) ;

    if ((h1 == h2) && ((m2 == m1) || (m2 == (m1 + 1)))) {
      //console.log("match") ;
      return true;
    }
    else {
      //console.log("match pas") ;
      return false;
    }

  }

  function isDateInferieure(hV: string, hL: string): boolean {
    //h1 : heure VEMGSA précise
    //h2 : heure LPLN arrondie
    let h1, h2, m1, m2: number;

    let motif1 = /(.*)(H)(.*)(')(.*)/;
    let motif2 = /(.*)(H)(.*)/;
    if (hV.match(motif1) !== null) {
      h1 = Number(hV.replace(motif1, "$1"));
      m1 = Number(hV.replace(motif1, "$3"));
    }
   // console.log("hL :"+hL) ;
    if (hL.match(motif2) !== null) {
      h2 = Number(hL.replace(motif2, "$1"));
      m2 = Number(hL.replace(motif2, "$3"));
    }
    //console.log("h1 :"+h1) ;
   // console.log("m1 :"+m1) ;
   // console.log("h2 :"+h2) ;
   // console.log("m2 :"+m2) ;

    if ((h1 < h2) && ((m1 == m1) || (m2 == (m1 + 1)))) {
      //console.log("match") ;
      return true;
    }
    else {
      //console.log("match pas") ;
      return false;
    }

  }


  console.log("resultat vol final : ");
  let graphe = new grapheEtat();

  monvolFinal = graphe.grapheMix(monvolFinal);

  monvolFinal.getListeLogs().forEach(etatCpdlc => {
    //console.log("contenu  map before: ",etatCpdlc.getDetaillog());
    console.log("msg: ", etatCpdlc.getTitle(), " etat: ", etatCpdlc.getEtat());
  });

  return monvolFinal;
}




/* Fonction qui prend en entrée deux fichiers Vemgsa et renvoie les deux fichiers en les classant par date */
function orderVemgsa(list: string[]): string[] {
  let f1: string = list[0];
  let f2: string = list[1];
  let d1, d2, d1_supp, d2_supp: number;
  let temp: string = "";

  let motif = /(.*)(VEMGSA)(.*)(stpv)(.*)(_)(.*)(_)(.*)(_)(.*)(_)(.*)/;
  if (f1.match(motif) !== null) {
    d1 = Number(f1.replace(motif, "$7"));
  }
  if (f2.match(motif) !== null) {
    d2 = Number(f2.replace(motif, "$7"));
  }
  if (d1 < d2) {
  }
  if (d1 > d2) {
    temp = list[0];
    list[0] = list[1];
    list[1] = temp;
  }
  if (d1 == d2) {
    if (f1.match(motif) !== null) {
      d1_supp = Number(f1.replace(motif, "$9"));
    }
    if (f2.match(motif) !== undefined) {
      d2_supp = Number(f2.replace(motif, "$9"));
    }
    if (d1_supp < d2_supp) {
    }
    if (d1_supp > d2_supp) {
      temp = list[0];
      list[0] = list[1];
      list[1] = temp;
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
