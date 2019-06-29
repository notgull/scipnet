// rating module
var fs = require('fs');
var metadata = require('./../metadata/metadata');
var path = require('path');

var rate_html = "" + fs.readFileSync(path.join(__dirname, 'Rate.html'));

exports.run = function(args, content, tokenizer, render_context) {
  if (!(render_context)) {
    throw new Error("Error: Rating module passed with null render context");
  }

  // get the current rating
  var mObj = metadata(render_context.pagename);
  var rating = mObj.rating;
  var content = rate_html.split('[INSERT_RATING_HERE]').join(String(rating));
  return content;
};
