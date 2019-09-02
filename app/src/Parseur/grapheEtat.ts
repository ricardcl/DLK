import { Vol } from '../Modele/vol';
import { Etat } from '../Modele/enumEtat';
import { DetailCpdlc } from '../Modele/detailCpdlc';
import { Frequences } from './frequences';

export class grapheEtat {

    private frequences: Frequences;

    constructor() {
        this.frequences = new Frequences();
    }

    grapheMix = function (vol: Vol): Vol {
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
                    if ((etatCpdlc.getDetail("ATNASSOC") == "S") || (etatCpdlc.getDetail("ATNASSOC") == "L")) {
                        monEtat = Etat.DemandeLogonAutorisee;
                    }
                    else if (etatCpdlc.getDetail("ATNASSOC") == "F") {
                        monEtat = Etat.NonLogue;
                    }
                    else {
                        monEtat = Etat.Unknown;
                    }
                    break;
                }
                case 'CPCVNRES': {
                    //console.log('CPCVNRES');
                    if (etatCpdlc.getDetail("GAPPSTATUS") == "A") {
                        monEtat = Etat.Logue;
                    }
                    else if (etatCpdlc.getDetail("GAPPSTATUS") == "F") {
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

                        if (etatCpdlc.getDetail("CPDLCCOMSTATUS") == "A") {
                            monEtat = Etat.Associe;
                        }
                        else if (etatCpdlc.getDetail("CPDLCCOMSTATUS") == "N") {
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
                    if (etatCpdlc.getDetail("FREQ") !== undefined) {
                        let freq = this.frequences.conversionFreq(etatCpdlc.getDetail("FREQ"));
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
                        if ((etatCpdlc.getDetail("CPDLCMSGDOWN") == "WIL") || (etatCpdlc.getDetail("CPDLCMSGDOWN") == "LCK")) {
                            monEtat = Etat.Transfere;
                        }
                        else if ((etatCpdlc.getDetail("CPDLCMSGDOWN") == "UNA") || (etatCpdlc.getDetail("CPDLCMSGDOWN") == "STB")) {
                            monEtat = Etat.RetourALaVoix;
                        }
                    }
                    //Cas ou le serveur air n a pas repondu assez tot, le vol passe vtr donc closelink obligatoire -> demande deconnexion en cours
                    if (monEtat == Etat.DemandeDeconnexion) {
                        if ((etatCpdlc.getDetail("CPDLCMSGDOWN") == "UNA") || (etatCpdlc.getDetail("CPDLCMSGDOWN") == "STB")) {
                            monEtat = Etat.DemandeDeconnexion;
                        }
                    }
                    else {
                        monEtat = Etat.Unknown;
                    }
                    break;
                }
                case 'CPCFREQ': {
                    let freq = this.frequences.conversionFreq(etatCpdlc.getDetail("FREQ"));

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