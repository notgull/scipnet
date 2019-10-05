/*
 * user/index.ts
 *
 * scipnet - Multi-tenant writing wiki software
 * Copyright (C) 2019 not_a_seagull, Ammon Smith
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

import { checkUserExistence, checkEmailUsage } from "app/user/existence_check";
import { ErrorCode } from "app/errors";
import { getFormattedDate } from "app/utils/date";
import { Nullable, timeout } from "app/utils";
import { queryPromise as query } from "app/sql";

import { pbkdf2, randomBytes } from "crypto";
import { promisify } from "util";

const pbkdf2Promise = promisify(pbkdf2);
const randomBytesPromise = promisify(randomBytes);

// represents a user
// TODO: figure out the best way to incorporate stats into this
export class User {
  constructor(public user_id: number,
              public username: string,
              public email: string,
              public karma: number,
              public join_date: Date,
              public website: Nullable<string>,
              public about: Nullable<string>,
              public city: Nullable<string>,
              public avatar: string,
              public gender: Nullable<string>) {

  }

  // helper function: hash a password
  static async hashPassword(password: string, salt: Buffer): Promise<string> {
    let pwHash = await pbkdf2Promise(password, salt, 100000, 64, "sha512");
    return pwHash.toString("hex"); 
  }

  // validate if a password corresponds to a user
  async validate(password: string): Promise<ErrorCode> {
    // get the pwhash from the database
    let res = await query("SELECT salt, pwhash FROM Passwords WHERE user_id=$1;", [this.user_id]);
    if (res.rowCount === 0) {
      return ErrorCode.USER_NOT_FOUND;
    }
    
    let truePwHash = res.rows[0].pwhash;
    let salt = new Buffer(res.rows[0].salt.data);

    // hash the currently input password
    let pwHash = await User.hashPassword(password, salt);
    
    if (pwHash === truePwHash) return ErrorCode.SUCCESS;
    else {
      // block execution for a second- this actually makes the system much, MUCH more secure
      await timeout(1000);
      return ErrorCode.PASSWORD_INCORRECT;
    } 
  }

  // create a user from an object that has user-like properties (most likely an SQL row)
  static fromRow(row: any): User {
    return new User(row.user_id,
                    row.username,
                    row.email,
                    row.karma,
                    row.join_date,
                    row.website,
                    row.about,
                    row.city,
                    row.avatar,
                    row.gender);
  }

  // load a user by its ID
  static async loadById(user_id: Number): Promise<Nullable<User>> {
    let res = await query("SELECT * FROM Users WHERE user_id=$1;", [user_id]);
    if (res.rowCount === 0) return null;
    else return User.fromRow(res.rows[0]);
  }

  // load a user by its username
  static async loadByUsername(username: string): Promise<Nullable<User>> {
    let res = await query("SELECT * FROM Users WHERE username=$1;", [username]);
    if (res.rowCount === 0) return null;
    else return User.fromRow(res.rows[0]);
  }

  // helper function- validate a user by its id or username
  static async validateCredentials(user: Number | string, password: string): Promise<ErrorCode> {
    let user_object: User;
    if (user instanceof Number) user_object = await User.loadById(user);
    else user_object = await User.loadByUsername(user);

    return user_object.validate(password);
  }

  // add a new user to the database
  // NOTE: number returned is an error code
  static async createNewUser(username: string, 
                             email: string, 
                             password: string,
                             return_user: boolean = false): Promise<ErrorCode | User> {
    // check for user and email existence
    let results = await Promise.all([checkUserExistence(username), checkEmailUsage(email)]);
    if (results[0]) return ErrorCode.USER_EXISTS;
    else if (results[1]) return ErrorCode.EMAIL_EXISTS;

    // insert user into database
    const addUserSql = "INSERT INTO Users (username, email, karma, join_date, status, avatar) " +
                       "VALUES ($1, $2, 0, $3::timestamp, 0, '') RETURNING user_id;";
    let res = await query(addUserSql, [username, email, getFormattedDate(new Date())]);
    let user_id = res.rows[0].user_id;
    
    // generate salt and password hash
    // NOTE TO FUTURE SELF: don't try to optimize this with Promise.all()
    let salt = await randomBytesPromise(16); 
    let pwHash = await User.hashPassword(password, salt);

    // stringify the salt so it can be stored easily in the database
    let stringifiedSalt = JSON.stringify(salt).split("'").join("\"");

    // insert password hash into database
    const addPasswordSql = "INSERT INTO Passwords (user_id, salt, pwhash) VALUES ($1, $2, $3);";
    await query(addPasswordSql, [user_id, stringifiedSalt, pwHash]);

    if (return_user) return User.loadById(user_id);
    return ErrorCode.SUCCESS;
  }
}
