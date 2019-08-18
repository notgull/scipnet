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
var config = require('./../../config.json');
var diff = require('diff');
var fs = require('fs');
var metadata = require('./metadata');
var path = require('path');
var validate = require('./../user/validate');
// just create a raw revision - good for pages
var raw_revision = function (article_id, article_name, user_id) {
    var dataLoc = path.join(config.scp_cont_location, article_name);
    var data = fs.readFileSync(dataLoc) + "";
    var patch = diff.createPatch(dataLoc, "", data, "", "");
    var revision = new metadata.revision(article_id, user_id);
    fs.writeFileSync(revision.diff_link, patch);
    return revision;
};
// put more pages in this if we need them
module.exports = function (next) {
    // add system user
    validate.add_new_user("system", "noreply@scipnet.net", "**DONTLOGINTOTHISACCOUNT**", function (user_id, err) {
        if (err) {
            // failed to add user; already exists
            console.error("Failed to add user: already exists");
            return;
        }
        var _404 = new metadata.metadata("_404");
        _404.title = "404";
        _404.locked_at = new Date();
        // save the page to the database so that we have a page id to work with
        _404.submit().then(function () {
            var article_id = _404.article_id;
            var _404_author = new metadata.author(article_id, user_id, "author");
            var _404_revision = raw_revision(article_id, _404.slug, user_id);
            _404.authors.push(_404_author);
            _404.revisions.push(_404_revision);
            _404.submit(true).then(function () {
                // we also need the main page
                var mainpage = new metadata.metadata("main");
                mainpage.title = "";
                mainpage.locked_at = new Date();
                mainpage.submit().then(function () {
                    var article_id = mainpage.article_id;
                    var mainpage_author = new metadata.author(article_id, user_id, "author");
                    var mainpage_revision = raw_revision(article_id, mainpage.slug, user_id);
                    mainpage.authors.push(mainpage_author);
                    mainpage.revisions.push(mainpage_revision);
                    mainpage.submit(true).then(function () {
                        // done!
                        console.log("========== FINISHED AUTOCREATION ===========");
                        next(0);
                    }).catch(function (err) { throw err; });
                }).catch(function (err) { throw err; });
            }).catch(function (err) { throw err; });
        }).catch(function (err) { throw err; });
    });
};
