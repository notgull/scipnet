/*
 * autocreate_404.js
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

import { promisify } from 'util';

import { config } from 'app/config';
import { ErrorCode } from 'app/errors';
import { Revision } from './revision';
import { revisionsService } from 'app/revisions';
import { User } from 'app/user';
import { Role } from 'app/user/role';

import * as metadata from 'app/metadata';

const contentDir = config.get('files.data.content');
const readFilePromise = promisify(fs.readFile);

function copy_file(orig: string, dest: string) {
  fs.createReadStream(orig).pipe(fs.createWriteStream(dest));
}

// an async way of going about this
async function autocreateAsync(): Promise<number> {
  // TODO: check for roles beforehand

  // create roles for system, admin, and for default users
  let systemRole = await Role.createNewRole("system", ~0, true);
  let defaultRole = await Role.createNewRole("default", null, true);
  let adminRole = await Role.createNewRole("admin", ~0, true);
  Role.systemRole = systemRole;
  Role.defaultRole = defaultRole;
  Role.adminRole = adminRole;

  // create system user
  let systemUser = await User.createNewUser("system", "noreply@scipnet.net", "**DONTLOGINTOTHISACCOUNT**", true);
  if (!(user instanceof User)) {
    console.error("Failed to add system user: already exists");
    User.systemUser = await User.loadByUsername("system");
    return;
  }
  User.systemUser = systemUser;

  let systemUserId = systemUser.user_id;
  
  // create 404 page
  let _404 = new metadata.Metadata("_404");
  _404.title = "404";
  _404.locked_at = new Date();

  // copy source of default 404 to content dir
  let _404Source = await readFilePromise(path.join(process.cwd(), "../templates/_404.ftml")).toString();

  await _404.submit();

  let articleId = _404.article_id;
  let _404Author = new metadata.Author(articleId, systemUserId, "author");
  let _404Revision = new Revision(article_id, user_id, "Created _404 page", [], "_404", "N");

  revisionService.commit(_404Revision, path.join(contentDir,
  
  _404.authors.push(_404Author);
  _404.revisions.push(_404Revision);

  await _404.submit(true);

  // create main page
  let main = new metadata.Metadata("_404");
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

    let _404 = new metadata.Metadata("_404");
    _404.title = "404";
    _404.locked_at = new Date();

    // copy source of default 404 to content dir
    copy_file(path.join(process.cwd(), "../templates/_404.ftml"), path.join(contentDir, '_404'));

    // save the page to the database so that we have a page id to work with
    _404.submit().then(() => {
      let article_id = _404.article_id;
      let _404_author = new metadata.Author(article_id, user_id, "author");
      let _404_revision = new Revision(article_id, user_id, 'Creating _404 page', [], '_404', 'N');

      _404.authors.push(_404_author);
      _404.revisions.push(_404_revision);

      _404.submit(true).then(() => {
        // we also need the main page
        let mainpage = new metadata.Metadata("main");
        mainpage.title = "";
        mainpage.locked_at = new Date();

        copy_file(path.join(process.cwd(), "../templates/main.ftml"), path.join(contentDir, 'main'));
        mainpage.submit().then(() => {
          let article_id = mainpage.article_id;
          let mainpage_author = new metadata.Author(article_id, user_id, "author");
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
