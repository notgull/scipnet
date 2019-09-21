## scipnet

### Running

Uses Node.JS version 8.0.0

**Setup:**

Initialize submodules:
```
$ git submodule init
$ git submodule update
```

Initialize database:
```
$ bin/setup_db.js | psql
```

(`sudo -u postgres psql` or similar if you're running Postgres as another user)

**Build:**

```
$ npm install
$ make
```

**Running:**

```
$ node dist/server/index.js
```
