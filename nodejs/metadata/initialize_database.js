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

var { query } = require('./../sql');

module.exports = function(next) {
  var metadata_table_sql = "CREATE TABLE IF NOT EXISTS Pages (" +
		             "article_id SERIAL PRIMARY KEY," +
		             "url TEXT NOT NULL UNIQUE," +
		             "title TEXT NOT NULL," +
		             "author TEXT NOT NULL," +
	                     "raters JSON," +
		             "revisions INTEGER[]," +
		             "tags TEXT[]," +
		             "editlock INTEGER," +
		             "discuss_page TEXT," +
		             "locked BOOLEAN NOT NULL," +
		             "files TEXT[]," +
		             "parent TEXT" +
		           ");";
  query(metadata_table_sql, (err, res) => {
    if (err) throw new Error(err);
    
    // also create the revision table
    var revision_table_sql = "CREATE TABLE IF NOT EXISTS Revisions (" +
		               "revision_id BIGSERIAL PRIMARY KEY," +
		               "article_id INTEGER NOT NULL," +
		               "diff_link TEXT NOT NULL UNIQUE," +
		               "occured_on TIMESTAMP NOT NULL" +
		             ");";
    query(revision_table_sql, (err, res) => {
      if (err) throw new Error(err);

      // also create the editlock table
      var editlock_sql = "CREATE TABLE IF NOT EXISTS Editlocks (" +
		           "editlock_id SERIAL PRIMARY KEY," +
		           "url TEXT NOT NULL UNIQUE," +
		           "username TEXT," +
		           "created TIMESTAMP" +
		         ");";
      query(editlock_sql, (err, res) => {
        if (err) throw new Error(err);

	next();
      });
    });
  });
}
