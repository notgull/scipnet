/*
 * revisions/index.ts
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

import { promises as fs } from 'fs';

import AwaitLock from 'await-lock';
import * as pg from 'pg';
import * as simpleGit from 'simple-git/promise';
import { SimpleGit } from 'simple-git/promise';

import { config } from 'app/config';
import { queryPromise as query } from 'app/sql';
import { Revision } from 'app/metadata/revision';

export class RevisionsService {
  private git: SimpleGit;
  private lock: AwaitLock;

  constructor(directory: string) {
    this.git = simpleGit(directory);
    this.lock = new AwaitLock();
  }

  async commit(revision: Revision, filename: string, newData: string | Buffer): Promise<void> {
    await this.lock.acquireAsync();

    if (revision.gitCommit !== '') {
      throw new Error(`Revision object has gitCommit value: '${revision.gitCommit}'.`);
    }

    try {
      revision.revisionId = await query(`
        INSERT INTO Revisions
            (article_id, user_id, git_commit, description, tags, title, flags, created_at)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamp)
          RETURNING revision_id;
        `,
        [
          revision.articleId,
          revision.userId,
          revision.gitCommit,
          revision.description,
          revision.tags,
          revision.title,
          revision.flags,
          revision.createdAt,
        ],
      );

      await fs.writeFile(filename, newData);

      const message = JSON.stringify({
        article_id: revision.articleId,
        user_id: revision.userId,
        revision_id: revision.revisionId,
      });

      const commitSummary = await this.git.commit(message, filename);
      revision.gitCommit = commitSummary.commit;

      await query(`
        UPDATE Revisions
          SET git_commit = $1
          WHERE revision_id = $2;
        `,
        [revision.gitCommit, revision.revisionId],
      );
    } finally {
      this.lock.release();
    }
  }
}

export const revisionsService = new RevisionsService(config.get('files.data.diff'));
