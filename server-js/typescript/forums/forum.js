/*
 * forum.js
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
// manages forums
// first, the data structure
exports.post = function (user_id, contents) {
    if (!(this instanceof exports.post))
        return new exports.post(user_id, contents);
    this.user_id = user_id;
    this.contents = contents;
    this.title = "";
    this.replies = [];
    this.created_at = new Date();
};
var gen_board_id = function () {
};
var gen_thread_id = function () {
};
exports.thread = function () {
    if (!(this instanceof exports.thread))
        return new exports.thread();
};
