// page request system - for things like upvoting, creating pages, etc.
var config = require('./../../config.json');
var fs = require('fs');
var metadata = require('./metadata');
var path = require('path');

var data_dir = config.scp_data_location;

// request an edit for the page
var editPage = function(username, args, next) {
  var returnVal = {result: false};

  var pMeta = metadata(args.pagename);
  if (!pMeta) {
    returnVal.error = "Page does not exist";
    returnVal.errorCode = 0;
    next(returnVal);
    return;
  }

  if (pMeta.editlock.length > 0) {
    returnVal.error = "Page is locked by " + pMeta.editlock;
    returnVal.errorCode = 1;
    next(returnVal);
    return;
  }

  // set edit lock
  pMeta.editlock = username;
  pMeta.save();

  // send over page source
  var dataLoc = path.join(data_dir, args.pagename);
  var data = fs.readFileSync(dataLoc);
  returnVal.src = data;
  returnVal.result = true;
  next(returnVal);
};

// save an edit
var changePage = function(username, args, next) {
  var returnVal = {result: false};

  // TODO: add revision
  var mObj = metadata(args.pagename);
  mObj.editlock = "";
  mObj.save();

  var dataLoc = path.join(data_dir, args.pagename);
  var data = args.pagedata;
  fs.saveFileSync(dataLoc);
  returnVal.result = true;
  next(returnVal);
};

// create a new page
var createPage = function(username, args, next) {
  var returnVal = {result: false};

  // create a metadata object
  var mObj = new metadata(args.pagename);
  mObj.title = args.title;
  mObj.author = username;
  // TODO: create initial revision
  // TODO: create temp edit lock
  mObj.save();

  var dataLoc = path.join(data_dir, args.pagename);
  var data = args.pagedata;
  fs.saveFileSync(dataLoc);
  returnVal.result = true;
  next(returnVal);
};

// vote on a page
var voteOnPage = function(username, args, next) {
  var returnVal = {result: false};

  // TODO: add username check
  var mObj = metadata(args.pagename); 
  mObj.rating += args.rating;
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
  if ('pagename' in args)
    args[pagename] = path.basename(args[pagename]);

  if (!username)
    next({result: false, errorCode: -1});

  if (name === 'createPage') createPage(username, args, next);
  else if (name === 'changePage') changePage(username, args, next);
  else if (name === 'editPage') editPage(username, args, next);
  else if (name === 'voteOnPage') voteOnPage(username, args, next);
};
