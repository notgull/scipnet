/*
 * metadata.js
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

// basic class for storing metadata for individual files

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
var metadata_dir = config.scp_meta_location;

var fs = require('fs');
var path = require('path');
var sqlite3 = require('sqlite3').verbose();

// var initialize_table = require('initialize_table');

/*// connect to database
var connect_to_meta_db = function(next) {
  var create_connection = function() {
    var db = new sqlite3.Database(config.sql_meta_location, (err) => {
      if (err) next(false, err);
      else next(db);
    });
  };

  if (!(fs.existsSync(config.sql_meta_location)))
    initialize_table(create_connection);
  else
    create_connection();
}

// check for the existence of a page/number
var check_metadata_existence = function(id, next) {
  connect_to_meta_db((db, err) => {
    if (err) { next(42, err); return; }

    var isString = typeof id === 'string';
    var check_exist_sql = "SELECT article_id FROM Metadata WHERE " +
		(isString ? "url" : "article_id") +
		" = " +
                (isString ? "'" : "") + id + 
		(isString ? "'" : "") +
		";";
    db.get(check_exist_sql, (err, row) => {
      db.close();

      if (err) next(42, err);
      else if (!row) next(false);
      else next(true);
    });
  });
};

// get a row representing a metadata object
var get_metadata_row = function(url, next) {
  connect_to_meta_db((db, err) => {
    if (err) { next(42, err); return; }

    var get_row_sql = "SELECT * FROM Metadata WHERE url='" + url + "';";
    db.get(get_row_sql, (err, row) => {
      db.close();
      if (err) next(42, err);
      else if (!row) next(42, "Unable to find metadata");
      else next(row);
    });
  });
};

// insert a row for metadata
var create_metadata_row = function(metadata, next) {
  connect_to_meta_db((db, err) => {
    if (err) { next(42, err); return; }

    var new_page_sql = "INSERT INTO Metadata (url, title, rating, author, revisions, tags, editlock, editdate, attached_files, locked, parent) VALUES (" +
		         "'" + metadata.url + "'," +
		         "'" + metadata.title + "'," +
		         "'" + metadata.rating + "'," +
  });
};*/

module.exports = function(url) {
  if (!(this instanceof module.exports)) {
    metadata_path = path.join(metadata_dir, url);
    if (!(fs.existsSync(metadata_path)))
      return null;

    // return an instance of metadata loaded from a file 
    metadata_text = fs.readFileSync(metadata_path);
    metadata = JSON.parse(metadata_text);

    mObj = new module.exports(url);
    mObj.title = metadata.title;
    mObj.rating = metadata.rating;
    mObj.raters = metadata.raters;
    mObj.author = metadata.author;
    mObj.revisions = metadata.revisions; // TODO: put revision diffs in here 
    mObj.tags = metadata.tags;
    mObj.editlock = metadata.editlock;
    mObj.discuss_link = metadata.discuss_link;
    mObj.attached_files = metadata.attached_files;
    mObj.locked = metadata.locked;
    mObj.parentPage = metadata.parentPage;

    return mObj;
  } else {
    // create a new metadata instance
    this.url = url;
    this.title = "";
    this.rating = 0;
    this.raters = [];
    this.author = "";
    this.editlock = "";
    this.tags = [];
    this.revisions = [];
    this.discuss_link = "";
    this.attached_files = [];
    this.locked = false;
    this.parentPage = "";
  }
};

// save metadata to a file
module.exports.prototype.save = function(next) {
  mObj = {};
  
  mObj.title = this.title;
  mObj.rating = this.rating;
  mObj.raters = this.raters;
  mObj.author = this.author;
  mObj.revisions = this.revisions; 
  mObj.tags = this.tags;
  mObj.editlock = this.editlock;
  mObj.discuss_link = this.discuss_link;
  mObj.attached_files = this.attached_files;
  mObj.locked = this.locked;
  mObj.parentPage = this.parentPage;

  filePath = path.join(metadata_dir, this.url);
  fs.writeFileSync(filePath, JSON.stringify(mObj));
};
