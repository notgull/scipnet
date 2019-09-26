/*
 * metadata.ts
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

// metadata properties, add more if necessary

// url
// title
// rating (+ ratings from users)
// author
// revisions
// link to diffs of revisions
// tags
// editlock (y/n)
// link to discussion page
// list of attached files
// locked (y/n)
// parent page

import * as path from 'path';
import * as pg from 'pg';

import { config } from 'app/config';
import { ErrorCode } from 'app/errors';
import { Nullable } from 'app/utils';
import { getFormattedDate } from 'app/utils/date';
import { queryPromise as query } from 'app/sql';

import { rating } from 'app/metadata/rating';
import { revision } from 'app/metadata/revision';
import { author } from 'app/metadata/author';
import { parent_ } from 'app/metadata/parent';
import {
  editlock,
  add_editlock,
  remove_editlock,
  check_editlock,
} from 'app/metadata/editlock';

export {
  rating,
  revision,
  author,
  parent_,
  editlock,
  add_editlock,
  remove_editlock,
  check_editlock,
};

// define an asynchronous foreach loop
async function async_foreach(arr: Array<any>, iter: any): Promise<void> {
  //let promises = [];
  for (var i = 0; i < arr.length; i++) {
    await iter(arr[i]);
  }
  // await Promise.all(promises);  <- causing some issues ATM, fix later?
};

// metadata belonging to a particular page
export class metadata {
  article_id: number;
  slug: string;
  title: string;
  ratings: Array<rating>;
  authors: Array<author>;
  author: Nullable<author>;
  editlock: Nullable<editlock>;
  tags: Array<string>;
  revisions: Array<revision>;
  discuss_page_link: string;
  attached_files: Array<any>;
  locked_at: Nullable<Date>
  parents: Array<parent_>;

  constructor(slug: string) {
    this.article_id = -1;
    this.slug = slug;
    this.title = "";
    this.ratings = [];
    this.authors = [];
    this.author = null;
    this.editlock = null;
    this.tags = [];
    this.revisions = [];
    this.discuss_page_link = "";
    this.attached_files = [];
    this.locked_at = null;
    this.parents = [];
  }

  // get the composite rating of the article
  get_rating(): number {
    let rating = 0;
    for (let i = this.ratings.length - 1; i >= 0; i--)
      rating += Number(this.ratings[i].rate);
    return rating;
  }

  // load metadata from any sql source
  static async load_metadata_from_row(res: any): Promise<Nullable<metadata>> {
    let mObj = new metadata(res.slug);
    mObj.article_id = res.article_id;
    mObj.title = res.title;
    mObj.tags = res.tags;
    mObj.discuss_page_link = res.discuss_page_link;
    mObj.locked_at = res.locked_at;

    // get the editlock, if any
    let el = check_editlock(null, res.editlock_id);
    if (el) mObj.editlock = el;
    else {
      el = check_editlock(res.slug, null);
      if (el) mObj.editlock = el;
      else mObj.editlock = null;
    }

    // load ratings
    mObj.ratings = await rating.load_array_by_article(res.article_id);

    // load authors
    mObj.authors = await author.load_array_by_article(res.article_id);
    if (mObj.authors.length > 1) {
      mObj.author = null;
    } else {
      mObj.author = mObj.authors[0];
    }

    // load revisions
    mObj.revisions = await revision.load_array_by_article(res.article_id);

    // load parents
    mObj.parents = await parent_.load_array_by_child(res.article_id);

    // TODO: load files once we have that system up and running
    return mObj;
  }

  // load metadata by its slug
  static async load_by_slug(slug: string): Promise<Nullable<metadata>> {
    let res = await query("SELECT * FROM Pages WHERE slug=$1;", [slug]);
    if (res.rowCount === 0) return null;
    else res = res.rows[0];

    return await metadata.load_metadata_from_row(res);
  }

  static async load_by_id(article_id: number): Promise<Nullable<metadata>> {
    let res = await query("SELECT * FROM Pages WHERE article_id=$1;", [article_id]);
    if (res.row_count === 0) return null;
    else res = res.rows[0];

    return await metadata.load_metadata_from_row(res);
  }

  // save metadata to database
  async submit(save_dependencies: boolean = false): Promise<void> {
    console.log("Submitting metadata");

    let editlock: Nullable<string> = null;
    if (this.editlock)
      editlock = this.editlock.editlock_id;
    const upsert = "INSERT INTO Pages (slug, title, tags, editlock_id, discuss_page_link, locked_at) VALUES (" +
                 "$1, $2, $3, $4, $5, $6::timestamp) " +
	         "ON CONFLICT (slug) DO UPDATE SET slug=$1, title=$2, tags=$3, editlock_id=$4, discuss_page_link=$5, " +
                 "locked_at=$6::timestamp;";
    await query(upsert, [this.slug, this.title, this.tags, editlock, this.discuss_page_link, this.locked_at]);

    if (save_dependencies) {
      // save the dependencies
      async_foreach(this.ratings, async function(vote: rating) { await vote.submit(); });
      async_foreach(this.authors, async function(authorInst: author) { await authorInst.submit(); });
      //async_foreach(this.revisions, async function(revisionInst: revision) { await revisionInst.submit(); });
      async_foreach(this.parents, async function (parentInst: parent_) { await parentInst.submit(); });
    }

    let article_id = await query("SELECT article_id FROM Pages WHERE slug=$1;", [this.slug]);
    if (article_id.rowLength === 0) throw new Error("Unable to get user id after saving to database");
    else this.article_id = article_id.rows[0].article_id;
  }
};
