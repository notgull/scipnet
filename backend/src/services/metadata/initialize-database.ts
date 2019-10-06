/*
 * services/metadata/initialize_database.ts
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

import { query } from 'app/sql';

// initialize the database for metadata storage
export function initialize_pages(next: (n: number) => any) {
  const metadata_table_sql = "CREATE TABLE IF NOT EXISTS Pages (" +
                         "article_id BIGSERIAL PRIMARY KEY," +
                         "slug TEXT NOT NULL UNIQUE," +
                         "title TEXT NOT NULL," +
                         "tags TEXT[]," +
                         "editlock_id TEXT," +
                         "discuss_page_link TEXT," +
                         "locked_at TIMESTAMP" +
                       ");";
  query(metadata_table_sql, [], (err: any, res: any) => {
    if (err) throw new Error(err);

    // also create the revision table
    const revision_table_sql = `
      CREATE SEQUENCE IF NOT EXISTS revisions_seq START 1 INCREMENT 1;

      CREATE TABLE IF NOT EXISTS Revisions (
        revision_id INTEGER PRIMARY KEY DEFAULT nextval('revisions_seq'),
        article_id INTEGER REFERENCES Pages(article_id),
        user_id INTEGER REFERENCES Users(user_id),
        git_commit TEXT NOT NULL UNIQUE,
        description TEXT,
        tags TEXT[],
        flags TEXT,
        title TEXT,
        created_at TIMESTAMP NOT NULL
      );
    `;
    query(revision_table_sql, [], (err: any, res: any) => {
      if (err) throw new Error(err);

      // also create the ratings table
      const rating_table_sql = "CREATE TABLE IF NOT EXISTS Ratings (" +
                           "article_id INTEGER REFERENCES Pages(article_id)," +
                           "user_id INTEGER REFERENCES Users(user_id)," +
                               "rating SMALLINT NOT NULL CHECK(abs(rating) <= 1)" +
                         ");";
      query(rating_table_sql, [], (err: any, res: any) => {
        if (err) throw new Error(err);

        const author_table_sql = "CREATE TABLE IF NOT EXISTS Authors (" +
                             "author_id BIGSERIAL PRIMARY KEY," +
                             "article_id INTEGER REFERENCES Pages(article_id)," +
                             "user_id INTEGER REFERENCES Users(user_id)," +
                             "author_type TEXT NOT NULL," +
                             "created_at TIMESTAMP NOT NULL" +
                           ");";
        query(author_table_sql, [], (err: any, res: any) => {
            if (err) throw new Error(err);

            const file_table_sql = "CREATE TABLE IF NOT EXISTS Files (" +
                             "file_id BIGSERIAL PRIMARY KEY," +
                             "article_id INTEGER REFERENCES Pages(article_id)," +
                             "description TEXT NOT NULL," +
                             "file_uri TEXT NOT NULL," +
                             "filename TEXT NOT NULL" +
                           ");";
            query(file_table_sql, [], (err: any, res: any) => {
              if (err) throw new Error(err);

              const parent_table_sql = "CREATE TABLE IF NOT EXISTS Parents (" +
                                 "article_id INTEGER REFERENCES Pages(article_id)," +
                                 "parent_article_id INTEGER REFERENCES Pages(article_id)" +
                               ");";
            query(parent_table_sql, [], (err, res) => {
                if (err) throw new Error(err);
              next(0);
            });
          });
        });
      });
    });
  });
}
