/*
 * prs.ts
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
import * as diff from 'diff';
import * as fs from 'fs';
import * as nunjucks from 'nunjucks';
import { Nullable } from './../helpers';
import { get_user_id } from './../user/validate';
import * as metadata from './../metadata/metadata';
import * as path from 'path';
import { render_rating_module } from './../renderer';
import * as uuid from 'uuid/v4';

const config = require(path.join(process.cwd(), 'config.json'));
const data_dir = config.scp_cont_location;
const diff_dir = config.scp_diff_location;
const meta_dir = config.scp_meta_location;

export type ArgsMapping = { [key: string]: any };

export interface PRSReturnVal {
  result: boolean;
  error: Nullable<Error | string>;
  errorCode: Nullable<number>;
  src: Nullable<string>;
  title: Nullable<string>;
  editlockBlocker: Nullable<string>;
  rating: Nullable<number>;
  newRating: Nullable<number>;
  ratingModule: Nullable<string>;
  not_logged_in: boolean;
};

export type PRSCallback = (result: PRSReturnVal) => any;

// generate an object for the return value
function genReturnVal(): PRSReturnVal {
  return { result: false,
           error: null,
	   errorCode: null,
	   src: null,
	   title: null,
	   editlockBlocker: null,
	   rating: null,
	   newRating: null,
	   ratingModule: null,
	   not_logged_in: false };
}

// generate an error'd return value
function genErrorVal(err: Error): PRSReturnVal {
  let returnVal = genReturnVal();
  returnVal.error = err;
  returnVal.errorCode = -1;
  return returnVal;
}

// request an edit for the page
function beginEditPage(username: string, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  // fetch the metadata
  metadata.metadata.load_by_slug(args.pagename).then((pMeta: Nullable<metadata.metadata>) => {
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
    let el = metadata.add_editlock(args.pagename, username);

    // if necessary, set the editlock in the metadata to it
    if (pMeta) {
      pMeta.editlock = el;

      let dataLoc = path.join(data_dir, args.pagename);
      let data = "" + fs.readFileSync(dataLoc);
      returnVal.src = data;
      returnVal.title = pMeta.title;

      // save metadata to database
      pMeta.submit(true).then(() => {
        returnVal.result = true;
        next(returnVal);
      }).catch((err) => { next(genErrorVal(err)); });

      return;
    }

    returnVal.result = true;
    next(returnVal);
  }).catch((err) => { next(genErrorVal(err)); });
};

// cancel an edit lock
function removeEditLock(username: string, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  metadata.metadata.load_by_slug(args.pagename).then((pMeta: Nullable<metadata.metadata>) => {
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
    if (pMeta && (pMeta.editlock.editlock_id !== el.editlock_id || pMeta.editlock.slug !== el.slug || pMeta.editlock.username !== el.username)) {
      next(genErrorVal(new Error("Editlock mismatch")));
      return;
    }

    // if the edit lock belongs to the user, remove it
    if (el.username === username) {
      metadata.remove_editlock(el.slug);

      // if necessary, set the editlock on the metadata to none
      if (pMeta) {
        pMeta.editlock = null;
        pMeta.submit(true).then(() => {
	  returnVal.result = true;
	  next(returnVal);
        }).catch((err) => { next(genErrorVal(err)); });
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
  }).catch((err: Error) => { next(genErrorVal(err)) });
};

// save an edit
// NOTE: making this async because it's easier to glob the id for the metadata
async function changePageAsync(username: string, args: ArgsMapping): Promise<PRSReturnVal> {
  let returnVal = genReturnVal();

  let pMeta = await metadata.metadata.load_by_slug(args.pagename);

  // before anything, check to see if there's an editlock
  // this shouldn't be an issue for normal usage, just if someone is messing with the PRS
  let el = metadata.check_editlock(args.pagename);
  if (el && el.username !== username) {
    returnVal.errorCode = 1;
    returnVal.error = "Page is locked by " + el.username;
    returnVal.editlockBlocker = el.username;
    return returnVal;
  } else if (el) { // username is the same, then remove the editlock
    metadata.remove_editlock(args.pagename);
    if (pMeta)
      pMeta.editlock = null;
  }

  if (!pMeta) {
    pMeta = new metadata.metadata(args.pagename);

    // submit so we get the metadata ID
    await pMeta.submit();
  }

  pMeta.title = args.title || "";

  // get the old source
  let dataLoc = path.join(data_dir, args.pagename);
  let data = args.src;
  let oldData;
  if (fs.existsSync(dataLoc))
    oldData = "" + fs.readFileSync(dataLoc);
  else
    oldData = "";
  fs.writeFileSync(dataLoc, data);

  // write revision
  //console.log(dataLoc, oldData, data);
  let patch = diff.createPatch(dataLoc, oldData, data, "", "");

  let revision = new metadata.revision(pMeta.article_id, args.user_id);
  console.log("Revision loc: " + revision.diff_link);
  fs.writeFileSync(revision.diff_link, patch);
  //console.log(pMeta);
  pMeta.revisions.push(revision);

  await pMeta.submit(true);
  // also submit the revision, since that's done manually
  await revision.submit();

  returnVal.result = true;
  return returnVal;
};

function changePage(username: string, args: ArgsMapping, next: PRSCallback) {
  changePageAsync(username, args).then((returnVal) => { next(returnVal); }).catch((err) => {
    next(genErrorVal(err));
  });
}

let history_header = '<table class="page-history"><tbody>';
history_header += "<tr><td>rev.</td><td>&nbsp;&nbsp;&nbsp;</td><td>flags</td><td>actions</td><td>by</td><td>date</td><td>comments</td></tr>";
const history_row = "<tr><td>{{ rev_number }}</td><td></td><td>{{ flags }}</td><td>{{ buttons }}</td><td>{{ author }}</td><td>{{ date }}</td><td>{{ comments }}</td></tr>";
const history_footer = '</tbody></table>';

// get the history of a page
function pageHistory(args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  metadata.metadata.load_by_slug(args.pagename).then((mObj: Nullable<metadata.metadata>) => {
    if (!mObj) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    let revisions = [];
    if (args.perpage > mObj.revisions.length)
      revisions = mObj.revisions;
    else {
      // get all of the revisions needed
      let start = args.perpage * args.pagenum;
      if (start > mObj.revisions.length) {
        next(genErrorVal(new Error("Page count mismatch")));
        return;
      }

      let end = start + args.perpage;
      if (end > mObj.revisions.length)
        end = mObj.revisions.length;

      revisions = mObj.revisions.slice(start, end);
    }

    // compile into html
    let history = history_header;
    let revision;
    for (let i = 0; i < revisions.length; i++) {
      revision = revisions[i];
      history += nunjucks.renderString(history_row, {
        rev_number: 1,
	buttons: "V S R",
	flags: "N",
	author: "somebodyx",
	date: revision.created_at.toLocaleDateString("en-US"),
	comments: ""
      });
    }
    history += history_footer;

    returnVal.result = true;
    returnVal.src = history;
    next(returnVal);
  }).catch((err) => { next(genErrorVal(err)); });
}

// vote on a page
function voteOnPage(username: string, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  metadata.metadata.load_by_slug(args.pagename).then((mObj: metadata.metadata) => {
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
    let rater = new metadata.rating(mObj.article_id, args.user_id, args.rating);
    let found = false;
    console.log("User id is " + args.user_id);
    for (let i = 0; i < mObj.ratings.length; i++) {
      if (Number(mObj.ratings[i].user_id) === Number(args.user_id)) {
        mObj.ratings[i].rate = args.rating;
	found = true;
        break;
      }
    }

    if (!found) {
      console.log("User was not found in list");
      mObj.ratings.push(rater);
    }

    mObj.submit(true).then(() => {
      returnVal.result = true;
      returnVal.newRating = mObj.get_rating();
      console.log(returnVal);
      next(returnVal);
    }).catch((err) => { next(genErrorVal(err)); });
  }).catch((err) => { next(genErrorVal(err)); });
};

// get rating
function getRating(username: string, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  metadata.metadata.load_by_slug(args.pagename).then((pMeta: metadata.metadata) => {
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
  }).catch((err) => { next(genErrorVal(err)); });
};

// get the html corresponding to the rating module
function getRatingModule(args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  metadata.metadata.load_by_slug(args.pagename).then((pMeta: metadata.metadata) => {
    if (!pMeta) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    render_rating_module(pMeta).then((ratingModule: string) => {
      returnVal.ratingModule = ratingModule;
      returnVal.result = true;
      next(returnVal);
    }).catch((err: Error) => { next(genErrorVal(err)); });
  }).catch((err: Error) => { next(genErrorVal(err)); });
}

// master prs function
export function request(name: string, username: string, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  // also get the user id
  get_user_id(username, (user_id: number, err: Error) => {
    if (err && username) { next(genErrorVal(err)); return; }

    if (!args["pagename"] || args["pagename"].length === 0)
      args["pagename"] = "main";

    args['user_id'] = user_id;

    // functions that don't need the username
    if (name === "getRatingModule") { getRatingModule(args, next); return; }
    else if (name === "pageHistory") { pageHistory(args, next); return; }

    if (!username) {
      returnVal.not_logged_in = true;
      next(returnVal);
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
