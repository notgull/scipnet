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

import { readFile } from "fs";
import { promisify } from "util";

import { ScipnetJsonApp, ScipnetFunctionMap, ScipnetInformation, ScipnetOutput } from 'app/server';

const readFilePromise = promisify(readFile);

export function populateApp(app: ScipnetJsonApp) {
  let fonts = [
    "font-bauhaus.css",
    "itc-bauhaus-lt-demi.ttf",
    "itc-bauhaus-lt-demi.eot"
  ];
  
  let fontHandles: ScipnetFunctionMap = {};
  for (const font of fonts) {
    fontHandles[font] = async function(inf: ScipnetInformation, out: ScipnetOutput): Promise<any> {
      out.type("text/css");
      out.send(await readFilePromise(`../css/${font}`));
      return { success: true };
    };
  }
  app.fontHandles = fontHandles;

  let images = [
    "background.png"
  ];
  let imageHandles: ScipnetFunctionMap = {};
  for (const image of images) {
    imageHandles[image] = async function(inf: ScipnetInformation, out: ScipnetOutput): Promise<any> {
      out.type("image/png");
      out.send(await readFilePromise(`../images/${image}`));
      return { success: true };
    };
  }
  app.imageHandles = imageHandles;  
}