
import { Vol } from '../Modele/vol';
import { EtatCpdlc } from '../Modele/etatCpdlc';
import { Etat } from '../Modele/enumEtat';
import * as moment from 'moment';
import { Split } from './split';
import { DetailCpdlc } from '../Modele/detailCpdlc';
import { GrepVEMGSA } from './grepVEMGSA';
import { Path } from '../Modele/path';
import { Frequences } from './frequences';
import { Dates, creneauHoraire } from './date';
import { ReadLine } from '../scripts/node-readline/node-readline';
const p = require('path');

export class ParseurVEMGSA {
  private grep: GrepVEMGSA;
  private split: Split;
  private frequences: Frequences;
  private readLine: ReadLine;
  private dates: Dates;

  constructor(grep: GrepVEMGSA) {
    console.log("Je rentre dans le constructor parseurVemgsa ");
    this.grep = grep;
    this.dates = new Dates();
    this.split = new Split();
    this.frequences = new Frequences();
    this.readLine = new ReadLine();

  }


  public parseur(arcid: string, plnid: number,creneau : creneauHoraire, fichierSourceVemgsa: string[]): Vol {
    console.log("Classe ParseurVemgsa Fonction parseur");
    const fichierGbdi = p.resolve(Path.systemPath, "STPV_G2910_CA20180816_13082018__1156");
    const source = p.resolve(this.grep.getUserPath(), "result.htm"); //Fichier en entree a analyser

    // TODO : DEPLACE DANS LA FONCTION CHECK  ?? 
    this.grep.grepLog(arcid, plnid, fichierSourceVemgsa, creneau);

    /* Ouverture du fichier à analyser*/

    let r = this.readLine.fopen(source, "r");
    if (r === false) {    // Test de l ouverture du fichier
      console.log("Error, can't open ", source);
      process.exit(1);
    }

    /* Initialiation des variables */
    let numeroLigne = 0; // Numero de la de lignes lue
    let monEtat = Etat.NonLogue; // Etat CPDLC par defaut
    let mylisteLogsCpdlc = new Array(); //Liste des lignes lues



    let monvol = new Vol(arcid, plnid);

    /* CREATION DU GRAPHE D ETAT */

    do {
      //lecture d'une ligne du fichier
      let mylogCpdlc = this.readLine.fgets(r);
      //Test de fin de fichier
      if (mylogCpdlc === false) { break; }


      //Recuperation de la date/heure et des infos suivantes
      let mylogCpdlcDecompose = this.split.splitString(mylogCpdlc, 'TITLE');
      let infoGen = mylogCpdlcDecompose[0];
      let infoLog = mylogCpdlcDecompose[1];

      //Creation de l objet logCpdlc et etatCpdlc
      let log = new EtatCpdlc(numeroLigne);
      log.setLog(infoLog);
      //Stockage de la date/heure
      let motifDateHeure = /(\d\d\/\d\d\/\d\d\d\d)( )(\d\d)(H)(\d\d)(')(\d\d)(.*)/;


      let dateHeure = infoGen.toString().match(motifDateHeure);
      if (dateHeure !== null) {
        const dateToStore = this.dates.vlogtoString(dateHeure.toString());
        const momentDate = moment(dateToStore, 'DD-MM-YYYY HH mm ss');

        log.setJour(moment(momentDate).format('DD-MM-YYYY'));
        log.setHeure(moment(momentDate).format('HH mm ss'));
        log.setDate(moment(momentDate).format('DD-MM-YYYY HH mm ss'));

        log.setAssociable(Boolean(infoGen.toString().replace(motifDateHeure, "$8")));
        if (monvol.getDate() == "") {
          monvol.setDate(log.getJour());
        }
      }
      //Stockage des infos suivantes
      let myMap: DetailCpdlc[] = this.split.stringToDetailCpdlc(infoLog);

      log.setDetailLog(myMap);
      log.setTitle(log.getDetaillog()['TITLE']);
      log.setIsTypeCPC(true);
      monvol.getListeLogs().push(log);

      //automate a etat sur la variable etat
      if ((log.getTitle() == "CPCCLOSLNK") || (log.getTitle() == "CPCFREQ")) {
        if (log.getDetaillog()["FREQ"] !== undefined) {
          let freq = this.frequences.conversionFreq(log.getDetaillog()["FREQ"]);
          let detail = <DetailCpdlc>{};
          detail.key = "FREQ";
          detail.value = freq;
          log.addDetail(detail);
        }
      }

      numeroLigne += 1;
    } while (!this.readLine.eof(r));

    this.readLine.fclose(r);
    //fs.closeSync(w);

    return monvol;
  }

}
