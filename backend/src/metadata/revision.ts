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
  static async loadById(revisionId: number): Promise<Nullable<Revision>> {
    const result = await query(`
      SELECT
        article_id, user_id, git_commit, description, tags, flags, title, created_at
      FROM Revisions
      WHERE revision_id = $1;
    `, [revisionId]);

    if (result.rowCount === 0) {
      return null;
    }

    const {
      article_id,
      user_id,
      git_commit,
      description,
      tags,
      flags,
      title,
      created_at,
    } = result.rows[0];

    const revision = new Revision(article_id, user_id, description, tags, title, flags);
    revision.revisionId = revisionId;
    revision.gitCommit = git_commit;
    revision.createdAt = created_at;
    return revision;
  }

  // load array of revisions by the article
  static async load_array_by_article(article_id: number): Promise<Array<Revision>> {
    const result = await query(
      `SELECT * FROM Revisions WHERE article_id = $1 ORDER BY created_at;`,
      [article_id],
    );

    const revisions = [];
    for (const row of result.rows) {
      const {
        revision_id,
        article_id,
        user_id,
        git_commit,
        description,
        tags,
        flags,
        title,
        created_at,
      } = row;

      const revision = new Revision(article_id, user_id, description, tags, title, flags);
      revision.gitCommit = git_commit;
      revision.revisionId = revision_id;
      revision.createdAt = created_at;

      revisions.push(revision);
    }

    return revisions;
  }
};
