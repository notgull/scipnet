"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var diff = require('diff');
var fs = require('fs');
var get_user_id = require('./../user/validate').get_user_id;
var metadata = require('./metadata');
var path = require('path');
var renderer = require('./../renderer');
var uuid = require('uuid/v4');
var data_dir = config.scp_cont_location;
var diff_dir = config.scp_diff_location;
var meta_dir = config.scp_meta_location;
// request an edit for the page
var beginEditPage = function (username, args, next) {
    var returnVal = { result: false };
    // fetch the metadata
    metadata.metadata.load_by_slug(args.pagename).then(function (pMeta) {
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
            pMeta.submit(true).then(function () {
                //if (res) { next(res, err); return; }
                returnVal.result = true;
                next(returnVal);
            }).catch(function (err) { next({ result: false, errorCode: -1, error: err }); });
            return;
        }
        returnVal.result = true;
        next(returnVal);
    }).catch(function (err) { next({ result: false, errorCode: -1, error: err }); });
};
// cancel an edit lock
var removeEditLock = function (username, args, next) {
    var returnVal = { result: false };
    metadata.metadata.load_by_slug(args.pagename).then(function (pMeta) {
        if (pMeta === 3) {
            next(pMeta, err);
            return;
        }
        // get the edit lock
        var el = metadata.check_editlock(args.pagename);
        if (!el) {
            // nothing to do!
            returnVal.error = "Attempted to remove a non-existent edit lock";
            returnVal.errorCode = 3;
            next(returnVal);
            return;
        }
        // if there's an editlock mismatch, we have an error
        if (pMeta && (pMeta.editlock.editlock_id !== el.editlock_id || pMeta.editlock.url !== el.url || pMeta.editlock.username !== el.username)) {
            next({ result: false, errorCode: -1, error: new Error("Editlock mismatch") });
            return;
        }
        // if the edit lock belongs to the user, remove it
        if (el.username === username) {
            metadata.remove_editlock(url);
            // if necessary, set the editlock on the metadata to none
            if (pMeta) {
                pMeta.editlock = null;
                pMeta.submit(true).then(function () {
                    returnVal.result = true;
                    next(returnVal);
                }).catch(function (err) { next({ result: false, errorCode: -1, error: err }); });
                return;
            }
            returnVal.result = true;
            next(returnVal);
        }
        else {
            returnVal.error = "Attempted to remove an editlock belonging to " + el.username;
            returnVal.errorCode = 2;
            returnVal.editlockBlocker = el.username;
            next(returnVal);
        }
    }).catch(function (err) { next({ result: false, error: err, errorCode: -1 }); });
};
// save an edit
// NOTE: making this async because it's easier to glob the id for the metadata
var changePageAsync = function (username, args) {
    return __awaiter(this, void 0, void 0, function () {
        var returnVal, pMeta, el, dataLoc, data, oldData, patch, revision;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    returnVal = { result: false };
                    return [4 /*yield*/, metadata.metadata.load_by_slug(args.pagename)];
                case 1:
                    pMeta = _a.sent();
                    el = metadata.check_editlock(args.pagename);
                    if (el && el.username !== username) {
                        returnVal.errorCode = 1;
                        returnVal.error = "Page is locked by " + el.username;
                        returnVal.editlockBlocker = el.username;
                        return [2 /*return*/, returnVal];
                    }
                    else if (el) { // username is the same, then remove the editlock
                        metadata.remove_editlock(args.pagename);
                        pMeta.editlock = null;
                    }
                    if (!!pMeta) return [3 /*break*/, 3];
                    pMeta = new metadata.metadata(args.pagename);
                    // submit so we get the metadata ID
                    return [4 /*yield*/, pMeta.submit()];
                case 2:
                    // submit so we get the metadata ID
                    _a.sent();
                    _a.label = 3;
                case 3:
                    pMeta.title = args.title || "";
                    dataLoc = path.join(data_dir, args.pagename);
                    data = args.src;
                    if (fs.existsSync(dataLoc))
                        oldData = "" + fs.readFileSync(dataLoc);
                    else
                        oldData = "";
                    fs.writeFileSync(dataLoc, data);
                    patch = diff.createPatch(dataLoc, oldData, data, "", "");
                    revision = new metadata.revision(pMeta.article_id, args.user_id);
                    console.log("Revision loc: " + revision.diff_link);
                    fs.writeFileSync(revision.diff_link, patch);
                    //console.log(pMeta);
                    pMeta.revisions.push(revision);
                    return [4 /*yield*/, pMeta.submit(true)];
                case 4:
                    _a.sent();
                    // also submit the revision, since that's done manually
                    return [4 /*yield*/, revision.submit()];
                case 5:
                    // also submit the revision, since that's done manually
                    _a.sent();
                    returnVal.result = true;
                    return [2 /*return*/, returnVal];
            }
        });
    });
};
var changePage = function (username, args, next) {
    changePageAsync(username, args).then(function (returnVal) { next(returnVal); }).catch(function (err) {
        next({ result: false, errorCode: -1, error: err });
    });
};
// vote on a page
var voteOnPage = function (username, args, next) {
    var returnVal = { result: false };
    // TODO: add username check
    metadata.metadata.load_by_slug(args.pagename).then(function (mObj) {
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
        mObj.submit(true).then(function () {
            //if (res) { next(res, err); return; }
            returnVal.result = true;
            returnVal.newRating = mObj.get_rating();
            console.log(returnVal);
            next(returnVal);
        }).catch(function (err) { next({ result: false, errorCode: -1, error: err }); });
    }).catch(function (err) { next({ result: false, errorCode: -1, error: err }); });
};
// get rating
var getRating = function (username, args, next) {
    var returnVal = { result: false };
    metadata.metadata.load_by_slug(args.pagename).then(function (pMeta) {
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
    }).catch(function (err) { next({ result: false, errorCode: -1 }); });
};
// get the html corresponding to the rating module
var getRatingModule = function (args, next) {
    var returnVal = { result: false };
    metadata.metadata.load_by_slug(args.pagename).then(function (pMeta) {
        if (!pMeta) {
            returnVal.error = "Page does not exist";
            returnVal.errorCode = 4;
            next(returnVal);
            return;
        }
        renderer.render_rating_module(pMeta).then(function (ratingModule) {
            returnVal.ratingModule = ratingModule;
            returnVal.result = true;
            next(returnVal);
        }).catch(function (err) { next({ result: false, errorCode: -1, error: err }); });
    }).catch(function (err) { next({ result: false, errorCode: -1, error: err }); });
};
// master prs function
exports.request = function (name, username, args, next) {
    var returnVal = {};
    //if (!username) {
    //  next({result: false, not_logged_in: true});
    //  return;
    //}
    // also get the user id
    get_user_id(username, function (user_id, err) {
        if (err && username) {
            next({ result: false, errorCode: -1 });
            return;
        }
        args['user_id'] = user_id;
        // functions that don't need the username
        if (name === "getRatingModule") {
            getRatingModule(args, next);
            return;
        }
        if (!username) {
            next({ result: false, not_logged_in: true });
            return;
        }
        // function that do
        if (name === 'changePage')
            changePage(username, args, next);
        else if (name === 'removeEditLock')
            removeEditLock(username, args, next);
        else if (name === 'beginEditPage')
            beginEditPage(username, args, next);
        else if (name === 'voteOnPage')
            voteOnPage(username, args, next);
        else
            throw new Error("Improper PRS request " + name);
    });
};
