/*
 * services/metadata/rating.ts
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
import { rawQuery } from 'app/sql';

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
  static async load_by_article_and_user(articleId: number, userId: number): Promise<Nullable<Rating>> {
    const result = await rawQuery(
      `SELECT * FROM Ratings WHERE article_id = $1 AND user_id = $2`,
      [articleId, userId],
    );

    if (result.rowCount === 0) {
      return null;
    } else {
      return new Rating(articleId, userId, result.rows[0].rating);
    }
  }

  // load a list of ratings by the article id
  static async load_array_by_article(articleId: number): Promise<Array<Rating>> {
    const result = await rawQuery(
      `SELECT * FROM Ratings WHERE article_id = $1`,
      [articleId],
    );

    return result.rows.map(row => new Rating(articleId, row.user_id, row.rating));
  }

  // save rating to database
  async submit(): Promise<void> {
    await rawQuery(
      `DELETE FROM Ratings WHERE article_id = $1 AND user_id = $2`,
      [this.article_id, this.user_id],
    );

    await rawQuery(
      `INSERT INTO Ratings VALUES ($1, $2, $3)`,
      [this.article_id, this.user_id, this.rate],
    );
  }
};
