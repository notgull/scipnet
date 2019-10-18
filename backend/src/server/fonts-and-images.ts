/*
 * server/fonts-and-images.ts
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

import { readdir, readFile } from "app/utils/promises";
import { 
  ScipnetJsonApp, 
  ScipnetFunctionMap, 
  ScipnetInformation, 
  ScipnetOutput 
} from "app/server";

async function dynamicResourceLoad(dir: string, mimeType: string) {
  const fileList = await readdir(dir);
  
  const handles: ScipnetFunctionMap = {};
  for (const file of fileList) {
    handles[file] = async function(inf: ScipnetInformation, out: ScipnetOutput): Promise<any> {
      out.mime(mimeType); // TODO: this is a HORRIBLE idea. add dynamic MIME types at some point
      out.send(await readFile(path.join(dir, file)));
      return { success: true };
    }
  }

  return handles;
}

export async function populateApp(app: ScipnetJsonApp): Promise<void> { 
  app.fontHandles = await dynamicResourceLoad("../css", "text/css");
  app.imageHandles = await dynamicResourceLoad("../images", "image/png");
}
