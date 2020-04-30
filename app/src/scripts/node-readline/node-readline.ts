
const fs = require('fs');


/** 
 * La Classe ReadLine fournit les fonctions permettant de manipuler les fichiers utilisateur ( ouverture, lecture, fermeture)  
*/
export class ReadLine {

  private filePtr;
  private fileBuffer;
  private buffer;


  constructor() {
    this.filePtr = {};
    this.fileBuffer = {};
    this.buffer = Buffer.alloc(4096);
  }

  /**
   * Cette fonction ouvre un fichier selon le mode spécifié
   * @param path chemin du fichier à ouvrir
   * @param mode mode d'ouverture ( "r" pour ouvrir en mode lecture)
   * @returns Le descripteur du fichier
   */
  public fopen(path: string, mode: string): any {
    let handle = fs.openSync(path, mode); //Returns an integer representing the file descriptor.
    this.filePtr[handle] = 0;
    this.fileBuffer[handle] = [];
    return handle;
  }

  /**
   * Cette fonction ferme un fichier 
   * @param handle Descripteur du fichier donné par la fonction fopen
   */
  public fclose(handle) {
    fs.closeSync(handle);
    if (handle in this.filePtr) {
      delete this.filePtr[handle];
      delete this.fileBuffer[handle];
    }
    return;
  }

  /**
   * Cette fonction retourne une ligne du fichier spécifié
   * Le curseur de la ligne lue se déplace à chaque appel de la fonction fgets tant que le fichier n'est pas refermé
   * @param handle Descripteur du fichier donné par la fonction fopen
   * @returns la ligne lue
   */
  public fgets(handle) {
    if (this.fileBuffer[handle].length == 0) {
      let pos = this.filePtr[handle];
      let br = fs.readSync(handle, this.buffer, 0, 4096, pos);
      if (br < 4096) {
        delete this.filePtr[handle];
        if (br == 0) return false;
      }
      let lst = this.buffer.slice(0, br).toString().split("\n");
      let minus = 0;
      if (lst.length > 1) {
        var x = lst.pop();
        minus = x.length;
      }
      this.fileBuffer[handle] = lst;
      this.filePtr[handle] = pos + br - minus;
    }
    return this.fileBuffer[handle].shift();
  }

  /**
   * Cette fonction indique si le curseur est arrivé à la dernière ligne du fichier
   * @param handle Descripteur du fichier donné par la fonction fopen
   * @returns true si l'on est arrivé à la dernière ligne du fichier, false sinon
   */
  public eof(handle) {
    return (handle in this.filePtr) == false && (this.fileBuffer[handle].length == 0);
  }






}

