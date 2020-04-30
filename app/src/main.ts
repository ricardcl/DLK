import { Echanges } from "./echanges";
import { Path } from './Modele/path';
const fs = require('fs');

console.log("debut main");
// Creation du dossier utilisateur où seront stockés les sessions temporaires des utilisateurs
if (!fs.existsSync(Path.userPath)) {
    fs.mkdirSync(Path.userPath);
}

// Creation du dossier de logs où seront stockés les logs de toutes les actions utilisateur
if (!fs.existsSync(Path.logBookPath)) {
    fs.mkdirSync(Path.logBookPath);
}

// Lancement de l'application
new Echanges();
