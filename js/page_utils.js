/*
 * page_utils.js
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

// page utilities (e.g. history, et al)
//var add_event_listener

var hidePageUtilities = function() {
  document.getElementById("editor").classList.add("vanished");
};

var editpage = function() {
  hidePageUtilities();

  // request page source and edit lock
  prsRequest("beginEditPage", {pagename: window.location.href}, (d) => {
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
  document.getElementById("sac_button").onclick = function() { savepage(false, true); };
  document.getElementById("save_button").onclick = function() { savepage(true, true); };
}

var savepage = function(refresh, use_404_param=false) {
  args = {pagename: window.location.href};
  args.src = document.getElementById('srcbox').value;
  args.title = document.getElementById('titlebox').value;

  if (use_404_param)
    args.pagename = window.location.protocol + "//" + window.location.host + "/" + get_parameter("original_page");

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

  prsRequest("removeEditLock", {pagename: window.location.href}, (d) => {
    window.location.reload();
  });
};

var scpvote = function(rate) {
  if (rate > 1 || rate < -1) return;

  prsRequest('voteOnPage', {pagename: window.location.href, rating: rate}, (d)=>{
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

var ratepage = function() {

};

var tagpage = function() {

};

var pagehistory = function() {

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
