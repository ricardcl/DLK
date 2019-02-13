import { TSMap } from "typescript-map";
import { DetailCpdlc } from "../Modele/detailCpdlc";

var espace = " ";


export class split {

  /*
  objectif : Fonction qui prend en entree une chaine de caractere,
  decoupe en differents elements cette chaine selon un separateur donne
  et renvoie sous forme de tableau le resultat
  Parametres en entrée :
  stringToSplit : la chaine de caractere a separer
  separateur : le caractere delimiteur
  */
  splitString = function (stringToSplit, separator) {
    var arrayOfStrings = new Array();
    arrayOfStrings = stringToSplit.toString().split(separator);
    /*for (var i=0; i < arrayOfStrings.length; i++)
    console.log(arrayOfStrings[i] + " / ");*/
    return arrayOfStrings;

  }

  /*
  objectif : Fonction qui prend en entree une chaine de caractere,
  decoupe en differents elements cette chaine à partir du séparateur '-'
  et renvoie sous forme de table de hashage  le resultat
  Parametres en entrée :
  stringToSplit : la chaine de caractere a separer
  */
  stringToTuple = function (stringToSplit){

    //declaration d'une table de hashage
    //let mymap : string[] = [];
    let mymap : TSMap<string, string> = new TSMap();

    //Remplissage de la table de hashage
    let infosDecomposees = this.splitString(stringToSplit, '-');

    for (var i = 0; i < infosDecomposees.length; i++) {
      if (i==0)  {
        var title= infosDecomposees[i].trim();
        mymap['TITLE']=title;
      }
      else {
        var tuple = this.splitString(infosDecomposees[i].trim(), espace);
        mymap[tuple[0]]=tuple[1];
      }
    }
    return mymap;
  }

    /*
  objectif : Fonction qui prend en entree une chaine de caractere,
  decoupe en differents elements cette chaine à partir du séparateur '-'
  et renvoie sous forme de table de hashage  le resultat
  Parametres en entrée :
  stringToSplit : la chaine de caractere a separer
  */
 stringToDetailCpdlc = function (stringToSplit){


  let mymap : DetailCpdlc[] = new Array();

  //Remplissage de la table 
  let infosDecomposees = this.splitString(stringToSplit, '-');
  let detail = <DetailCpdlc>{};
  for (var i = 0; i < infosDecomposees.length; i++) {
    if (i==0)  {
      var title= infosDecomposees[i].trim();
      detail.key = 'TITLE';
      detail.value = title;
      mymap.push(detail);
    }
    else {
      var tuple = this.splitString(infosDecomposees[i].trim(), espace);     
      detail.key = tuple[0];
      detail.value = tuple[1];
      mymap.push(detail);
    }
  }
  return mymap;
}


  


    }




    // Tests
    //var result = this.splitString("-A 1 -B 2 -C 3", '-');
    //console.log(result[1]);

    /**
     * 
     * const E = new split;
const result = E.stringToTuple("-A 1 -B 2 -C 3");
console.log("result: "+result);
console.log("A: "+result["A"]);  -> renvoie 1
     */
