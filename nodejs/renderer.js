
// this file renders html from markdown stored in data files
var markdown = require('./markdown/markdown');
var fs = require('fs');

exports.render = function(modName, htmlFileName = '', title = 'Testing Page', loginInfo = false) {
  var template = fs.readFileSync('html/template.html');
  template = template + ''; // ensure template is a string
  const replacement_string = "[INSERT_CONTENT_HERE]";
 
  // get username, if it exists
  var username;
  var loginBar;
  if (loginInfo) {
    username = loginInfo;
    loginBar = fs.readFileSync('html/lbar_li.html');
  } else
    loginBar = fs.readFileSync('html/lbar_nli.html');

  var content;
  if (!htmlFileName || htmlFileName.length === 0) {
    var markdown_tree = markdown(modName);
    content = markdown_tree.flatten(username);
  } else {
    content = '' + fs.readFileSync(htmlFileName);
  }

  const lb_replacement_string = "[INSERT_LOGINBAR_HERE]";

  const mt_replacement_string = "[INSERT_META_TITLE_HERE]";
  var meta_title;
  if (modName === "main") meta_title = '';
  else meta_title = title + " - ";

  const t_replacement_string = "[INSERT_TITLE_HERE]";
  const u_replacement_string = "[INSERT_USERNAME_HERE]";
  
  var page = template.split(replacement_string).join(content);
  page = page.split(mt_replacement_string).join(meta_title);
  page = page.split(t_replacement_string).join(title);
  page = page.split(lb_replacement_string).join(loginBar);
  page = page.split(u_replacement_string).join(username);

  return page;
}
