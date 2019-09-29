/*
 * parent.ts
 *
 * scipnet - SCP Hosting Platform
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

import { Nullable } from 'app/utils';
import { queryPromise as query } from 'app/sql';

// represents an article's parent pages
export class Parent {
  child_id: number;
  parent_id: number;

  constructor(child_id: number, parent_id: number) {
    this.child_id = child_id;
    this.parent_id = parent_id;
  }

  // load by the ids of the child and parent
  static async load_by_id(child_id: number, parent_id: number): Promise<Nullable<Parent>> {
    let res = await query("SELECT * FROM Parents WHERE article_id=$1 AND parent_article_id=$2",
                          [child_id, parent_id]);
    if (res.rowCount === 0) return null;

    let par = new Parent(child_id, parent_id);
    return par;
  }

  // load by the ids of the child
  static async load_array_by_child(child_id: number): Promise<Array<Parent>> {
    let res = await query("SELECT parent_article_id FROM Parents WHERE article_id=$1", [child_id]);
    if (res.rowCount === 0) return [];
    else res = res.rows;

    let parents = [];
    let row;
    for (row of res) {
      let parentInst = new Parent(child_id, row.parent_article_id);
      parents.push(parentInst);
    }

    return parents;
  }

  // submit a parent object to the database
  async submit(): Promise<void> {
    const remove_query = "DELETE FROM Parents WHERE article_id=$1 AND parent_article_id=$2;";
    const insert_query = "INSERT INTO Parents VALUES ($1, $2);";
    await query(remove_query, [this.child_id, this.parent_id]);
    await query(insert_query, [this.child_id, this.parent_id]);
  }
};
