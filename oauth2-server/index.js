"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var setup_1 = require("./setup");
var express = require('express');
exports.server = express();
setup_1.setupServer(exports.server);
var srv = exports.server.listen(8888, function () {
    console.log('oauth2-server listening on port ' + 8888);
});
console.log("hello from oauth2-server!");
