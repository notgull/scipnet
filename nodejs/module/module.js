// constructing modules
var fs = require('fs');
var path = require('path');
var process = require('process');

// load this only once
var mod_not_found_html = "" + fs.readFileSync(path.join(__dirname, "not_found.html"));

// load all modules up front
moduleList = [];
fs.readdir(__dirname, function(err, files) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  files.forEach(function(file, index) {
    //fs.stat(file, function(err, stat) {
    //  if (err) {
    //    console.error(err);
    //    process.exit(1);
    //  }
     
      // if it is a file and a .js file, load it!
      if (/*stat.isFile() &&*/ path.extname(file) == ".js") {
        name = path.parse(file).name;
	mod = [name, require('./' + name)];
	//console.log(mod);

	moduleList.push(mod);
      }
    //});
  });
});

// helper function to tell if a string is alphanumeric
var isAlphanumeric = function(str) {
  var ch;
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i);
    if (!(ch > 47 && ch < 58) &&  // numeric (0-9)
        !(ch > 64 && ch < 91) &&  // upper alpha (A-Z)
        !(ch > 96 && ch < 123))   // lower alpha (a-z)
      return false;
  }
  return true;
};

// module.exports should take in name, args, content (elem set), tokenizer/context, and produce a string containing HTML
module.exports = function(name, args, content, tokenizer, render_context) {
  if (name === "") return "";
  
  // alphaRegex = new RegExp("/^[a-z0-9]+$/i")
  if (!(isAlphanumeric(name))) {
    console.log("Attempted to load nonalphanumeric module " + name + ", check for hack attempt");
    return "";
  }

  // search for <name> in moduleList
  console.log('render_context is ' + JSON.stringify(render_context));
  var found = false;
  //console.log(moduleList);
  for (var i = 0; i < moduleList.length; i++) {
    var modpair = moduleList[i];
    var mName = modpair[0];
    var loadedModule = modpair[1];
    //console.log("mName is " + mName + ", name is " + name);
    if (mName === name)
      return loadedModule.run(args, content, tokenizer, render_context=render_context);
  }
 
  var content = mod_not_found_html.split("[INSERT_MODNAME_HERE]").join(name);
  return content;
};
