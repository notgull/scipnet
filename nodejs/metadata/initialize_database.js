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
		             "article_id BIGSERIAL PRIMARY KEY," +
		             "slug TEXT NOT NULL UNIQUE," +
		             "title TEXT NOT NULL," +
		             "tags TEXT[]," +
		             "editlock_id INTEGER," +
		             "discuss_page_link TEXT," +
		             "locked BOOLEAN NOT NULL," +
		             "files TEXT[]," +
		             "parent TEXT" +
		           ");";
  query(metadata_table_sql, (err, res) => {
    if (err) throw new Error(err);
    
    // also create the revision table
    var revision_table_sql = "CREATE TABLE IF NOT EXISTS Revisions (" +
		               "revision_id BIGSERIAL PRIMARY KEY," +
		               "article_id INTEGER REFERENCES Pages(article_id)," +
		               "user_id INTEGER REFERENCES Users(user_id)," +
		               "diff_link TEXT NOT NULL UNIQUE," +
		               "occured_on TIMESTAMP NOT NULL" +
		             ");";
    query(revision_table_sql, (err, res) => {
      if (err) throw new Error(err);

      // also create the ratings table
      var rating_table_sql = "CREATE TABLE IF NOT EXISTS Ratings (" +
		               "rating_id BIGSERIAL PRIMARY KEY," +
		               "article_id INTEGER REFERENCES Pages(article_id)," +
		               "user_id INTEGER REFERENCES Users(user_id)," +
                               "rating INTEGER NOT NULL" +
		             ");";
      query(rating_table_sql, (err, res) => {
        if (err) throw new Error(err);

        var author_table_sql = "CREATE TABLE IF NOT EXISTS Author (" +
		                 "author_id BIGSERIAL PRIMARY KEY," +
		                 "article_id INTEGER REFERENCES Pages(article_id)," +
		                 "user_id INTEGER REFERENCES Users(user_id)," +
		                 "role TEXT NOT NULL," +
		                 "date TIMESTAMP NOT NULL" +
		               ");";
	query(author_table_sql, (err, res) => {
          if (err) throw new Error(err);

          var file_table_sql = "CREATE TABLE IF NOT EXISTS Files (" +
			         "file_id BIGSERIAL PRIMARY KEY," +
			         "article_id INTEGER REFERENCES Pages(article_id)," +
			         "description TEXT," +
			         "file_uri TEXT NOT NULL" +
			       ");";
          query(file_table_sql, (err, res) => {
            if (err) throw new Error(err);

            var parent_table_sql = "CREATE TABLE IF NOT EXISTS Parents (" +
			             "parent_id BIGSERIAL PRIMARY KEY," +
			             "article_id INTEGER REFERENCES Pages(article_id)," +
			             "parent_article_id INTEGER REFERENCES Pages(article_id)" +
			           ");";
	    query(parent_table_sql, (err, res) => {
              if (err) throw new Error(err);
	      next(0);
	    });
	  });
	});
      });
    });
  });
}
