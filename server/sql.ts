/*
 * sql.ts
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

// exposes basic SQL functionality
import { Pool } from 'pg';
import * as path from 'path';

const config = require(path.join(process.cwd(), "config.json"));

const pool = new Pool({
  user: config.postgres_username,
  host: config.postgres_host,
  database: config.postgres_database,
  password: config.postgres_password,
}); // TODO: set up port?

export type CallbackFn = (err: any, res: any) => void;

export function query(sql: string, args: any, callback: CallbackFn): void {
  pool.query(sql, args, callback);
}

export async function queryPromise(sql: string, args: any): Promise<any> {
  return pool.query(sql, args);
}
