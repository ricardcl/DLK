var siofu = require("socketio-file-upload");


export class Formulaire {

    private app = require('http').createServer();
    private io = require('socket.io')(this.app);

    constructor() {
        console.log("hello");
        this.app.listen(4000);
        this.initSocket();
    }

    private initSocket() {
        this.io.on("connection", function (socket) {
            var uploader = new siofu();
            uploader.dir = "./app/assets/Output";
            uploader.listen(socket);
        });


    }

}