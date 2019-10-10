## scipnet
[![Build Status](https://travis-ci.org/Nu-SCPTheme/scipnet.svg?branch=master)](https://travis-ci.org/Nu-SCPTheme/scipnet)

Platform for multi-tenant writing wikis.

### Running

**Requirements:**

* GNU make
* node.js version 8.10.0
* npm compatible with the above
* Cargo / rustc stable 1.38.0
* diesel\_cli (installable using `cargo install diesel_cli --features postgres`)

**Setup:**

Initialize submodules:
```
$ git submodule init
$ git submodule update
```

TODO: add section about ssl certs

Initialize database: (TODO: remove)
```
$ bin/setup_db.js | psql
```

(`sudo -u postgres psql` or similar if you're running Postgres as another user)

**Build:**

```
$ make prepare
$ make BUILD=release
```

**Running:**

```
$ node dist/server/index.js
```
