# mongodb

- Database name: **MyOauth2**

- Added user from `mongo shell` using:
```js
db.createUser({
    user: "admin-user",
    pwd: "admin-password",
    roles: [{
        role:"readWrite",
        db: "myOauth2"
    }]
})
```

- The following collections are present:
- **Accounts**
