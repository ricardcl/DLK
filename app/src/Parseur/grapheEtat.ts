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
                    //console.log('CPCASREQ');
                    if (monEtat == Etat.NonLogue) {
                        monEtat = Etat.DemandeLogon;
                    }
                    else {
                        monEtat = Etat.Unknown;
                    }
                    break;
                }
                case 'CPCASRES': {
                    //console.log('CPCASRES');
                    if ((etatCpdlc.getDetaillog()["ATNASSOC"] == "S") || (etatCpdlc.getDetaillog()["ATNASSOC"] == "L")) {
                        monEtat = Etat.DemandeLogonAutorisee;
                    }
                    else if (etatCpdlc.getDetaillog()["ATNASSOC"] == "F") {
                        monEtat = Etat.NonLogue;
                    }
                    else {
                        monEtat = Etat.Unknown;
                    }
                    break;
                }
                case 'CPCVNRES': {
                    //console.log('CPCVNRES');
                    if (etatCpdlc.getDetaillog()["GAPPSTATUS"] == "A") {
                        monEtat = Etat.Logue;
                    }
                    else if (etatCpdlc.getDetaillog()["GAPPSTATUS"] == "F") {
                        monEtat = Etat.NonLogue;
                    }
                    else {
                        monEtat = Etat.Unknown;
                    }
                    break;
                }
                case 'CPCOPENLNK': {
                    //console.log('CPCOPENLNK');
                    if (monEtat == Etat.Logue) {
                        monEtat = Etat.DemandeConnexion;
                    }
                    else {
                        monEtat = Etat.Unknown;
                    }
                    break;
                }
                case 'CPCCOMSTAT': {
                    //console.log('CPCCOMSTAT');
                    if (monEtat == Etat.DemandeConnexion) {

                        if (etatCpdlc.getDetaillog()["CPDLCCOMSTATUS" ] == "A") {
                            monEtat = Etat.Associe;
                        }
                        else if (etatCpdlc.getDetaillog()["CPDLCCOMSTATUS"] == "N") {
                            monEtat = Etat.Logue;
                            let causeEchec = "demande de connexion a echoue , raisons de l echec dans les logs du serveur air";
                        }
                    }
                    else {
                        monEtat = Etat.Logue;
                    }
                    break;
                }
                case 'CPCEND': {
                    //console.log('CPCEND');
                    monEtat = Etat.FinVol;

                    break;
                }
                case 'CPCCLOSLNK': {
                    //console.log('CPCCLOSLNK');
                    if (etatCpdlc.getDetaillog()["FREQ"] !== undefined) {
                        let freq :string = this.frequences.conversionFreq(String(etatCpdlc.getDetaillog()["FREQ"]));
                        let detail = <DetailCpdlc>{};
                        detail.key = "FREQ";
                        detail.value = freq;
                        etatCpdlc.addDetail(detail);
                        monEtat = Etat.TransfertEnCours;
                    }

                    else {
                        monEtat = Etat.DemandeDeconnexion;
                    }
                    break;
                }
                case 'CPCMSGDOWN': {
                    //console.log('CPCMSGDOWN');
                    //  console.log('CPCMSGDOWN :'+etatCpdlc.getInfoMap().get("CPDLCMSGDOWN"));
                    if (monEtat == Etat.TransfertEnCours) {
                        if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "WIL") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "LCK")) {
                            monEtat = Etat.Transfere;
                        }
                        else if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
                            monEtat = Etat.RetourALaVoix;
                        }
                    }
                    //Cas ou le serveur air n a pas repondu assez tot, le vol passe vtr donc closelink obligatoire -> demande deconnexion en cours
                    if (monEtat == Etat.DemandeDeconnexion) {
                        if ((etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "UNA") || (etatCpdlc.getDetaillog()["CPDLCMSGDOWN"] == "STB")) {
                            monEtat = Etat.DemandeDeconnexion;
                        }
                    }
                    else {
                        monEtat = Etat.Unknown;
                    }
                    break;
                }
                case 'CPCFREQ': {
                    let freq: string = this.frequences.conversionFreq(String(etatCpdlc.getDetaillog()["FREQ"]));

                    let detail = <DetailCpdlc>{};
                    detail.key = "FREQ";
                    detail.value = freq;
                    etatCpdlc.addDetail(detail);
                    monEtat = Etat.TransfertEnCours;

                    //console.log('CPCFREQ');
                    // TODO:
                    break;
                }
                case 'TRFDL': {
                    let position = etatCpdlc.getDetaillog()['POSITION'];

                    let detail = <DetailCpdlc>{};
                    detail.key = "POSITION";
                    detail.value = position;
                    etatCpdlc.addDetail(detail);
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
                case 'CPCMSGUP': {
                    //console.log('CPCMSGUP');
                    // TODO:
                    break;
                }
                case 'CPCNXTCNTR': {
                    //console.log('CPCNXTCNTR');
                    // TODO:
                    break;
                }
                default: {
                    //console.log('etats.title');
                    break;
                }

            }
            //console.log("affichage : "+ etatCpdlc.afficheLogCpdlc());
            etatCpdlc.setEtat(monEtat);


        });

        return vol;
    }
}