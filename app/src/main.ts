import { Formulaire } from "./Formulaire";
import { Path } from './Modele/path';
const fs = require('fs');
let frequences = require("./Parseur/frequences");

console.log("debut main");
// Init the server user path :
if (!fs.existsSync(Path.userPath)) {
    fs.mkdirSync(Path.userPath);
}

// Create frequence files :
frequences.GbdiToFreq(Path.STPVFilePath);

// Start application :
new Formulaire();
