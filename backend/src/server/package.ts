/*
 * server/package.ts
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

import { populateApp as frontendPA } from "app/server/frontend";
import { populateApp as fontsImagesPA } from "app/server/fonts-and-images";
import { populateApp as loginPA } from "app/server/login";
import { populateApp as renderPA } from "app/services/render/handler";
import { populateApp as pagereqPA } from "app/services/pagereq/handler";
import { ScipnetJsonApp } from "app/server";

// create a server with all necessary functions
export function createServer(): ScipnetJsonApp {
  let app = new ScipnetJsonApp();
  frontendPA(app);
  fontsImagesPA(app);
  loginPA(app);
  renderPA(app);
  pagereqPA(app);
  return app;
}
