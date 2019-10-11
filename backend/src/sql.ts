/*
 * sql.ts
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

import { config } from 'app/config';
import { Nullable } from 'app/utils';

import { Pool } from 'pg';

import * as knex from 'knex';

export type SqlType =
  | string
  | number
  | Date
  | object
  ;

let pool: Nullable<Pool> = null;

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

function createPool() {
  const host = config.get('database.host');
  const user = config.get('database.username');
  const password = config.get('database.password');
  const database = config.get('database.name');
  const timeout = config.get('database.timeout');
  const maxThreads = config.get('database.max_threads');

  const url = `postgresql://${user}:${password}@${host}/${database}`;

  return new Pool({
    user,
    host,
    database,
    password,
    max: maxThreads,
    connectionTimeoutMillis: timeout,
    idleTimeoutMillis: timeout,
  });
}

export async function rawQuery(sql: string, params: SqlType[]): Promise<any> {
  if (pool == null) {
    pool = createPool();
  }

  return pool.query(sql, params);
}

export async function findOne<T>(sql: string, params: SqlType[]): Promise<Nullable<Partial<T>>> {
  const result = await rawQuery(sql, params);

  switch (result.rowCount) {
    case 0:
      return null;
    case 1:
      return result.rows[0];
    default:
      throw new DatabaseError('Primary key query returned multiple results');
  }
}

export async function findMany<T>(sql: string, params: SqlType[]): Promise<Array<Partial<T>>> {
  const result = await rawQuery(sql, params);
  return result.rows;
}

// deprecate
export const queryPromise = rawQuery;
