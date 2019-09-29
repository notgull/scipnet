/*
 * page_utils.js
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

// page utilities (e.g. history, et al)
//var add_event_listener

var hidePageUtilities = function() {
  document.getElementById("editor").classList.add("vanished");
  document.getElementById("rater").classList.add("vanished");
  document.getElementById("revisions").classList.add("vanished");
};

var editpage = function(use_404_param=false) {
  hidePageUtilities();
  var pagename = get_slug();
  if (use_404_param)
    pagename = get_parameter("original_page");

  var args = {};
  args.pagename = pagename;
  console.log("Pagename: " + pagename);

  // request page source and edit lock
  prsRequest("beginEditPage", args, (d) => {
    if ('not_logged_in' in d && d.not_logged_in) {
      createDialog("You must be logged in to edit pages.");
      return;
    }

    if ('result' in d && !d.result) {
      err = "Error Code " + d.errorCode + ": " + d.error;
      createDialog(err);
      return;
    }

    var pagesource = "";
    if ('src' in d) {
      pagesource = d.src;
      // pagesource = new String(pagesource.data.map(String.fromCharCode));
    }

    var title = "Title";
    if ('title' in d) {
      title = d.title;
    }


    // expose editor
    document.getElementById("editor").classList.remove("vanished");
    document.getElementById("titlebox").value = title;
    document.getElementById("srcbox").value = pagesource;
  });
};

var toggle_404_param = function() {
  //document.getElementById("sac_button").onclick = function() { savepage(false, true); };
  //document.getElementById("save_button").onclick = function() { savepage(true, true); };
}

var savepage = function(refresh, use_404_param=false) {
  var args = {};
  args.pagename = get_slug();
  args.src = document.getElementById('srcbox').value;
  args.title = document.getElementById('titlebox').value;
  args.comment = document.getElementById('commentbox').value;

  if (use_404_param)
    args.pagename = get_parameter("original_page");

  prsRequest("changePage", args, (d) => {
    if (refresh)
      if (!use_404_param)
        window.location.reload();
      else
	window.location.href = args.pagename;
  });
};

var canceleditpage = function() {
  hidePageUtilities();

  prsRequest("removeEditLock", {pagename: get_slug()}, (d) => {
    window.location.reload();
  });
};

var scpvote = function(rate) {
  if (rate > 1 || rate < -1) return;

  prsRequest('voteOnPage', {pagename: get_slug(), rating: rate}, (d)=>{
    if ('not_logged_in' in d && d.not_logged_in) {
      createDialog("You must be logged in to vote on pages.");
      return;
    }

    if ('result' in d && !d.result) {
      createDialog("Failed to vote on page.");
      return;
    }

    var prList = document.getElementsByClassName("page-rating");
    for (var i = 0; i < prList.length; i++) {
      if (d.newRating > 0)
        prList[i].innerHTML = "+" + d.newRating;
      else
	prList[i].innerHTML = d.newRating;
    }
  });
};

// clicking the "Rate" button
var showrater = function() {
  hidePageUtilities();

  prsRequest("getRatingModule", {pagename: get_slug()}, (d) => {
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

var tagpage = function() {

};

var pagehistory = function(pagenum=1, perpage=20) {
  hidePageUtilities();
  prsRequest("pageHistory", {pagename: get_slug(), pagenum: pagenum, perpage: perpage}, (d) => {
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

var pagesource = function() {

};

var pageparent = function() {

};

var renamepage = function() {

};
