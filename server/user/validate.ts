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
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Nullable } from './../helpers';
import { query } from './../sql';
import * as path from 'path';

const config = require(path.join(process.cwd(), "config.json"));

// some error codes
export const INTERNAL_ERROR = 3;
export const USER_NOT_FOUND = 5;
export const PASSWORD_INCORRECT = 7;
export const SESSION_MISMATCH = 11;
export const SESSION_EXPIRY = 13;
export const EMAIL_NOT_FOUND = 17;
export const error_codes = [
  INTERNAL_ERROR,
  USER_NOT_FOUND,
  PASSWORD_INCORRECT,
  SESSION_MISMATCH,
  SESSION_EXPIRY,
  EMAIL_NOT_FOUND,
];

// date formatting function
// from: https://stackoverflow.com/a/15764763/11187995
export function getFormattedDate(date: Date): string {
  let year = date.getFullYear();

  let month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;

  let day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;

  let hour = date.getHours().toString();
  hour = hour.length > 1 ? hour : '0' + hour;

  let minutes = date.getMinutes().toString();
  minutes = minutes.length > 1 ? minutes : '0' + minutes;

  let seconds = date.getSeconds().toString(); 
  seconds = seconds.length > 1 ? seconds : '0' + seconds;
  
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
}

const options = {
  timeCost: 1,
  type: argon2.argon2i,
  salt: new Buffer([]),
};

// check to see if a username already exists
export function check_user_existence(user: string, next: (res: any, err: Nullable<Error>) => any) {
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

// validate a user and password
export function validate_user(user: string, pwHash: string, next: (res: any, err: Nullable<Error>) => any) {
  // check for use existence first 
  check_user_existence(user, (row: any, err: any) => {
    if (err) next(INTERNAL_ERROR, err);
    else if (!row) next(USER_NOT_FOUND, null);
    else {
      // get the user id
      get_user_id(user, (res: any, err: any) => {
        if (err) { next(res, err); return; }

        // get the proper password hash
        const get_pwhash_sql = "SELECT salt, pwhash FROM Passwords WHERE user_id=$1;";
        query(get_pwhash_sql, [res], (err: Error, row: any) => {
          if (err) next(INTERNAL_ERROR, err);
          else if (row.rowCount === 0) next(USER_NOT_FOUND, null);
          else {
            row = row.rows[0];
            let opts = options;
            opts.salt = new Buffer(row.salt.data);

            argon2.verify(row.pwhash, pwHash, opts).then((result: boolean) => {
              if (result) next(0, null);
              else next(PASSWORD_INCORRECT, null);
	    }).catch((err: Error) => { next(INTERNAL_ERROR, err); });
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
        crypto.randomBytes(16, (err, buf) => {
          if (err) next(exports.INTERNAL_ERROR, err);
          else {
            console.log("Generated bytes");
            // generate a password hash using these options
            let opts = options;
            opts.salt = buf;
	        
            argon2.hash(pwHash, opts).then(function(realHash: string) {  
              let stringified_salt = JSON.stringify(buf);
              stringified_salt = stringified_salt.split("'").join("\"");

	      const add_password_sql = "INSERT INTO Passwords (user_id, salt, pwhash) " + 
                                        "VALUES ($1, $2, $3);";

	      query(add_password_sql, [user_id, stringified_salt, realHash], (err, res) => {
	       console.log("Finally done");

                if (err) next(INTERNAL_ERROR, err);
	          else next(user_id, null);
	      });
            }).catch(function(err) { console.log(err); next(INTERNAL_ERROR, err); });
	  }
        });
      });
    }
  });
};