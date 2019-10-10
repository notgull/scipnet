/*
 * services/database/index.ts
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

import * as knex from 'knex';

function createDatabase() {
  const host = config.get('database.host');
  const user = config.get('database.username');
  const password = config.get('database.password');
  const database = config.get('database.name');
  const version = config.get('database.version');
  const maxThreadPool = config.get('database.max_threads');
  const debug = config.get('database.debug');

  const url = `postgresql://${user}:${password}@${host}/${database}`;

  return knex({
    client: 'postgresql',
    version,
    connection: {
      host,
      user,
      password,
      database,
    },
    pool: {
      min: 0,
      max: maxThreadPool,
    },
    debug,
  });
}

let handle: Nullable<knex> = null;

export function db(): knex {
  if (handle === null) {
    handle = createDatabase();
  }

  return handle;
}
