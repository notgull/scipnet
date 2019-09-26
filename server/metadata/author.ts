/*
 * author.ts
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

// represents an author, as there can be more than one per article
export class Author {
  article_id: number;
  user_id: number;
  author_type: string;
  created_at: Date;
  author_id: number;

  constructor(article_id: number, user_id: number, role: string) {
    this.article_id = article_id;
    this.user_id = user_id;
    this.author_type = role;
    this.created_at = new Date();
    this.author_id = -1;
  }

  // load an author by its author id
  static async load_by_id(author_id: number): Promise<Nullable<Author>> {
    let res = await query("SELECT * FROM Authors WHERE author_id=$1;", [author_id]);
    if (res.rowCount === 0) return null;
    else res = res.rows[0];

    let authorInst = new Author(res.article_id, res.user_id, res.author_type);
    authorInst.created_at = res.created_at;
    authorInst.author_id = res.author_id;
    return authorInst;
  }

  // load an array of authors by the article_id
  static async load_array_by_article(article_id: number): Promise<Array<Author>> {
    let res = await query("SELECT * FROM Authors WHERE article_id=$1;", [article_id]);
    if (res.rowCount === 0) return [];
    else res = res.rows;

    let authors = [];
    let row;
    for (row of res) {
      let authorInst = new Author(article_id, row.user_id, row.diff_link);
      authorInst.created_at = row.created_at;
      authorInst.author_id = row.author_id;
      authors.push(authorInst);
    }

    return authors;
  }

  // submit the author to the database
  async submit(): Promise<void> {
    await query("DELETE FROM Authors WHERE author_id = $1;", [this.author_id]);
    await query("INSERT INTO Authors (article_id, user_id, author_type, created_at) VALUES (" +
              "$1, $2, $3, $4);", [this.article_id, this.user_id, this.author_type, this.created_at]);
    this.author_id = await query("SELECT author_id FROM Authors WHERE article_id = $1 AND " +
                               "user_id = $2;", [this.article_id, this.user_id]);
  }
};
