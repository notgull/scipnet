// basic class for storing metadata for individual files

// metadata properties, add more if necessary
// url
// title
// rating (+ ratings from users)
// author
// revisions
// link to diffs of revisions
// tags
// editlock (y/n)
// link to discussion page
// list of attached files
// locked (y/n)
// parent page

var config = require('./../../config.json');
var metadata_dir = config.scp_meta_location;

var fs = require('fs');
var path = require('path');

module.exports = function(url) {
  if (!(this instanceof module.exports)) {
    metadata_path = path.join(metadata_dir, url);
    if (!(fs.existsSync(metadata_path)))
      return null;

    // return an instance of metadata loaded from a file 
    metadata_text = fs.readFileSync(metadata_path);
    metadata = JSON.parse(metadata_text);

    mObj = new module.exports(url);
    mObj.title = metadata.title;
    mObj.rating = metadata.rating;
    mObj.raters = metadata.raters;
    mObj.author = metadata.author;
    mObj.revisions = metadata.revisions; // TODO: put revision diffs in here 
    mObj.tags = metadata.tags;
    mObj.editlock = metadata.editlock;
    mObj.discuss_link = metadata.discuss_link;
    mObj.attached_files = metadata.attached_files;
    mObj.locked = metadata.locked;
    mObj.parentPage = metadata.parentPage;

    return mObj;
  } else {
    // create a new metadata instance
    this.url = url;
    this.title = "";
    this.rating = 0;
    this.raters = [];
    this.author = "";
    this.editlock = "";
    this.tags = [];
    this.revisions = [];
    this.discuss_link = "";
    this.attached_files = [];
    this.locked = false;
    this.parentPage = "";
  }
};

// save metadata to a file
module.exports.prototype.save = function() {
  mObj = {};
  
  mObj.title = this.title;
  mObj.rating = this.rating;
  mObj.raters = this.raters;
  mObj.author = this.author;
  mObj.revisions = this.revisions; 
  mObj.tags = this.tags;
  mObj.editlock = this.editlock;
  mObj.discuss_link = this.discuss_link;
  mObj.attached_files = this.attached_files;
  mObj.locked = this.locked;
  mObj.parentPage = this.parentPage;

  filePath = path.join(metadata_dir, this.url);
  fs.writeFileSync(filePath, JSON.stringify(mObj));
};
