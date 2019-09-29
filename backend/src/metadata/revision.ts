/*
 * revision.ts
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

import * as fs from 'fs';
import * as uuidv4 from 'uuid/v4';
import * as path from 'path';

import { config } from 'app/config';
import { Nullable } from 'app/utils';
import { queryPromise as query } from 'app/sql';

// represents a revision made to a page by a user
export class Revision {
  gitCommit: string;
  revisionId: number;
  createdAt: Date;
  articleRevisionId: number;

  constructor(
    public articleId: number,
    public userId: number,
    public description: string,
    public tags: Array<string>,
    public title: string,
    public flags: string,
  ) {
    this.gitCommit = '';
    this.revisionId = -1;
    this.createdAt = new Date();
  }

  // load revision by id
  static async loadById(revision_id: number): Promise<Nullable<Revision>> {
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
    const result = await query(
      "SELECT * FROM Revisions WHERE article_id = $1 ORDER BY created_at;",
      [article_id],
    );

    for (const row of result.rows) {
      let revision = new Revision(
        article_id,
        row.user_id,
        row.description,
        row.tags,
        row.title,
        row.flags,
      );

      revision.git_commit = row.git_commit;
      revision.created_at = row.created_at;
      revision.revision_id = row.revision_id;
      revision.article_revision_id = revisions.length;
      revisions.push(revision);
    }

    return revisions;
  }
};
