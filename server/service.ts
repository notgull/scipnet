/*
 * service.ts
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

// run certain modules as services
import { fork } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const module_root = 'dist/server';

// with the input of a module and a port, run a service
export function runservice(modname: string, port: number) {
  // get path of module
  let module_path = path.join(process.cwd(), module_root, modname);
  let module_service = path.join(module_path, "service.js");
  if (!(fs.existsSync(module_service))) {
    throw new Error("Service not found: " + modname);
  }

  fork(path.join(process.cwd(), "dist/server/service_wrapper.ts"), [module_service, String(port)]);
}
