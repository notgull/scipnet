/*
 * index.ts
 *
 * scipnet - Multi-tenant writing wiki software
 * Copyright (C) 2019 not_a_seagull, Ammon Smith
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

import { config } from 'app/config';

import { autocreate } from 'app/metadata/autocreate_404';
import * as metadata from 'app/metadata';
import { initialize_pages } from 'app/metadata/initialize_database';

import { initialize_users }  from 'app/user/initialize_database';
import { UserTable } from 'app/user/usertable';
import * as validate from 'app/user/validate';

import { ArgsMapping } from 'app/pagereq';
import * as renderer from 'app/renderer';
import { slugify } from 'app/slug';
import * as service from 'app/service';
import { Nullable } from 'app/utils';
import { send_jsonrpc_message } from 'app/utils/jsonrpc';
import { ErrorCode } from 'app/errors';

// get version
const version = require(path.join(process.cwd(), 'package.json')).version;
console.log("SCPWiki v" + version);

let s_port = config.get('services.scipnet.port');

// create folders before sql initialization
function check_dir(dirname: string) {
  if (!(fs.existsSync(dirname))) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

check_dir(config.get('files.data.content'));
check_dir(config.get('files.data.metadata'));
check_dir(config.get('files.data.diff'));
check_dir(config.get('files.data.attachments'));

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
app.use(cookie_parser());

// load ssl certs
const certs = { key: fs.readFileSync('certs/scpwiki.key'),
                cert: fs.readFileSync('certs/scpwiki.pem') };

// create a table of user sessions
let ut = new UserTable();

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
  return ut.check_session(Number(req.cookies.sessionId), ip_addr);
}

// function to render a page
async function render_page_async(req: express.Request, isHTML: boolean, name: string, pageTitle: string): Promise<Nullable<string>> {
  if (isHTML) {
    return renderer.render('', name, pageTitle, loginInfo(req));
  } else {
    var md = await metadata.Metadata.load_by_slug(name);

    let title = pageTitle;
    if (pageTitle.length === 0)
      if (md)
        title = md.title;
      else
        title = "404";

    return renderer.render(name, '', title, loginInfo(req), md);
  }
}

function render_page(req: express.Request, isHTML: boolean, name: string, pageTitle: string, next: (s: Nullable<string>) => any): void {
  render_page_async(req, isHTML, name, pageTitle).then((r) => {
    next(r);
  }).catch((err) => {throw err;});
}

/*
 Services

 This is DEFINITELY going to go in a different file sometime soon, once we get an actual
 service manager and such up and running.
*/

const services = [
  {
    modname: "pagereq",
    config: {
      hosts: [
        {
          address: config.get('services.pagereq.host'),
          port: config.get('services.pagereq.port'),
        },
      ],
    },
  },
  {
    modname: "ftml",
    config: {},
  },
];

let sel_service: any;
for (let i = 0; i < services.length; i++) {
  sel_service = services[i];
  console.log("Modname: " + sel_service.modname);
  if (sel_service.modname !== "ftml")
    service.runservice(sel_service.modname, sel_service.config);
  else
    service.runftmlservice();
}

// special files
app.get("/favicon.ico", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("../images/icon.ico"));
});

app.get("/sys/images/background.png", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("../images/body_bg.png"));
});

// bauhaus font css
app.get("/sys/fonts/font-bauhaus.css", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("../css/font-bauhaus.css"));
});

app.get("/sys/fonts/itc-bauhaus-lt-demi.ttf", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("../css/itc-bauhaus-lt-demi.ttf"));
});

app.get("/sys/fonts/itc-bauhaus-lt-demi.eot", function(req: express.Request, res: express.Response) {
  res.send(fs.readFileSync("../css/itc-bauhaus-lt-demi.eot"));
});

// get login page
app.get("/sys/login", function(req: express.Request, res: express.Response) {
  render_page(req, true, '../templates/login.html', "Login",
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

    if (result !== 0) res.redirect("/sys/login?errorCode=" + result);
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
app.post("/sys/pagereq", function(req: express.Request, res: express.Response) {
  let ip_addr = getIPAddress(req);

  console.log("PRS Request: " + JSON.stringify(req.body));

  // get username
  let username = ut.check_session(parseInt(req.body.sessionId, 10), ip_addr);

  // pull all parameters from req.body and put them in args
  let args: ArgsMapping = {};
  for (var key in req.body)
    args[key] = req.body[key];
  args["username"] = username;

  // TODO: replace this with whatever event bus system we come up with
      send_jsonrpc_message("pagereq", args, config.get('services.pagereq.host'), config.get('services.pagereq.port')).then((response: any) => {
    let result = response.result;
    if (result.errorCode === -1) {
      console.error(result.error);
      result.error = "An internal error occurred. Please contact a site administrator.";
    }
    console.log("RESULT: " + JSON.stringify(result));
    res.send(JSON.stringify(result));
  });
});

// get registration page
app.get("/sys/register", function(req: express.Request, res: express.Response) {
  render_page(req, true, '../templates/register.html', 'Register',
             (d) => {res.send(d);});
});

function onEmailVerify(username: string, pwHash: string, email: string): void {
  validate.add_new_user(username, email, pwHash, (i: number, err: Error) => {
    console.log("Err: " + i + "\n" + err);
  });
};

// process registration
app.post("/sys/process-register", function(req: express.Request, res: express.Response) {
  let { username, pwHash, email } = req.body;

  function redirectErr(errCode: number) { res.redirect("/sys/register?errors=" + errCode); }

  // check to ensure that there aren't any errors
  if (username.length === 0) { redirectErr(4); return; }
  if (pwHash.length === 0) { redirectErr(16); return; }
  if (email.length === 0) { redirectErr(8); return; }
  if (pwHash.length < 8) { redirectErr(32); return; }

  // make sure neither the username nor the email exist
  validate.check_user_existence(username, function(result: any, err: Error): void {
    //console.log(err);
    if (result == ErrorCode.INTERNAL_ERROR) {
      console.log(err);
      res.redirect('/sys/register?errors=512');
    } else if (result !== ErrorCode.USER_NOT_FOUND) {
      res.redirect('/sys/register?errors=128')
    } else {
      validate.check_email_usage(email, function(result: number, err: Error) {
        if (result === ErrorCode.INTERNAL_ERROR) {
          //console.log(err);
        res.redirect('/sys/register?errors=512');
        } else if (result !== ErrorCode.EMAIL_NOT_FOUND)
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
  let user_id = req.cookies["session_id"];
  let new_location = req.query.new_url || "";
  ut.logout(user_id);

  res.redirect('/' + new_location);
});

// get generic page
app.get("/:pageid", function(req, res) {
  const params: Params = req.params as Params;
  let pageid = params['pageid'];

  let slug = slugify(pageid);
  if (slug !== pageid) {
    res.redirect('/' + slug);
    return;
  }

  console.log("RENDERING: " + slug);

  render_page(req, false, pageid, '',
              (d) => {
              if (!d) throw new Error("THIS SHOULD NOT RETURN NULL");
              else res.send(d);
            });
});

// load javascript files
app.get("/sys/js/:script", function(req, res) {
  const params: Params = req.params as Params;
  let scriptName = params['script'];
  let scriptPath = path.join("../frontend/dist", scriptName);
  if (!fs.existsSync(scriptPath)) scriptPath = "../frontend/dist/404.js";

  let script = fs.readFileSync(scriptPath);
  res.type("application/javascript");
  res.send(script);
});

app.get("/", function(req, res) {
  render_page(req, false, 'main', '',
              (d) => {res.send(d);});
});

// initialize http servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(certs, app);

httpServer.listen(8002);
httpsServer.listen(s_port);
