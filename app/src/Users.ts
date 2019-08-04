var fs = require('fs');
var rimraf = require("rimraf");

/**
 * Manage user repository
 */
export class UsersRepository {
    private usersPath: string;

    constructor(usersPath: string) {
        this.usersPath = usersPath;
        this.initUsersRepository ();
    }

    public createUser(userId: string): boolean {
        var dir = this.usersPath + "/" + userId;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        return true;
    }

    public deleteUser(userId: string): boolean {
         // User found ! Remove  its repo :
         var dir = this.usersPath + "/" + userId;
         rimraf.sync(dir);
         return true;
    }

    public deleteAllUsers(): void {
        rimraf.sync(this.usersPath);
        this.initUsersRepository();
    }

    private initUsersRepository () : void {
        if (!fs.existsSync(this.usersPath)) {
            fs.mkdirSync(this.usersPath);
        }
    }
}