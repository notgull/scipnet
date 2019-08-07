/*
 * sql.js
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

// exposes basic SQL functionality
const { Pool } = require('pg');
var config = require("./../config.json");

const pool = new Pool({
  user: config.postgres_username,
  host: "localhost",
  database: config.postgres_database,
  password: config.postgres_password,
}); // TODO: set up port?

module.exports.query = function(query, args, callback) {
  pool.query(query, callback);
}

module.exports.queryPromise = async function(query, args) {
  return await pool.query(query);
}
