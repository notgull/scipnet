/*
 * validate.js
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

// validating whether users exist or not
var argon2 = require('argon2');
var crypto = require('crypto');
var config = require('./../../config.json');
var fs = require('fs');
var initialize_database = require('./initialize_database');
var { promisify } = require('util');
var sqlite3 = require('sqlite3').verbose();

// some error codes
exports.INTERNAL_ERROR = 3;
exports.USER_NOT_FOUND = 5;
exports.PASSWORD_INCORRECT = 7;
exports.SESSION_MISMATCH = 11;
exports.SESSION_EXPIRY = 13;
exports.EMAIL_NOT_FOUND = 17;
exports.error_codes = [
  exports.INTERNAL_ERROR,
  exports.USER_NOT_FOUND,
  exports.PASSWORD_INCORRECT,
  exports.SESSION_MISMATCH,
  exports.SESSION_EXPIRY,
  exports.EMAIL_NOT_FOUND,
];

//var argon2Hash = promisify(argon2.hash);
//var argon2Verify = promisify(argon2.verify);

// date formatting function
// from: https://stackoverflow.com/a/15764763/11187995
function getFormattedDate(date) {
  var year = date.getFullYear();

  var month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;

  var day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;
  
  return month + '/' + day + '/' + year;
}

const options = {
  timeCost: 1,
  type: argon2.argon2i,
};

var connect_to_db = function(next) {
  var create_connection = function() {
    var db = new sqlite3.Database(config.sql_db_location, (err) => {
      if (err) next(exports.INTERNAL_ERROR, err);
      else next(db);
    });
  };

  // first, check to see if the database file exists
  if (!(fs.existsSync(config.sql_db_location)))
    initialize_database(create_connection);
  else
    create_connection(); 
};

exports.check_user_existence = function(user, next) {
  // connect to the user database
  connect_to_db((db, err) => {
    if (exports.error_codes.indexOf(db) !== -1) next(db, err);

    // check for user existence first
    const check_user_sql = "SELECT username FROM Users WHERE username='" + user + "';";
    db.get(check_user_sql, (err, row) => {
      db.close();
      //console.log("Row is: ");
      //console.log(row);
      if (err) next(exports.INTERNAL_ERROR, err);
      else if (!row) next(exports.USER_NOT_FOUND);
      else next(0);
    });
  });
};

exports.check_email_usage = function(email, next) {
  // connect to the user database
  connect_to_db((db, err) => {
    if (exports.error_codes.indexOf(db) !== -1) next(db, err);
    
    var check_email_sql = "SELECT username FROM Users WHERE email='" + email + "';";
    db.get(check_email_sql, (err, row) => {
      db.close();

      if (err) next(exports.INTERNAL_ERROR, err);
      else if (!row) next(exports.EMAIL_NOT_FOUND);
      else next(0);
    });
  });
}

exports.validate_user = function(user, pwHash, next) {
  // connect to the user database
  connect_to_db((db) => {
    if (exports.error_codes.indexOf(db) !== -1) next(db);

    // check for user existence first
    var check_user_sql = "SELECT username FROM Users WHERE username='" + user + "';";
    db.get(check_user_sql, (err, row) => {
      if (err) next(exports.INTERNAL_ERROR, err);
      else if (!row) next(exports.USER_NOT_FOUND);
      else {
        // get the proper password hash
        var get_pwhash_sql = "SELECT salt, pwhash FROM Passwords WHERE username='" + user + "';";
        db.get(get_pwhash_sql, (err, row) => {
	  db.close();
          if (err) next(exports.INTERNAL_ERROR, err);
	  else if (!row) next(exports.USER_NOT_FOUND);
          else {
	    var opts = options;
	    opts.salt = JSON.parse(row.salt);

	    argon2.verify(row.pwhash, pwHash, opts).then((result) => {
              if (result) next(0);
              else next(exports.PASSWORD_INCORRECT);
	    }).catch((err) => { next(exports.INTERNAL_ERROR, err); });
	  }
        });
      }
    });
  });
};

// add a new user to the database
exports.add_new_user = function(user, email, pwHash, next) {
  console.log("Username is " + user + ", pwHash is " + pwHash + ", email is " + email + ", registering account");
  // connect to the user database
  connect_to_db((db) => {
    if (exports.error_codes.indexOf(db) !== -1) next(db);

    
    // NOTE: user existence check should have already happened 
    // add user data in
    console.log("Adding user data");
    var now = new Date();
    var add_user_sql = "INSERT INTO Users (username, email, karma, join_date, status, avatar) VALUES (" +
	                 "'" + user + "'," +
		         "'" + email + "'," +
		         "0," +
		         "'" + getFormattedDate(now) + "'," +
		         "0," +
		         "''" +
		       ");";
    db.run(add_user_sql, (err) => {
      if (err) next(exports.INTERNAL_ERROR, err);
      else {
        // generate a salt for the user
	console.log("Added user to database");
        crypto.randomBytes(16, (err, buf) => {
          if (err) next(exports.INTERNAL_ERROR, err);
          else {
            console.log("Generated bytes");
	    // generate a password hash using these options
	    var opts = options;
	    opts.salt = buf;
	    argon2.hash(pwHash, opts).then(function(realHash) {
	      // turn the salt into a competent string
	      console.log("Hashed password");
              var stringified_salt = JSON.stringify(buf);
              stringified_salt = stringified_salt.split("'").join("\"");

	      var add_password_sql = "INSERT INTO Passwords (username, salt, pwhash) VALUES (" +
			           "'" + user + "'," +
			           "'" + stringified_salt + "'," +
			           "'" + realHash + "'" +
	  	  	           ");";
	      db.run(add_password_sql, (err) => {
	        console.log("Finally done");
	        db.close();
                if (err) next(exports.INTERNAL_ERROR, err);
	        else next(0);
	      });
	    }).catch(function(err) { console.log(err); next(exports.INTERNAL_ERROR, err); });
	  }
        });
      }
    });
  });
};
