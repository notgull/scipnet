/*
 * validate.ts
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
//import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Nullable } from './../helpers';
import { query } from './../sql';
import * as path from 'path';

import * as config from './../config';

import { INTERNAL_ERROR, USER_NOT_FOUND, PASSWORD_INCORRECT, SESSION_MISMATCH, SESSION_EXPIRY, EMAIL_NOT_FOUND, error_codes, getFormattedDate } from './../helpers';

//const options = {
//  timeCost: 1,
//  type: argon2.argon2i,
//  salt: new Buffer([]),
//};

// check to see if a username already exists
export function check_user_existence(user: string, next: (res: any, err: Nullable<Error>) => any) {
  console.log("Checking for user " + user);
  const check_user_sql = "SELECT username FROM Users WHERE username=$1;";
  query(check_user_sql, [user], (err: Nullable<Error>, row: any) => {
    if (err) next(INTERNAL_ERROR, err);
    else if (row.rowCount === 0) next(USER_NOT_FOUND, null);
    else next(0, null);
  });
};

// check to see if an email already exists
export function check_email_usage(email: string, next: (res: any, err: Nullable<Error>) => any) {
  const check_email_sql = "SELECT username FROM Users WHERE email=$1;";
  query(check_email_sql, [email], (err: Nullable<Error>, row: any) => {
    if (err) next(INTERNAL_ERROR, err);
    else if (row.rowCount === 0) next(EMAIL_NOT_FOUND, null);
    else next(0, null);
  });
}

// get the ID of a user by its username
export function get_user_id(user: string, next: (res: any, err: Nullable<Error>) => any) {
  const userid_query = "SELECT user_id FROM Users WHERE username=$1;";
  query(userid_query, [user], (err: Nullable<Error>, res: any) => {
    if (err) { next(INTERNAL_ERROR, err); return; }
    
    if (res.rowCount === 0) next(null, new Error("Unable to find user ID"));
    else next(res.rows[0].user_id, null);
  });
};

// get the username of a user by its id
export function get_username(user_id: number, next: (res: any, err: Nullable<Error>) => any) {
  query("SELECT username FROM Users WHERE user_id=$1;", [user_id], (err: Nullable<Error>, res: any) => {
    if (err) { next(INTERNAL_ERROR, err); return; }

    if (res.rowCount === 0) next(null, new Error("Unable to find username"));
    else next(res.rows[0].username, null);
  });
};

// validate a user and password
export function validate_user(user: string, pwHash: string, next: (res: any, err: Nullable<Error>) => any) {
  // check for use existence first 
  check_user_existence(user, (res: number, err: any) => {
    if (err) next(INTERNAL_ERROR, err);
    else if (res) next(USER_NOT_FOUND, null);
    else {
      console.log("User exists");
      // get the user id
      get_user_id(user, (res: any, err: any) => {
        if (err) { next(res, err); return; }

        // get the proper password hash
	console.log("User id exists");
        const get_pwhash_sql = "SELECT salt, pwhash FROM Passwords WHERE user_id=$1;";
        query(get_pwhash_sql, [res], (err: Error, row: any) => {
          if (err) next(INTERNAL_ERROR, err);
          else if (row.rowCount === 0) next(USER_NOT_FOUND, null);
          else {
            row = row.rows[0];
	    crypto.pbkdf2(pwHash, new Buffer(row.salt.data), 
	                  100000, 64, 'sha512', (err: Error, derivedKey: Buffer) => {
              let derivedText = derivedKey.toString("hex");
	      //console.log("Provided: " + derivedText);
	      //console.log("Database: " + row.pwhash);

	      if (err) next(INTERNAL_ERROR, err);
              else if (derivedText === row.pwhash) next(0, null);
              else next(PASSWORD_INCORRECT, null);
	    });
          }
        });
      });
    }
  });
};

// add a new user to the database
export function add_new_user(user: string, email: string, pwHash: string, 
                            next: (res: number, err: any) => any) {
  // NOTE: user existence check should have already happened 
  // add user data in
  console.log("Adding user data");
  let now = new Date();
  const add_user_sql = "INSERT INTO Users (username, email, karma, join_date, status, avatar) " +
		       "VALUES ($1, $2, 0, $3::timestamp, 0, '');";

  query(add_user_sql, [user, email, getFormattedDate(now)], (err: Nullable<Error>, res: any) => {
    if (err) next(INTERNAL_ERROR, err);
    else {
      // get the user id
      exports.get_user_id(user, (user_id: number, err: Nullable<Error>) => {
        if (err) { next(INTERNAL_ERROR, err); return; }

        // generate a salt for the user
        console.log("Added user to database");
        crypto.randomBytes(16, (err: Error, buf: Buffer) => {
          if (err) next(exports.INTERNAL_ERROR, err);
          else {
            console.log("Generated bytes");
            // generate a password hash using these options
	    //let opts = options;
	    //opts.salt = buf;
	        
	    crypto.pbkdf2(pwHash, buf, 100000, 64, 'sha512', (err: Error, realHash: Buffer) => {  
              if (err) { next(INTERNAL_ERROR, err); return; }

              let stringified_salt = JSON.stringify(buf);
              stringified_salt = stringified_salt.split("'").join("\"");

	      const add_password_sql = "INSERT INTO Passwords (user_id, salt, pwhash) " + 
                                        "VALUES ($1, $2, $3);";

	      query(add_password_sql, [user_id, stringified_salt, realHash.toString("hex")], (err: Error, res: any) => {
	       console.log("Finally done");

                if (err) next(INTERNAL_ERROR, err);
	        else next(user_id, null);
	      });
            });
	  }
        });
      });
    }
  });
};
