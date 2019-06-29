
// top-level element for markdown trees
var config = require('./../../config.json');
var fs = require('fs');
var path = require('path');

var paragraph = require('./paragraph');

module.exports = function(filename) {
  if (!(this instanceof module.exports)) return new module.exports(filename);

  console.log("Reading " + path.join(config.scp_cont_location, filename)); 

  this.source = fs.readFileSync(path.join(config.scp_cont_location, filename));
  this.source = ('' + this.source); // ensure source is a string
  this.paragraphs = [];

  // set up a rendering context object
  this.render_context = {pagename: filename};

  // generate from source, split by double newline
  var raw_paragraphs = this.source.split("\n\n");
  for (var i = 0; i < raw_paragraphs.length; i++) {
    if (i === raw_paragraphs.length - 1)
      raw_paragraphs[i] = raw_paragraphs[i].slice(0,-1);
    console.log("Processing paragraph #" + i);
    this.paragraphs.push(paragraph(raw_paragraphs[i], render_context=this.render_context));
  }
};

module.exports.prototype.add_paragraph = function(par) {
  this.paragraphs.push(par);
}

module.exports.prototype.flatten = function(username) {
  username = username || "";

  var content = "";
  for (var i = 0; i < this.paragraphs.length; i++) {
    content += "<!-- paragraph unit #" + i + " -->\n";
    content += this.paragraphs[i].flatten();
    content += "\n";
  }

  // content += "<p>You are logged in as [INSERT_USERNAME_HERE]</p>";
  return content;
}
