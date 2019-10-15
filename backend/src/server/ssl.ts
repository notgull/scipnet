/*
 * server/ssl.ts
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

import { readFile } from "fs";
import { promisify } from "util";

import { config } from "app/config";

// load ssl certifications
export type SslCerts = {
  key: Buffer,
  cert: Buffer
};

const readFilePromise = promisify(fs.readFile);

// load SSL certifications
export async function getSslCerts(): Promise<SslCerts> { 
  return { key: await readFilePromise(config.get("ssl.keys.private")),
           cert: await readFilePromise(config.get("ssl.keys.public")) };
}

