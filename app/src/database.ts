
import { Vol } from './Modele/vol';
const { Client } = require('pg')
const mysql = require('mysql');

export class Database {
    //private client;
    private pool;
    constructor() {
        // Add the credentials to access your database
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: 'localhost',
            user: 'serveur_dlk',
            database: 'bdd_vols_datalink',

        });
    }

    public connectionDatabase(): void {
        this.pool.connect(function (err) {
            // in case of error
            if (err) {
                console.log(err.code);
                console.log(err.fatal);
            }
            else {
                console.log("connexion ok");

            }
        });
    }


    /**  public connectionDatabase(): void {
           //throw new Error();
           console.log("!!! Fonction connectionDatabase ");
           this.client
               .connect().then(() => {
                   console.log('client has connected')
               })
               .catch((error) => {
                   console.log("erreur connection", error);
               });
   
       }
    */

    public read(): void | never {
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
            });
        });
    }

    public write(vol: Vol): void | never {

        // Perform a query : ECRITURE
        let DATE = JSON.stringify(vol.getDate());
        let ARCID = JSON.stringify(vol.getArcid());
        // let VOL = JSON.stringify(vol);
        let VOL = JSON.stringify(vol.getArcid());
        let query2 = 'INSERT INTO vol (entree_date, vol_date, plnid, arcid) VALUES (' + DATE + ',' + DATE + ',' + ARCID + ',' + ARCID + ')';

        this.pool.getConnection(function (err, connection) {
            if (err) throw err; // not connected!
            connection.query(query2, function (err, rows, fields) {

                // Handle error after the release.
                if (err) {
                    console.log("An error ocurred performing the query query2.", query2);
                    return;
                }
                console.log("Query write succesfully executed: ", rows, rows.insertId);           
                const query3 = 'INSERT INTO vol_data (vol_id, data) VALUES (' + rows.insertId + ',' + VOL + ')';
                connection.query(query3, function (err, rows, fields) {
                  
                        if (err) {
                        console.log("An error ocurred performing the query write.", query3);
                        return;
                    }
                    console.log("Query write succesfully executed: ", rows);
                });
            });
                  });

    }

    public disconnectionDatabase(): void | never {
        // Close the connection
        this.pool.end(function () {
            // The connection has been closed
        });
    }
    /** 
       private write(vol: Vol): void | never {
           this.client
               .query('INSERT INTO public.vol( entree_date, vol_date, plnid, arcid) VALUES ( $1, $2, $3, $4) RETURNING *',
                   [vol.getDate(), vol.getDate(), vol.getArcid(), vol.getArcid()])
               .then(res => {
                   console.log("arcid 2: " + vol.getArcid());
                   let idRequete;
                   idRequete = res.rows[0].id;
                   console.log("arcid bdd: " + res.rows[0].arcid) // Hello World!
                   const json = JSON.stringify(vol);
   
                   this.client.query('INSERT INTO public.vol_data( vol_id, data) VALUES ($1, $2) RETURNING *',
                       [String(idRequete), json])
                       .then(() => {
                           console.log(idRequete);
                           this.client.end()
                               .then(() => console.log('client has disconnected'))
                               .catch(err => console.error('error during disconnection', err.stack))
                       })
                       .catch(error => {
                           this.client.end()
                               .then(() => console.log('client has disconnected'))
                               .catch(err => console.error('error during disconnection', err.stack))
                           throw error;
                       })
   
               })
               .catch(error => {
                   this.client.end()
                   throw error;
               })
       }
   */
    /** 
       public writeFlightDatabase(vol: Vol): void | never {
           //throw new Error();
           console.log("!!! Fonction writeFlightLogFile ajout vol");
           this.client
               .connect().then(() => {
                   console.log('client has connected')
                   this.write(vol);
               })
               .catch((error) => {
                   console.log("erreur: ");
                   throw error;
               });
   
       }
   */
    /** 
        public readFlightDatabase() : Promise<any> {
            console.log("!!! Fonction readFlightLogFile lecture vol");       
            return this.client.query('SELECT id, entree_date, vol_date, plnid, arcid FROM public.vol WHERE arcid=\'AFR22VR\'');
        }
    */





}





