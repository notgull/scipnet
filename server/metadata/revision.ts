/*
 * revision.ts
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

import * as fs from 'fs';
import * as uuidv4 from 'uuid/v4';
import * as path from 'path';

import { config } from 'app/config';
import { Nullable } from 'app/utils';
import { queryPromise as query } from 'app/sql';

// generate a good place for a diff link
function get_diff_link(article_id: number): string {
  const diff_dir = config.get('files.data.diff');
  var diff_col = path.join(diff_dir, String(article_id));

  if (!(fs.existsSync(diff_col)))
    fs.mkdirSync(diff_col, { recursive: true });

  return path.join(diff_col, uuidv4()) + ".patch";
}


// represents a revision made to a page by a user
export class Revision {
  article_id: number;
  user_id: number;
  diff_link: string;
  revision_id: number;
  created_at: Date;
  revision_number: number;
  tags: Array<string>;
  description: string;
  flags: string;
  title: string;

  constructor(article_id: number, user_id: number, description: string, tags: Array<string>, title: string, flags: string, diff_link: Nullable<string> = null) {
    this.article_id = article_id;
    this.user_id = user_id;
    this.diff_link = diff_link || get_diff_link(article_id);
    this.revision_id = -1;
    this.created_at = new Date();
    this.revision_number = -1;
    this.description = description;
    this.tags = tags;
    this.flags = flags;
    this.title = title;
  }

  // load revision by id
  static async load_by_id(revision_id: number): Promise<Nullable<Revision>> {
    let res = await query("SELECT * FROM Revisions WHERE revision_id = $1;", [revision_id]);
    if (res.rowCount === 0) return null;
    else res = res.rows[0];

    let revisionInst = new Revision(res.article_id, res.user_id, res.description, res.tags, res.title, res.flags, res.diff_link);
    revisionInst.created_at = res.created_at;
    revisionInst.revision_id = revision_id;
    return revisionInst;
  }

  // load array of revisions by the article
  static async load_array_by_article(article_id: number): Promise<Array<Revision>> {
    let res = await query("SELECT * FROM Revisions WHERE article_id = $1 ORDER BY created_at;", [article_id]);
    if (res.rowCount === 0) return [];
    else res = res.rows;

    let revisions = [];
    let row;
    for (var i = 0; i < res.length; i++) {
      row = res[i];

      let revisionInst = new Revision(article_id, row.user_id, row.description, row.tags, row.title, row.flags, row.diff_link);
      revisionInst.created_at = row.created_at;
      revisionInst.revision_id = row.revision_id;
      revisionInst.revision_number = i;
      revisions.push(revisionInst);
    }

    return revisions;
  }

  // submit revision to article
  // NOTE: this should not be run more than once
  async submit(): Promise<void> {
    let revision_id = await query("INSERT INTO Revisions (article_id, user_id, description, tags, title, flags, diff_link, created_at) VALUES ($1, $2, $3, $4::timestamp) RETURNING revision_id;", [this.article_id, this.user_id, this.description, this.tags, this.title, this.flags, this.diff_link, this.created_at]);
    if (revision_id.rowCount > 0)
      this.revision_id = revision_id.rows[0].revision_id;
  }
};
