/*
 * server/login.ts
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

import { ScipnetHttpsApp, ScipnetRequest, ScipnetResponse } from "app/server";
import { User } from "app/services/user";
import { Usertable } from "app/services/user/usertable";

export function populateApp(app: ScipnetHttpsApp) {
  app.processLoginHandle = async (req: ScipnetRequest, res: ScipnetResponse, ut: Usertable): Promise<void> {
    let { username, pwHash } = req.body;
    let pushExpiry = (req.body.remember === "true");
    let changeIp = (req.body.changeIp === "true");
    let newUrl = req.params.newurl || "";
    
    const user = await User.loadByUsername(username);
    if (!user) {
      res.redirect("/sys/login/errorcode/512");
      return;
    }

    // validate the password
    const result = await user.validate(pwHash);
    if (result !== ErrorCode.SUCCESS) {
      res.redirect(`/sys/login/errorcode/${result}`);
    } else {
      const expiry = new Date();
      if (pushExpiry) {
        expiry.setDate(expiry.getDate() + 7);
      } else {
        expiry.setDate(expiry.getDate() + 1);
      }

      const sessionId = ut.register(user, req.ip, expiry, changeIp);
      res.cookie("sessionId", sessionId, 8 * 86400000);
      res.redirect(`/${newUrl}`);
    }
  }; 

  app.processRegisterHandle = async (req: ScipnetRequest, res: ScipnetResponse): Promise<void> {

  };
}
