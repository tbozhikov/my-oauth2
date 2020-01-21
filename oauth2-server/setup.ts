import * as fs from 'fs';
import * as core from "express-serve-static-core";
import * as crypto from 'crypto';
import * as express from 'express';
import { MongoClient } from 'mongodb';

console.log(process.env.MONGO_INITDB_ROOT_USERNAME);
console.log(process.env.MONGO_INITDB_ROOT_PASSWORD);
console.log(process.env.DOCKER);

const jwt = require('jsonwebtoken');
const url = `mongodb://admin-user:admin-password@${process.env.DOCKER ? 'mongodb' : 'localhost'}:27017/myOauth2`;
console.log(url);
const users = [
    { id: 1, username: 'toto', password: 'secret', displayName: 'Toto', emails: [{ value: 'toto@toto.com' }] }
    , { id: 2, username: 'kiro', password: 'kiro', displayName: 'Kiro', emails: [{ value: 'kiro@kiro.com' }] }
];

MongoClient.connect(url, (err: any, mongoClient) => {
    if (err) throw err;
    var dbo = mongoClient.db("MyOauth2");
    dbo.collections().then(value => { console.log(value) });
    // dbo.collection("Users").findOne({}, function (err: any, result: any) {
    //     if (err) throw err;
    //     console.log(result.username);
    //     mongoClient.close();
    // });
    mongoClient.close();
});

const findByUsername = (username: any, callback: (err: any, user: any) => any) => {
    MongoClient.connect(url, (err: any, mongoClient) => {
        if (err) throw err;
        var dbo = mongoClient.db("MyOauth2");
        dbo.collection("Accounts").findOne({ username: username }, function (err: any, result: any) {
            if (err) throw err;
            console.log(JSON.stringify(result));
            mongoClient.close();

            if (result) {
                return callback(null, result);
            } else {
                return callback(null, null);
            }
        });
    });
};
// const findByUsername = (username: any, callback: (err: any, user: any) => any) => {
//     for (let i = 0, len = users.length; i < len; i++) {
//         const user = users[i];
//         if (user.username === username) {
//             return callback(null, user);
//         }
//     }
//     return callback(null, null);
// };

export function setupServer(server: core.Express) {
    server.use(express.json());
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


            // res.status(200).send();
        });

    server.post('/users/authenticate',
        (req: any, res: any, next: any) => {
            console.log(`authenticating user, encrypted msg: ${req.body.base64EncodedMsg}`);
            console.log(`req.body: ${JSON.stringify(req.body)}`);

            let decryptedMessage = decrypt(req.body.base64EncodedMsg);
            console.log(`decrypted msg: ${decryptedMessage}`);

            let user = extractUserDataFromMessage(decryptedMessage);

            console.log('searching for user', user)

            findByUsername(user.username, (err, userFromStore) => {

                console.log('searching finished', userFromStore);

                if (userFromStore) {
                    let token = jwt.sign({ 'user': 'stuff' }, 'some-very-secure-secret');
                    res.json({ access_token: token });
                } else {
                    res.sendStatus(403);
                }
            });
        });
}

function extractUserDataFromMessage(message: string): any {
    const user = JSON.parse(message.split('.')[0]);
    return user;
}

function decrypt(base64EncodedMsg: string): string {
    const publicKey = fs.readFileSync('./rsa256/jwt-rs256.key.pub', 'utf8');
    const decrypted = crypto.publicDecrypt(publicKey, Buffer.from(base64EncodedMsg, 'base64'));

    return decrypted.toString();
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