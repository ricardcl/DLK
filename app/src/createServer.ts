export class Server {

  private app = require('http').createServer();
  private io = require('socket.io')(this.app);

  // TODO : à supprimer
  private cpt : number = 0;

  constructor () {
    console.log("hello");
    this.app.listen(4000);
    this.initSocket();
  }

  private initSocket () {
    this.io.on('connection', (socket) => {
      console.log("Connected and init client socket !");
      socket.emit('cptUpdate', this.cpt);
      this.cpt += 1;
      socket.on('incrCpt', (incr : number) => {
        this.cpt += incr;
        socket.emit('cptUpdate', this.cpt);
      });
    });
  }
}
