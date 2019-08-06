/*
 * index.js
 *
 * scipnet - SCP Hosting Platform
 * Copyright (C) 2019 not_a_seagull
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var body_parser = require('body-parser');
var cookie_parser = require('cookie-parser');
var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var util = require('util');

var ut_initializer = require("./nodejs/user/initialize_database");
var mt_initializer = require("./nodejs/metadata/initialize_database");

var metadata = require('./nodejs/metadata/metadata');
var prs = require('./nodejs/metadata/prs');
var renderer = require('./nodejs/renderer');
var usertable = require('./nodejs/user/usertable');
var validate = require('./nodejs/user/validate');

// get version
var version = require('./package.json').version;
console.log("SCPWiki v" + version);

// error out if not root
if (process.geteuid) {
  if (process.geteuid() !== 0) {
    console.error("Error: Must be run as root");
    process.exit(1);
  }
}

// if we can't access config.json, return
require('./config.json');

var s_port = process.env.PORT || 8443;

// load up the SQL before we start up
ut_initializer((_o) => {});
mt_initializer((_o) => {});

// initialize node.js app
var app = express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true, }));
//app.use(express.json());
//app.use(express.urlencoded());
app.use(cookie_parser());

// load ssl certs
var certs = { key: fs.readFileSync('certs/scpwiki.key'),
	      cert: fs.readFileSync('certs/scpwiki.pem') };

// create a table of user sessions
var ut = usertable();

// function that puts together login info for user
function loginInfo(req) {
  var ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress; 
  return ut.check_session(Number(req.cookies["sessionId"]), ip_addr);
}

// if the css theme is requested, return it
//app.get("/special/css", function(req, res) {
//  res.send(fs.readFileSync("css/scp-sigma-9.css"));
//});

// special files
app.get("/favicon.ico", function(req, res) {
  res.send(fs.readFileSync("images/icon.ico"));
});

app.get("/special/background.png", function(req, res) {
  res.send(fs.readFileSync("images/body_bg.png"));
});

// bauhaus font css
app.get("/special/font-bauhaus.css", function(req, res) {
  res.send(fs.readFileSync("css/font-bauhaus.css"));
});

app.get("/special/itc-bauhaus-lt-demi.ttf", function(req, res) {
  res.send(fs.readFileSync("css/itc-bauhaus-lt-demi.ttf"));
});

app.get("/special/itc-bauhaus-lt-demi.eot", function(req, res) {
  res.send(fs.readFileSync("css/itc-bauhaus-lt-demi.eot"));
});

// get login page
app.get("/login", function(req, res) {
  var login = renderer.render('', 'html/login.html', 'Login', loginInfo(req)); 
  res.send(login);
});

const day_constant = 86400000;

// post request - used for logging in
app.post("/process-login", function(req, res) {
  var username = req.body.username;
  var pwHash = req.body.pwHash;
  var push_expiry = (req.body.remember === "true");
  var change_ip = (req.body.change_ip === "true");
  var new_url = req.body.new_url || "/";

  // firstly, validate both whether the user exists and whether the password is correct
  validate.validate_user(username, pwHash, (result, err) => {
    if (result === 3) console.log(err);

    if (result !== 0) res.redirect("/login?errorCode=" + result);
    else {
      // add user to user table
      var ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      var expiry = new Date();
      if (push_expiry)
	expiry.setDate(expiry.getDate() + 7);
      else
	expiry.setDate(expiry.getDate() + 1);

      var sessionId = ut.register(username, ip_addr, expiry, change_ip);
      console.log("Logged session " + sessionId);
      res.cookie("sessionId", sessionId, { maxAge: 8 * day_constant });
      res.redirect(new_url);
    }
  });
});

// hookup to PRS system
app.post("/prs", function(req, res) {
  var ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress; 

  //console.log("PRS Request: " + JSON.stringify(req.body));

  // get username
  var username = ut.check_session(parseInt(req.body.sessionId, 10), ip_addr);
  //console.log(username);
  if (username) {
    // pull all parameters from req.body and put them in args
    var args = {};
    for (var key in req.body)
      args[key] = req.body[key];
    prs.request(args["name"], username, args, function(result) {
      res.send(JSON.stringify(result));
    });
  } else {
    res.send(JSON.stringify({not_logged_in: true, result: false}));
  }
});

// get registration page
app.get("/register", function(req, res) {
  var register = renderer.render('', 'html/register.html', 'Register', loginInfo(req));
  res.send(register);
});

var onEmailVerify = function(username, pwHash, email) {
  validate.add_new_user(username, email, pwHash, (i, err) => {
    console.log("Err: " + i + "\n" + err);
  });
};

// process registration
app.post("/process-register", function(req, res) {
  var username = req.body.username;
  var pwHash = req.body.pwHash;
  var email = req.body.email;

  // make sure neither the username nor the email exist
  validate.check_user_existence(username, function(result, err) {
    //console.log(err);
    if (result == validate.INTERNAL_ERROR) {
      console.log(err);
      res.redirect('/register?errors=512');
    } else if (result !== validate.USER_NOT_FOUND) {
      res.redirect('/register?errors=128')
    } else {
      validate.check_email_usage(email, function(result, err) {
        if (result === validate.INTERNAL_ERROR) {
          //console.log(err);
          res.redirect('/register?errors=512');
	} else if (result !== validate.EMAIL_NOT_FOUND)
	  res.redirect('/register?errors=256');
	else {
          // TODO: verify via email
          res.redirect('/');
          onEmailVerify(username, pwHash, email);
	}
      });
    }
  });
});

// get generic page
app.get("/:pageid", function(req, res) {
  // TODO: render username
  var pageid = req.params.pageid;
  metadata(pageid, (pMeta, err) => {
    if (pMeta === 3 || !pMeta) res.redirect('/_404');
    else res.send(renderer.render(pageid, '', 'Testing Page', loginInfo(req), pMeta));
  });
});

// load javascript files
app.get("/js/:script", function(req, res) {
  var scriptName = req.params.script;
  var scriptPath = "js/" + scriptName;
  if (!fs.existsSync(scriptPath)) scriptPath = "js/404.js";

  var script = fs.readFileSync(scriptPath);
  res.send(script);
});

app.get("/", function(req, res) {
  metadata("main", (pMeta, err) => {
    if (pMeta === 3 || !pMeta) res.redirect('/_404');
    else res.send(renderer.render("main", '', '', loginInfo(req), pMeta));
  });
});

// initialize http servers
var httpServer = http.createServer(app);
var httpsServer = https.createServer(certs, app);

httpServer.listen(8000);
httpsServer.listen(s_port);
