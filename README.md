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
* Postgres 11 or later

**Setup:**

Initialize submodules:
```
$ git submodule init
$ git submodule update
$ cd deepwell
$ DATABASE_URL=(postgres database url) diesel migration run
```

TODO: ~~add section about ssl certs~~ remove ssl certs

**Build:**

```
$ make prepare
$ make BUILD=release
```

**Running:**

```
$ node dist/server/index.js
```
