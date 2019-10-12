/*
 * services/user/index.ts
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

import { pbkdf2, randomBytes } from 'app/crypto';
import { ErrorCode } from 'app/errors';
import { Nullable, timeout } from 'app/utils';
import { getFormattedDate } from 'app/utils/date';
import { findOne, rawQuery, insertReturn } from 'app/sql';
import { UserModel } from 'app/sql/models';

// Represents a user with an account on the site.
// TODO: figure out the best way to incorporate stats into this
export class User {
  constructor(
    public userId: number,
    public username: string,
    public email: string,
    public karma: number,
    public joinDate: Date,
    public website: Nullable<string>,
    public about: Nullable<string>,
    public city: Nullable<string>,
    public avatar: string,
    public gender: Nullable<string>,
  ) {}

  // helper function: hash a password
  static async hashPassword(password: string, salt: Buffer): Promise<string> {
    const pwHash = await pbkdf2(password, salt, 100000, 64, "sha512");
    return pwHash.toString("hex");
  }

  // validate if a password corresponds to a user
  async validate(password: string): Promise<ErrorCode> {
    // get the pwhash from the database
    let res = await rawQuery(
      `SELECT salt, pwhash FROM passwords WHERE user_id = $1`,
      [this.userId],
    );

    if (res.rowCount === 0) {
      return ErrorCode.USER_NOT_FOUND;
    }

    let truePwHash = res.rows[0].pwhash;
    let salt = new Buffer(res.rows[0].salt.data);

    // hash the currently input password
    let pwHash = await User.hashPassword(password, salt);

    if (pwHash === truePwHash) {
      return ErrorCode.SUCCESS;
    } else {
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
    let res = await rawQuery(
      `SELECT * FROM Users WHERE user_id = $1`,
      [user_id],
    );

    if (res.rowCount === 0) {
      return null;
    } else {
      return User.fromRow(res.rows[0]);
    }
  }

  // load a user by its username
  static async loadByUsername(username: string): Promise<Nullable<User>> {
    let res = await rawQuery(
      `SELECT * FROM Users WHERE username = $1`,
      [username],
    );

    if (res.rowCount === 0) {
      return null;
    } else {
      return User.fromRow(res.rows[0]);
    }
  }

  // helper function- validate a user by its id or username
  static async validateCredentials(user: Number | string, password: string): Promise<ErrorCode> {
    let user_object: User;
    if (user instanceof Number) user_object = await User.loadById(user);
    else user_object = await User.loadByUsername(user);

    return user_object.validate(password);
  }

  private static async checkExistence(
    username: string,
    email: string,
  ): Promise<{ usernameExists: boolean, emailExists: boolean }> {
    const model = await findOne<UserModel>(
      `SELECT name, email FROM users WHERE name = $1 OR email = $2`,
      [username, email],
    );

    if (model === null) {
      return {
        usernameExists: false,
        emailExists: false,
      };
    }

    return {
      usernameExists: model.name === username,
      emailExists: model.email === email,
    };
  }

  // add a new user to the database
  // NOTE: number returned is an error code
  static async createNewUser(
    username: string,
    email: string,
    password: string,
  ): Promise<number> {
    const { usernameExists, emailExists } = await User.checkExistence(username, email);

    if (usernameExists) {
      return ErrorCode.USER_EXISTS;
    }

    if (emailExists) {
      return ErrorCode.EMAIL_EXISTS;
    }

    // insert user into database
    // TODO replace
    const userId = await insertReturn(`
        INSERT INTO users
          (username, email, karma, join_date, status, avatar)
        VALUES
          ($1, $2, 0, $3::timestamp, 0, '')
        RETURNING user_id
      `,
      [username, email, getFormattedDate()],
    ) as number;

    // Password hashing is intentionally synchronous, do not use Promise.all()
    const salt = await randomBytes(16);
    const pwHash = await User.hashPassword(password, salt);

    // stringify the salt so it can be stored easily in the database
    const stringifiedSalt = JSON.stringify(salt).split("'").join("\"");

    // insert password hash into database
    await rawQuery(`
        INSERT INTO passwords (user_id, salt, hash)
        VALUES ($1, $2, $3)
      `,
      [userId, stringifiedSalt, pwHash],
    );

    return userId;
  }

  // update a user in its database with new details
  async submit(): Promise<void> {
    await rawQuery(`
        UPDATE users
        SET
          username = $1,
          email = $2,
          karma = $3,
          website = $4,
          about = $5,
          city = $6,
          gender = $8
        WHERE user_id = $9
      `,
      [
        this.username,
        this.email,
        this.karma,
        this.website,
        this.about,
        this.city,
        this.avatar,
        this.gender,
        this.userId,
      ],
    );
  }
}
