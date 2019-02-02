/**export class Server {

  private app = require('http').createServer();
  private io = require('socket.io')(this.app);

  // TODO : à supprimer
  private cpt: number = 0;

  constructor() {
    console.log("hello");
    this.app.listen(4000);
    this.initSocket();
  }

  private initSocket() {
    this.io.on('connection', (socket) => {
      console.log("Connected and init client socket !");
      //socket.emit('message', 'Un nouveau client vient de se connecter');
      socket.emit('cptUpdate', this.cpt);
      this.cpt += 1;


      socket.on('petit_nouveau', function (pseudo) {
        socket.pseudo = pseudo;
      });

      // Quand le serveur reçoit un signal de type "message" du client    
      socket.on('message', function (message) {
        console.log(socket.pseudo + ' me parle ! Il me dit : ' + message);
      });

      //evenement increment Compteur initie par le client
      socket.on('incrCpt', (incr: number) => {
        this.cpt += incr;
        socket.emit('cptUpdate', this.cpt);
        console.log("update bouton");
      });




    });
  }
}
*/