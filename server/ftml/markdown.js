/*
 * markdown.js
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

var ffi = require('ffi');
var path = require('path');

var ftml_path = path.join(__dirname, "./../../rust/target/release/libscipnetrust.so");
var ftml = ffi.Library(ftml_path, {
  scipnet_transform: ['char *', ['char *', 'char *', 'int', 'char *', 'char *']]
});

var str_to_buffer = function(val) {
  var buffer = Buffer.from(val);
  var ending = Buffer.from([0x00]);
  return Buffer.concat([buffer, ending]);
}

exports.get_markdown = function(url, src, metadata) {
  //console.log("URL: " + url);
  //console.log("SRC: " + src);

  var url_buffer = str_to_buffer(url);
  var src_buffer = str_to_buffer(src);
  return ftml.scipnet_transform(url_buffer, src_buffer, metadata.get_rating(),
	                        str_to_buffer(metadata.title), str_to_buffer(metadata.tags.join(';'))).readCString();
}
