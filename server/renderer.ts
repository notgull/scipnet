/*
 * renderer.ts
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

// this file renders html from markdown stored in data files
import { get_markdown } from './ftml/markdown';
import * as md from './metadata/metadata';
import * as nunjucks from 'nunjucks';
import * as fs from 'fs';
import * as path from 'path';

// nunjucks environment
const templates_folder = path.join(process.cwd(), "templates");
let env = new nunjucks.Environment(new nunjucks.FileSystemLoader(templates_folder), {
  autoescape: false,
});

import * as config from './config';

//nunjucks.configure('../../html', { autoescape: true });

const rating_mod_src = "[[=]]\n[[module Rate]]\n[[/=]]";

export async function render_rating_module(metadata: any): Promise<string> {
  // render a rating module
  return get_markdown("Rating Module", rating_mod_src, metadata);
};

// add a filter used for rendering usernames
env.addFilter("usermodule", function(str: string, add_pfp: boolean = false) {
  // TODO: process username and create a username module
  return str;
});

export async function render(modName: string, 
                             htmlFileName: string = '', 
			     title: string = 'Testing Page', 
			     loginInfo: any = false, 
			     metadata: any = null): Promise<string> {
  //let template = '' + fs.readFileSync(path.join(process.cwd(), 'html/template.html')); 
  const replacement_string = "[INSERT_CONTENT_HERE]";
  console.log("S-RENDERING: " + modName);
 
  // get username, if it exists
  let username;
  let loginBar;
  if (loginInfo) {
    username = loginInfo;
    loginBar = fs.readFileSync(path.join(process.cwd(), 'templates/lbar_li.html')) + "";
  } else
    loginBar = fs.readFileSync(path.join(process.cwd(), 'templates/lbar_nli.html')) + "";

  let content;
  if (!htmlFileName || htmlFileName.length === 0) {
    //var markdown_tree = markdown(modName);
    //content = markdown_tree.flatten(username);
	 
    if (!metadata)
      return await exports.render("_404", '', title, loginInfo, await md.metadata.load_by_slug('_404'));

    // test for existence first
    let filepath = path.join(config.scp_cont_location, modName);
    if (!fs.existsSync(filepath)) {
      return await exports.render("_404", '', title, loginInfo, await md.metadata.load_by_slug('_404'));
    }
	
    let src = fs.readFileSync(filepath) + "";
    content = await get_markdown(modName, src, metadata);
  } else {
    content = '' + fs.readFileSync(htmlFileName);
  }

  const lb_replacement_string = "[INSERT_LOGINBAR_HERE]";

  const mt_replacement_string = "[INSERT_META_TITLE_HERE]";
  let meta_title;
  if (modName === "main") {
    meta_title = '';
    title = '';
  } else meta_title = title + " - ";

  const t_replacement_string = "[INSERT_TITLE_HERE]";
  const u_replacement_string = "[INSERT_USERNAME_HERE]";
  const ulv_replacement_string = "[INSERT_UL_VANISHING_HERE]";
  const r_replacement_string = "[INSERT_RATING_HERE]";
  const rr_replacement_string = "[INSERT_RATER_HERE]";

  let ulv_replacement = "";
  if (htmlFileName !== '' || modName === "_404")
    ulv_replacement = "display: none;"

  let rating = 0;
  let rater = "";
  if (metadata) {
    rating = metadata.get_rating();
    //rater = await exports.render_rating_module(metadata);
  }

  const first_stage_replacements = {
    ftml_content: content,
    ul_vanishing: ulv_replacement,
    meta_title: meta_title,
    title: title,
    page_rating: rating,
    login_bar: loginBar
  };

  const second_stage_replacements = {
    username: username
  };
  
  /*let page = template.split(replacement_string).join(content) + "";
  page = page.split(mt_replacement_string).join(meta_title);
  page = page.split(t_replacement_string).join(title);
  page = page.split(lb_replacement_string).join(loginBar);
  page = page.split(u_replacement_string).join(username);
  page = page.split(ulv_replacement_string).join(ulv_replacement);
  page = page.split(r_replacement_string).join(String(rating));
  page = page.split(rr_replacement_string).join(rater);*/

  let page = env.render("template.html", first_stage_replacements);
  page = env.renderString(page, second_stage_replacements);

  return page;
}
