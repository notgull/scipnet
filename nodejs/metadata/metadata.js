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
var { error_codes, getFormattedDate } = require('./../user/validate');
var metadata_dir = config.scp_meta_location;

var fs = require('fs');
var path = require('path');
var { query } = require("./../sql");

var check_metadata_existence = function(url, next) {
  var check_existence_query = "SELECT article_id FROM Pages WEHRE url='" + url + "';";
  query(check_existence_query, (err, res) => {
    if (err) next(error_codes[0], err);
    else if (res.rowCount == 0) next(error_codes[1]);
    else next(0);
  });
};


// note: ratings are dicts, such that
// {user: "[username]", rating: +-1}
var aggregate_rating = function(ratings) {
  var total = 0;
  for (var i = 0; i < ratings.length; i++) {
    total += ratings[i].rating;
  }
  return total;
};

// edit locks
var editlock = function(url, username, id=-1, created_at=null) {
  if (!(this instanceof editlock)) return new editlock(url, username, id, created_at);

  this.url = url;
  this.username = username;
  this.created_at = created_at;
  this.id = id;
  if (!created_at)
    this.created_at = new Date();
};

// get editlock from id
var editlock.get = function(id, next) {
  var get_editlock_query = "SELECT url, username, created FROM Editlocks WHERE editlock_id = " + id + ";";
  query(get_editlock_query, (err, res) => {
    if (err) next(error_codes[0], err);

    var row = res.rows[0];
    next(editlock(row.url, row.username, id, row.created);
  });
};

// get editlock from url
//var editlock.get_by_url = function(url, next) {
//
//};

// remove editlock from database
var editlock.prototype.remove = function(next) {
  // if the id is -1, we don't need anything, go next
  if (this.id === -1) {
    next(0);
    return;
  }

  var delete_el_query = "DELETE FROM Editlocks WHERE editlock_id = " + this.id + ";";
  query(delete_el_query, (err, res) => {
    if (err) next(error_codes[0], err);
    else next(0);
  });
}

var editlock.prototype.save = function(next) {
  // NOTE: this function should only be used for saving stuff that doesn't exist yet
  // so just delete it first
  this.remove((res, err) => {
    if (res) next(res, err);
    else {
      var add_el_query = "INSERT INTO Editlocks (url, username, created) VALUES (" +
		           "'" + this.url + "'," +
		           "'" + this.username + "'," +
		           "'" + getFormattedDate(this.created_at) + "'" +
		         ");";
      query(add_el_query, (err, res) => {
        if (err) next(error_codes[0], err);
	
	// glob the id from the database
	var get_id_query = "SELECT editlock_id FROM Editlocks WHERE url='" + this.url + "';";
	query(get_id_query, (err, res) => {
          if (err) next(error_codes[0], err);
          this.id = res.rows[0].editlock_id;

          next(0);
	});
      });
    }
  });
};

module.exports = function(url, next) {
  if (!(this instanceof module.exports)) {
    metadata_path = path.join(metadata_dir, url);
    if (!(fs.existsSync(metadata_path)))
      return null;

    // return an instance of metadata loaded from a file 
    var get_metadata_query = "SELECT title, author, raters, revisions, tags, editlock, discuss_page, locked, files, parent FROM Pages WHERE url = '" + url + "';";
    query(get_metadata_query, (err, res) => {
      if (err) next(error_codes[0], err);
      else if (res.rowCount === 0) next(null);
      else {
        metadata = res.rows[0];

        mObj = new module.exports(url);
        mObj.title = metadata.title;
        //mObj.rating = metadata.rating;
        mObj.raters = metadata.raters;
	mObj.rating = aggregate_rating(mObj.raters);
        mObj.author = metadata.author;
        mObj.revisions = metadata.revisions; // TODO: put revision diffs in here 
        mObj.tags = metadata.tags;
        //mObj.editlock = metadata.editlock;
        mObj.discuss_link = metadata.discuss_link;
        mObj.attached_files = metadata.attached_files;
        mObj.locked = metadata.locked;
        mObj.parentPage = metadata.parentPage;

        var after_editlock_check = function() {
          // now get revisions 
          // TODO: get revisions
	  mObj.revisions = metadata.revisions;
          next(mObj);
	};

	// get the editlock, if any
	if (metadata.editlock !== -1) {
          editlock.get(metadata.editlock, (res, err) => {
            if (res === error_codes[0]) next(res, err);
            else {
	      mObj.editlock = res;  
              after_editlock_check();
	    }
	  });
	} else {
          mObj.editlock = null;
          after_editlock_check();
	}
      }
    });
  } else {
    // create a new metadata instance
    this.url = url;
    this.title = "";
    this.rating = 0;
    this.raters = [];
    this.author = "";
    this.editlock = -1;
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
  
  /*mObj.
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
  mObj.parentPage = this.parentPage;*/

  // save the metadata to the database
  check_metadata_existence((res, err) => {
    if (res == error_codes[1]) next(res, err);
    else if (res) {
      // item was not found, create a new item
      var create_newmd_query = "INSERT INTO Pages (url, title, author, raters, revisions, tags, editlock, discuss_page, locked, files, parent) " +
		                 "VALUES (" +
		                   "'" + this.url + "'," +
		                   "'" + this.title + "'," +
		                   "'" + this.author + "'," +
		                   "'" + JSON.stringify(this.raters).replace("'", '"') + "'," +
		                   "[" + this.revisions.toString() + "]," +	
		                   JSON.stringify(this.tags).replace("'", '"') + "," +
		                   this.editlock + "," +
		                   "'" + this.discuss_link + "'," +
		                   this.locked + "," +
		                   JSON.stringify(this.attached_files).replace("'", '"') + "," +
		                   "'" + this.parentPage + "'" +
		               ");";
      query(create_newmd_query, (err, res) => {
        if (err) next(error_codes[0], err);
	else next(0);
      });
    } else {
      var update_newmd_query = "UPDATE Pages SET " +
		                 "title = '" + this.title + "'," +
		                 "author = '" + this.author + "'," +
		                 "raters = '" + JSON.stringify(this.raters).replace("'", '"') + "'," +
		                 "revisions = [" this.revisisions.toString() + "]," + 
		                 "tags = " + JSON.stringify(this.tags).replace("'", '"') + "," +
		                 "editlock = " + this.editlock + "," +
		                 "discuss_page = " + this.discuss_link + "'," +
		                 "locked = " + this.locked + "," +
		                 "files = " + JSON.stringify(this.attached_files).replace("'", '"') + "," +
		                 "parent = " + this.parentPage + "' " +
		               "WHERE url = '" + this.url + "';";
      query(update_newmd_query, (err, res) => {
        if (err) next(error_codes[0], err);
	else next(0);
      });
    }
  });
};

module.exports.editlock = editlock;
