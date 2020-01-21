import * as fs from 'fs';
import * as core from "express-serve-static-core";
import * as crypto from 'crypto';
import * as express from 'express';
import { MongoClient } from 'mongodb';

const jwt = require('jsonwebtoken');
const url = `mongodb://admin-user:admin-password@${process.env.DOCKER ? 'mongodb' : 'localhost'}:27017/myOauth2`;
const jwtSecret = 'some-very-secure-secret';

export function setupServer(server: core.Express) {
    server.use(express.json());

    server.get('/test-unprotected', (req: any, res: any, next: any) => {
        res.status(200).send('THIS IS PUBLIC, SHARE FREELY!');
    });

    server.get('/test-protected', isAuthorized, (req: any, res: any, next: any) => {
        res.json({ "message": "THIS IS SUPER SECRET, DO NOT SHARE!" });
    });

    server.post('/users/authenticate',
        (req: any, res: any, next: any) => {
            console.log(`authenticating user, encrypted msg: ${req.body.base64EncodedMsg}`);
            console.log(`req.body: ${JSON.stringify(req.body)}`);

            let decryptedMessage = decrypt(req.body.base64EncodedMsg);
            console.log(`decrypted msg: ${decryptedMessage}`);

            let user = extractUserDataFromMessage(decryptedMessage);

            findUser(user, (err, userFromStore) => {
                if (userFromStore) {
                    // let token = jwt.sign({ 'user': 'stuff' }, 'some-very-secure-secret');
                    let token = createToken();
                    res.json({ access_token: token });
                } else {
                    res.sendStatus(403);
                }
            });
        });
}

function findUser(user: any, callback: (err: any, user: any) => any) {
    MongoClient.connect(url, (err: any, mongoClient) => {
        if (err) throw err;
        var dbo = mongoClient.db("myOauth2");
        dbo.collection("Accounts").findOne({ username: user.username, password: user.password }, function (err: any, result: any) {
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

function createToken(): any {
    return jwt.sign({
        'exp': Math.floor(Date.now() / 1000) + (60 * 60),
        'data': 'bla bla'
    }, jwtSecret);
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
        let token = req.headers.authorization.split(" ")[1];

        // validate that the token
        jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
            // TODO: perform additional checks on "decoded" to validate expirations, etc. 

            // if there has been an error...
            if (err) {
                console.log(err);

                res.status(403).json({ error: "Not Authorized" });
                throw new Error("Not Authorized");
            }

            return callback();
        });
    } else {
        // if no Authorization header, return not authorized and throw a new error 
        res.status(500).json({ error: "Not Authorized" });
        throw new Error("Not Authorized");
    }
}