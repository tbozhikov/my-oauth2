"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import * as bodyParser from 'body-parser';
// import * as moment from 'moment';
// import { Request, Response } from 'express';
var path = __importStar(require("path"));
// import 'reflect-metadata';
var express_1 = __importDefault(require("express"));
exports.server = express_1.default();
// const bodyParser = require('body-parser');
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
// Allowed extensions list can be extended depending on your own needs
var allowedExt = [
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
var Server = /** @class */ (function () {
    function Server() {
        var _this = this;
        this.port = 8080;
        // Create expressjs application
        this.app = exports.server;
        // Route our backend calls
        this.app.get('/api', function (req, res) { return res.json({ application: 'Reibo collection' }); });
        // Redirect all the other resquests
        this.app.get('*', function (req, res) {
            if (allowedExt.filter(function (ext) { return req.url.indexOf(ext) > 0; }).length > 0) {
                res.sendFile(path.resolve("./ng-client/" + req.url));
            }
            else {
                console.log('Serving index.html');
                res.sendFile(path.resolve('./ng-client/index.html'));
            }
        });
        this.app.on('error', function (error) {
            console.error(new Date(), 'ERROR', error);
        });
        this.app.listen(this.port, function () { return console.log("ng-web-server is started " + _this.port); });
    }
    Server.bootstrap = function () {
        return new Server();
    };
    return Server;
}());
// Bootstrap the server, so it is actualy started
Server.bootstrap();
// export default srv.app;
