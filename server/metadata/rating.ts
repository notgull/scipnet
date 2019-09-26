/*
 * rating.ts
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

// represents a single upvote, downvote, or novote
export class Rating {
  user_id: number;
  article_id: number;
  rate: number;

  constructor(article_id: number, user_id: number, rate: number) {
    this.user_id = user_id;
    this.article_id = article_id;
    this.rate = rate;
  }

  // load the rating by the article and user
  static async load_by_article_and_user(article_id: number, user_id: number): Promise<Nullable<Rating>> {
    let res = await query("SELECT * FROM Ratings WHERE article_id = $1 AND user_id = $2;",
                          [article_id, user_id]);
    if (res.rowCount === 0) return null;
    else res = res.rows[0];

    let vote = new Rating(article_id, user_id, res.rating);
    return vote;
  }

  // load a list of ratings by the article id
  static async load_array_by_article(article_id: number): Promise<Array<Rating>> {
    let res = await query("SELECT * FROM Ratings WHERE article_id = $1;", [article_id]);
    if (res.rowCount === 0) return [];
    else res = res.rows;

    let ratings = [];
    let row;
    for (row of res) {
      let vote = new Rating(article_id, row.user_id, row.rating);
      ratings.push(vote);
    }

    return ratings;
  }

  // save rating to database
  async submit(): Promise<void> {
    let remove_query = "DELETE FROM Ratings WHERE article_id = $1 AND user_id = $2;";
    await query(remove_query, [this.article_id, this.user_id]);

    let insert_query = "INSERT INTO Ratings VALUES ($1, $2, $3);"
    await query(insert_query, [this.article_id, this.user_id, this.rate]);
  }
};
