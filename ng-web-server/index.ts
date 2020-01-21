import * as path from 'path';
import * as core from "express-serve-static-core";
import * as express from 'express';
import * as crypto from 'crypto';
import * as request from 'request';
// import * as fs from 'fs';

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
// const privateKey = fs.readFileSync('./key/jwt-rs256.key', 'utf8'); // TODO: retrieve from Vault

class Server {
    private express: core.Express;
    private port = 8080;
    private privateKey: string;

    constructor(express: core.Express) {
        // Create expressjs application
        this.express = express;
    }

    public bootstrap() {
        this.initPrivateKey();
        this.setupExpress();

        this.express.listen(this.port, () => console.log(`ng-web-server is started ${this.port}`));
    }

    private setupExpress() {
        this.express.use(express.json());

        this.express.post('/login', (req: any, res: any) => {
            // info format is: {username, password}.{date}.{clientId}
            const message = `${JSON.stringify({
                username: req.body.username,
                password: req.body.password
            })}.${Date.now()}.${clientId}`;

            // send private-key encrypted hello to auth server
            const options = {
                url: `http://${process.env.DOCKER ? 'oauth-server' : 'localhost'}:8888/users/authenticate`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    base64EncodedMsg: this.encrypt(message)
                })
            };

            request(options, (err: any, response: request.Response) => {
                if (err) {
                    console.log(err);
                }

                if (response.statusCode === 200) {
                    res.json({
                        token: response.body
                    })
                } else if (response.statusCode === 403) {
                    res.sendStatus(403);
                }
            });
        });

        // Redirect all the other requests
        this.express.get('*',
            (req: any, res: any) => {
                if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
                    res.sendFile(path.resolve(`./angular-client/${req.url}`));
                } else {
                    console.log('Serving index.html');

                    res.sendFile(path.resolve('./angular-client/index.html'));
                }
            }
        );

        this.express.on('error', (error: any) => {
            console.error(new Date(), 'ERROR', error);
        });
    }

    private encrypt(message: string): string {
        const encrypted = crypto.privateEncrypt(this.privateKey, Buffer.from(message, 'utf8'));
        return encrypted.toString('base64');
    }

    private async initPrivateKey() {
        await this.unsealVault();

        this.privateKey = await this.fetchPrivateKey();
    }

    private async fetchPrivateKey(): Promise<string> {
        let key: string;
        let options = {
            'method': 'GET',
            'url': `http://${process.env.DOCKER ? 'vault' : 'localhost'}:8200/v1/secret`,
            'headers': {
                'x-vault-token': '7e09acff-529e-57d4-a76a-58622afc6b1e'
            }
        };

        key = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) {
                    throw new Error(error)
                };

                resolve(JSON.parse(response.body)['data']['private-key']);
            });
        });

        return key;
    }

    private async unsealVault() {
        var options = {
            'method': 'PUT',
            'url': `http://${process.env.DOCKER ? 'vault' : 'localhost'}:8200/v1/sys/unseal`,
            'headers': {
                'Content-Type': 'text/plain'
            },
            body: "{\n  \"key\": \"E9aqjPOfqdWC6h/pD3BljMD5sfoFmRUfijVj6YBslTo=\"\n}"
        };

        await new Promise((resolve, reject) => {
            request(options, function (error, response) {
                if (error) {
                    throw new Error(error);
                }

                console.log(response.body);
                resolve();
            });
        })
    }
}

const expressApp = express();
const appServer = new Server(expressApp);
appServer.bootstrap();
