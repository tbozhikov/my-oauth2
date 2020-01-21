To start the app, from the root folder of the project execute:

`npm run start-all-docker`

This command builds and runs (using Docker containers):
- A web server (`ng-web-server` folder), hosting an Angular app (`angular-client` folder)
- An authentication server (`oauth2-server` folder)
- A `mongodb` database
- A `Vault` service (`vault` folder)

After running the project, in order to go through a login flow:
1. Browse to http://localhost:8080
2. Enter username 'toto', password 'wrongpass' - this results in an error.
3. Enter username 'toto', password 'toto' - this should log you in the home page.

The authentication happens when the client sends the following message to the auth server:

```
 const message = `${JSON.stringify({
                username: req.body.username,
                password: req.body.password
            })}.${Date.now()}.${clientId}`;
```

encrypted using the same private key as the one `ng-web-server/key`, retreived from the Vault service.
The Auth service is decrypting this message using the public key, and issues a token.