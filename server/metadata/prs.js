"use strict";
// using this to prevent mistakes

/*
 * prs.js
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

// page request system - for things like upvoting, creating pages, etc.
var config = require('./../../../config.json');
var diff = require('diff');
var fs = require('fs');
var { get_user_id } = require('./../user/validate');
var metadata = require('./metadata');
var path = require('path');
var renderer = require('./../renderer');
var uuid = require('uuid/v4');

var data_dir = config.scp_cont_location;
var diff_dir = config.scp_diff_location;
var meta_dir = config.scp_meta_location;

// request an edit for the page
var beginEditPage = function(username, args, next) {
  var returnVal = {result: false};
  
  // fetch the metadata
  metadata.metadata.load_by_slug(args.pagename).then((pMeta) => {
    //if (pMeta === 3) {
    //  next(pMeta, err);
    //  return;
    //}

    // check for an edit lock
    if (pMeta && (pMeta.editlock && pMeta.editlock.is_valid() && pMeta.editlock.username !== username)) {
      returnVal.error = "Page is locked by " + pMeta.editlock.username;
      returnVal.errorCode = 1;
      next(returnVal);
      return;
    }
 
    // set an edit lock, if possible
    var el = metadata.add_editlock(args.pagename, username);
      //if (res) { next(res, err); return; }
 
    // if necessary, set the editlock in the metadata to it
    if (pMeta) {
      pMeta.editlock = el;

      var dataLoc = path.join(data_dir, args.pagename);
      var data = "" + fs.readFileSync(dataLoc);
      returnVal.src = data;
      returnVal.title = pMeta.title;

      // save metadata to database
      pMeta.submit(true).then(() => {
        //if (res) { next(res, err); return; }

        returnVal.result = true;
        next(returnVal);
      }).catch((err) => { next({result: false, errorCode: -1, error: err}); });
      return;
    }

    returnVal.result = true;
    next(returnVal);
  }).catch((err) => { next({result: false, errorCode: -1, error: err}); });
};

// cancel an edit lock
var removeEditLock = function(username, args, next) {
  var returnVal = {result: false};
  
  metadata.metadata.load_by_slug(args.pagename).then((pMeta) => {
    if (pMeta === 3) {
      next(pMeta, err);
      return;
    }

    // get the edit lock
    let el = metadata.check_editlock(args.pagename); 
	
    if (!el) {
      // nothing to do!
      returnVal.error = "Attempted to remove a non-existent edit lock";
      returnVal.errorCode = 3;
      next(returnVal);
      return;
    }

    // if there's an editlock mismatch, we have an error
    if (pMeta && (pMeta.editlock.editlock_id !== el.editlock_id || pMeta.editlock.url !== el.url || pMeta.editlock.username !== el.username)) {
      next({result: false, errorCode: -1, error: new Error("Editlock mismatch")});
      return;
    }

    // if the edit lock belongs to the user, remove it
    if (el.username === username) {
      metadata.remove_editlock(url);

      // if necessary, set the editlock on the metadata to none
      if (pMeta) {
        pMeta.editlock = null;
        pMeta.submit(true).then(() => {
	  returnVal.result = true;
	  next(returnVal);
        }).catch((err) => { next({result: false, errorCode: -1, error: err}); });
        return;
      }

      returnVal.result = true;
      next(returnVal);
    } else {
      returnVal.error = "Attempted to remove an editlock belonging to " + el.username;
      returnVal.errorCode = 2;
      returnVal.editlockBlocker = el.username;
      next(returnVal);
    }
  }).catch((err) => { next({result: false, error: err, errorCode: -1}); });
};

// save an edit
// NOTE: making this async because it's easier to glob the id for the metadata
var changePageAsync = async function(username, args) {
  var returnVal = {result: false};

  //metadata.metadata.load_by_slug(args.pagename).then((pMeta) => {
  var pMeta = await metadata.metadata.load_by_slug(args.pagename);
    // before anything, check to see if there's an editlock 
    // this shouldn't be an issue for normal usage, just if someone is messing with the PRS
  var el = metadata.check_editlock(args.pagename);
  if (el && el.username !== username) {
    returnVal.errorCode = 1;
    returnVal.error = "Page is locked by " + el.username;
    returnVal.editlockBlocker = el.username;
    return returnVal;
  } else if (el) { // username is the same, then remove the editlock
    metadata.remove_editlock(args.pagename);
    pMeta.editlock = null;
  }

  if (!pMeta) {
    pMeta = new metadata.metadata(args.pagename); 

    // submit so we get the metadata ID
    await pMeta.submit();
  }

  pMeta.title = args.title || "";

  // get the old source
  var dataLoc = path.join(data_dir, args.pagename);
  var data = args.src;
  var oldData;
  if (fs.existsSync(dataLoc))
    oldData = "" + fs.readFileSync(dataLoc);
  else
    oldData = "";
  fs.writeFileSync(dataLoc, data);

  // write revision
  //console.log(dataLoc, oldData, data);
  var patch = diff.createPatch(dataLoc, oldData, data, "", "");

  var revision = new metadata.revision(pMeta.article_id, args.user_id);
  console.log("Revision loc: " + revision.diff_link);
  fs.writeFileSync(revision.diff_link, patch);
  //console.log(pMeta);
  pMeta.revisions.push(revision);
 
  await pMeta.submit(true);
  // also submit the revision, since that's done manually
  await revision.submit();


  returnVal.result = true;
  return returnVal;
  //}).catch((err) => { next({result: false, errorCode: -1, error: err}); });
};

var changePage = function(username, args, next) {
  changePageAsync(username, args).then((returnVal) => {next(returnVal);}).catch((err) => {
    next({result: false, errorCode: -1, error: err}); 
  });
}

// vote on a page
var voteOnPage = function(username, args, next) {
  var returnVal = {result: false};

  // TODO: add username check
  metadata.metadata.load_by_slug(args.pagename).then((mObj) => { 
    if (!mObj) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    if (args.rating > 1 || args.rating < -1) {
      returnVal.error = "Invalid rating";
      returnVal.errorCode = 5;
      next(returnVal);
      return;
    }

    // search for rater if needed
    var rater = new metadata.rating(mObj.article_id, args.user_id, args.rating);
    var found = false;
    console.log("User id is " + args.user_id);
    for (var i = 0; i < mObj.ratings.length; i++) {
      if (Number(mObj.ratings[i].user_id) === Number(args.user_id)) {
        mObj.ratings[i].rating = args.rating;
	found = true;
        break;
      }
    }
 
    if (!found) {
      console.log("User was not found in list");
      mObj.ratings.push(rater);
    }

    mObj.submit(true).then(() => {
      //if (res) { next(res, err); return; }

      returnVal.result = true;
      returnVal.newRating = mObj.get_rating();
      console.log(returnVal);
      next(returnVal);
    }).catch((err) => { next({result: false, errorCode: -1, error:err}); });
  }).catch((err) => { next({result: false, errorCode: -1, error:err}); });
};

// get rating
var getRating = function(username, args, next) {
  var returnVal = {result: false};

  metadata.metadata.load_by_slug(args.pagename).then((pMeta) => {
    if (!pMeta) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    // get the current rating
    returnVal.rating = pMeta.get_rating();
    returnVal.result = true;
    next(returnVal);
  }).catch((err) => { next({result:false,errorCode:-1}); });
};

// get the html corresponding to the rating module
var getRatingModule = function(args, next) {
  var returnVal = {result: false};
  
  metadata.metadata.load_by_slug(args.pagename).then((pMeta) => {
    if (!pMeta) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    renderer.render_rating_module(pMeta).then((ratingModule) => {
      returnVal.ratingModule = ratingModule;
      returnVal.result = true;
      next(returnVal);
    }).catch((err) => { next({result: false, errorCode: -1, error: err}); });
  }).catch((err) => { next({result: false, errorCode: -1, error: err}); });
}

// master prs function
exports.request = function(name, username, args, next) {
  var returnVal = {};

  //if (!username) {
  //  next({result: false, not_logged_in: true});
  //  return;
  //}

  // also get the user id
  get_user_id(username, (user_id, err) => {
    if (err && username) { next({result: false, errorCode: -1}); return; }

    args['user_id'] = user_id;

    // functions that don't need the username
    if (name === "getRatingModule") { getRatingModule(args, next); return; }

    if (!username) {
      next({result: false, not_logged_in: true});
      return;
    }

    // function that do
    if (name === 'changePage') changePage(username, args, next);
    else if (name === 'removeEditLock') removeEditLock(username, args, next);
    else if (name === 'beginEditPage') beginEditPage(username, args, next);
    else if (name === 'voteOnPage') voteOnPage(username, args, next);
    else throw new Error("Improper PRS request " + name);
  });
};
