/*
 * services/users/utils.ts
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

// quick functions to make it easy to get certain details of users without going through the model
import { Nullable } from 'app/utils';
import { findOne } from 'app/sql';
import { UserModel } from 'app/sql/models';

// get the ID of a user by its username
export async function getUserId(username: string): Promise<Nullable<number>> {
  const userModel = await findOne<UserModel>(
    `SELECT user_id FROM users WHERE name = $1`,
    [username],
  );

  return userModel ? userModel.user_id : null;
};

// get the username of a user by its id
export async function getUsername(userId: number): Promise<Nullable<string>> {
  const userModel = await findOne<UserModel>(
    `SELECT name FROM users WHERE user_id = $1`,
    [userId],
  );

  return userModel ? userModel.name : null;
};
