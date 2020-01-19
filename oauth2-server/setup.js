"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
// import 'es6-shim';
// import 'reflect-metadata';
// import * as jwt from 'jsonwebtoken';
var fs = __importStar(require("fs"));
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var users = [
    { id: 1, username: 'toto', password: 'secret', displayName: 'Toto', emails: [{ value: 'toto@toto.com' }] },
    { id: 2, username: 'kiro', password: 'kiro', displayName: 'Kiro', emails: [{ value: 'kiro@kiro.com' }] }
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
function setupServer(server) {
    // server.use(bodyParser.json());
    // server.use(function (req: any, res: any, next: any) {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    //     next();
    // });
    server.get('/health', function (req, res, next) {
        res.sendStatus(200);
    });
    server.get('/test', function (req, res, next) {
        res.status(200).send('test endpoint works');
    });
    server.get('/testcheck', isAuthorized, function (req, res, next) {
        res.json({ "message": "THIS IS SUPER SECRET, DO NOT SHARE!" });
    });
    server.get('/users/authenticate', function (req, res, next) {
        var privateKey = fs.readFileSync('./rsa256/jwt-rs256.key', 'utf8');
        console.log(privateKey);
        // create token for user
        var token = jwt.sign({ "body": "stuff" }, privateKey, { algorithm: 'RS256' });
        console.log(">>> token", token);
        res.send(token);
        // res.status(200).send();
    });
}
exports.setupServer = setupServer;
function isAuthorized(req, res, callback) {
    if (typeof req.headers.authorization !== "undefined") {
        // retrieve the authorization header and parse out the
        // JWT using the split function
        var token = req.headers.authorization.split(" ")[1];
        // console.log("token", token);
        var publicKey = fs.readFileSync('./rsa256/jwt-rs256.key.pub', 'utf8');
        // Here we validate that the JSON Web Token is valid and has been 
        // created using the same private pass phrase
        jwt.verify(token, publicKey, { algorithms: ['RS256'] }, function (err, user) {
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
    }
    else {
        // No authorization header exists on the incoming
        // request, return not authorized and throw a new error 
        res.status(500).json({ error: "Not Authorized" });
        throw new Error("Not Authorized");
    }
}
