/*
 * server/frontend.ts
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

// this file simply loads the frontend bundle script
import { config } from "app/config";
import { readFile } from "app/utils/promises";
import { ScipnetJsonApp, ScipnetInformation, ScipnetOutput } from "app/server";

export function populateApp(app: ScipnetJsonApp) {
  app.bundleHandle = async function(inf: ScipnetInformation, res: ScipnetOutput): Promise<any> {
    let script = await readFile(config.get("files.scripts.bundle"));
    res.type("application/javascript");
    res.send(script);
    return { success: true };
  };
}
