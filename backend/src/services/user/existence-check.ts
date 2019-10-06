/*
 * services/existence_check.ts
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

import { queryPromise as query } from 'app/sql';

// check to see if a username already exists
export async function checkUserExistence(user: string): Promise<boolean> {
  const check_user_sql = "SELECT username FROM Users WHERE username=$1;";
  let res = await query(check_user_sql, [user]);
  return res.rowCount !== 0;
};

// check to see if an email already exists
export async function checkEmailUsage(email: string): Promise<boolean> {
  const check_email_sql = "SELECT username FROM Users WHERE email=$1;";
  let res = await query(check_email_sql, [email]);
  return res.rowCount !== 0;
}
