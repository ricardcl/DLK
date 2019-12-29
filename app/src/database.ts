
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

    public writeFlightLogFile(vol: Vol) {



        console.log("!!! Fonction writeFlightLogFile ajout vol");


        //const connectionString = "pg://postgres:postgres@localhost:5432/students";
        //const client = new Client(connectionString)
        console.log("arcid 1: " + vol.getArcid());

        let idRequete;
        this.client.connect()
        this.client.query('INSERT INTO public.vol( entree_date, vol_date, plnid, arcid) VALUES ( $1, $2, $3, $4) RETURNING *',
            [vol.getDate(), vol.getDate(), vol.getArcid(), vol.getArcid()], (err, res) => {
                console.log("arcid 2: " + vol.getArcid());
                //console.log(res);

                idRequete = res.rows[0].id;
                console.log("arcid bdd: " + res.rows[0].arcid) // Hello World!
               // this.client.end()
                const json = JSON.stringify(vol);

               // this.client.connect()
                this.client.query('INSERT INTO public.vol_data( vol_id, data) VALUES ($1, $2) RETURNING *',
                    [String(idRequete), json], (err, res) => {
                        console.log(idRequete);
                       // console.log(res)
                        //console.log(err ? err.stack : res.rows[0]) // Hello World!
                        this.client.end()
                    })
            })





        console.log("!!!  writeFlightLogFile je sors de la fonction");
    }







}





