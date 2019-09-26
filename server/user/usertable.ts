/*
 * usertable.ts
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

import { randomInt } from 'app/random';
import { Nullable } from 'app/helpers';

interface User {
  id: number;
  user: string;
  expiry: Date;
  ip_addrs: Array<string>
}

export class usertable {

  userset: Array<User>;
  prevId: number;

  constructor() {
    this.userset = [];
    this.prevId = 0;
  }

  // register a user and ip address into the user table
  register(user: string, ip_addr: string, expiry: Date, change_ip: boolean): number {
    // check if the user is already in here
    for (let i = 0; i < this.userset.length; i++) {
      let chckUser = this.userset[i];
      if (chckUser.user === user) {
	if (chckUser.ip_addrs.indexOf(ip_addr) === -1) {
	  if (!change_ip)
	    chckUser.ip_addrs.push(ip_addr);
	  else
	    chckUser.ip_addrs = [ip_addr];
	}
	return chckUser.id;
      }
    }

    let id = this.prevId;
    id += randomInt(2, 9);
    if (id > 2999999) id -= this.prevId;
    this.prevId = id;

    // it's much more random to use the UUID algoritm
    //var id = uuid();

    let userObj = {id: id,
                   user: user,
		   expiry: expiry,
		   ip_addrs: [ip_addr]};
    this.userset.push(userObj);

    // console.log("Added id " + id + " to table");

    return id;
  }

  // log a user out
  logout(id: number): void {
    for (let i = this.userset.length - 1; i >= 0; i--) {
      let chckUser = this.userset[i];
      if (chckUser.id === id) {
        this.userset.splice(i, 1);
        break;
      }
    }
  }

  // check to make sure a session conforms to the ip address
  check_session(session: number, ip_addr: string): Nullable<string> {
    //console.log("Checking for id " + session);
    for (let i = 0; i < this.userset.length; i++) {
      let chckUser = this.userset[i];
      //console.log("Comparing to id " + chckUser.id);
      if (chckUser.id === session) {
        if (chckUser.ip_addrs.indexOf(ip_addr) !== -1) {
          // console.log("Found user!");
          return chckUser.user;
        } else {
          // console.log("Found user, but IP address does not match");
          return null;
        }
      }
    }

    // console.log("Did not find user");
    return null;
  }

  // remove expired sessions from the database
  check_expiry() {
    let now = new Date();
    for (var i = this.userset.length - 1; i >= 0; i--) {
      let chckUser = this.userset[i];
      if (now > chckUser.expiry) {
        this.userset.splice(1, i);
      }
    }
  }

  // debug function
  _printUsers() {
    for (let i = 0; i < this.userset.length; i++) {
      console.log(JSON.stringify(this.userset[i]));
    }
  }
}

exports.global_usertable = new usertable();
