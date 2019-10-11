/*
 * services/user/author.ts
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
import { queryPromise as query, findMany } from 'app/sql';
import { AuthorsModel } from 'app/sql/models';

export type AuthorType =
  | 'author'
  | 'rewrite'
  | 'translator'
  | 'maintainer'
  ;

// Represents an author, or a particular contributor to a page.
// This is distinct from a user, who is just an account.
// Multiple authors may be associated with a page (e.g. translator, co-author),
// and a user may be associated multiple times (e.g. original author, rewriter).
export class Author {
  constructor(
    public pageId: number,
    public userId: number,
    public authorType: AuthorType,
    public createdAt: Date,
  ) {}

  static async loadAuthorsByPage(pageId: number): Promise<Array<Author>> {
    const authorModels = await findMany<AuthorsModel>(`
        SELECT user_id, author_type, created_at
        FROM authors
        WHERE page_id = $1
        ORDER BY created_at ASC
      `,
      [pageId],
    );

    return authorModels.map(({
        user_id: userId,
        author_type: authorType,
        created_at: createdAt,
      }) => new Author(pageId, userId, authorType as AuthorType, createdAt),
    );
  }

  // submit the author to the database
  async submit(): Promise<void> {
    await query("INSERT INTO Authors (article_id, user_id, author_type, created_at) VALUES (" +
              "$1, $2, $3, $4);", [this.pageId, this.userId, this.authorType, this.createdAt]);
  }
};
