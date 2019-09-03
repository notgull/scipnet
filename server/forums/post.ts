/*
 * post.ts
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

// a single post in a comment thread
import { queryPromise } from './../sql';
const query = queryPromise;

import { Nullable } from './../helpers';
import { Thread } from './thread';
import * as uuid from 'uuid/v4';

export class Post {
  post_id: string;
  author_id: number;
  thread_id: string;
  reply_to: string;
  title: string;
  content: string;
  replies: Array<Post>;
  created_at: Date;
  submitted: boolean;

  constructor(author_id: number, thread_id: string, title: string, content: string, reply_to: string, created_at: Nullable<Date> = null) {
    this.author_id = author_id;
    this.thread_id = thread_id; 	  
    this.title = title;
    this.content = content;
    this.replies = [];
    this.reply_to = reply_to;
    if (created_at === null)
      this.created_at = new Date();
    else
      this.created_at = created_at;
    this.post_id = "";
    this.submitted = false;
  }

  // load by id
  static async load_by_id(post_id: string): Promise<Nullable<Post>> {
    let res = await query("SELECT * FROM Posts WHERE post_id = $1;", [post_id]);
    let row;
    if (res.rowCount === 0) return null;
    else row = res.rows[0];  

    let post = new Post(row.author, row.thread, row.title, row.content, row.reply_to, row.created_at);
    post.post_id = post_id;
    return post;
  }

  const REALLY_HIGH_NUMBER = 1000000;

  // load array by thread
  static async load_array_by_thread(thread: Thread | string,
                                    limit: number = REALLY_HIGH_NUMBER,
				    pagenum: number = 0): Promise<Array<Post>> {
    let thread_id;
    if (thread instanceof Thread) thread_id = thread.thread_id;
    else {
      thread_id = thread;
    }

    const offset = limit * pagenum;

    let res = await query("SELECT * FROM Posts WHERE thread = $1 OFFSET $1 LIMIT $2;", 
                          [thread_id, offset, limit]);
    let rows;
    if (res.rowCount === 0) return [];
    else rows = res.rows;

    let row: any;
    let post;
    let posts = [];
    for (row in rows) {
      post = new Post(row.author, row.thread, row.title, row.content, row.reply_to, row.created_at);
      post.post_id = row.post_id;
      posts.push(post);
    }

    return posts;
  }

  // submit to database
  // NOTE: this should only be called once in a prod context
  async submit(): Promise<void> {
    if (this.submitted) throw new Error("Post has already been submitted");
    if (this.post_id === "") this.post_id = uuid().replace('-', '');

    const insert_query = "INSERT INTO Posts VALUES ($1, $2, $3, $4, $5, $6, $7);";
    await query(insert_query, [this.post_id, this.author_id, this.thread_id, this.title, 
                               this.content, this.reply_to, this.created_at]);

    this.submitted = true;
  }
};
