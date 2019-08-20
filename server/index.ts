/*
 * index.ts
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

import * as body_parser from 'body-parser';
import * as cookie_parser from 'cookie-parser';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

import { autocreate } from './metadata/autocreate_404';
import { initialize_users }  from './user/initialize_database';
import { initialize_pages } from './metadata/initialize_database';

import { Nullable } from './helpers'
import * as metadata from './metadata/metadata';
import * as prs from './prs/prs';
import * as renderer from './renderer';
import { usertable } from './user/usertable';
import * as validate from './user/validate';

// get version
const version = require(path.join(process.cwd(), 'package.json')).version;
console.log("SCPWiki v" + version);

// if we can't access config.json, return
require(path.join(process.cwd(), 'config.json'));

let s_port = process.env.PORT || 8443;

// load up the SQL before we start up
initialize_users((_o: any) => {
  initialize_pages((_o: any) => {
    autocreate((_o: any) => {});
  });
});

// initialize node.js app
const app = express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
//app.use(express.json());
//app.use(express.urlencoded());
app.use(cookie_parser());

// load ssl certs
const certs = { key: fs.readFileSync('certs/scpwiki.key'),
                cert: fs.readFileSync('certs/scpwiki.pem') };

// create a table of user sessions
let ut = new usertable();

// need a type to deal with parameters
type Params = { [key: string]: string };

// get an ip address from a request
function getIPAddress(req: express.Request): string {
  //return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  return req.ip;
}

// function that puts together login info for user
function loginInfo(req: express.Request): Nullable<string> {
  var ip_addr = getIPAddress(req); 
  return ut.check_session(Number(req.cookies["sessionId"]), ip_addr);
}

// function to render a page
async function render_page_async(req: express.Request, isHTML: boolean, name: string, pageTitle: string): Promise<Nullable<string>> {
  //console.log("Rendering page with: ");
  //console.log(Array.from(arguments));

  if (isHTML) {
    return await renderer.render('', name, pageTitle, loginInfo(req));
  } else {
    var md = await metadata.metadata.load_by_slug(name);
    if (!md) return null;

    let title = pageTitle;
    if (pageTitle.length === 0)
      title = md.title;

    return await renderer.render(name, '', title, loginInfo(req), md);
  }
}

function render_page(req: express.Request, isHTML: boolean, name: string, pageTitle: string, next: (s: Nullable<string>) => any): void {
  render_page_async(req, isHTML, name, pageTitle).then((r) => {
    next(r);
  }).catch((err) => {throw err;});
}

// if the css theme is requested, return it
//app.get("/special/css", function(req, res) {
//  res.send(fs.readFileSync("css/scp-sigma-9.css"));
//});

// special files
app.get("/favicon.ico", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("images/icon.ico"));
});

app.get("/sys/images/background.png", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("images/body_bg.png"));
});

// bauhaus font css
app.get("/sys/fonts/font-bauhaus.css", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("css/font-bauhaus.css"));
});

app.get("/sys/fonts/itc-bauhaus-lt-demi.ttf", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("css/itc-bauhaus-lt-demi.ttf"));
});

app.get("/sys/fonts/itc-bauhaus-lt-demi.eot", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("css/itc-bauhaus-lt-demi.eot"));
});

// get login page
app.get("/sys/login", function(req: express.Request, res: express.Response) {
  //var login = renderer.render('', 'html/login.html', 'Login', loginInfo(req)); 
  //res.send(login);

 render_page(req, true, 'html/login.html', "Login",
	  (d) => {res.send(d)});
});

const day_constant = 86400000;

// post request - used for logging in
app.post("/sys/process-login", function(req: express.Request, res: express.Response) {
  let username = req.body.username;
  let pwHash = req.body.pwHash;
  let push_expiry = (req.body.remember === "true");
  let change_ip = (req.body.change_ip === "true");
  let new_url = req.query.new_url || "";

  // firstly, validate both whether the user exists and whether the password is correct
  validate.validate_user(username, pwHash, (result: number, err: Error) => {
    if (result === 3) console.log(err);

    if (result !== 0) res.redirect("/login?errorCode=" + result);
    else {
      // add user to user table
      let ip_addr = getIPAddress(req);
      let expiry = new Date();
      if (push_expiry)
	expiry.setDate(expiry.getDate() + 7);
      else
	expiry.setDate(expiry.getDate() + 1);

      let sessionId = ut.register(username, ip_addr, expiry, change_ip);
      console.log("Logged session " + sessionId);
      res.cookie("sessionId", sessionId, { maxAge: 8 * day_constant });
      res.redirect('/' + new_url);
    }
  });
});

// hookup to PRS system
app.post("/sys/prs", function(req: express.Request, res: express.Response) {
  let ip_addr = getIPAddress(req); 

  //console.log("PRS Request: " + JSON.stringify(req.body));

  // get username
  let username = ut.check_session(parseInt(req.body.sessionId, 10), ip_addr);
  
  // pull all parameters from req.body and put them in args
  let args: prs.ArgsMapping = {};
  for (var key in req.body)
    args[key] = req.body[key];
  prs.request(args["name"], username, args, function(result: prs.PRSReturnVal) {
  if (result.errorCode === -1) {
      console.log(result.error);
      result.error = "An internal error occurred. Please contact a site administrator.";
    }
    res.send(JSON.stringify(result));
  });
});

// get registration page
app.get("/sys/register", function(req: express.Request, res: express.Response) {
  //var register = renderer.render('', 'html/register.html', 'Register', loginInfo(req));
  //res.send(register);

  render_page(req, true, 'html/register.html', 'Register', 
	       (d) => {res.send(d);});
});

var onEmailVerify = function(username: string, pwHash: string, email: string): void {
  validate.add_new_user(username, email, pwHash, (i: number, err: Error) => {
    console.log("Err: " + i + "\n" + err);
  });
};

// process registration
app.post("/sys/process-register", function(req: express.Request, res: express.Response) {
  let username = req.body.username;
  let pwHash = req.body.pwHash;
  let email = req.body.email;

  // make sure neither the username nor the email exist
  validate.check_user_existence(username, function(result: any, err: Error): void {
    //console.log(err);
    if (result == validate.INTERNAL_ERROR) {
      console.log(err);
      res.redirect('/sys/register?errors=512');
    } else if (result !== validate.USER_NOT_FOUND) {
      res.redirect('/sys/register?errors=128')
    } else {
      validate.check_email_usage(email, function(result: number, err: Error) {
        if (result === validate.INTERNAL_ERROR) {
          //console.log(err);
	  res.redirect('/sys/register?errors=512');
        } else if (result !== validate.EMAIL_NOT_FOUND)
	  res.redirect('/sys/register?errors=256');
        else {
          // TODO: verify via email
	  res.redirect('/sys/login');
          onEmailVerify(username, pwHash, email);
        }
      });
    }
  });
});

// log a user out of the system
app.use("/sys/process-logout", function(req: express.Request, res: express.Response) {
  //var username = loginInfo(req);
  //var ip_addr = getIPAddress(req);

  let user_id = req.cookies["session_id"];
  let new_location = req.query.new_url || "";
  ut.logout(user_id);
  
  res.redirect('/' + new_location);
});

// get generic page
app.get("/:pageid", function(req, res) {
  // TODO: render username
  const params: Params = req.params as Params;
  let pageid = params['pageid'];

  render_page(req, false, pageid, '', 
	        (d) => {
		  if (!d) res.redirect("/_404?original_page=" + pageid);	
		  else res.send(d);
		});
});

// load javascript files
app.get("/sys/js/:script", function(req, res) {
  const params: Params = req.params as Params;
  let scriptName = params['script'];
  let scriptPath = path.join("../client", scriptName);
  if (!fs.existsSync(scriptPath)) scriptPath = "js/404.js";

  let script = fs.readFileSync(scriptPath);
  res.send(script);
});

app.get("/", function(req, res) {
  render_page(req, false, 'main', '',
	        (d) => {res.send(d);});
});

// initialize http servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(certs, app);

httpServer.listen(8000);
httpsServer.listen(s_port);
