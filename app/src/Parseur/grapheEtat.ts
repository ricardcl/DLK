import { Vol } from '../Modele/vol';
import { Etat } from '../Modele/enumEtat';
import { DetailCpdlc } from '../Modele/detailCpdlc';
import { Frequences } from './frequences';

export class GrapheEtat {

    private frequences: Frequences;

    constructor() {
        console.log("Je rentre dans le constructor GrapheEtat ");
        this.frequences = new Frequences();
    }

    public grapheMix(vol: Vol): Vol {
        console.log("Classe grapheEtat Fonction grapheMix");

        let monEtat: Etat = Etat.NonLogue;// Etat CPDLC par defaut

        vol.getListeLogs().forEach(etatCpdlc => {

            let etat: Etat = etatCpdlc.getEtat();


            //automate a etat sur la variable etat
            switch (etatCpdlc.getTitle()) {
                case 'CPCASREQ': {
                    if (monEtat == Etat.NonLogue) {
                        monEtat = Etat.DemandeLogon;
                    }
                    break;
                }
                case 'CPCASRES': {
                    if ((etatCpdlc.getDetaillog()["ATNASSOC"] == "S") || (etatCpdlc.getDetaillog()["ATNASSOC"] == "L")) {
                        monEtat = Etat.DemandeLogonAutorisee;
                    }
                    else if (etatCpdlc.getDetaillog()["ATNASSOC"] == "F") {
                        monEtat = Etat.NonLogue;
                    }
                    break;
                }
                case 'CPCVNRES': {
                    if (etatCpdlc.getDetaillog()["GAPPSTATUS"] == "A") {
                        monEtat = Etat.Logue;
                    }
                    else if (etatCpdlc.getDetaillog()["GAPPSTATUS"] == "F") {
                        monEtat = Etat.NonLogue;
                    }
                    break;
                }
                case 'CPCOPENLNK': {
                    if (monEtat == Etat.Logue) {
                        monEtat = Etat.DemandeConnexion;
                    }
                    break;
                }
                case 'CPCCOMSTAT': {
                        if (etatCpdlc.getDetaillog()["CPDLCCOMSTATUS"] == "A") {
                            monEtat = Etat.Connecte;
                        }
                        else if (etatCpdlc.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
                            monEtat = Etat.Logue;
                        }
                    break;
                }
                case 'CPCEND': {
                    monEtat = Etat.FinVol;
                    break;
                }
                case 'CPCCLOSLNK': {
                    if (etatCpdlc.getDetaillog()["FREQ"] !== undefined) {
                        monEtat = Etat.TransfertEnCours;
                    }
                    else {
                        monEtat = Etat.DemandeDeconnexion;
                    }
                    break;
                }
                case 'CPCMSGDOWN': {
                    if (monEtat == Etat.TransfertEnCours) {
                        if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "WIL") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "LCK")) {
                            monEtat = Etat.Transfere;
                        }
                        else if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
                            monEtat = Etat.RetourALaVoix;
                        }
                    }
                    //Cas ou le serveur air n a pas repondu assez tot, le vol passe vtr donc closelink obligatoire -> demande deconnexion en cours
                    else if (monEtat == Etat.DemandeDeconnexion) {
                        if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
                            monEtat = Etat.DemandeDeconnexion;
                        }
                    }
                    break;
                }
                case 'CPCFREQ': {
                    monEtat = Etat.TransfertEnCours;
                    break;
                }
                case 'TRFDL': {
                    monEtat = Etat.TransfertEnCours;
                    break;
                }
                case 'FIN TRFDL': {
                    monEtat = Etat.RetourALaVoix;
                    break;
                }
                case 'TRARTV': {
                    monEtat = Etat.RetourALaVoixAcquitte;
                    break;
                }
                case 'FIN VOL': {
                    monEtat = Etat.FinVol;
                    break;
                }
                case 'FPCLOSE': {
                    monEtat = Etat.FinVol;
                    break;
                }
                case 'CPCMSGUP': {
                    // TODO:
                    break;
                }
                case 'CPCNXTCNTR': {
                    // TODO:
                    break;
                }
                default: {
                   // TODO:
                    break;
                }

            }
            //console.log("affichage : "+ etatCpdlc.afficheLogCpdlc());
            etatCpdlc.setEtat(monEtat);


        });

        return vol;
    }
}