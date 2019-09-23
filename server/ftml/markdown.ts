/*
 * markdown.ts
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

// ftml is now a port-based service

import * as jayson from 'jayson/promise';
import * as path from 'path';

import * as config from './../config';

const client = jayson.Client.http({
  port: config.ftml_port,
  host: config.ftml_ip
});

interface PageInfo {
  title: string;
  alt_title: string;
  header: any;
  subheader: any;
  rating: number;
  tags: Array<string>;
};

export async function get_markdown(url: string, src: string, metadata: any): Promise<string> {
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
