
// basic unit for markdown trees, second from top-level
var helpers = require('./../helpers');
var plaintext = require('./text');
var tokenize = require('./tokenizer');

module.exports = function(source, render_context) {
  if (!(this instanceof module.exports)) return new module.exports(source, render_context);

  //this.elements = [];
  
  // generate paragraph from source
  
  // split into tokens
  var tokens = source.split(' ');
  //console.log('render_context is ' + JSON.stringify(render_context));
  this.elements = tokenize(tokens, true, true, render_context=render_context);
}

module.exports.prototype.push_elem = function(elem) {
  this.elements.push(elem); 
}

module.exports.prototype.flatten = function() {
  var only_html = true;
  var content = "";

  //console.log("--- elems ---");
  //console.log(JSON.stringify(this.elements, null, ' '));
  //console.log("--- elems ---");

  for (var i = 0; i < this.elements.length; i++) {
    if (!(this.elements[i].flatten)) {
      console.log("Element #" + i + " cannot be flattened, struct = " + JSON.stringify(this.elements[i]));
    }

    // every elem should be flatten-able and have an "html" tag (for html elem replication)
    if (!(this.elements[i].html)) {
      only_html = false;
    }

    //console.log("Flattened element: " + this.elements[i].flatten());
    content += this.elements[i].flatten();
  }

  if (!only_html) {
    content = "<p>\n" + content + "\n</p>";
  }

  return content;
}
