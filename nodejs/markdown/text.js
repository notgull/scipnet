
// low-level element for storing plain text

module.exports = function(txt, spaceAfter = false) {
  if (!(this instanceof module.exports)) return new module.exports(txt, spaceAfter);

  this.contents = txt;
  this.html = false;
  this.spaceAfter = spaceAfter;
}

module.exports.prototype.flatten = function() {
  // we can just return the contents of the inner string here
  if (this.spaceAfter) return this.contents + " ";
  else return this.contents;
}
