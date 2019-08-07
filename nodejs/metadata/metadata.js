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

"use strict";

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
var query = require('./../sql').queryPromise;
var uuidv4 = require('uuid/v4');

var check_metadata_existence = async function(url) {
  var check_existence_query = "SELECT article_id FROM Pages WEHRE url=$1;";
  //console.log(check_existence_query);
  return await query(check_existence_query, [url]).rowCount > 0;
};

// getting id from a table will be a common occurence
var get_primary_key = async function(key_name, table_name, determiner_name, determiner) {
  

  var gpk_query = "SELECT $1 FROM $2 WHERE $3 = $4;";
  var res = await query(gpk_query, [key_name, table_name, determiner_name, determiner]).rows[0];
  return res[determiner_name];
};

exports.rating = function(article_id, user_id, rating) {
  if (!(this instanceof exports.rating)) return new exports.rating(user_id, rating);
  this.user_id = user_id;
  this.article_id = article_id;
  this.rating = rating;
  //this.rating_id = -1;
}

// load from database by article id/user id
exports.rating.load_by_article = async function(article_id, user_id) {
  var res = await query("SELECT * FROM Ratings WHERE article_id = $1 AND user_id = $2;",
                        [article_id, user_id]).rows[0];
  var rating = exports.rating(article_id, user_id, res.rating);
  //rating.rating_id = res.rating_id;
  return rating;
}

// save rating to database
exports.rating.prototype.submit = async function() {
  var remove_query = "DELETE FROM Ratings WHERE article_id = $1 AND user_id = $2;";
  await query(remove_query, [this.article_id, this.user_id]);

  var insert_query = "INSERT INTO Ratings VALUES ($1, $2, $3);"
  await query(insert_query, [this.article_id, this.user_id, this.rating]);
}

exports.revision = function(article_id, user_id, diff_link) {
  if (!(this instanceof exports.revision)) return new exports.revision(article_id, user_id, diff_link);
  this.article_id = article_id;
  this.user_id = user_id;
  this.diff_link = diff_link;
  this.revision_id = -1;
  this.created_at = new Date();
}

exports.revision.load_by_id = async function(revision_id) {
  var res = await query("SELECT * FROM Revisions WHERE revision_id = $1;", [revision_id]).rows[0];
  var revision = new exports.revision(res.article_id, res.user_id, res.diff_link);
  revision.created_at = res.created_at;
  revision.revision_id = revision_id;
  return revision;
}

exports.revision.load_array_by_article = async function(article_id) {
  var res = await query("SELECT * FROM Revisions WHERE article_id = $1;", [article_id]).rows;
  var revisions = [];
  var row;
  for (row of res) {
    var revision = new exports.revision(article_id, row.user_id, row.diff_link);
    revision.created_at = row.created_at;
    revision.revision_id = row.revision_id;
    revisions.push(revision);
  }

  return revisions;
}

exports.revision.prototype.submit = async function() {
  await query("DELETE FROM Revisions WHERE revision_id = $1;", [this.revision_id]);
  await query("INSERT INTO Revisions (article_id, user_id, diff_link, created_at) VALUES ($1, $2, $3, $4::timestamp);", [this.article_id, this.user_id, this.diff_link, getFormattedDate(this.created_at)]);
  this.revision_id = await query("SELECT revision_id FROM Revisions WHERE article_id = $1 AND " +
	                         "user_id = $1", [this.article_id, this.user_id]).rows[0].revision_id;
}

// represents an author - there can be more than one per article
exports.author = function(article_id, user_id, role) {
  if (!(this instanceof exports.author)) return new exports.author(article_id, user_id, role);
  this.article_id = article_id;
  this.user_id = user_id;
  this.author_type = role;
  this.created_at = new Date();
  this.author_id = -1;
}

exports.author.load_by_id = async function(author_id) {
  var res = await query("SELECT * FROM Authors WHERE author_id=$1;", [author_id]).rows[0];
  var author = new exports.author(res.article_id, res.user_id, res.author_type);
  author.created_at = res.created_at;
  author.author_id = res.author_id;
  return author;
}

exports.author.load_array_by_article = async function(article_id) {
  var res = await query("SELECT * FROM Authors WHERE article_id=$1;", [article_id]).rows;
  var authors = [];
  var row;
  for (row of res) {
    var author = new exports.revision(article_id, row.user_id, row.diff_link);
    author.created_at = row.created_at;
    author.revision_id = row.author_id;
    authors.push(author);
  }

  return authors;
}

exports.author.prototype.submit = async function() {
  await query("DELETE FROM Authors WHERE author_id = $1;", [this.author_id]);
  await query("INSERT INTO Authors (article_id, user_id, author_type, created_at) VALUES (" +
	      "$1, $2, $3, $4);", [this.article_id, this.user_id, this.author_type, this.created_at]);
  this.author_id = await query("SELECT author_id FROM Authors WHERE article_id = $1 AND " +
	                       "user_id = $2;", [this.article_id, this.user_id])
}

// we will just store edit locks in memory
exports.editlock = function(slug, username, locked_at) {
  if (!(this instanceof exports.editlock)) return new exports.editlock(slug, username, locked_at);

  this.url = slug;
  this.username = username;
  this.locked_at = locked_at;
  this.editlock_id = uuidv4();
}

exports.editlock.prototype.is_valid = function() {
  var now = new Date();
  var ms_per_sec = 1000;
  return (now - this.editlock) > (ms_per_sec * config.editlock_timeout);
}

exports.editlock_table = [];
var outdated_check = function() {
  for (var i = exports.editlock_table.length - 1; i >= 0; i--) {
    if (!(exports.editlock_table[i].is_valid()))
      exports.editlock_table.splice(i, 1);
  }
}

exports.add_editlock = function(slug, username) {
  exports.editlock_table.push(new exports.editlock(slug, username, new Date()));
}

exports.remove_editlock = function(slug) {
  for (var i = exports.editlock_table.length - 1; i >= 0; i--) {
    if (exports.editlock_table[i].slug === slug) {
      exports.editlock_table.splice(i, 1);
      break;
    }
  }
}

exports.check_editlock = function(slug) {
  outdated_check();
  for (var i = exports.editlock_table.length - 1; i >= 0; i--) {
    if (exports.editlock_table[i].slug === slug)
      return true;
  }
  return false;
}

exports.metadata = function(url) {
  if (!(this instanceof exports.metadata)) {
    return new exports.metadata(url);
  } else {
    this.article_id = -1;
    this.url = url;
    this.title = "";
    this.ratings = [];
    this.authors = [];
    this.editlock = -1;
    this.tags = [];
    this.revisions = [];
    this.discuss_page_link = "";
    this.attached_files = []; 
    this.locked = false;
    this.parents = [];
  }
}

exports.metadata.load_by_slug = async function(slug) {
  var res = await query("SELECT * FROM Metadata WHERE slug=$1;", [slug]).rows[0];
  var metadata = new exports.metadata(slug);
  metadata.article_id = res.article_id;
  metadata.title = res.title;
  metadata.tags = res.tags;
  metadata.editlock_id = res.editlock_id;
  metadata.discuss_page_link = res.discuss_page_link;
  metadata.locked_at = res.locked_at;
}  
