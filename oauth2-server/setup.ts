// import 'es6-shim';
// import 'reflect-metadata';
// import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as core from "express-serve-static-core";

const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

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

export function setupServer(server: core.Express) {
    // server.use(bodyParser.json());
    // server.use(function (req: any, res: any, next: any) {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    //     next();
    // });

    server.get('/health', (req: any, res: any, next: any) => {
        res.sendStatus(200);
    });

    server.get('/test', (req: any, res: any, next: any) => {
        res.status(200).send('test endpoint works');
    });

    server.get('/testcheck', isAuthorized, (req: any, res: any, next: any) => {
        res.json({ "message": "THIS IS SUPER SECRET, DO NOT SHARE!" });
    });

    server.get('/users/authenticate',
        (req: any, res: any, next: any) => {
            let privateKey = fs.readFileSync('./rsa256/jwt-rs256.key', 'utf8');
            console.log(privateKey);
            // create token for user
            let token = jwt.sign({ "body": "stuff" }, privateKey, { algorithm: 'RS256' });
            console.log(">>> token", token);

            res.send(token);

            // res.status(200).send();
        });

    server.post('/users/authenticate',
        (req: any, res: any, next: any) => {
            let privateKey = fs.readFileSync('./rsa256/jwt-rs256.key', 'utf8');
            console.log(privateKey);
            // create token for user
            let token = jwt.sign({ "body": "stuff" }, privateKey, { algorithm: 'RS256' });
            console.log(">>> token", token);

            res.send(token);

            // res.status(200).send();
        });
}

function isAuthorized(req: any, res: any, callback: any) {
    if (typeof req.headers.authorization !== "undefined") {
        // retrieve the authorization header and parse out the
        // JWT using the split function
        let token = req.headers.authorization.split(" ")[1];

        // console.log("token", token);
        let publicKey = fs.readFileSync('./rsa256/jwt-rs256.key.pub', 'utf8');
        // Here we validate that the JSON Web Token is valid and has been 
        // created using the same private pass phrase
        jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err: any, user: any) => {

            // if there has been an error...
            if (err) {
                console.log(err);
                // shut them out!
                res.status(500).json({ error: "Not Authorized" });
                throw new Error("Not Authorized");
            }
            // if the JWT is valid, allow them in
            return callback();
        });
    } else {
        // No authorization header exists on the incoming
        // request, return not authorized and throw a new error 
        res.status(500).json({ error: "Not Authorized" });
        throw new Error("Not Authorized");
    }
}