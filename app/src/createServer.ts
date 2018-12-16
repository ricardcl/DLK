import {vol} from './Modele/vol';
import {mixInfos} from './Parseur/MixInfos';
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');


app.listen(3000);

function handler (req, res) {
  fs.readFile('./app/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html !');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  console.log("connected");
  socket.on('traitementFichierCPDLC', function (data) {
    console.log(data);
    let volResult : vol = mixInfos(data.arcid, data.plnid, data.fichierSourceLpln, data.fichierSourceVemgsa);
    console.log(volResult);
    //socket.emit('volResult', volResult);
  });
});
