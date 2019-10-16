/*
 * handler.ts
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

// note to mallard: I know that we're probably turning the renderer into a service or something in the future
// this will probably need reworking at that point
// this file creates a renderer for the scipnet app

import { config } from "app/config";
import { Metadata } from "app/services/metadata";
import { Nullable } from "app/utils";
import { render } from "app/services/render";
import { ScipnetJsonApp, ScipnetInformation, ScipnetOutput } from "app/server";
import { slugify } from "app/slug";
import { UserTable } from "app/services/user/usertable";

// render a page from a request and a usertable
async function renderPage(req: ScipnetInformation, 
                          isHTML: boolean,
                          name: string, 
                          pageTitle: string,
                          usertable: UserTable): Promise<Nullable<string>> {
  const loginInfo = usertable.check_session(Number(req.cookies.sessionId), req.ip);
  if (isHTML) {
    return render("", name, pageTitle, loginInfo);
  } else {
    var md = await Metadata.load_by_slug(name);

    let title = pageTitle;
    if (pageTitle.length === 0)
      if (md)
        title = md.title;
      else
        title = "404";

    return render(name, "", title, loginInfo, md);
  }
}

export function populateApp(app: ScipnetJsonApp) {
  app.pageHandle = async function(req: ScipnetInformation, res: ScipnetOutput, ut: UserTable): Promise<void> {
    const pageid = req.params["pageid"];
    
    let slug = slugify(pageid);
    if (slug !== pageid) {
      res.redirect(`/${slug}`);
      return;
    }

    res.send(await renderPage(req, false, pageid, "", ut));
  };

  app.mainHandle = async function(req: ScipnetInformation, res: ScipnetOutput, ut: UserTable): Promise<void> {
    res.send(await renderPage(req, false, "main", "", ut));
  };

  app.loginHandle = async function(req: ScipnetInformation, res: ScipnetOutput, ut: UserTable): Promise<void> {
    res.send(await renderPage(req, true, config.get("files.pages.login"), "Login", ut));
  };

  app.registerHandle = async function(req: ScipnetInformation, res: ScipnetOutput, ut: UserTable): Promise<void> {
    res.send(await renderPage(req, true, config.get("files.pages.register"), "Register", ut));
  };
}

