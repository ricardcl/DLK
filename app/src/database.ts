
import { Vol } from './Modele/vol';
import { Identifiants } from './Modele/identifiants';
import { Contexte } from './Modele/enumContexte';
const { Client } = require('pg')
const mysql = require('mysql');

export class Database {
    //private client;
    private pool;
    constructor() {
        // Add the credentials to access your database
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: 'localhost', //'crna-se-07-1',
            user: 'serveur_dlk', //vdlink
            database: 'bdd_vols_datalink',// 'vdlink',//'bdd_vols_datalink',
            // password: 'vdlink-sql',

        });
    }

    public query(sql) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection(function (err, connection) {
                if (err) return reject(err);
                connection.query(sql, function (err, rows, fields) {
                    connection.release();
                    // Handle error after the release.
                    //  console.log("Query read succesfully executed: ", rows);
                    resolve(rows);
                });
            });
        });
    }

    public close() {
        return new Promise((resolve, reject) => {
            this.pool.end(function () {
                // The connection has been closed
                resolve();
            });
        });
    }


    public read(): void | never {
        console.log("Fonction read database");

        // Perform a query : LECTURE 
        let query = 'SELECT * from vol';
        this.pool.getConnection(function (err, connection) {
            if (err) throw err; // not connected!
            connection.query(query, function (err, rows, fields) {
                connection.release();
                // Handle error after the release.
                if (err) {
                    console.log("An error ocurred performing the query read.");
                    return;
                }
                //  console.log("Query read succesfully executed: ", rows);
                return rows;
            });
        });
    }

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
    public writeVol(id: Identifiants, contexte: string, volLPLN: Vol, volVEMGSA: Vol, volMIX: Vol): void | never {

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
        if  (volLPLN != null ) {VOL_LPLN= "'" + JSON.stringify(volLPLN.getArcid()) + "'";}
        if  (volVEMGSA != null ) { VOL_VEMGSA = "'" + JSON.stringify(volVEMGSA.getArcid()) + "'";}
        if  (volMIX != null ) {VOL_MIX = "'" + JSON.stringify(volMIX.getArcid()) + "'";}
        let queryWriteVol = 'INSERT INTO vol (entree_date, vol_date, plnid, arcid, contexte) VALUES (' + DATE_DEBUT + ',' + DATE_FIN + ',' + PLNID + ',' + ARCID + ',' + CONTEXTE + ')';

        this.pool.getConnection(function (err, connection) {
            if (err) throw err; // not connected!

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

    }

    public disconnectionDatabase(): void | never {
        // Close the connection
        this.pool.end(function () {
            // The connection has been closed
        });
    }

}





