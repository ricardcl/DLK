import { TSMap } from "typescript-map";
import { DetailCpdlc } from "../Modele/detailCpdlc";

export class Split {
  
  constructor() {
    console.log("Je rentre dans le constructor Split ");
  }

  /*
  objectif : Fonction qui prend en entree une chaine de caractere,
  decoupe en differents elements cette chaine selon un separateur donne
  et renvoie sous forme de tableau le resultat
  Parametres en entrée :
  stringToSplit : la chaine de caractere a separer
  separateur : le caractere delimiteur
  */
  public splitString(stringToSplit: string, separator: string): string[] {
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
  private stringToTuple(stringToSplit) {
    let chaine_espace: string = " ";

    //declaration d'une table de hashage
    //let mymap : string[] = [];
    let mymap: TSMap<string, string> = new TSMap();

    //Remplissage de la table de hashage
    let infosDecomposees = this.splitString(stringToSplit, '-');

    for (var i = 0; i < infosDecomposees.length; i++) {
      if (i == 0) {
        var title = infosDecomposees[i].trim();
        mymap['TITLE'] = title;
      }
      else {
        var tuple = this.splitString(infosDecomposees[i].trim(), chaine_espace);
        mymap[tuple[0]] = tuple[1];
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
  public stringToDetailCpdlc(stringToSplit: string): DetailCpdlc[] {
    let chaine_espace: string = " ";
    let mymap: DetailCpdlc[] = new Array();

    //Remplissage de la table 
    let infosDecomposees = this.splitString(stringToSplit, '-');

    for (var i = 0; i < infosDecomposees.length; i++) {
      let detail = <DetailCpdlc>{};
      if (i == 0) {
        var title = infosDecomposees[i].trim();
        mymap['TITLE'] = title;
        // detail.key = 'TITLE';
        // detail.value = title;
        // mymap.push(detail);

      }
      else {
        var tuple = this.splitString(infosDecomposees[i].trim(), chaine_espace);
        mymap[tuple[0]] = tuple[1];

        // detail.key = tuple[0];
        // detail.value = tuple[1];
        // mymap.push(detail);
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
