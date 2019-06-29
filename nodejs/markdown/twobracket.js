
// a function that resolves types that follow the style: "[[name arg1="data1" arg2="data2"]][[/name]]"
var create_token_set = require("./tokenset");
var module = require('../module/module');
var plaintext = require('./text');

// returns array of elems
exports.validNames = [
  "div",
  "span",
  "module",
  ">",
  "<",
  "=",
];

exports.isValid = function(name) {
  return exports.validNames.indexOf(name.toLowerCase()) !== -1;
}

exports.processAttrs = function(elems, isModule) {
  if (!elems || elems.length === 0) return {};

  var attrsObj = {};

  var qualified_tokens = [];
  for (var i = 0; i < elems.length; i++) {
    var elemParts = elems[i].split('=\"');
    if (elemParts.length === 2) {
      var result = create_token_set(elems, i, "\"", "\"", false);
      var attrName = elemParts[0];
      var attrData = result.elemSet.join(" ");
      attrsObj[attrName] = attrData;
      i = result.newPos;
    } else if (isModule && i === 0) {
      attrsObj.moduleType = elems[i];
    } else console.log("Elem \"" + elems[i] + "\" is not a valid elem");
  }

  return attrsObj;
}

exports.htmlElem = function(begin, end, elemSet, tokenize, render_context=null) {
  if (!(this instanceof exports.htmlElem)) return new exports.htmlElem(begin, end, elemSet, tokenize, render_context);

  this.begin = begin;
  this.end = end;

  // if the last element of the elemset ends with a newline, remove the newline
  var lastElem = elemSet[elemSet.length - 1];
  if (lastElem[lastElem.length - 1] === "\n") {
    lastElem = lastElem.slice(0, -1);
    elemSet[elemSet.length - 1] = ("" + lastElem); // ensure value is a string
  }

  //console.log("- ElemSet is " + JSON.stringify(elemSet));

  this.elemSet = tokenize(elemSet, render_context=render_context);  

  this.html = true;
}

exports.htmlElem.prototype.flatten = function() {
  var contents = this.begin;
  for (var i = 0; i < this.elemSet.length; i++) {
    contents += this.elemSet[i].flatten();
  }
  contents += this.end;

  // explicitly delete trailing newlines
  contents.split(this.begin + "\n").join(this.begin);
  return contents;
}

exports.createElem = function(tokenize, name, attrs, elemSet = [], render_context=null) {
  name = name.toLowerCase();
  // console.log("> Attrs is " + JSON.stringify(attrs));

  if (name === "div" || name === "span") {
    var begin = "<" + name;
    for (var attrName in attrs) {
      // console.log("Reading attr " + attrName + " is " + attrs[attrName]);
      begin += " " + attrName + "=\"" + attrs[attrName] + "\"";
    }
    begin += ">";
    var end = "</" + name + ">";

    return exports.htmlElem(begin, end, elemSet, tokenize, render_context);
  } else if (name === "module") {
    // load module
    modName = attrs['moduleType'];
    modAttrs = {};

    for (var attrName in attrs) {
      if (attrName !== 'moduleType')
        modAttrs[attrName] = attrs[attrName];
    }

    return plaintext(module(modName, modAttrs, elemSet, tokenize, render_context)); 
  } else if (name === ">" || name === "<" || name === "=") {
    var begin = "<div style=\"text-align: ";

    if (name === "<") begin += "left";
    else if (name === ">") begin += "right";
    else begin += "center";

    begin += "\">";
    var end = "</div>";
    return exports.htmlElem(begin, end, elemSet, tokenize, render_context);
  } else throw "Internal Program Error: two bracket name mismatch";
}
