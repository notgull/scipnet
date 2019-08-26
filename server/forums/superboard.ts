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

export class Superboard {
  superboard_id: number;
  name: string;
  description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.superboard_id = -1;
  }

  static async load_by_id(superboard_id: number): Promise<Nullable<Superboard>> {
    let res = await query("SELECT * FROM Superboards WHERE superboard_id = $1;", [superboard_id]);
    let row;

    if (res.rowCount === 0) return null;
    else row = res.rows[0];

    let superboard = new Superboard(row.name, row.description);
    superboard.superboard_id = superboard_id;
    return superboard;
  }

  async submit(): Promise<void> {
    let old_id = this.superboard_id;
    const remove_query = "DELETE FROM Superboards WHERE superboard_id=$1;";
    const insert_query = "INSERT INTO Superboards (name, description) VALUES ($1, $2) " +
                         "RETURNING superboard_id;";
    await query(remove_query, [this.superboard_id]);

    let res = await query(insert_query, [this.name, this.description]);
    if (res.rowCount === 0) throw new Error("Unable to update row");
    else this.superboard_id = res.rows[0].superboard_id;

    const update_query = "UPDATE Boards SET superboard=$1 WHERE superboard=$2;";
    await query(update_query, [this.superboard_id, old_id]);
  }
};
