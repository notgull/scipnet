// constructing modules
var fs = require('fs');
var path = require('path');
var process = require('process');

// load this only once
var mod_not_found_html = fs.readFileSync(path.join(__dirname, "not_found.html"));

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

	moduleList.push(mod);
      }
    //});
  });
});

// module.exports should take in name, args, content (elem set), tokenizer/context, and produce a string containing HTML
module.exports = function(name, args, content, tokenizer, render_context=null) {
  if (name === "") return "";
  
  alphaRegex = new RegExp("/^[a-z0-9]+$/i")
  if (!(alphaRegex.test(name))) {
    console.log("Attempted to load nonalphanumeric module " + name + ", check for hack attempt");
    return "";
  }

  // search for <name> in moduleList
  var found = false;
  for (var modpair in moduleList) {
    var [mName, loadedModule] = modpair;
    if (mName === name)
      return loadedModule.run(args, content, tokenizer, render_context=null);
  }
 
  var content = mod_not_found_html.split("[INSERT_MODNAME_HERE]").join(name);
  return content;
};
