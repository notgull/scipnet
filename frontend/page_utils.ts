/*
 * page_utils.ts
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

import { get_slug, prsRequest } from './pagereq';
import { getParameter } from './parameters';
import { createDialog } from './dialog';

export function hidePageUtilities() {
  document.getElementById("editor").classList.add("vanished");
  document.getElementById("rater").classList.add("vanished");
  document.getElementById("revisions").classList.add("vanished");
  document.getElementById('tags').classList.add("vanished");
  document.getElementById("pagesrc").classList.add("vanished");
};

export function editpage(use_404_param: boolean = false) {
  hidePageUtilities();
  let pagename = get_slug();
  if (use_404_param)
    pagename = getParameter("original_page");

  let args: any = {};
  args.pagename = pagename;
  console.log("Pagename: " + pagename);

  // request page source and edit lock
  prsRequest("beginEditPage", args, (d: any) => {
    if ('not_logged_in' in d && d.not_logged_in) {
      createDialog("You must be logged in to edit pages.");
      return;
    }

    if ('result' in d && !d.result) {
      let err = "Error Code " + d.errorCode + ": " + d.error;
      createDialog(err);
      return;
    }

    let pagesource = "";
    if ('src' in d) {
      pagesource = d.src;
      // pagesource = new String(pagesource.data.map(String.fromCharCode));
    }

    let title = "Title";
    if ('title' in d) {
      title = d.title;
    }

    // expose editor
    (<HTMLInputElement>document.getElementById("editor")).classList.remove("vanished");
    (<HTMLInputElement>document.getElementById("titlebox")).value = title;
    (<HTMLInputElement>document.getElementById("srcbox")).value = pagesource;
  });
};

export function toggle_404_param() {
  //document.getElementById("sac_button").onclick = function() { savepage(false, true); };
  //document.getElementById("save_button").onclick = function() { savepage(true, true); };
}

export function savepage(refresh: boolean, use_404_param: boolean = false) {
  let args: any = {};
  args.pagename = get_slug();
  args.src = (<HTMLInputElement>document.getElementById('srcbox')).value;
  args.title = (<HTMLInputElement>document.getElementById('titlebox')).value;
  args.comment = (<HTMLInputElement>document.getElementById('commentbox')).value;

  if (use_404_param)
    args.pagename = getParameter("original_page");

  prsRequest("changePage", args, (d: any) => {
    if (refresh)
      if (!use_404_param)
        window.location.reload();
      else
        window.location.href = args.pagename;
  });
};

export function canceleditpage() {
  hidePageUtilities();

  prsRequest("removeEditLock", {pagename: get_slug()}, (d: any) => {
    window.location.reload();
  });
};

export function scpvote(rate: number) {
  if (rate > 1 || rate < -1) return;

  prsRequest('voteOnPage', {pagename: get_slug(), rating: rate}, (d: any)=>{
    if ('not_logged_in' in d && d.not_logged_in) {
      createDialog("You must be logged in to vote on pages.");
      return;
    }

    if ('result' in d && !d.result) {
      createDialog("Failed to vote on page.");
      return;
    }

    let prList = document.getElementsByClassName("page-rating");
    for (let i = 0; i < prList.length; i++) {
      if (d.newRating > 0)
        prList[i].innerHTML = "+" + d.newRating;
      else
        prList[i].innerHTML = d.newRating;
    }
  });
};

// clicking the "Rate" button
export function showrater() {
  hidePageUtilities();

  prsRequest("getRatingModule", {pagename: get_slug()}, (d: any) => {
    if ('result' in d && !d.result) {
      createDialog("Failed to open rating module.");
      return;
    }

    document.getElementById("utils_rating_module").innerHTML = d.ratingModule;
    document.getElementById("rater").classList.remove("vanished");
  });
};

var ratepage = function() {

};

export function showtagger() {
  hidePageUtilities();
  
  prsRequest("getTags", {pagename: get_slug()}, (d: any) => {
    if ('result' in d && !d.result) {
      createDialog("Failed to retrieve tags.");
      return;
    }

    (<HTMLInputElement>document.getElementById("tag-input")).value = d.tags.join(' ');
    document.getElementById("tags").classList.remove("vanished");
  }); 
}

export function cleartags() {
  (<HTMLInputElement>document.getElementById('tag-input')).value = "";
}

export function tagpage() {
  let taglist = (<HTMLInputElement>document.getElementById("tag-input")).value;
  let tags = taglist.split(' ');
  
  prsRequest("tagPage", {pagename: get_slug(), tags: tags}, (d: any) => {
    if ('not_logged_in' in d && d.not_logged_in) {
      createDialog("You must be logged in to vote on pages.");
      return;
    }

    if ('result' in d && !d.result) {
      createDialog("Failed to vote on page.");
      return;
    }
  });
};

export function pagehistory(pagenum: number = 1, perpage: number = 20) {
  hidePageUtilities();
  prsRequest("pageHistory", {pagename: get_slug(), pagenum: pagenum, perpage: perpage}, (d: any) => {
    if ('result' in d && !d.result) {
      createDialog("Failed to open page history.");
      return;
    }

    document.getElementById("history-table").innerHTML = d.src;
    document.getElementById("revisions").classList.remove("vanished");
  });
};

var pagefiles = function() {

};

var printpage = function() {

};

export function pagesource() {
  hidePageUtilities();
  prsRequest("getPageSource", {pagename: get_slug()}, (d: any) => {
    if ('result' in d && !d.result) {
      createDialog("Failed to open page source.");
      return;
    }

    (<HTMLInputElement>document.getElementById("page-source-box")).value = d.src;
    document.getElementById("pagesrc").classList.remove("vanished");
  });
};

var pageparent = function() {

};

var renamepage = function() {

};
