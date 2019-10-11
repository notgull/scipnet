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

import { promisify } from 'util';

import { config } from 'app/config';
import { ErrorCode } from 'app/errors';
import { Revision } from './revision';

import { Nullable } from 'app/utils';
import { revisionsService } from 'app/services/revisions';
import { User } from 'app/services/user';
import { Role } from 'app/services/user/role';

import { Author, Metadata } from 'app/services/metadata';

const readFilePromise = promisify(fs.readFile);

const contentDir = path.join(config.get('files.data.directory'), 'pages');

function copy_file(orig: string, dest: string) {
  fs.createReadStream(orig).pipe(fs.createWriteStream(dest));
}

// helper function- create role, throw on error
async function createRole(name: string, perms: Nullable<number>): Promise<Role> {
  let role = await Role.createNewRole(name, perms, true);
  if (!(role instanceof Role)) {
    throw new Error(`Error occured during role creation: ${role}`);
  }
  return role;
}

// an async way of going about this
async function autocreateAsync(): Promise<number> {
  // TODO: check for roles beforehand

  // create roles for system, admin, and for default users
  let systemRole = await createRole("system", ~0);
  let defaultRole = await createRole("default", null);
  let adminRole = await createRole("admin", ~0);
  Role.systemRole = systemRole;
  Role.defaultRole = defaultRole;
  Role.adminRole = adminRole;

  // create system user
  let systemUser = await User.createNewUser("system", "noreply@scipnet.net", "**DONTLOGINTOTHISACCOUNT**", systemRole, true);
  if (!(systemUser instanceof User)) {
    console.error("Failed to add system user: already exists");
    User.systemUser = await User.loadByUsername("system");
    return;
  }
  User.systemUser = systemUser;

  let systemUserId = systemUser.user_id;
  
  // create 404 page
  let _404 = new Metadata("_404");
  _404.title = "404";
  _404.locked_at = new Date();

  // copy source of default 404 to content dir
  let _404Source = (await readFilePromise(path.join(process.cwd(), "../templates/_404.ftml"))).toString();

  await _404.submit(); // submitted to get the id

  let articleId = _404.article_id;
  let _404Author = new Author(articleId, systemUserId, "author");
  let _404Revision = new Revision(articleId, systemUserId, "Created _404 page", [], "_404", "N");

  await revisionsService.commit(_404Revision, "_404", _404Source);
  
  _404.authors.push(_404Author);
  _404.revisions.push(_404Revision);

  await _404.submit(true);

  // create main page
  let main = new Metadata("main");
  main.title = "";
  main.locked_at = new Date();

  let mainSource = (await readFilePromise(path.join(process.cwd(), "../templates/main.ftml"))).toString();
  
  await main.submit();

  articleId = main.article_id;
  let mainAuthor = new Author(articleId, systemUserId, "author");
  let mainRevision = new Revision(articleId, systemUserId, "Created main page", [], "main", "N");
  await revisionsService.commit(mainRevision, "main", mainSource);

  main.authors.push(mainAuthor);
  main.revisions.push(mainRevision);
  await main.submit(true);

  return 0;
}

// put more pages in this if we need them
export function autocreate(next: (r: number) => any) {
  autocreateAsync().then(next).catch((err: Error) => { throw err; });
};
