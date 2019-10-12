/*
 * config.ts
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

import * as fs from 'fs';
import * as path from 'path';

export const CONFIG_DIR = path.join(process.cwd(), 'config');

type RawConfig = { [key: string]: any };

export type ConfigKey =
  | 'files.data.directory'
  | 'database.username'
  | 'database.password'
  | 'database.name'
  | 'database.host'
  | 'database.timeout'
  | 'database.max_threads'
  | 'auth.salt_length'
  | 'auth.iterations'
  | 'auth.key_length'
  | 'auth.digest'
  | 'services.scipnet.port'
  | 'services.ftml.host'
  | 'services.ftml.port'
  | 'services.pagereq.host'
  | 'services.pagereq.port'
  | 'ui.editor.lock_timeout';

function loadJson(file: string, optional: boolean = false): RawConfig {
  try {
    const buf = fs.readFileSync(file);
    return JSON.parse(buf.toString());
  } catch (err) {
    if (!optional) {
      throw err;
    }

    return {};
  }
}

export class Config {
  private data: RawConfig;

  constructor(directory: string) {
    const mainPath = path.join(directory, 'config.json');
    const overridePath = path.join(directory, 'override.json');

    this.data = loadJson(mainPath);
    Object.assign(this.data, loadJson(overridePath, true));
  }

  public get(key: ConfigKey): any {
    const value = this.data[key];
    if (value === undefined) {
      throw new Error(`No such configuration key: '${key}'.`);
    }

    return value;
  }
}

export const config = new Config(CONFIG_DIR);
