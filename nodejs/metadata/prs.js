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
  metadata(args.pagename, (pMeta, err) => {
    if (pMeta === 3) {
      next(pMeta, err);
      return;
    }

    // check for an edit lock
    if (pMeta && pMeta.editlock !== -1) {
      returnVal.error = "Page is locked by " + pMeta.editlock.username;
      returnVal.errorCode = 1;
      next(returnVal);
      return;
    }
 
    // set an edit lock, if possible
    var el = metadata.editlock(args.pagename, username);
    el.save((res, err) => {
      if (res) { next(res, err); return; }
 
      // if necessary, set the editlock in the metadata to it
      if (pMeta) {
        pMeta.editlock = el;

        var dataLoc = path.join(data_dir, args.pagename);
	var data = "" + fs.readFileSync(dataLoc);
	returnVal.src = data;
	returnVal.title = pMeta.title;
      }

      returnVal.result = true;
      next(returnVal);
    });
  });
};

// cancel an edit lock
var removeEditLock = function(username, args, next) {
  var returnVal = {result: false};

  var pMeta = metadata(args.pagename);
  if (!pMeta) {
    // check for edit lock file
    var editlockPath = path.join(meta_dir, args.pagename + ".editlock");
    if (fs.existsSync(editlockPath)) {
      var editlockObj = JSON.parse("" + fs.readFileSync(editlockPath));
      if (editlockObj.name !== username) {
        returnVal.error = "Attempted to remove edit lock that is not yours";
        returnVal.errorCode = 2;
        next(returnVal);
        return;
      } else {
        fs.unlinkSync(editlockPath);
      }
    }
  } else {
    if (pMeta.editlock !== username) {
      returnVal.error = "Attempted to remove edit lock that is not yours";
      returnVal.errorCode = 2;
      next(returnVal);
      return;
    }

    pMeta.editlock = "";
    pMeta.editstart = "";
    pMeta.save();
  }

  returnVal.result = true;
  next(returnVal);
};

// save an edit
var changePage = function(username, args, next) {
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
  mObj.save();

  returnVal.result = true;
  next(returnVal);
};

// vote on a page
var voteOnPage = function(username, args, next) {
  var returnVal = {result: false};

  // TODO: add username check
  var mObj = metadata(args.pagename); 
  mObj.rating += Number(args.rating);
  mObj.save();

  returnVal.result = true;
  returnVal.newRating = mObj.rating;
  next(returnVal);
};

// get rating
var getRating = function(username, args, next) {
  var returnVal = {result: false};

  var mObj = metadata(args.pagename);
  returnVal.rating = mObj.rating;
  returnVal.result = true;
  next(returnVal);
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
