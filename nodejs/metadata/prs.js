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
var config = require('./../../config.json');
var fs = require('fs');
var metadata = require('./metadata');
var path = require('path');

var data_dir = config.scp_cont_location;
var meta_dir = config.scp_meta_location;

// request an edit for the page
var beginEditPage = function(username, args, next) {
  var returnVal = {result: false};
  
  // fetch the metadata
  metadata.metadata.get_by_slug(args.pagename).then((pMeta) => {
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
      pMeta.save().then(() => {
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
  
  metadata(args.pagename).then((pMeta) => {
    if (pMeta === 3) {
      next(pMeta, err);
      return;
    }

    // get the edit lock
    el = metadata.check_editlock(args.pagename);
      //if (el === 3) { next(el, err); return; }
	
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
        pMeta.save().then(() => {
          //      if (res) { next(res, err); return; }
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
/*var changePage = function(username, args, next) {
  var returnVal = {result: false};

  // TODO: add revision
  var mObj = metadata(args.pagename);
  if (!mObj) {
    // if needed, create a new metadata object
    var editlockPath = path.join(meta_dir, args.pagename + ".editlock");
    if (fs.existsSync(editlockPath)) {
      // make sure we're not messing with anyone
      var editlockObj = JSON.parse("" + fs.readFileSync(editlockPath));
      if (editlockObj.name === username)
        fs.unlinkSync(editlockPath);
      else {
        returnVal.errorCode = 2;
	returnVal.error = "Attempted to remove edit lock that is not yours";
	next(returnVal);
	return;
      }
    }
   
    mObj = new metadata(args.pagename);
    mObj.title = args.title;
    mObj.author = username;
  } else {
    if (mObj.editlock.length > 0 && mObj.editlock !== username) {
      returnVal.errorCode = 2;
      returnVal.error = "Attempted to remove edit lock that is not yours";
      next(returnVal);
      return;
    }
  }

  var dataLoc = path.join(data_dir, args.pagename);
  var data = args.src;
  fs.writeFileSync(dataLoc, data);

  // TODO: add revisions, et al
  mObj.save((res, err) => {
    if (res) { next(res, err); return; }

    returnVal.result = true;
    next(returnVal);
  });
};*/

// save an edit
var changePage = function(username, args, next) {
  var returnVal = {result: false};

  metadata(args.pagename, (pMeta, err) => {
    // before anything, check to see if there's an editlock 
    // this shouldn't be an issue for normal usage, just if someone is messing with the API
    var el = metadata.check_editlock(args.pagename);
    if (el && el.username !== username) {
      returnVal.errorCode = 1;
      returnVal.error = "Page is locked by " + el.username;
      returnVal.editlockBlocker = el.username;
      next(returnVal);
      return;
    } else if (el) { // username is the same, then remove the editlock
      metadata.remove_editlock(args.pagename);
      pMeta.editlock = null;
    }

    // update source
    var dataLoc = path.join(data_dir, args.pagename);
    var data = args.src;
    fs.writeFileSync(dataLoc, data);

    // TODO: apply revision to metadata, create diff, et al
    pMeta.save().then(() => {
      returnVal.result = true;
      next(returnVal);
    }).catch((err) => { next({result: false, errorCode: -1, error: err}); });
  }).catch((err) => { next({result: false, errorCode: -1, error: err}); });
};

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
    var rater = {user: username, rating: args.rating};
    var found = false;
    for (var i = 0; i < mObj.raters.length; i++) {
      if (mObj.ratings[i].username === username) {
        mObj.ratings[i].rating = args.rating;
	      found = true;
        break;
      }
    }
 
    if (!found)
      mObj.raters.push(rating);

    mObj.save().then(() => {
      if (res) { next(res, err); return; }

      returnVal.result = true;
      returnVal.newRating = mObj.rating;
      next(returnVal);
    }).catch((err) => { next({result: false, errorCode: -1, error:err}); });
  }).catch((err) => { next({result: false, errorCode: -1, error:err}); });
};

// get rating
var getRating = function(username, args, next) {
  var returnVal = {result: false};

  metadata.metadata.load_by_slug(args.pagename).then((pMeta) => {
    if (pMeta === 3) { next(pMeta, err); return; }

    if (!pMeta) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    // remove the current rating, if needed
    returnVal.rating = pMeta.get_rating();
    returnVal.result = true;
    next(returnVal);
  }).catch((err) => { next({result:false,errorCode:-1}); });
};

// master prs function
exports.request = function(name, username, args, next) {
  var returnVal = {};

  // slight modification to pagename
  if ('pagename' in args) {
    var pagenameParts = args['pagename'].split('/');
    args['pagename'] = pagenameParts[pagenameParts.length - 1];
    
  }

  if (!username) {
    next({result: false, errorCode: -1});
    return;
  }

  if (name === 'changePage') changePage(username, args, next);
  else if (name === 'removeEditLock') removeEditLock(username, args, next);
  else if (name === 'beginEditPage') beginEditPage(username, args, next);
  else if (name === 'voteOnPage') voteOnPage(username, args, next);
  else throw new Error("Improper PRS request " + name);
};
