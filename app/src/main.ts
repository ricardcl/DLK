import { Echanges } from "./echanges";
import { Path } from './Modele/path';
const fs = require('fs');

console.log("debut main");
// Init the server user path :
if (!fs.existsSync(Path.userPath)) {
    fs.mkdirSync(Path.userPath);
}

// Init the log folder :
if (!fs.existsSync(Path.logBookPath)) {
    fs.mkdirSync(Path.logBookPath);
}

// Start application :
new Echanges();
