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
var sqlite3 = require('sqlite3').verbose();

module.exports = function(next) {
  console.log("Creating new database at " + config.sql_db_location);
  var db = new sqlite3.Database(config.sql_db_location, (err) => {
    if (err) throw new Error(err);
    // create user and pwhash tables
    var user_table_sql = "CREATE TABLE Users (" +
		            "user_id INTEGER PRIMARY KEY," +
		            "username TEXT NOT NULL UNIQUE," +
		            "email TEXT NOT NULL UNIQUE," +
		            "karma INTEGER NOT NULL," +
		            "join_data INTEGER NOT NULL," +
		            "status INTEGER NOT NULL," +
		            "website TEXT," +
		            "about TEXT," +
		            "city TEXT," +
		            "avatar TEXT NOT NULL," +
		            "gender TEXT" +
	                  ");";
    db.run(user_table_sql, (err) => {
      if (err) throw new Error(err);
      var pwHash_table_sql = "CREATE TABLE Passwords (" +
                               "user_id INTEGER PRIMARY KEY," +
			       "username TEXT NOT NULL UNIQUE," +
		               "salt TEXT NOT NULL UNIQUE," +
			       "pwhash TEXT NOT NULL" +
			     ");";
      db.run(pwHash_table_sql, (err) => {
        if (err) throw new Error(err);

	// tables are created, close the database
        db.close((err) => {
          if (err) throw new Error(err);
	  next();
	});
      });
    });
  });
};
