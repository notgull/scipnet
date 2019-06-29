
// a block quote tag

module.exports = function(lineSet, tokenizer, render_context=null) {
  if (!(this instanceof module.exports)) return new module.exports(lineSet, tokenizer, render_context);

  this.html = false;
  this.tokenSet = [];
  for (var i = 0; i < lineSet.length; i++) {
    this.tokenSet.push(tokenizer(lineSet[i], render_context=render_context));
  }
}

module.exports.prototype.flatten = function() {
  var content = "<blockquote>\n";
  for (var i = 0; i < this.tokenSet.length; i++) {
    content += "<p>\n";
    for (var j = 0; j < this.tokenSet[i].length; j++) {
      content += (this.tokenSet[i])[j].flatten();
    }
    content += "</p>\n";
  }
  return content + "</blockquote>";
}
