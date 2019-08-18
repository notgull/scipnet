/*
 * renderer.js
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
'use strict';

// this file renders html from markdown stored in data files
//var markdown = require('./markdown/markdown');
var config = require('./../../config.json');
var markdown = require('./ftml/markdown');
var metadata = require('./metadata/metadata');
//var nunjucks = require('nunjucks');
var fs = require('fs');
var path = require('path');

//nunjucks.configure('html', { autoescape: true });

var rating_mod_src = "[[module Rate]]";

exports.render_rating_module = async function(metadata) {
  // render a rating module
  return markdown.get_markdown("Rating Module", rating_mod_src, metadata);
};

exports.render = async function(modName, htmlFileName = '', title = 'Testing Page', loginInfo = false, metadata=null) {
  var template = fs.readFileSync('html/template.html');
  template = template + ''; // ensure template is a string
  const replacement_string = "[INSERT_CONTENT_HERE]";
 
  // get username, if it exists
  var username;
  var loginBar;
  if (loginInfo) {
    username = loginInfo;
    loginBar = fs.readFileSync('html/lbar_li.html');
  } else
    loginBar = fs.readFileSync('html/lbar_nli.html');

  var content;
  if (!htmlFileName || htmlFileName.length === 0) {
    //var markdown_tree = markdown(modName);
    //content = markdown_tree.flatten(username);
	 
    if (!metadata)
      throw new Error("Expected metadata");

    // test for existence first
    var filepath = path.join(config.scp_cont_location, modName);
    if (!fs.existsSync(filepath))
      return exports.render("_404", '', "404", loginInfo);
	
    var src = fs.readFileSync(filepath);
    content = markdown.get_markdown(modName, src, metadata);
  } else {
    content = '' + fs.readFileSync(htmlFileName);
  }

  const lb_replacement_string = "[INSERT_LOGINBAR_HERE]";

  const mt_replacement_string = "[INSERT_META_TITLE_HERE]";
  var meta_title;
  if (modName === "main") {
    meta_title = '';
    title = '';
  } else meta_title = title + " - ";

  const t_replacement_string = "[INSERT_TITLE_HERE]";
  const u_replacement_string = "[INSERT_USERNAME_HERE]";
  const ulv_replacement_string = "[INSERT_UL_VANISHING_HERE]";
  const r_replacement_string = "[INSERT_RATING_HERE]";
  const rr_replacement_string = "[INSERT_RATER_HERE]";

  var ulv_replacement = "";
  if (htmlFileName !== '' || modName === "_404")
    ulv_replacement = "display: none;"

  var rating = 0;
  var rater = "";
  if (metadata) {
    rating = metadata.get_rating();
    rater = await exports.render_rating_module(metadata);
  }

  //var replacements = {
  //
  //};
  
  var page = template.split(replacement_string).join(content);
  page = page.split(mt_replacement_string).join(meta_title);
  page = page.split(t_replacement_string).join(title);
  page = page.split(lb_replacement_string).join(loginBar);
  page = page.split(u_replacement_string).join(username);
  page = page.split(ulv_replacement_string).join(ulv_replacement);
  page = page.split(r_replacement_string).join(rating);
  page = page.split(rr_replacement_string).join(rater);

  return page;
}
