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

import frontendPA from "app/server/frontend";
import fontsImagesPA from "app/server/fonts-and-images";
import loginPA from "app/server/login";
import renderPA from "app/services/render/handler";
import pagereqPA from "app/services/pagereq/handler";
import { ScipnetJsonApp } from "app/server";

// create a server with all necessary functions
export async function createServer(): Promise<ScipnetJsonApp> {
  let app = new ScipnetJsonApp();
  frontendPA(app);
  await fontsImagesPA(app);
  loginPA(app);
  renderPA(app);
  pagereqPA(app);
  return app;
}
