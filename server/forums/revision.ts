/*
 * revision.ts
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

// a revision that has been made to a post
import { queryPromise } from './../sql';
const query = queryPromise;

import { Nullable } from './../helpers';
import { Post } from './post';
import * as uuid from 'uuid/v4';

export class PostRevision {
  post_revision_id: number;
  post_id: number;
  author_id: number;
  title: string;
  content: string;
  created_at: Date;
  submitted: boolean;

  constructor(post_id: number, author_id: number, title: string, content: string, created_at: Nullable<Date> = null) {
    this.post_id = post_id;
    this.author_id = author_id;
    this.title = title;
    this.content = content;
    if (created_at)
      this.created_at = created_at;
    else
      this.created_at = new Date(); 
    this.submitted = false;
    this.post_revision_id = -1;
  }

  // load revision by its id
  static async load_by_id(post_revision_id: number): Promise<Nullable<PostRevision>> {
    let res = await query("SELECT * FROM PostRevisions WHERE post_revision_id = $1;", [post_revision_id]);
    let row;
    if (res.rowCount === 0) return null;
    else row = res.rows[0];

    let revision = new PostRevision(row.post_id, row.author_id, row.title, row.content, row.created_at);
    revision.post_revision_id = post_revision_id;
    return revision;
  }

  // load array of revisions by the post it belongs to
  static async load_array_by_post(post: Post | number): Promise<Array<PostRevision>> {
    let post_id;
    if (post instanceof Post) post_id = post.post_id;
    else post_id = post;

    let res = await query("SELECT * FROM PostRevisions WHERE post_id = $1;", [post_id]);
    let rows;
    if (res.rowCount === 0) return [];
    else rows = res.rows;

    let row: any;
    let revisions = [];
    let revision;
    for (row in rows) {
      revision = new PostRevision(post_id, row.author_id, row.title, row.content, row.created_at);
      revision.post_revision_id = row.post_revision_id;
      revisions.push(revision);
    }

    return revisions;
  }

  // submit revision to database
  // should only be called once
  async submit(): Promise<void> {
    if (this.submitted) throw new Error("Revision already submitted");

    this.post_revision_id = await query("INSERT INTO PostRevisions (post_id, author, title, content, created_at)" +
                                        "VALUES ($1, $2, $3, $4, $5) RETURNING post_revision_id;", 
                                        [this.post_id, this.author_id, this.title, this.content, this.created_at]);
    this.submitted = true;
  }
};
