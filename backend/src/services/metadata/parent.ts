/*
 * services/metadata/parent.ts
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

import { Nullable } from 'app/utils';
import { rawQuery } from 'app/sql';

// represents an article's parent pages
export class Parent {
  child_id: number;
  parent_id: number;

  constructor(child_id: number, parent_id: number) {
    this.child_id = child_id;
    this.parent_id = parent_id;
  }

  // load by the ids of the child and parent
  static async loadById(childId: number, parentId: number): Promise<Nullable<Parent>> {
    const result = await rawQuery(`
        SELECT *
        FROM parents
        WHERE article_id = $1
        AND parent_article_id=$2
      `,
      [childId, parentId],
    );

    if (result.rowCount === 0) {
      return null;
    } else {
      return new Parent(childId, parentId);
    }
  }

  static async loadArrayByChild(childId: number): Promise<Array<Parent>> {
    const result = await rawQuery(
      `SELECT parent_page_id FROM parents WHERE page_id = $1`,
      [childId],
    );

    return result.rows.map(row => new Parent(childId, row.parent_page_id));
  }

  // submit a parent object to the database
  async submit(): Promise<void> {
    // TODO update properly
    // TODO use transaction
    await rawQuery(`
        DELETE FROM parents
          WHERE page_id = $1
          AND parent_page_id = $2
      `,
      [this.child_id, this.parent_id],
    );

    await rawQuery(
      `INSERT INTO parents (page_id, parent_page_id) VALUES ($1, $2)`,
      [this.child_id, this.parent_id],
    );
  }
}
