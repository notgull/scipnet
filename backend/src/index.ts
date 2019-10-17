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

import * as fs from "fs";
import * as jayson from "jayson";
import * as path from "path";

import { autocreate } from 'app/services/metadata/autocreate-404';
import { initialize_pages } from 'app/services/metadata/initialize-database';
import { initialize_users }  from 'app/services/user/initialize-database';

import { createServer } from "app/server/package";
import { config } from "app/config";

// get version
const version = require(path.join(process.cwd(), 'package.json')).version;
console.log(`SCPWiki v${version}`);

// load up the SQL before we start up
initialize_users((_o: any) => {
  initialize_pages((_o: any) => {
    autocreate((_o: any) => {});
  });
});

// some process info
type ServiceInfo = { [key: string]: { host: any, port: any } };
const serviceInfo: ServiceInfo = {
  "pagereq": { host: config.get("services.pagereq.host"), port: config.get("services.pagereq.port") }
};

// check, then launch a service if the option is provided
if (process.argv.length > 2) {
  // tell if we have a module
  const modname = process.argv[2];
  const modulePath = path.join(process.cwd(), config.get("files.scripts.modroot"), modname);
  const moduleService = path.join(modulePath, "service.js");
  
  if (!(fs.existsSync(moduleService))) {
    console.error(`Error: Module ${modname} not found`);
    process.exit(1);
  }

  // get service variables
  const service = require(moduleService).service();
  const { host, port } = serviceInfo[modname]; 
  
  // run server
  const server = new jayson.Server(service);
  console.log(`Launching module ${modname}`);
  server.http().listen(port); // TODO: does host really matter?
} else {
  // launch main server
  const server = createServer();
  console.log(`Launching main scipnet module`);
  server.runServer();
}
