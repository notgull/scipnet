
// hyperlink used to connect elsewhere

module.exports = function(tokenSet) {
  if (!(this instanceof module.exports)) return new module.exports(tokenSet);

  console.log("Creating hyperlink with " + JSON.stringify(tokenSet));

  this.html = false;

  // determine what link we're pointing to
  // TODO: we aren't using tokens anymore, split by '|'
  var contentParts = tokenSet.split('|', 2).filter(function(el) { return el !== ""; });
  if (contentParts.length === 1) {
    this.url = contentParts[0];
    this.name = this.url;
  } else {
    this.url = contentParts[0];
    this.name = contentParts[1];
  }
};

module.exports.prototype.flatten = function() {
  return "<a href=\"" + this.url + "\">" + this.name + "</a>";
}
