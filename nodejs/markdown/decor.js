
// text decoration markdown elements

var defineElem = function(name, tag, endTag) {
  module.exports[name] = function(tokens, lastElemSplit, tokenizer, render_context) {
    if (!(this instanceof module.exports[name])) return new module.exports[name](tokens, lastElemSplit, tokenizer, render_context);

    // tokenize all of the inner elements
    this.elemSet = tokenizer(tokens, false, false, render_context);
    this.lastElemSplit = lastElemSplit;
    this.html = false;
  }

  module.exports[name].prototype.flatten = function() {
    var content = tag; 
    for (var i = 0; i < this.elemSet.length; i++) {
      console.log("Flattened element #" + i + " to \"" + this.elemSet[i].flatten() + "\"");
      content += this.elemSet[i].flatten();
    }

    //if (!(this.lastElemSplit)) content += " ";

    return content + endTag;
  }
};

defineElem("bold", "<b>", "</b>");
defineElem("italics", "<i>", "</i>");
defineElem("underline", "<u>", "</u>");
defineElem("strikethrough", "<span class=\"strikethrough\">", "</span>");
