import { Formulaire } from "./Formulaire";
import { Path } from './Modele/path';
const fs = require('fs');

console.log("debut main");
// Init the server user path :
if (!fs.existsSync(Path.userPath)) {
    fs.mkdirSync(Path.userPath);
}



// Start application :
new Formulaire();
