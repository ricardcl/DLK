
import { Vol } from './Modele/vol';
const { Client } = require('pg')


export class Database {
    private client;

    constructor() {
        this.client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'root',
            database: "Bdd_vols_datalink", // default process.env.PGDATABASE || process.env.USER
            //connectionString: "pg://postgres:root@localhost:5432/Bdd_vols_datalink",
        })
    }


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

    public writeFlightLogFile(vol: Vol): void | never {
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







}





