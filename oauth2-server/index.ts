import { setupServer } from './setup';
import express from "express";

export const server = express();

setupServer(server);

const srv = server.listen(8888, () => {
    console.log('oauth2-server listening on port ' + 8888);
});

console.log("hello from oauth2-server!");
