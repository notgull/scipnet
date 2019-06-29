
// function to convert tokens to markup using a recursive function
var blockquote = require('./blockquote');
var decor = require('./decor');
var hyperlink = require("./hyperlink");
var plaintext = require('./text');
var twobrackets = require("./twobracket");

// compare n characters from front
var strncmp = function(str1, str2, n) {
  var part1 = (str1 + '').substring(0, n);
  var part2 = (str2 + '').substring(0, n);
  return part1 == part2;
}

// compare e characters from back
var strecmp = function(str1, str2, n) {
  var rstr1 = (str1 + '');
  var rstr2 = (str2 + '');
  var part1 = str1.substring(str1.length - n, str1.length);
  var part2 = str2.substring(str2.length - n, str2.length);
}

// get all tokens in between two delimiters
var create_token_set = require("./tokenset");

var catalogue_tokens = function(tokens, i, boldness, render_context=null) {
    var result = create_token_set(tokens, i, boldness, boldness, true, tokenizer, render_context=render_context);
    var elemSet = [];
    var last_elem_split = result.last_elem_split;

    for (var i = 0; i < result.beginElems.length; i++) elemSet.push(result.beginElems[i]);

    if (boldness == "**") elemSet.push(decor.bold(result.elemSet, last_elem_split, tokenizer, render_context=render_context));
    else if (boldness == "//") elemSet.push(decor.italics(result.elemSet, last_elem_split, tokenizer, render_context=render_context));
    else if (boldness == "__") elemSet.push(decor.underline(result.elemSet, last_elem_split, tokenizer, render_context=render_context));
    else if (boldness == "--") elemSet.push(decor.strikethrough(result.elemSet, last_elem_split, tokenizer, render_context=render_context));
    // else if (boldness == "]]]") elemSet.push(hyperlink(bold_token_set, tokenizer));

    if (last_elem_split) elemSet.push(plaintext(result.endToken + " "));
    else elemSet.push(plaintext(" "));
	
    // advance index
    return {elemSet: elemSet, newIndex: result.newPos};
  //}
}
	
var search_for_elem = function(tokens, i, boldness) {
  var elemSet = [];
  var token = tokens[i];

  if (token.indexOf(boldness) !== -1) {
      //console.log("> Found boldness!");
      // split token into two, if necessary
      return catalogue_tokens(tokens, i, boldness);
    } else {
      elemSet = [-1];
      return {elemSet: elemSet, newIndex: i};
    }
}

// defines a line
var line_params = function(start, end) {
  if (!(this instanceof line_params)) return new line_params(start, end);

  this.start = start;
  this.end = end;
};

// gets conents of a line from a token set
line_params.prototype.get_contents = function(tokenSet) {
  var lineSet = [];
  //console.log("> Getting contents of line");
  for (var i = this.start; i <= this.end; i++) {
     console.log("i is " + i + ", start is " + this.start + ", end is " + this.end);

     if (tokenSet[i].indexOf('\n') !== -1) {
       var tokenparts = tokenSet[i].split('\n');
       //console.log("Split token into " + JSON.stringify(tokenparts));

       if (i === this.start) {
         //console.log("Resolved to token " + tokenparts[tokenparts.length - 2]);
         lineSet.push(tokenparts[tokenparts.length - 2]);
       } else { 
	 //console.log("Resolved to token " + tokenparts[tokenparts.length - 1]);
	 lineSet.push(tokenparts[tokenparts.length - 1]);
       }
     } else lineSet.push(tokenSet[i]);
  }
  return lineSet;
};

// note: this function assumes that the token at i is at the start of the line, which is its primary use
var find_line = function(tokens, i) {
  if (i !== 0 && tokens[i - 1].indexOf('\n') === -1)
    return line_params(-1, -1);

  var start, end;
  if (i !== 0) {
    var prevToken = tokens[i - 1];
    
    if (prevToken[prevToken.length - 1] !== "\n") {
      // console.log("For token " + tokens[i] + " and prevToken " + prevToken + ", we must subtract i by one");
      start = i - 1;
    }
    else start = i;
  } else start = i;

  for (var j = i; j < tokens.length; j++) {
    end = j;
    if (tokens[j].indexOf("\n") !== -1) break;
  }

  return line_params(start, end);
};

var isBQQualifyingToken = (splitByNL) => { return splitByNL[splitByNL.length - 2] === ">" || splitByNL[splitByNL.length - 1] === ">"; }

// convert tokens into markdown elements - involves recursion
var tokenizer = function(tokens, put_space_after_ltoken=false, top_level=false, render_context=null) {
  var elemSet = [];
  if (!tokens || tokens.length === 0) return elemSet;

  // some constants
  const boldness = "**";
  const italics = "//";
  const underline = "__";

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    //console.log("Processing token: \"" + token + "\"");
   
    /*var l = find_line(tokens, i);
    if ((l.start !== -1 && l.end !== -1) && top_level)
      console.log("Token #" + l.start + " (" + tokens[l.start] + ") is the first token of the line from " + l.start + " to " + l.end);*/

    if (!token || token.length === 0) continue;

    var elSet;
    var pos;
    var splitByNL = token.split("\n");
    //console.log("Elem Set: " + JSON.stringify(elSet));
    if ((pos = token.indexOf("[[")) !== -1) {
      // before all else, push the first token part
      var tokenparts = token.split('[[', 2);
      if (pos !== 0) elemSet.push(plaintext(tokenparts[0]));

      // if the next character is [, this is a link
      if (token[pos + 2] === '[') {
        // get all text in between links
	var tokenparts = token.split('[[[', 2);
	// if (pos !== 0) elemSet.push(plaintext(tokenparts[0]));
	var linkcontent = tokenparts[1];

	// if the link is one word, cut out the ]]]
	if (linkcontent.indexOf(']]]') !== -1) {
	  linkparts = linkcontent.split(']]]');
          linkcontent = linkparts[0];
          elemSet.push(hyperlink(linkcontent));
	  elemSet.push(plaintext(linkparts[1] + ' '));
	} else {
          var found = false;
          linkcontent += ' ';
          for (var j = 0; i < tokens.length; i++) {
            if (tokens[j].indexOf(']]]') !== -1) {
              tokenparts = tokens[j].split(']]]');
	      linkcontent += tokenparts[0];
	      elemSet.push(hyperlink(linkcontent));
	      elemSet.push(plaintext(tokenparts[1] + ' '));
	      found = true;
	      i = j;
	      break;
	    } else linkcontent += tokens[j] + ' ';
	  }

	  if (!found) elemSet.push(plaintext(linkcontent));
	}
      } // link test
      else {
	// test for a twobrackets element
        var tokenparts = token.split("[[", 2);
        var name = tokenparts[1].split("]]", 2)[0];
	if (tokenparts[0] !== "") elemSet.pushArray(tokenizer([tokenparts[0]], render_context=render_context));
        
	if (twobrackets.isValid(name)) {
	  // get attributes - all tokens between i + 1 and the token with ]]
	  // or just have no attrs if the tag ends here
	  var attrs = {};
          var endingToken;
	  if (token.indexOf(']]') === -1) {
            var result = create_token_set(tokens, i, "[[" + name, "]]", autoresolve_ends = false, tokenizer=tokenizer, render_context=render_context);
            if (!(result.found)) {
              elemSet.push(plaintext(token, true));
              continue; // should continue tokenizer main for loop
	    }
	    endingElems = result.endingToken;
	    i = result.newPos;

	    attrs = twobrackets.processAttrs(result.elemSet, name === "module");
	  } else {
            endingElems = token.split(']]', 2)[1];
	  }

	  // strip newlines from ending token if necessary
          if (endingElems && endingElems.length > 0 && endingElems[0] === '\n') endingElems = endingElems.substr(1);

	  // get all elements in between
	  var ending_result = create_token_set(tokens, i, "]]", "[[/" + name + "]]", false, tokenizer, render_context=render_context); // don't auto-tokenize the endings
	  if (ending_result.found) {
            var divElems = [];
            divElems.pushArray(ending_result.elemSet);
	    elemSet.push(twobrackets.createElem(tokenizer, name, attrs, divElems, render_context=render_context));
	    if (ending_result.endToken === "") ending_result.endToken = " ";
	    elemSet.pushArray(tokenizer([ending_result.endToken], render_context));
	    i = ending_result.newPos;
	  } else {
            elemSet.push(twobrackets.createElem(tokenizer, name, attrs, render_context=render_context));
	    elemSet.pushArray(tokenizer([endingElems], render_context=render_context));
	  }
	} else {
          elemSet.push(plaintext("[[" + name, true));
	}
      }
    } else if (isBQQualifyingToken(splitByNL) && top_level) {
      console.log("Token #" + i + " (" + token + ") qualifies as a blockquote");
      // collect all other blockquote tokens
      var invToken = token;
      var lineSet = [];
      while (isBQQualifyingToken(splitByNL)) {
        if (splitByNL[splitByNL.length - 2] === ">") {
	  i += 1; // advance to next token
	  console.log("Empty blockquote, advancing to the next token");
        } else {
          // we need to check if the next token is a qualifying token
          if (isBQQualifyingToken(tokens[i + 1].split("\n"))) {
            // if the next token qualifies for blockquote status, append a null line
	    lineSet.push([]);
            console.log("Pushing empty token set");
	    i += 1;
	  } else {
            // go until we find a qualifying token
            var line = [];
            var t = i + 1;
            for (; t < tokens.length; t++) {
	      console.log("Testing token \"" + tokens[t] + "\"");
              if (isBQQualifyingToken(tokens[t].split("\n"))) {
                // i = t;
		line.push(tokens[t].split("\n")[0]);
		lineSet.push(line);
		line = []
		console.log("Token is a qualifying token, ending line");
                break;
	      }
	      else {
	        line.push(tokens[t]);
		console.log("Token is not a qualifying token, appending to line");
	      }
	    }

	    // fix buffers
	    i = t;
	    if (line.length > 0)
	      lineSet.push(line);
	  }
	}
	if (i < tokens.length) {
	  invToken = tokens[i];
          splitByNL = invToken.split("\n");
	} else break;
      }
      console.log("Final set is " + JSON.stringify(lineSet));
      elemSet.push(blockquote(lineSet, tokenizer, render_context=render_context));
    } else if ((elSet = search_for_elem(tokens, i, boldness)).elemSet[0] !== -1) {
      //console.log("First elem is not -1");
      i = elSet.newIndex;
      for (var j = 0; j < elSet.elemSet.length; j++) elemSet.push(elSet.elemSet[j]);
    } else if ((elSet = search_for_elem(tokens, i, italics)).elemSet[0] !== -1) {
      i = elSet.newIndex;
      for (var j = 0; j < elSet.elemSet.length; j++) elemSet.push(elSet.elemSet[j]);
    } else if ((elSet = search_for_elem(tokens, i, underline)).elemSet[0] !== -1) {
      i = elSet.newIndex;
      for (var j = 0; j < elSet.elemSet.length; j++) elemSet.push(elSet.elemSet[j]);
    } else if ((elSet = search_for_elem(tokens, i, "--")).elemSet[0] !== -1) {
      i = elSet.newIndex;
      for (var j = 0; j < elSet.elemSet.length; j++) elemSet.push(elSet.elemSet[j]);
    } else {
      // get tokens, split by \n
      var pl_token = tokens[i].split("\n").join("<br />\n");
      
      var putSpaceAfter = true;
      if (i === tokens.length - 1 && !put_space_after_ltoken)
        putSpaceAfter = false;

      elemSet.push(plaintext(pl_token, putSpaceAfter));
    }
  }

  // filter out empty sets
  var pos;
  while ((pos = elemSet.indexOf([])) !== -1) elemSet.splice(pos, 1);

  // console.log("Final elemset is " + JSON.stringify(elemSet));
  return elemSet;
}

module.exports = tokenizer;
