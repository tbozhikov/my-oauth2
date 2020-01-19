// import { Request, Response } from 'express';
import * as path from 'path';
import express from 'express';
import * as crypto from 'crypto';
import * as fs from 'fs';
import request = require('request');

const bodyParser = require('body-parser');
const server = express();

server.use(express.json());

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

const clientId = 'web-app';
const privateKey = fs.readFileSync('./key/jwt-rs256.key', 'utf8'); // TODO: retrieve from Vault

class Server {
    public app: any;
    private port = 8080;

    public static bootstrap(): Server {
        return new Server();
    }

    constructor() {
        // Create expressjs application
        this.app = server;

        this.app.post('/login', (req: any, res: any) => {
            console.log("trying to get access token");
            // pass headers
            // Client-ID: "sample-app"
            // Authorization: "random_string.timestamp.client_id"
            const message = `${JSON.stringify({ username: req.body.username, password: req.body.password })}.${Date.now()}.${clientId}`;

            console.log('message', message);

            const options = {
                // url: 'http://localhost:8888/users/authenticate',
                url: `http://${process.env.DOCKER ? 'oauth-server' : 'localhost'}:8888/users/authenticate`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // pass
                    base64EncodedMsg: this.encrypt(message)
                })
            };

            request(options, (err: any, response: request.Response) => {
                if (err) {
                    console.log(err);
                }
                // let json = JSON.parse(body);
                console.log(response.body);
                if (response.statusCode === 200) {
                    res.json({ token: response.body })
                } else if (response.statusCode === 403) {
                    res.sendStatus(403);
                }
            });
        });

        // Redirect all the other requests
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

    private encrypt(message: string): string {
        const encrypted = crypto.privateEncrypt(privateKey, Buffer.from(message, 'utf8'));
        return encrypted.toString('base64');
    }
}

// Bootstrap the server, so it is actualy started
Server.bootstrap();
