
/*
OBJECTIF DE CETTE FONCTION :
Lire le contenu d un fichier VEMGSA donne en entree
recuperer uniquement les informations relatives a un PLNID
copier le resultat dans un fichier texte en enlevant les caracteres speciaux et verifiant que le format et correct
*/

const fs = require('fs');
const path_dir = "./app/assets/";
const path_dir_input = path_dir+"Input/";
const path_dir_input_user = path_dir_input+"user/";
const path_dir_input_system = path_dir_input+"system/";
const path_dir_output = path_dir+"Output/";
let readline = require("../scripts/node-readline/node-readline");




export function grepLog (arcid:string, plnid:number, fichierSourceVemgsa:string[] ):void {

    let fichierDestination = path_dir_output+"/result.htm";
    let w = fs.openSync(fichierDestination, "w");

  for (let fichier of fichierSourceVemgsa) {
    console.log("coucou1");
    //let fichierSource = "../Input/test1.htm";
    //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";

    let fichierSource = fichier;

    //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";


    console.log("coucou2");
    console.log("fichier"+fichier);
   
    let r = readline.fopen(path_dir_input_user+fichierSource, "r");


    let count = 0;
    console.log("coucou3");
    /* regex a utiliser pour enlever les caracteres speciaux
    en utilisant mylogCpdlc = mylogCpdlc.replace(regex);*/
    //let regex = /|||||||�|@|.||%|\(|\)|,|ZZZZ|]\|þ|Ô|Ç|â|Á|||[a-z]/g;

    /* regex a utiliser pour ne garder que les caracteres autorises
    en utilisant mylogCpdlc = mylogCpdlc.match(regex1);*/
    //let regex1 = /[^A-Z0-9-/'"]/g;


    /*format attendu d un fichier  VEMGSA
    avec /\d\d\/\d\d\d\d\/\d\d = motif de la date
    et \s = espace
    */

    let motif =/\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

    console.log("coucou4");
    let motifPlnid = "-PLNID "+plnid;
    let motifArcid = "-ARCID "+arcid;


    if (r === false) {
      console.log("Error, can't open ", fichierSource);
      process.exit(1);
    }
    else {
      do {
        let mylogCpdlc = readline.fgets(r);
        //mylogCpdlc=mylogCpdlc.toString();
        if (mylogCpdlc === false) { break;}

        if (mylogCpdlc.match(motif) !== null){
          mylogCpdlc = mylogCpdlc.match(motif);

          if  ((mylogCpdlc.toString().match(motifPlnid) !== null) && (plnid !== 0))  {
            fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
          }
          else { //Cas ou la meme ligne contient l'arcid et le plnid, on copie la ligne une seule fois
          if ((mylogCpdlc.toString().match(motifArcid) !== null) && (arcid !== "")){
            fs.writeSync(w, mylogCpdlc+"\n", null, 'utf8') ;
          }
        }
      }

    }while (!readline.eof(r));

  }


  readline.fclose(r);


}
fs.closeSync(w);
}


export function grepArcidFromPlnid (plnid:number,fichierSourceVemgsa:string ):string {

  let fichierSource = fichierSourceVemgsa;
  //"../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  let fichierDestination = path_dir_output+"result.htm";
  let reqid=0;
  let arcid = "";
  //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
  console.log("debug");
  console.log('fichierSourceVemgsa : ',fichierSourceVemgsa);
  console.log('fichierSource : ',fichierSource);
  
  console.log('path_dir_input_user : ',path_dir_input_user);

  console.log('path_complet : ',path_dir_input_user+fichierSource);
  
  
  let r = readline.fopen(path_dir_input_user+fichierSource, "r");
  let motifVemgsa =/\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;
  let motif1 = /(.*)(CPCASRES)(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-PLNID)(.*)/;
  let motif2 = /(.*)(CPCASRES)(.*)(-PLNID )(.*)(-REQID)(.*)/;

  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      mylogCpdlc=mylogCpdlc.toString();
      if (mylogCpdlc === false) { break;}


      if  ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif1) !== null) && (mylogCpdlc.match(plnid) !== null)){
        mylogCpdlc = mylogCpdlc.match(motifVemgsa);
        arcid = mylogCpdlc.toString().replace(motif1, "$5").trim();
        //console.log("arcid : "+arcid);
        break;
      }

      if  ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif2) !== null) && (mylogCpdlc.match(plnid) !== null)){
        mylogCpdlc = mylogCpdlc.match(motifVemgsa);
        reqid = mylogCpdlc.toString().replace(motif2, "$7").trim();
        reqid = Number(String(reqid).substr(1));
        console.log("reqid : "+reqid);
        arcid = grepArcidFromReqid(reqid,fichierSourceVemgsa);
        break;
      }
    }while (!readline.eof(r));
  }
  console.log("plnid : "+plnid);
  console.log("reqid : "+reqid);
  console.log("arcid : "+arcid);
  readline.fclose(r);
  return arcid;


}


export function grepArcidFromReqid ( reqid:number, fichierSourceVemgsa:string):string {
  let fichierSource = fichierSourceVemgsa;
  //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  let fichierDestination = path_dir_output+"result.htm";
  let arcid="";
  //let source = "../Input/VEMGSA50.OPP.stpv3_310818_0649_010918_0714_ori";
  let r = readline.fopen(path_dir_input_user+fichierSource, "r");
  let motifVemgsa =/\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

  let motif1 = /(.*)(-ARCID )(.*)(-ATNASSOC)(.*)(-ATNLOGON)(.*)(-REQID)(.*)/;
  let motif2 = /(.*)(-ARCID )(.*)(-ATNLOGON)(.*)(-REQID)(.*)/;

  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      mylogCpdlc=mylogCpdlc.toString();
      if (mylogCpdlc === false) { break;}
      if  ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif1) !== null) && (mylogCpdlc.match(reqid) !== null)){
        mylogCpdlc = mylogCpdlc.match(motifVemgsa);
        //console.log("log : "+mylogCpdlc);
        arcid = mylogCpdlc.toString().replace(motif1, "$3").trim();
        //arcid = Number(String(reqid).substr(1));
        //console.log("arcid1 : "+arcid);
        break;
      }
      if  ((mylogCpdlc.match(motifVemgsa) !== null) && (mylogCpdlc.match(motif2) !== null) && (mylogCpdlc.match(reqid) !== null)){
        mylogCpdlc = mylogCpdlc.match(motifVemgsa);
        console.log("log : "+mylogCpdlc);
        arcid = mylogCpdlc.toString().replace(motif2, "$3").trim();
        //arcid = Number(String(reqid).substr(1));
        //console.log("arcid2 : "+arcid);
        break;
      }
    }while (!readline.eof(r));
  }

  readline.fclose(r);
  return arcid;


}



export function grepPlnidFromArcid ( arcid:string, fichierSourceVemgsa:string):number {
  let fichierSource = fichierSourceVemgsa;
  //let fichierSource = "../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742";
  let fichierDestination = path_dir_output+"result.htm";
  let reqid=0;
  let plnid=0;

  let r = readline.fopen(path_dir_input_user+fichierSource, "r");
  let motifVemgsa =/\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;


  let motifCPCASREQ = /(.*)(CPCASREQ)(.*)(-REQID)(.*)/;
  let motifCPCASRES = /(.*)(CPCASRES)(.*)(-PLNID)(.*)/;
  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break;}

      let infoLpln1 = mylogCpdlc.match(motifVemgsa);
      let infoLpln2 = mylogCpdlc.match(arcid);
      if  ((infoLpln1 !== null) && (infoLpln2 !== null)){
        //console.log("infolpln 1 :"+infoLpln1);

        //CAS 1 : arcid envoye en meme temps que le reqId dans le CPCASREQ
        // on en deduit le reqid
        if (mylogCpdlc.match("CPCASREQ") !== null){
          reqid=infoLpln1.toString().replace(motifCPCASREQ, "$5").trim();
          console.log("cas 1");
          console.log("reqid : "+ reqid);
          //reqid = "".concat("0", String(reqid));
          //console.log("reqid : "+reqid);

          do {
            mylogCpdlc = readline.fgets(r);
            mylogCpdlc = mylogCpdlc.toString();
            if((mylogCpdlc.match("REQID") !== null) && (mylogCpdlc.match(reqid) !== null) && (mylogCpdlc.match("PLNID") !== null) ){
              console.log("cas 1A");
              infoLpln1 = mylogCpdlc.match(motifVemgsa);
              //CAS 1A :  reqid et plnid en info  ex : GMI39SL PLNID 7893-REQID 01099
              let motif = /(.*)(-PLNID)(.*)(-REQID)(.*)/;
              reqid=infoLpln1.toString().replace(motif,"$5").trim();
              plnid=infoLpln1.toString().replace(motif,"$3").trim();
              console.log("plnid : "+plnid);
              console.log("reqid : "+reqid);
              break;
            }
            if((mylogCpdlc.match("REQID") !== null) && (mylogCpdlc.match(reqid) !== null) && (mylogCpdlc.match("PLNID") == null) ){
              console.log("cas 1B");
              infoLpln1 = mylogCpdlc.match(motifVemgsa);
              //CAS 1B: que le reqid comme information  ex : EZY928J
              let motif = /(.*)(-REQID)(.*)/;
              reqid=infoLpln1.toString().replace("$5").trim();
              console.log("reqid : "+reqid);
              break;
            }

          }while (!readline.eof(r));

          break;
        }
        //CAS 2 : arcid envoye en meme temps que le plnid dans le CPCASRES (ex AFR6006)
        // on en deduit le reqid
        else {
          console.log("cas 2");
          plnid=infoLpln1.toString().replace(motifCPCASRES, "$5").trim();
          console.log("plnid : "+plnid);
          break;
        }


      }


    }while (!readline.eof(r));
  }

  readline.fclose(r);


  return plnid;


}


export function grepPlageHoraireFichier (fichierSourceVemgsa:string ):void {

  let fichierSource = fichierSourceVemgsa;
  let r = readline.fopen(path_dir_input_user+fichierSource, "r");
  let motif =/\d\d\/\d\d\/\d\d\d\d\s.*-[A-Z]+\s+[A-Z|\d]+/;

  //26/09/2018 07H54'11" -TITLE CPCCLOSLNK-PLNID 7466  	,
  //  let motif2 = /(\d\d)(\/)(\d\d)(\/)(\d\d\d\d )(\d\d)(H)(\d\d)(')(\d\d)(.*)/;
  let motif2 = /(\d\d\/\d\d\/\d\d\d\d )(\d\dH\d\d'\d\d)(.*)/;
  let dateMin,dateMax,heureMin,heureMax:string;


  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {
    do {
      let mylogCpdlc = readline.fgets(r);
      if (mylogCpdlc === false) { break;}

      if (mylogCpdlc.match(motif) !== null){
        mylogCpdlc = mylogCpdlc.match(motif);

        if  (mylogCpdlc.toString().match(motif2) !== null)  {
          if (dateMin == undefined){
            dateMin = mylogCpdlc.toString().replace(motif2, "$1");
            heureMin = mylogCpdlc.toString().replace(motif2, "$2");
          }
          dateMax = mylogCpdlc.toString().replace(motif2, "$1");
          heureMax = mylogCpdlc.toString().replace(motif2, "$2");
        }
      }
    }while (!readline.eof(r));
    readline.fclose(r);
    console.log("dateMin :"+dateMin) ;
    console.log("heureMin :"+heureMin) ;
    console.log("dateMax :"+dateMax) ;
    console.log("heureMax :"+heureMax) ;
  }



}


//grepPlageHoraireFichier("../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742");




//grepLog("EZS53NY",6663,"../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742");
//grepArcidFromPlnid(6663,"../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742");
//grepPlnidFromArcid("EZS53NY","../Input/VEMGSA1.EVP.stpv3_250918_2303_260918_0742");

//grepArcidFromPlnid(7496);
//grepArcidFromPlnid(6903);
/*console.log("Test 6663\n");
grepArcidFromPlnid(6663); //EZS53NY
console.log("Test 6900\n");
grepArcidFromPlnid(6900); //EZS49JV
console.log("Test 6976\n");
grepArcidFromPlnid(6976); //ELY027
console.log("Test 8505\n");
grepArcidFromPlnid(8505); //AFR600H
*/

/*
grepPlnidFromArcid("EWG8JG");
grepPlnidFromArcid("EZY928J");
grepPlnidFromArcid("AFR6006");
grepPlnidFromArcid("EZY928J");
*/
