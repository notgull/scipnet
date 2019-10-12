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

import { UserTable } from 'app/services/user/usertable';
import { Password } from 'app/services/auth';
import { User } from 'app/services/user';

import { ArgsMapping } from 'app/services/pagereq';
import { Metadata } from 'app/services/metadata';
import { render } from 'app/services/render';
import { slugify } from 'app/slug';
import { runservice, runftmlservice } from 'app/old-service';
import { Nullable } from 'app/utils';
import { callJsonMethod } from 'app/utils/jsonrpc';
import { ErrorCode } from 'app/errors';

// get version
const version = require(path.join(process.cwd(), 'package.json')).version;
console.log(`SCPWiki v${version}`);

const port = config.get('services.scipnet.port');

// create folders before sql initialization
function checkDirs(names: Array<string>) {
  const baseDirectory = config.get('files.data.directory');

  for (const name of names) {
    const directory = path.join(baseDirectory, name);

    if (!(fs.existsSync(directory))) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }
}

// TODO: move init to separate function
checkDirs(['metadata', 'pages']);

// initialize node.js app
const app = express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(cookie_parser());

// create a table of user sessions
let ut = new UserTable();

// need a type to deal with parameters
type Params = { [key: string]: string };

// function that puts together login info for user
function loginInfo(req: express.Request): Nullable<string> {
  return ut.checkSession(Number(req.cookies.sessionId), req.ip);
}

// function to render a page
async function render_page_async(req: express.Request, isHTML: boolean, name: string, pageTitle: string): Promise<Nullable<string>> {
  if (isHTML) {
    return render('', name, pageTitle, loginInfo(req));
  } else {
    var md = await Metadata.load_by_slug(name);

    let title = pageTitle;
    if (pageTitle.length === 0)
      if (md)
        title = md.title;
      else
        title = "404";

    return render(name, '', title, loginInfo(req), md);
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

// TODO fix service execution
for (const service of services) {
  console.log(`Modname: ${service.modname}`);
  if (service.modname !== "ftml") {
    runservice(service.modname, service.config as any);
  } else {
    runftmlservice();
  }
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
  render_page(req, true, '../templates/login.j2', "Login",
        (d) => {res.send(d)});
});

const dayConstant = 86400000;

// post request - used for logging in
app.post("/sys/process-login", async function(req: express.Request, res: express.Response) {
  const { username, password } = req.body;
  const pushExpiry = (req.body.remember === "true");
  const changeIp = (req.body.change_ip === "true");
  const newUrl = req.query.new_url || "";

  // firstly, validate both whether the user exists and whether the password is correct
  // TODO don't tell the user that the user exists
  const user = await User.loadByName(username);
  if (user === null) {
    res.json({
      error: ErrorCode.USER_NOT_FOUND,
    });
    return;
  }

  const pwd = await Password.loadById(user.userId);
  if (!pwd.validate(password)) {
    res.json({
      error: ErrorCode.PASSWORD_INCORRECT,
    });
    return;
  }

  // add user to user table
  const expiry = new Date();
  if (pushExpiry) {
    expiry.setDate(expiry.getDate() + 7);
  } else {
    expiry.setDate(expiry.getDate() + 1);
  }

  let sessionId = ut.register(user, req.ip, expiry, changeIp);
  console.log(`Logged session ${sessionId}`);
  res.cookie("sessionId", sessionId, { maxAge: 8 * dayConstant });
  res.redirect(`/${newUrl}`);
});

// hookup to PRS system
app.post("/sys/pagereq", function(req: express.Request, res: express.Response) {
  console.log(`pagereq: ${JSON.stringify(req.body)}`);

  const username = ut.checkSession(parseInt(req.body.sessionId, 10), req.ip);

  // pull all parameters from req.body and put them in args
  const args: ArgsMapping = {};
  for (const key in req.body) {
    args[key] = req.body[key];
  }

  args.username = username;

  // TODO: replace this with whatever event bus system we come up with
  callJsonMethod("pagereq", args, config.get('services.pagereq.host'), config.get('services.pagereq.port')).then((response: any) => {
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
  render_page(req, true, '../templates/register.j2', 'Register',
             (d) => {res.send(d);});
});

// process registration
app.post("/sys/process-register", function(req: express.Request, res: express.Response) {
  let { username, pwHash, email } = req.body;

  function redirectErr(errCode: number) { res.redirect("/sys/register?errors=" + errCode); }

  // check to ensure that there aren't any errors
  if (username.length === 0) { redirectErr(4); return; }
  if (pwHash.length === 0) { redirectErr(16); return; }
  if (email.length === 0) { redirectErr(8); return; }
  if (pwHash.length < 8) { redirectErr(32); return; }

  // TODO use the user package instead of reimplementing
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

  console.log(`RENDERING: ${slug}`);

  render_page(req, false, pageid, '',
              (d) => {
              if (!d) throw new Error("THIS SHOULD NOT RETURN NULL");
              else res.send(d);
            });
});

// load javascript files
app.get("/sys/bundle.js", function(req: express.Request, res: express.Response) {
  let script = fs.readFileSync("../frontend/release/bundle.js");
  res.type("application/javascript");
  res.send(script);
});

app.get("/", function(req, res) {
  render_page(req, false, 'main', '',
              (d) => {res.send(d);});
});

// initialize http servers
const httpServer = http.createServer(app);

httpServer.listen(port);
