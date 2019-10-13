/*
 * services/pagereq/index.ts
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

import * as fs from 'fs';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import * as uuid from 'uuid/v4';

import { promisify } from 'util';

const readFilePromise = promisify(fs.readFile);

import { config } from 'app/config';
import { Nullable } from 'app/utils';
import { getUserId, getUsername } from 'app/services/user/utils';
import { User } from 'app/services/user';

import {
  add_editlock,
  check_editlock,
  remove_editlock,
  Metadata,
  Rating,
  Revision,
} from 'app/services/metadata';

import { revisionsService } from 'app/services/revisions';

const dataDir = path.join(config.get('files.data.directory'), 'pages');

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
  tags: Nullable<Array<string>>;
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
           tags: null,
           not_logged_in: false };
}

// generate an error'd return value
function genErrorVal(err: Error): PRSReturnVal {
  console.log(`PAGEREQ ERROR: ${err}`);

  let returnVal = genReturnVal();
  returnVal.error = err;
  returnVal.errorCode = -1;
  return returnVal;
}

function permissionDenied(): PRSReturnVal {
  let returnVal = genReturnVal();
  returnVal.error = "Permission denied";
  returnVal.errorCode = -2;
  return returnVal;
}

// request an edit for the page
function beginEditPage(user: User, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  // if the user does not have permission to edit pages, return
  if (!user.hasPermission("editPages")) {
    next(permissionDenied());
    return; 
  }

  // fetch the metadata
  Metadata.load_by_slug(args.pagename).then((pMeta: Nullable<Metadata>) => {
    // if the metadata is null, we are creating a new page. check for permission
    if (!pMeta && !user.hasPermission("createPages")) {
      next(permissionDenied());
      return;
    }

    // if the page is locked and we don't have permission, return
    if (pMeta) {
      if (pMeta.locked_at && !user.hasPermission("modifyLockedPages")) {
        next(permissionDenied());
        return;
      }
    } 

    // check for an edit lock
    if (pMeta && (pMeta.editlock && pMeta.editlock.is_valid() && pMeta.editlock.username !== user.username)) {
      returnVal.error = "Page is locked by " + pMeta.editlock.username;
      returnVal.errorCode = 1;
      next(returnVal);
      return;
    }

    // set an edit lock, if possible
    let el = add_editlock(args.pagename, user.username);

    // if necessary, set the editlock in the metadata to it
    if (pMeta) {
      pMeta.editlock = el;

      let dataLoc = path.join(dataDir, args.pagename);
      let data = fs.readFileSync(dataLoc).toString();
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
function removeEditLock(user: User, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  // if the user does not have edit permissions, they should not be doing this anyways
  if (!user.hasPermission("editPages")) {
    next(permissionDenied());
    return;
  }

  Metadata.load_by_slug(args.pagename).then((pMeta: Nullable<Metadata>) => {
    // get the edit lock
    let el = check_editlock(args.pagename);

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
    if (el.username === user.username) {
      remove_editlock(el.slug);

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
async function changePageAsync(user: User, args: ArgsMapping): Promise<PRSReturnVal> {
  let returnVal = genReturnVal();

  if (!user.hasPermission("editPages")) {
    return permissionDenied();
  }

  let pMeta = await Metadata.load_by_slug(args.pagename);

  // if the metadata is null, we are creating a new page. check for permission
  if (!pMeta && !user.hasPermission("createPages")) {
    return permissionDenied();
  }

  // if the page is locked and we don't have permission, return
  if (pMeta && pMeta.locked_at && !user.hasPermission("modifyLockedPages")) {
    return permissionDenied();
  }

  // before anything, check to see if there's an editlock
  // this shouldn't be an issue for normal usage, just if someone is messing with the PRS
  let el = check_editlock(args.pagename);
  if (el && el.username !== user.username) {
    returnVal.errorCode = 1;
    returnVal.error = "Page is locked by " + el.username;
    returnVal.editlockBlocker = el.username;
    return returnVal;
  } else if (el) { // username is the same, then remove the editlock
    remove_editlock(args.pagename);
    if (pMeta) {
      pMeta.editlock = null;
    }
  }

  let isNewPage = false;
  if (!pMeta) {
    pMeta = new Metadata(args.pagename);
    isNewPage = true;

    // submit so we get the metadata ID
    await pMeta.submit();
  }

  pMeta.title = args.title || "";

  // get the old source
  let dataLoc = path.join(dataDir, args.pagename);
  let data = args.src;

  // write revision
  let comment = "";
  if (args.comment) comment = args.comment;
  let flags = isNewPage ? "N" : "S";

  let revision = new Revision(pMeta.article_id, args.user_id, comment, pMeta.tags, pMeta.title, flags);
  pMeta.revisions.push(revision);

  await pMeta.submit(true);
  await revisionsService.commit(revision, args.pagename, data);

  returnVal.result = true;
  return returnVal;
};

function changePage(user: User, args: ArgsMapping, next: PRSCallback) {
  changePageAsync(user, args).then((returnVal) => { next(returnVal); }).catch((err) => {
    next(genErrorVal(err));
  });
}

let history_header = '<table class="page-history"><tbody>';
history_header += "<tr><td>rev.</td><td>&nbsp;&nbsp;&nbsp;</td><td>flags</td><td>actions</td><td>by</td><td>date</td><td>comments</td></tr>";
const history_row = "<tr><td>{{ rev_number }}</td><td></td><td>{{ flags }}</td><td>{{ buttons }}</td><td>{{ author }}</td><td>{{ date }}</td><td>{{ comments }}</td></tr>";
const history_footer = '</tbody></table>';

// get the history of a page
async function pageHistoryAsync(args: ArgsMapping): Promise<PRSReturnVal> {
  let returnVal = genReturnVal();

  let mObj = await Metadata.load_by_slug(args.pagename);
  if (!mObj) {
    returnVal.error = "Page does not exist";
    returnVal.errorCode = 4;
    return returnVal;
  }

  let revisions = [];
  if (args.perpage > mObj.revisions.length)
    revisions = mObj.revisions;
  else {
    // get all of the revisions needed
    let start = args.perpage * args.pagenum;
    if (start > mObj.revisions.length) {
      return genErrorVal(new Error("Page count mismatch"));
    }

    let end = start + args.perpage;
    if (end > mObj.revisions.length)
      end = mObj.revisions.length;

    revisions = mObj.revisions.slice(start, end);
  }

  // compile into html
  // we can take advantage of promises.all to run all of the needed promises at once
  let history = [history_header];
  async function render_revision(revision: Revision, i: number) {
    history[i] = nunjucks.renderString(history_row, {
      rev_number: revision.revisionId,
      buttons: "V S R",
      flags: revision.flags,
      author: await getUsername(revision.userId),
      date: revision.createdAt.toLocaleDateString("en-US"),
      comments: "",
    });
  };

  let revision;
  let revision_promises = [];
  for (let i = 0; i < revisions.length; i++) {
    revision = revisions[i];
    revision_promises.push(render_revision(revision, i + 1));
  }

  await Promise.all(revision_promises);
  history.push(history_footer);

  returnVal.result = true;
  returnVal.src = history.join('\n');
  return returnVal;
}

function pageHistory(args: ArgsMapping, next: PRSCallback) {
  pageHistoryAsync(args).then((retval: PRSReturnVal) => { next(retval); })
    .catch((err: Error) => { next(genErrorVal(err)); });
}

// set the tags on the page (creating a new revision in the process)
async function tagPageAsync(user: User, args: ArgsMapping): Promise<PRSReturnVal> {
  let returnVal = genReturnVal();

  // check for permission
  if (!user.hasPermission("editPages") || !user.hasPermission("tagPages")) {
    return permissionDenied();
  }

  let mObj = await Metadata.load_by_slug(args.pagename);
  if (!mObj) {
    returnVal.error = "Page does not exist";
    returnVal.errorCode = 4;
    return returnVal;
  }

  // if the page is locked, permission denied
  if (mObj.locked_at && !user.hasPermission("modifyLockedPages")) {
    return permissionDenied();
  }

  if (!args.tags) {
    mObj.tags = [];
  } else {
    mObj.tags = args.tags.split(',');
  }

  // revision
  let latest_revision = mObj.revisions[mObj.revisions.length - 1];
  let revision = new Revision(mObj.article_id, args.user_id, "", mObj.tags, mObj.title, "A");
  mObj.submit(false);

  let dataLoc = path.join(dataDir, args.pagename);
  let data = await readFilePromise(dataLoc);
  await revisionsService.commit(revision, args.pagename, data);

  returnVal.result = true;
  return returnVal;
}

function tagPage(user: User, args: ArgsMapping, next: PRSCallback) {
  tagPageAsync(user, args).then((retval: PRSReturnVal) => { next(retval); })
    .catch((err: Error) => { next(genErrorVal(err)); });
}

// vote on a page
function voteOnPage(user: User, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  // TODO: check permissions

  Metadata.load_by_slug(args.pagename).then((mObj: Metadata) => {
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
    let rater = new Rating(mObj.article_id, args.user_id, args.rating);
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
      next(returnVal);
    }).catch((err) => { next(genErrorVal(err)); });
  }).catch((err) => { next(genErrorVal(err)); });
};

// get the list of tags
function getTags(args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  Metadata.load_by_slug(args.pagename).then((mObj: Nullable<Metadata>) => {
    if (!mObj) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    returnVal.tags = mObj.tags;
    returnVal.result = true;
    next(returnVal);
  });
}

// get rating
function getRating(user: User, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  Metadata.load_by_slug(args.pagename).then((pMeta: Metadata) => {
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

  Metadata.load_by_slug(args.pagename).then((pMeta: Metadata) => {
    if (!pMeta) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    next(returnVal);
  }).catch((err: Error) => { next(genErrorVal(err)); });
}

// retrieve page source
function getPageSource(args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();
  Metadata.load_by_slug(args.pagename).then((pMeta: Nullable<Metadata>) => {
    if (!pMeta) {
      returnVal.error = "Page does not exist";
      returnVal.errorCode = 4;
      next(returnVal);
      return;
    }

    let dataLoc = path.join(dataDir, args.pagename);
    fs.readFile(dataLoc, (err: Error, data: Buffer) => {
      if (err) {
        next(genErrorVal(err));
        return;
      }

      returnVal.result = true;
      returnVal.src = data.toString();
      next(returnVal);
    });
  }).catch((err: Error) => { next(genErrorVal(err)); });
}

// master prs function
export function request(name: string, username: string, args: ArgsMapping, next: PRSCallback) {
  let returnVal = genReturnVal();

  // also get the user id
  User.loadByUsername(username).then((user: Nullable<User>) => {
    if ((!user) && username) { next(genErrorVal(new Error("Bad user id"))); return; }

    if (!args["pagename"] || args["pagename"].length === 0) {
      args["pagename"] = "main";
    }

    args['user'] = user;
    if (user) {
      args['user_id'] = user.user_id;
    }

    // functions that don't need the username 
    switch (name) {
      case "getRatingModule":
        getRatingModule(args, next);
        return;
      case "pageHistory":
        pageHistory(args, next);
        return;
      case "getTags":
        getTags(args, next);
        return;
      case "getPageSource":
        getPageSource(args, next);
        return;
    }

    if (!user) {
      returnVal.not_logged_in = true;
      next(returnVal);
      return;
    }

    // functions that do
    switch (name) {
      case "changePage":
        changePage(user, args, next);
        return;
      case "removeEditLock":
        removeEditLock(user, args, next);
        return;
      case "beginEditPage":
        beginEditPage(user, args, next);
        return;
      case "voteOnPage":
        voteOnPage(user, args, next);
        return;
      case "tagPage":
        tagPage(user, args, next);
        return;
      default:
        throw new Error(`Improper PRS request: ${name}`);
    }
  }).catch((err: Error) => { next(genErrorVal(err)); });
};
