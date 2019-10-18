/*
 * index.ts
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

import * as path from "path";

import { autocreate } from 'app/services/metadata/autocreate-404';
import { initialize_pages } from 'app/services/metadata/initialize-database';
import { initialize_users }  from 'app/services/user/initialize-database';

import { createServer } from "app/server/package";
import { config } from "app/config";
import { runService } from "app/service";

// get version
const version = require(path.join(process.cwd(), 'package.json')).version;
console.log(`SCPWiki v${version}`);

// load up the SQL before we start up
initialize_users((_o: any) => {
  initialize_pages((_o: any) => {
    autocreate((_o: any) => {});
  });
});


// check, then launch a service if the option is provided
if (process.argv.length > 2) {
  const modname = process.argv[2];
  runService(modname);
} else {
  // launch main server
  (async function() {
    const server = await createServer();
    console.log(`Launching main scipnet module`);
    server.runServer();
  })();
}
