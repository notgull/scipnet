*
 * initialize_database.ts
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

// create the necessary data structures for the forums

import { queryPromise } from './../sql';
const query = queryPromise;

async function initialize_forums_async(): Promise<number> {
  const superboard_table_sql = "CREATE TABLE IF NOT EXISTS Superboards (" +
                                 "superboard_id TEXT PRIMARY KEY," +
                                 "name TEXT NOT NULL UNIQUE," +
                                 "description TEXT NOT NULL" +
                               ");";
  const board_table_sql = "CREATE TABLE IF NOT EXISTS Boards (" +
                            "board_id TEXT PRIMARY KEY," +
                            "name TEXT NOT NULL UNIQUE," +
			    "description TEXT NOT NULL," +
			    "superboard string REFERENCES Superboards(superboard_id)" +
			  ");";
  const thread_table_sql = "CREATE TABLE IF NOT EXISTS Threads (" +
                             "thread_id TEXT PRIMARY KEY," +
                             "author INTEGER REFERENCES Users(user_id)," +
			     "board string REFERENCES Boards(board_id)," +
                             "name TEXT NOT NULL," +
			     "description TEXT NOT NULL," +
			     "created_at TIMESTAMP NOT NULL" +
                           ");";
  const post_table_sql = "CREATE TABLE IF NOT EXISTS Posts (" +
                           "post_id TEXT PRIMARY KEY," +
                           "author INTEGER REFERENCES Users(user_id)," +
			   "thread TEXT REFERENCES Threads(thread_id)," +
                           "title TEXT," +
                           "content TEXT," +
                           "reply_to string REFERENCES Posts(post_id)," +
                           "created_at TIMESTAMP NOT NULL" +
                         ");";
  const revision_table_sql = "CREATE TABLE IF NOT EXISTS PostRevisions (" +
                               "post_revision_id BIGSERAL PRIMARY KEY," +
                               "post_id TEXT REFERENCES Posts(post_id)," + 
                               "author INTEGER REFERENCES Users(user_id)," +
                               "content TEXT," +
                               "created_at TIMESTAMP NOT NULL" +
                             ");";

  await query(superboard_table_sql, []);
  await query(board_table_sql, []);
  await query(thread_table_sql, []);
  await query(post_table_sql, []);
  await query(revision_table_sql, []);

  return 0;
}

export function initialize_forums(next: (n: number) => any) {
  initialize_forums_async().then(next).catch((err) => { throw err; });
}
