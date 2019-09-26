/*
 * config.ts
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

import * as fs from 'fs';
import * as path from 'path';

export const CONFIG_DIR = path.join(process.cwd(), 'config');

export type Config = { [key: string]: any };

function loadConfig(directory: string): Config {
  const mainPath = path.join(directory, 'config.json');
  const overridePath = path.join(directory, 'override.json');

  function loadJson(filename: string): Config {
    const file = path.join(directory, filename);
    const data = fs.readFileSync(file);
    return JSON.parse(data);
  }

  const config = loadJson('config.json');
  Object.assign(config, loadJson('override.json'));
}

export const config = loadConfig(CONFIG_DIR);
