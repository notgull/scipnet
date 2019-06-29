// compare e characters from back
var strecmp = function(str1, str2, n) {
  var rstr1 = (str1 + '');
  var rstr2 = (str2 + '');
  var part1 = str1.substring(str1.length - n, str1.length);
  var part2 = str2.substring(str2.length - n, str2.length);
}

// TODO: resolve tokenizer loop
module.exports = function(tokens, i, delimiter1, delimiter2 = delimiter1, autoresolve_ends = true, tokenizer = null, render_context=null) {
  var token = tokens[i];
  var elemSet = [];

  console.log('tokenset: render_context is ' + render_context);
 
  var beginToken, endToken = "";

  if (!tokenizer) autoresolve_ends = false;

  var token_parts = token.split(delimiter1, 2);
  var token_split = false;
  if (token_parts[0] != "") { // only one token part if the first elem is 0
    beginToken = token_parts[0];
    token_split = true;
  }

  var firstBoldToken = token_parts[1];
  var bold_token_set = [firstBoldToken];

  // search for second bold token
  var j, newPos;
  var found = false;
  for (j = i; j < tokens.length; j++) {
    // if we're running on the same token as before, expunge the past token
    var compare_token = tokens[j];
    if (i == j && delimiter1 === delimiter2) {
      //console.log("Compare token might be " + compare_token);
      var compare_token_parts = compare_token.split(delimiter2, 3);
      //console.log(compare_token_parts);
      if (strecmp(compare_token, delimiter2, 2)) compare_token_parts.push("");
      compare_token = compare_token_parts.slice(1, compare_token_parts.length).join(delimiter2);
      //console.log("i == j, compare token is \"" + compare_token + "\"");
    }

    if (compare_token.indexOf(delimiter2) !== -1) {
      //console.log("> Found next boldness token: " + tokens[j]);
      // special case: if this is the same token, adjust accordingly
      var split_additive = (i == j && token_split) ? 1 : 0;
      var token_parts = tokens[j].split(delimiter2);
      //console.log(JSON.stringify(token_parts));
      if (i == j && token_parts[token_parts.length - 1] === "") endToken = ""; 
      else endToken = token_parts[1 + split_additive];

      // create set
      for (var k = i + 1; k < j; k++) bold_token_set.push(tokens[k]);

      var secondBoldToken = token_parts[split_additive];
      if (i !== j) bold_token_set.push(secondBoldToken);

      found = true;
      newPos = j;
      break;
    }
  }

  // compose return value
  if (!found) {
    elemSet.splice(0, 0, beginToken);
    elemSet.push(endToken);
    return {found: false, elemSet: tokenizer(elemSet, true, false, render_context=render_context)};
  } else {
    var result = {
      found: true,
      beginToken: beginToken,
      endToken: endToken,
      newPos: newPos,
    };
    
    var last_elem_split = false;
    if (endToken !== "") {
      last_elem_split = true;
    } //else bold_token_set[bold_token_set.length - 1] += " ";

    result.elemSet = bold_token_set;
    result.last_elem_split = last_elem_split;

    // tokenize the ends if necessary
    if (autoresolve_ends) {
      result.beginElems = tokenizer([beginToken], false, false, render_context=render_context);
      result.endElems = tokenizer([endToken], true, false, render_context=render_context);
    }

    return result;
  }
};
