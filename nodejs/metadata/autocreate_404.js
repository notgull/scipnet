/*
 * autocreate_404.js
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

// automatically create the 404 and main pages
var metadata = require('./metadata');
var validate = require('./../user/validate');

// put more pages in this if we need them
module.exports = function(next) {
  // add system user
  validate.add_new_user("system", "noreply@scipnet.net", "**DONTLOGINTOTHISACCOUNT**", (user_id, err) => {
    if (err) {
      // failed to add user; already exists
      console.error("Failed to add user: already exists");
      return;
    }

    var _404 = new metadata.metadata("_404");
    _404.title = "404";
    _404.locked_at = new Date();

    // save the page to the database so that we have a page id to work with
    _404.submit().then(() => {
      var article_id = _404.article_id;
      var _404_author = new metadata.author(article_id, user_id, "author");
      var _404_revision = new metadata.revision(article_id, user_id, ""); // TODO: diff link

      _404.authors.push(_404_author);
      _404.revisions.push(_404_revision);

      _404.submit().then(() => {
        // we also need the main page
        var mainpage = new metadata.metadata("main");
        mainpage.title = "";
        mainpage.locked_at = new Date();

        mainpage.submit().then(() => {
          var article_id = mainpage.article_id;
          var mainpage_author = new metadata.author(article_id, user_id, "author");
          var mainpage_revision = new metadata.revision(article_id, user_id, ""); // TODO: diff link

          mainpage.authors.push(mainpage_author);
          mainpage.revisions.push(mainpage_revision);

          mainpage.submit().then(() => {
            // done!
            next(0);
          }).catch((err) => {throw err;});
        }).catch((err) => {throw err;});
      }).catch((err) => {throw err;});
    }).catch((err) => {throw err;});
  });
};
