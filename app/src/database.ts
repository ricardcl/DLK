
import { Vol } from './Modele/vol';
import { Identifiants } from './Modele/identifiants';
const { Client } = require('pg')
const mysql = require('mysql');

export class Database {
    //private client;
    private pool;
    constructor() {
        // Add the credentials to access your database
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: 'crna-se-07-1', //'crna-se-07-1',
            user: 'vdlink',
            database: 'vdlink',// 'vdlink',//'bdd_vols_datalink',
            password: 'vdlink-sql',

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
        console.log("Fonction read2 database");

        this.query('SELECT * from vol')
            .then(rows => {
                console.log("je rentre database 1", rows);
                socket.emit('database', rows);
            })
            .catch(err => {
                // handle the error
            });
    }

    public readVol(socket, id?:string): void | never {
        console.log("Fonction readVol database idcomplet ",id);
        //let DATE_DEBUT = JSON.stringify(id.entree_date);
        //let DATE_FIN = JSON.stringify(id.vol_date);
        //let PLNID = JSON.stringify(id.plnid);
        //let ARCID = JSON.stringify(id.arcid);
        let ID = JSON.stringify(id);
        let queryReadVol = 'SELECT * FROM `vol_data` WHERE (vol_id =' + ID +')';
        console.log("lecture vol database global", queryReadVol);
        this.query(queryReadVol)
            .then(rows => {
                const volJson = rows[0].data;
                const vol = JSON.parse(volJson);
                console.log("lecture vol database global", rows);

                //console.log("lecture vol database ", vol);
                socket.emit("analysedVol", "LPLN", "", vol, null, null);

            })
            .catch(err => {
                console.log("error: ", err);
            });
    }

    //regarder la version mysql, > 5.7.8 ??
    //https://dev.mysql.com/doc/refman/5.7/en/json.html
    public writeVol(id: Identifiants, vol: Vol): void | never {

        // Perform a query : ECRITURE
        let DATE_DEBUT = JSON.stringify(id.dates.dateMin);
        let DATE_FIN = JSON.stringify(id.dates.dateMax);
        let PLNID = JSON.stringify(vol.getPlnid());
        let ARCID = JSON.stringify(vol.getArcid());
        let VOL = "'" + JSON.stringify(vol) + "'";

        //let VOL = JSON.stringify(vol.getArcid());
        let queryWriteVol = 'INSERT INTO vol (entree_date, vol_date, plnid, arcid) VALUES (' + DATE_DEBUT + ',' + DATE_FIN + ',' + PLNID + ',' + ARCID + ')';

        this.pool.getConnection(function (err, connection) {
            if (err) throw err; // not connected!

            connection.query(queryWriteVol, function (errQueryWriteVol, rowsQueryWriteVol) {
                if (errQueryWriteVol) {
                    console.log("An error ocurred performing the query queryWriteVol.", queryWriteVol, errQueryWriteVol);
                    //  return;
                }

                console.log("Query queryWriteVol succesfully executed: ", rowsQueryWriteVol, rowsQueryWriteVol.insertId);

                const queryWriteVol_Data = 'INSERT INTO vol_data (vol_id, data) VALUES (' + rowsQueryWriteVol.insertId + ',' + VOL + ')';
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





