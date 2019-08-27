/*
 * superboard.ts
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

// a superboard, i.e. a category for multiple boards
import { queryPromise } from './../sql';
const query = queryPromise;

import { Nullable } from './../utils';
import * as uuid from 'uuid/v4';

export class Superboard {
  superboard_id: string;
  name: string;
  description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.superboard_id = "";
  }

  static async load_by_id(superboard_id: string): Promise<Nullable<Superboard>> {
    let res = await query("SELECT * FROM Superboards WHERE superboard_id = $1;", [superboard_id]);
    let row;

    if (res.rowCount === 0) return null;
    else row = res.rows[0];

    let superboard = new Superboard(row.name, row.description);
    superboard.superboard_id = superboard_id;
    return superboard;
  }

  // submit superboard to database
  async submit(): Promise<void> {
    if (this.superboard_id === "") this.superboard_id = uuid().replace('-', '');

    const upsert_query = "INSERT INTO Superboards VALUES ($1, $2, $3) " +
                         "ON CONFLICT (superboard_id) DO UPDATE SET " +
                         "name=$2, description=$3;";
    await query(upset_query, [this.superboard_id, this.name, this.description]);
  }
};
