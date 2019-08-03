/*
 * initialize_database.js
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

// create the initial database
var config = require('./../../config.json');
//var sqlite3 = require('sqlite3').verbose();
var { query } = require('./../sql');

module.exports = function(next) {
  // create user and pwhash tables
  var user_table_sql = "CREATE TABLE IF NOT EXISTS Users (" +
		            "user_id SERIAL PRIMARY KEY," +
		            "username TEXT NOT NULL UNIQUE," +
		            "email TEXT NOT NULL UNIQUE," +
		            "karma INTEGER NOT NULL," +
		            "join_date TIMESTAMP NOT NULL," +
		            "status INTEGER NOT NULL," +
		            "website TEXT," +
		            "about TEXT," +
		            "city TEXT," +
		            "avatar TEXT NOT NULL," +
		            "gender TEXT" +
	                  ");";
  query(user_table_sql, (err, res) => {
    if (err) throw new Error(err);
    var pwHash_table_sql = "CREATE TABLE IF NOT EXISTS Passwords (" +
                               "user_id SERIAL PRIMARY KEY," +
			       "username TEXT NOT NULL UNIQUE," +
		               "salt JSONB NOT NULL UNIQUE," +
			       "pwhash TEXT NOT NULL" +
			     ");";
    query(pwHash_table_sql, (err, res) => {
      if (err) throw new Error(err);

      next();	
    });
  });
};
