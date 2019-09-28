/*
 * renderer.ts
 *
 * scipnet - SCP Hosting Platform
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

// this file renders html from markdown stored in data files

import * as fs from 'fs';
import * as path from 'path';
import * as nunjucks from 'nunjucks';

import { renderFtml } from 'app/ftml';
import * as md from 'app/metadata';

// nunjucks environment
const templates_folder = path.join(process.cwd(), "templates");
let env = new nunjucks.Environment(new nunjucks.FileSystemLoader(templates_folder), {
  autoescape: false,
});

import { config } from 'app/config';

const contentDir = config.get('files.data.content');
const rating_mod_src = "[[=]]\n[[module Rate]]\n[[/=]]";

export async function render_rating_module(metadata: any): Promise<string> {
  // render a rating module
  return renderFtml("Rating Module", rating_mod_src, metadata);
};

// add a filter used for rendering usernames
env.addFilter("usermodule", function(str: string, add_pfp: boolean = false) {
  // TODO: process username and create a username module
  return str;
});

export async function render(
  modName: string,
  htmlFileName: string = '',
  title: string = 'Testing Page',
  loginInfo: any = false,
  metadata: any = null,
): Promise<string> {
  const replacement_string = "[INSERT_CONTENT_HERE]";
  console.log("S-RENDERING: " + modName);

  // get username, if it exists
  let username;
  let loginBar;
  if (loginInfo) {
    username = loginInfo;
    loginBar = fs.readFileSync(path.join(process.cwd(), 'templates/lbar_li.html')).toString();
  } else {
    loginBar = fs.readFileSync(path.join(process.cwd(), 'templates/lbar_nli.html')).toString();
  }

  let content;
  if (!htmlFileName || htmlFileName.length === 0) {
    if (!metadata) {
      return render("_404", '', title, loginInfo, await md.Metadata.load_by_slug('_404'));
    }

    // test for existence first
    let filepath = path.join(contentDir, modName); // new change: using folder w/ modname
    if (!fs.existsSync(filepath)) {
      return render("_404", '', title, loginInfo, await md.Metadata.load_by_slug('_404'));
    }

    let src = fs.readFileSync(filepath) + "";
    content = await renderFtml(modName, src, metadata);
  } else {
    content = '' + fs.readFileSync(htmlFileName);
  }

  const lb_replacement_string = "[INSERT_LOGINBAR_HERE]";

  const mt_replacement_string = "[INSERT_META_TITLE_HERE]";
  let meta_title;
  if (modName === "main") {
    meta_title = '';
    title = '';
  } else {
    meta_title = `${title} - `;
  }

  const t_replacement_string = "[INSERT_TITLE_HERE]";
  const u_replacement_string = "[INSERT_USERNAME_HERE]";
  const ulv_replacement_string = "[INSERT_UL_VANISHING_HERE]";
  const r_replacement_string = "[INSERT_RATING_HERE]";
  const rr_replacement_string = "[INSERT_RATER_HERE]";

  let ulv_replacement = "";
  if (htmlFileName !== '' || modName === "_404") {
    ulv_replacement = "display: none;"
  }

  let rating = 0;
  let rater = "";
  if (metadata) {
    rating = metadata.get_rating();
  }

  const first_stage_replacements = {
    ftml_content: content,
    ul_vanishing: ulv_replacement,
    meta_title: meta_title,
    title: title,
    page_rating: rating,
    login_bar: loginBar,
  };

  const second_stage_replacements = { username };

  let page = env.render("template.html", first_stage_replacements);
  page = env.renderString(page, second_stage_replacements);

  return page;
}
