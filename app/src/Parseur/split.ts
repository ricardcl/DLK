import { TSMap } from "typescript-map";

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
    let mymap = new TSMap<string,string>();

    //Remplissage de la table de hashage
    let infosDecomposees = this.splitString(stringToSplit, '-');

    for (var i = 0; i < infosDecomposees.length; i++) {
      if (i==0)  {
        var title= infosDecomposees[i].trim();
        mymap.set('TITLE',title);
      }
      else {
        var tuple = this.splitString(infosDecomposees[i].trim(), espace);
        mymap.set(tuple[0],tuple[1]);
      }
    }
    return mymap;
  }



  


    }




    // Tests
    //var result = this.splitString("-A 1 -B 2 -C 3", '-');
    //console.log(result[1]);
