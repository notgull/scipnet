## scipnet

### Running

Provisional execution instructions:

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
$ make
```
