/*
 * initialize_table.js
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

// create the metadata table

// metadata properties, add more if necessary
// url
// title
// rating (+ ratings from users)
// author
// revisions
// link to diffs of revisions
// tags
// editlock (y/n)
// link to discussion page
// list of attached files
// locked (y/n)
// parent page

var config = require('./../../config.json');
var sqlite3 = require('sqlite3').verbose();

module.exports = function(next) {
  var db = new sqlite3.Database(config.sql_meta_location, (err) -> {
    if (err) throw new Error(err);

    // create metadata table
    var meta_table_sql = "CREATE TABLE Metadata (" +
	                   "article_id INTEGER PRIMARY KEY," +
	                   "url TEXT NOT NULL UNIQUE," +
	                   "title TEXT," +
	                   "rating INTEGER," +
	                   "raters TEXT," + 
	                   "author TEXT NOT NULL," +
	                   "revisions TEXT NOT NULL," +
	                   "tags TEXT NOT NULL," +
	                   "editlock TEXT NOT NULL," +
	                   "editdate INTEGER," +
	                   "attached_files TEXT," +
                           "locked INTEGER NOT NULL," +
	                   "parent TEXT" +
	                 ");";
    db.run(meta_table_sql, (err) => {
      if (err) throw new Error(err);
      db.close((err) => {
        if (err) throw new Error(err);
	next();
      });
    });
  });
}
