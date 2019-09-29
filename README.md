## scipnet
[![Build Status](https://travis-ci.org/Nu-SCPTheme/scipnet.svg?branch=master)](https://travis-ci.org/Nu-SCPTheme/scipnet)

Platform for multi-tenant writing wikis.

### Running

Uses Node.JS version 8.10.0

**Setup:**

Initialize submodules:
```
$ git submodule init
$ git submodule update
```

TODO: add section about ssl certs

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
