// import * as bodyParser from 'body-parser';
// import * as moment from 'moment';
// import { Request, Response } from 'express';
import * as path from 'path';
// import 'reflect-metadata';

import express from "express";

export const server = express();

// const bodyParser = require('body-parser');

const users = [
    { id: 1, username: 'toto', password: 'secret', displayName: 'Toto', emails: [{ value: 'toto@toto.com' }] }
    , { id: 2, username: 'kiro', password: 'kiro', displayName: 'Kiro', emails: [{ value: 'kiro@kiro.com' }] }
];

// const findByUsername = function (username, callback) {
//     process.nextTick(function () {
//         for (let i = 0, len = users.length; i < len; i++) {
//             const user = users[i];
//             if (user.username === username) {
//                 return callback(null, user);
//             }
//         }
//         return callback(null, null);
//     });
// };

// Allowed extensions list can be extended depending on your own needs
const allowedExt = [
    '.js',
    '.ico',
    '.css',
    '.png',
    '.jpg',
    '.woff2',
    '.woff',
    '.ttf',
    '.svg',
];

class Server {
    public app: any;
    private port = 8080;

    public static bootstrap(): Server {
        return new Server();
    }

    constructor() {
        // Create expressjs application
        this.app = server;
        // Route our backend calls
        this.app.get('/api', (req: any, res: any) => res.json({ application: 'Reibo collection' }));

        // Redirect all the other resquests
        this.app.get('*',
            (req: any, res: any) => {
                if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
                    res.sendFile(path.resolve(`./ng-client/${req.url}`));
                } else {
                    console.log('Serving index.html');
                    res.sendFile(path.resolve('./ng-client/index.html'));
                }
            }
        );

        this.app.on('error', (error: any) => {
            console.error(new Date(), 'ERROR', error);
        });

        this.app.listen(this.port, () => console.log(`ng-web-server is started ${this.port}`))
    }
}

// Bootstrap the server, so it is actualy started
Server.bootstrap();
// export default srv.app;
