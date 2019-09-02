import { Path } from "../Modele/path";


let readline = require("../scripts/node-readline/node-readline");
const fs = require('fs');
const p = require('path');




export class Frequences {

  private fichierFreq : string;

 constructor(){
    this.fichierFreq = p.resolve(Path.systemPath, "freq.htm");
  }



  
//process.exit(1) : pour sortir de la fonctionet
// break pour sortir du test en restant dans la fonction

/*
objectif : Fonction qui prend en entree le fichier gbdi STPV
et cree a partir de celui un fichier ne contenant que les frequences de transfert avec le secteur associe
Il teste au préalabre la date de génération de la bds pour éviter de mettre a jour son fichier de frequences s il n y a pas eu de mofications
Parametres en entrée :
fichierSource : le  fichier gbdi STPV a traiter
*/
public GbdiToFreq(fichierSource) {





  var dateFichierSource = fichierSource;
  var dateFichierDest = "Pas de date definie";

  //Test de la date du fichier gbdi pour vérifier s'il y a besoin de mettre à jour la liste des fréquences
  let r = readline.fopen(fichierSource, "r");

  if (r === false) {
    console.log("Error, can't open ", fichierSource);
    process.exit(1);
  }
  else {

    var motif = /SECT [5|8]/;
    var motifSect = /[A-Z|0-9]{2}.{10}[0-9]{3}.[0-9]{1,3}/;



    var w2 = fs.openSync(this.fichierFreq, "w");
    fs.writeSync(w2, dateFichierDest + "\n", null, 'utf8');




    do {
      var ligneGbdi = readline.fgets(r);
      if (ligneGbdi === false) { break; }
      var infoLigneGbdi = ligneGbdi.match(motif);


      if (infoLigneGbdi !== null) {
        ligneGbdi = ligneGbdi.match(motifSect);
        if (ligneGbdi != null) {
          fs.writeSync(w2, ligneGbdi + "\n", null, 'utf8');
        }

      }
    } while (!readline.eof(r));

    readline.fclose(r);
    fs.closeSync(w2);

  }



}



////TODO : gerer les frequences associees a plusieurs secteurs (ex 122.615 pour paris)
//// TODO : verifier quels SECT 5 ? 8 ? ... recuperer
//// gerer le cas ou une frequence nest pas definie ou trouvee


/*
objectif : Fonction qui parcourt le fichier des frequences de transfert avec le secteur associe
et renvoie le secteur associe a une frequence donnee
Parametres en entrée :
freq : une frequence de transfert
*/
public freqToSecteur(freq) {



  var r = readline.fopen(this.fichierFreq, "r");
  if (r === false) {
    console.log("Error, can't open ", this.fichierFreq);
    process.exit(1);
  }
  else {
    var secteur = null;
    var motifSecteur = /[A-Z|0-9][A-Z|0-9]/;
    do {
      var ligne = readline.fgets(r);
      if (ligne === false) { break; }
      if (ligne.match(freq) !== null) {
        console.log("ligne lue : " + ligne);
        secteur = ligne.match(motifSecteur);
        //console.log("secteur  : "+secteur);

      }
    } while (!readline.eof(r));
    readline.fclose(r);

  }
  return secteur;
}

/*
objectif : Fonction qui prend en entree une frequence issue du fichier VEMGSA
et la convertit en une frequence au format bds
ex : 135930 devient 135.930
freq : une frequence de transfert
*/
public conversionFreq(freq) {


  var motifFreq = /(\d\d\d)(\d+)/;
  var frequence = freq.replace(motifFreq, "$1.$2");
  return frequence;
}




/*
this.GbdiToFreq(fichierGbdi);

var result = this.freqToSecteur(fichierDest,"134.260");
if (result !== null){
  console.log("secteur  : "+result[0]);
}
else {
  console.log("pas de secteur associe a cette frequence");
}
*/

}