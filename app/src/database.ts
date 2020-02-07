
import { Vol } from './Modele/vol';
import { Identifiants } from './Modele/identifiants';
const mysql = require('mysql');

/**
 * La Classe Database gère l'accès à la base de données des vols Data Link
 * 
 * Elle définit les fonctions de lecture et d'écriture de la base de données.
 */
export class Database {

    /**
     * pool: Lien vers la base de données
     */
    private pool;

    /**
     * Constructeur de la classe Database 
     * 
     * Les paramètres suivants permettent de définir la base de donnée mysql 
     * 
     * host: nom du serveur bureautique hébergeant la base de donnée
     * 
     * user: utilisateur autorisé à s'y connecter
     * 
     * password: mot de passe utilisateur
     * 
     * database : nom de la base de donnée
     * 
     * connectionLimit : nombre de connexions mamximum autorisées simultanément
     */
    constructor() {
        this.pool = mysql.createPool({
            host: 'localhost', //'crna-se-07-1',
            user: 'serveur_dlk', //vdlink
            // password: 'vdlink-sql',
            database: 'bdd_vols_datalink',// 'vdlink',//'bdd_vols_datalink',
            connectionLimit: 10,
        });
    }

    /**
     * Cette fonction exétute la requête passée en paramètres sur la base données
     * @param sql Requête de lecture ou d'écriture 
     */
    public query(sql):Promise<{}> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection(function (err, connection) {
                if (err) return reject(err);
                connection.query(sql, function (err, rows, fields) {
                    connection.release();
                    resolve(rows);
                });
            });
        });
    }

    /**
     * Cette fonction termine la connexion à la base de données des vols
     */
    public close(): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.pool.end(function () {
                // The connection has been closed
                resolve();
            });
        });
    }


    /**
     * Cette fonction récupère la liste des vols stockés dans la table "VOL"
     * Pour chaque vol les paramètres remontés sont [date_de_début, date_de_fin, plnid, arcid, contexte ]
     * 
     * @param socket la socket permettant de générer un événement "database" vers le client
     */
    public readAllVol(socket): void | never {
        console.log("Fonction readAllVol database");

        this.query('SELECT * from vol')
            .then(rows => {
                console.log("je rentre database vol", rows);
                //Generation d'un evenement vers le client avec la liste de tous les vols
                socket.emit('database', rows);
            })
            .catch(err => {
                console.log("error readAllVol Bdd: ", err);
            });
    }

    /**
     * Cette fonction récupère un des vols stockés dans la table "VOL_DATA" à partir de l'identifiant passé en paramètre
     * Le vol récupéré est au format JSON dans la base de donnée est converti en Objet avant d'être envoyéF 
     * 
     * @param socket la socket permettant de générer un événement "analysedVol" vers le client
     * @param id identifiant du vol à extraire de la base de données
    */
    public readVol(socket, id?: string): void | never {
        console.log("Fonction readVol database idcomplet ", id);
        //let DATE_DEBUT = JSON.stringify(id.entree_date);
        //let DATE_FIN = JSON.stringify(id.vol_date);
        //let PLNID = JSON.stringify(id.plnid);
        //let ARCID = JSON.stringify(id.arcid);
        let ID = JSON.stringify(id);
        let queryReadVol = 'SELECT * FROM `vol_data` WHERE (vol_id =' + ID + ')';
        console.log("lecture vol database global", queryReadVol);
        this.query(queryReadVol)
            .then(rows => {
                console.log("lecture vol database global", rows);
                const contexte = rows[0].contexte;
                const volLplnJson = rows[0].data_LPLN;
                const volVemgsaJson = rows[0].data_VEMGSA;
                const volMixJson = rows[0].data_MIX;
                let volLpln = null;
                let volVemgsa = null;
                let volMix = null;


                if (volLplnJson !== null) {
                    volLpln = JSON.parse(volLplnJson);
                }
                if (volVemgsaJson !== null) {
                    volVemgsa = JSON.parse(volVemgsaJson);
                }
                if (volMixJson !== null) {
                    volMix = JSON.parse(volMixJson);
                }

                console.log("lecture vol database global", rows);

                //console.log("lecture vol database ", vol);
                socket.emit("analysedVol", contexte, "", volLpln, volVemgsa, volMix);

            })
            .catch(err => {
                console.log("error readVol Bdd: ", err);
            });
    }



    //regarder la version mysql, > 5.7.8 ??
    //https://dev.mysql.com/doc/refman/5.7/en/json.html

    /**
     * Cette fonction stocke dans la base de donnée le vol passé en paramètre
     * Les informations essentielles du vol ( date_de_debut, date_de_fin, plnid, arcid, contexte) sont stockés dans la table "VOL"
     *
     * @param id identifiants complets du vol 
     * @param contexte contexte du vol ( LPLN, VEMGSA, ou MIX)
     * @param volLPLN L'objet vol issu de l'analyse du fichier LPLN
     * @param volVEMGSA L'objet vol issu de l'analyse du fichier VEMGSA
     * @param volMIX L'objet vol issu de l'analyse des fichiers LPLN et VEMGSA
     */
    public writeVol(id: Identifiants, contexte: string, volLPLN: Vol, volVEMGSA: Vol, volMIX: Vol): Promise<{}> {
        return new Promise((resolve, reject) => {
            console.log("Fonction writeVol");
            // Perform a query : ECRITURE 
            let DATE_DEBUT = JSON.stringify(id.dates.dateMin);
            let DATE_FIN = JSON.stringify(id.dates.dateMax);
            let PLNID = JSON.stringify(id.plnid);
            let ARCID = JSON.stringify(id.arcid);
            let CONTEXTE = JSON.stringify(contexte);
            //let VOL_LPLN = "'" + JSON.stringify(volLPLN) + "'"; 
            //let VOL_VEMGSA = "'" + JSON.stringify(volVEMGSA) + "'"; 
            //let VOL_MIX = "'" + JSON.stringify(volMIX) + "'"; 
            let VOL_LPLN = null;
            let VOL_VEMGSA = null;
            let VOL_MIX = null;
            if (volLPLN != null) { VOL_LPLN = "'" + JSON.stringify(volLPLN.getArcid()) + "'"; }
            if (volVEMGSA != null) { VOL_VEMGSA = "'" + JSON.stringify(volVEMGSA.getArcid()) + "'"; }
            if (volMIX != null) { VOL_MIX = "'" + JSON.stringify(volMIX.getArcid()) + "'"; }
            let queryWriteVol = 'INSERT INTO vol (entree_date, vol_date, plnid, arcid, contexte) VALUES (' + DATE_DEBUT + ',' + DATE_FIN + ',' + PLNID + ',' + ARCID + ',' + CONTEXTE + ')';


            this.pool.getConnection(function (err, connection) {
                if (err) return reject(err);


                connection.query(queryWriteVol, function (errQueryWriteVol, rowsQueryWriteVol) {
                    if (errQueryWriteVol) {
                        console.log("An error ocurred performing the query queryWriteVol.", queryWriteVol, errQueryWriteVol);
                        //  return; 
                    }

                    console.log("Query queryWriteVol succesfully executed: ", rowsQueryWriteVol, rowsQueryWriteVol.insertId);

                    const queryWriteVol_Data = 'INSERT INTO vol_data (vol_id,contexte, data_LPLN, data_VEMGSA, data_MIX) VALUES (' + rowsQueryWriteVol.insertId + ',' + CONTEXTE + ',' + VOL_LPLN + ',' + VOL_VEMGSA + ',' + VOL_MIX + ')';
                    connection.query(queryWriteVol_Data, function (errQueryWriteVolData, QueryWriteVolData) {
                        if (errQueryWriteVolData) {
                            console.log("An error ocurred performing the query queryWriteVol_Data.", queryWriteVol_Data), errQueryWriteVolData;
                            // return; 
                        }
                        console.log("queryWriteVol_Data write succesfully executed: ", QueryWriteVolData);
                    });


                    connection.release();
                });
            });
        });
    }



}





