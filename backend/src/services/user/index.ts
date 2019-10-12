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
import { ClientError, ErrorCode } from 'app/errors';
import { Nullable, timeout } from 'app/utils';
import { getFormattedDate } from 'app/utils/date';

import { findOne, rawQuery, insertReturn } from 'app/sql';
import { UserModel } from 'app/sql/models';

import { Password } from 'app/services/auth';

// Represents a user with an account on the site.
// TODO: figure out the best way to incorporate stats into this <-- should be separate table
// TODO: allow updating user fields
export class User {
  constructor(
    public userId: number,
    public name: string,
    public createdAt: Date,
    public email: string,
    public authorPage: string,
    public website: string,
    public about: string,
    public location: string,
    public gender: string,
  ) {}

  static async create(
    username: string,
    email: string,
    password: string,
  ): Promise<number> {
    const { usernameExists, emailExists } = await User.checkExistence(username, email);

    if (usernameExists) {
      throw new ClientError(
        `User with name ${username} already exists`,
        ErrorCode.USER_EXISTS,
      );
    }

    if (emailExists) {
      throw new ClientError(
        `User with email ${email} already exists`,
        ErrorCode.EMAIL_EXISTS,
      );
    }

    // TODO start transaction

    const { user_id: userId } = await insertReturn<UserModel>(`
        INSERT INTO users (name, email)
        VALUES ($1, $2)
        RETURNING user_id, created_at
      `,
      [username, email],
    );

    await Password.create(userId, password);
    return userId;
  }

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

  static async loadById(userId: number): Promise<Nullable<User>> {
    const model = await findOne<UserModel>(`
        SELECT
          name,
          created_at,
          email,
          author_page,
          website,
          about,
          location,
          gender
        FROM users
        WHERE user_id = $1
      `,
      [userId],
    );

    if (model === null) {
      return null;
    }

    return new User(
      userId,
      model.name,
      model.created_at,
      model.email,
      model.author_page,
      model.website,
      model.about,
      model.location,
      model.gender,
    );
  }

  static async loadByName(username: string): Promise<Nullable<User>> {
    const model = await findOne<UserModel>(`
        SELECT
          user_id,
          created_at,
          email,
          author_page,
          website,
          about,
          location,
          gender
        FROM users
        WHERE name = $1
      `,
      [username],
    );

    if (model === null) {
      return null;
    }

    return new User(
      model.user_id,
      username,
      model.created_at,
      model.email,
      model.author_page,
      model.website,
      model.about,
      model.location,
      model.gender,
    );
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
}
