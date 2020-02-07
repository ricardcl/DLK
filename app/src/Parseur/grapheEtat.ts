import { Vol } from '../Modele/vol';
import { Etat } from '../Modele/enumEtat';
import { Frequences } from './frequences';

/**
 * Classe regroupant les fonctions permettant de déterminer les différents état Data Link d'un vol
 */
export class GrapheEtat {

    private frequences: Frequences;

    constructor(frequences: Frequences) {
        console.log("Je rentre dans le constructor GrapheEtat ");
        this.frequences = frequences;
    }

    public evaluateGrapheEtat(vol: Vol): Vol {
        console.log("Classe grapheEtat Fonction grapheMix");

        let monEtat: Etat = Etat.NonLogue;// Etat CPDLC par defaut

        vol.getListeLogs().forEach(etatCpdlc => {
            let infoEtat: string = "";// infoEtat CPDLC par defaut
            let explication: string = "";
            //automate a etat sur la variable etat
            switch (etatCpdlc.getTitle()) {
                case 'CPCASREQ': {
                    if (monEtat == Etat.NonLogue) {
                        monEtat = Etat.DemandeLogon;
                    }
                    explication = "Demande de Logon";
                    break;
                }
                case 'CPCASRES': {
                    if ((etatCpdlc.getDetaillog()["ATNASSOC"] == "S") || (etatCpdlc.getDetaillog()["ATNASSOC"] == "L")) {
                        monEtat = Etat.DemandeLogonAutorisee;
                        explication= "Demande de logon autorisee";
                    }
                    else if (etatCpdlc.getDetaillog()["ATNASSOC"] == "F") {
                        monEtat = Etat.NonLogue;
                        infoEtat = Etat.NonLogue;
                        explication= "Logon Impossible";
                    }
                    break;
                }
                case 'CPCVNRES': {
                    if (etatCpdlc.getDetaillog()["GAPPSTATUS"] == "A") {
                        monEtat = Etat.Logue;
                        infoEtat = Etat.Logue;
                        explication= "Validation du Logon par le STPV";

                    }
                    else if (etatCpdlc.getDetaillog()["GAPPSTATUS"] == "F") {
                        monEtat = Etat.NonLogue;
                        infoEtat = Etat.NonLogue;
                        explication= "non validation du Logon par le STPV";

                    }
                    break;
                }
                case 'CPCOPENLNK': {
                    monEtat = Etat.DemandeConnexion;
                    explication="Demande de connexion"
                    break;
                }
                case 'CPCCOMSTAT': {
                    if (etatCpdlc.getDetaillog()["CPDLCCOMSTATUS"] == "A") {
                        monEtat = Etat.Connecte;
                        infoEtat = Etat.Connecte;
                        explication="Connexion Acceptée"

                    }
                    else if (etatCpdlc.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
                        monEtat = Etat.Logue;
                        infoEtat = Etat.Logue;
                        explication="Déconnexion"
                    }
                    break;
                }
                case 'CPCEND': {
                    monEtat = Etat.FinVol;
                    infoEtat = Etat.NonLogue;
                    explication="Fin du vol"
                    break;
                }
                case 'CPCCLOSLNK': {
                    // if ((monEtat == Etat.Connecte) && log.getDetaillog()["FREQ"] !== undefined) { 

                    if (etatCpdlc.getDetaillog()["FREQ"] !== undefined) {
                        monEtat = Etat.TransfertEnCours;
                        infoEtat= Etat.Logue;
                        explication="Demande de déconnexion avec transfert de fréquence"
                    }
                    else {
                        monEtat = Etat.DemandeDeconnexion;
                        infoEtat= Etat.Logue;
                        explication="Demande de déconnexion"
                    }
                    break;
                }
                case 'CPCMSGDOWN': {
                    if (monEtat == Etat.TransfertEnCours) {
                        if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "WIL") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "LCK")) {
                            monEtat = Etat.Transfere;
                            explication = "Transfert de fréquence accepté"
                        }
                        else if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
                            monEtat = Etat.RetourALaVoix;
                            explication = "Echec de transfert: Retour à la voix"

                        }
                    }
                    //Cas ou le serveur air n a pas repondu assez tot, le vol passe vtr donc closelink obligatoire -> demande deconnexion en cours
                    else if (monEtat == Etat.DemandeDeconnexion) {
                        if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
                            monEtat = Etat.DemandeDeconnexion;
                            infoEtat= Etat.Logue;
                            explication = "Demande de déconnexion"

                        }
                    }
                    
                    break;
                }
                case 'CPCFREQ': {
                    monEtat = Etat.TransfertEnCours;
                    explication= "TransfertEnCours";
                    break;
                }
                case 'TRFDL': {
                    monEtat = Etat.TransfertEnCours;
                    explication= "TransfertEnCours";
                    break;
                }
                case 'FIN TRFDL': {
                    monEtat = Etat.RetourALaVoix;
                    explication= "Retour à la voix";
                    break;
                }
                case 'TRARTV': {
                    monEtat = Etat.RetourALaVoixAcquitte;
                    explication= "Retour à la voix acquitté";
                    break;
                }
                case 'FIN VOL': {
                    monEtat = Etat.FinVol;
                    infoEtat = Etat.NonLogue;
                    explication= "Fin du vol";

                    break;
                }
                case 'FPCLOSE': {
                    monEtat = Etat.FinVol;
                    infoEtat = Etat.NonLogue;
                    explication= "Fin du vol";
                    break;
                }
                case 'CPCMSGUP': {
                    // TODO:
                    break;
                }
                case 'CPCNXTCNTR': {
                    let nextCenter: string = "";
                    if (etatCpdlc.getDetaillog()["UNITID"] !== undefined) {
                        nextCenter = "à " + etatCpdlc.getDetaillog()["UNITID"];
                    }
                    explication = "transfert du logon " + nextCenter;
                    break;
                }
                /** case 'ETATDL': {
                     let result: string = "";
                     if (monEtat == Etat.TransfertEnCours) result = "éclair blanc encadré";
                     if (monEtat == Etat.Transfere) result = "disparition de l'éclair";
                     if (monEtat == Etat.RetourALaVoix) result = "casque bleu";
                     if (monEtat == Etat.RetourALaVoixAcquitte) result = "suppression du casque bleu";
                     explication = "Mise à jour ODS: " + result;
                     break;
                 } 
                 case 'TRANSFERT': {
                     let etatSTPV: string = "";
                     if (etatCpdlc.getDetaillog()["ETAT"] !== undefined) {
                         etatSTPV = "à " + etatCpdlc.getDetaillog()["ETAT"];
                     }
                     explication = "Changement d'état STPV du vol: " + etatSTPV;
                     break;
                 }
                 case 'TRFSEC': {
                     let positions: string = "";
                     if (etatCpdlc.getDetaillog()["POSITION"] !== undefined) {
                         positions = "pour la/les positions " + etatCpdlc.getDetaillog()["POSITION"];
                     }
                     explication = "Passage à l'état VTR " + positions;
                     break;
                 }*/
                default: {
                    // TODO:
                    break;
                }

            }
            //console.log("affichage : "+ etatCpdlc.afficheLogCpdlc());
            etatCpdlc.setEtat(monEtat);
            etatCpdlc.setExplication(explication);
            etatCpdlc.setInfoEtat(infoEtat);


        });

        for (let i = vol.getListeLogs().length - 1; i >= 1; i--) {
            if (vol.getListeLogs()[i].getEtat() == vol.getListeLogs()[i - 1].getEtat()) {
                vol.getListeLogs()[i].setEtat(Etat.Unknown);
            }
        }

        return vol;
    }
}