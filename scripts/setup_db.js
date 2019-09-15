#!/usr/bin/env node

/*
 * setup_db.js
 *
 * scipnet - SCP Hosting Platform
 * Copyright (C) 2019 not_a_seagull
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// attempt to load configuration
let config;
try {
  config = require("config.json");
} catch(_e) {
  config = require("../config.json");
}

const username = config.postgres_username;
const password = config.postgres_password;
const database = config.postgres_database;

console.log(`
  CREATE USER ${username} PASSWORD '${password}';
  CREATE DATABASE ${database} OWNER = ${username};
`);
