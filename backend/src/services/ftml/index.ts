/*
 * services/ftml/index.ts
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

import * as jayson from 'jayson/promise';
import * as path from 'path';

import { config } from 'app/config';
import { Nullable } from 'app/utils';

const client = jayson.Client.http({
  port: config.get('services.ftml.port'),
  host: config.get('services.ftml.host'),
});

interface PageInfo {
  title: string;
  alt_title: string;
  header: Nullable<string>;
  subheader: Nullable<string>;
  rating: number;
  tags: Array<string>;
};

export async function renderFtml(url: string, src: string, metadata: any): Promise<string> {
  let page_info: PageInfo = {
    title: metadata.title,
    alt_title: "",
    header: null,
    subheader: null,
    rating: metadata.get_rating(),
    tags: metadata.tags,
  };

  let response = await client.request("render", [page_info, src]);
  console.log("Received response: " + JSON.stringify(response));

  return response.result.html;
}
