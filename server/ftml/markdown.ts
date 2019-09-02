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

import * as ffi from 'ffi';
import * as path from 'path';

const ftml_path = path.join(process.cwd(), "rust/target/release/libscipnetrust.so");
const ftml = ffi.Library(ftml_path, {
  scipnet_transform: ['char *', ['char *', 'char *', 'int', 'char *', 'char *']]
});

function str_to_buffer(val: string): Buffer {
  var buffer = Buffer.from(val);
  var ending = Buffer.from([0x00]);
  return Buffer.concat([buffer, ending]);
}

export function get_markdown(url: string, src: string, metadata: any): string {
  //console.log("URL: " + url);
  //console.log("SRC: " + src);

  var url_buffer = str_to_buffer(url);
  var src_buffer = str_to_buffer(src);
  return ftml.scipnet_transform(url_buffer, src_buffer, metadata.get_rating(),
	                        str_to_buffer(metadata.title), str_to_buffer(metadata.tags.join(';'))).readCString();
}
