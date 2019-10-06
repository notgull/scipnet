/*
 * services/metadata/autocreate_404.js
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

import * as diff from 'diff';
import * as fs from 'fs';
import * as path from 'path';

import { config } from 'app/config';
import { ErrorCode } from 'app/errors';
import { Revision } from './revision';
import { revisionsService } from 'app/services/revisions';
import { User } from 'app/services/user';

import { Author, Metadata } from 'app/services/metadata';

const contentDir = path.join(config.get('files.data.directory'), 'pages');

function copy_file(orig: string, dest: string) {
  fs.createReadStream(orig).pipe(fs.createWriteStream(dest));
}

// put more pages in this if we need them
export function autocreate(next: (r: number) => any) {
  // add system user
  User.createNewUser("system", "noreply@scipnet.net", "**DONTLOGINTOTHISACCOUNT**", true)
    .then((user: ErrorCode | User) => {
    if (!(user instanceof User)) {
      // failed to add user; already exists
      console.error("Failed to add system user: already exists");
      return;
    }

    let user_id = user.user_id;

    let _404 = new Metadata("_404");
    _404.title = "404";
    _404.locked_at = new Date();

    // copy source of default 404 to content dir
    copy_file(path.join(process.cwd(), "../templates/_404.ftml"), path.join(contentDir, '_404'));

    // save the page to the database so that we have a page id to work with
    _404.submit().then(() => {
      let article_id = _404.article_id;
      let _404_author = new Author(article_id, user_id, "author");
      let _404_revision = new Revision(article_id, user_id, 'Creating _404 page', [], '_404', 'N');

      _404.authors.push(_404_author);
      _404.revisions.push(_404_revision);

      _404.submit(true).then(() => {
        // we also need the main page
        let mainpage = new Metadata("main");
        mainpage.title = "";
        mainpage.locked_at = new Date();

        copy_file(path.join(process.cwd(), "../templates/main.ftml"), path.join(contentDir, 'main'));
        mainpage.submit().then(() => {
          let article_id = mainpage.article_id;
          let mainpage_author = new Author(article_id, user_id, "author");
          let mainpage_revision = new Revision(article_id, user_id, 'Creating main page', [], 'main', 'N');

          mainpage.authors.push(mainpage_author);
          mainpage.revisions.push(mainpage_revision);

          mainpage.submit(true).then(() => {
            // done!
          console.log("========== FINISHED AUTOCREATION ===========");
            next(0);
          }).catch((err) => {throw err;});
        }).catch((err) => {throw err;});
      }).catch((err) => {throw err;});
    }).catch((err) => {throw err;});
  });
};
