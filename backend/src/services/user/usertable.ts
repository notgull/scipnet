/*
 * services/user/usertable.ts
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

import { randomInt } from 'app/utils/random';
import { Nullable } from 'app/utils';
import { User } from 'app/services/user';

export interface UserIdPair {
  id: number;
  user: User;
  expiry: Date;
  ipAddrs: Array<string>
}

export class UserTable {
  userset: Array<UserIdPair>;
  prevId: number;

  constructor() {
    this.userset = [];
    this.prevId = 0;
  }

  register(user: User, ipAddr: string, expiry: Date, changeIp: boolean): number {
    // check if the user is already in here
    for (let i = 0; i < this.userset.length; i++) {
      let chckUser = this.userset[i];
      if (chckUser.user === user) {
        if (chckUser.ipAddrs.indexOf(ipAddr) === -1) {
          if (!changeIp) {
            chckUser.ipAddrs.push(ipAddr);
          } else {
            chckUser.ipAddrs = [ipAddr];
          }
        }
        return chckUser.id;
      }
    }

    let id = this.prevId;
    id += randomInt(2, 9);
    if (id > 2999999) {
      id -= this.prevId;
    }

    this.prevId = id;
    this.userset.push({
      id,
      user,
      expiry,
      ipAddrs: [ipAddr],
    });

    return id;
  }

  logout(id: number): void {
    for (let i = this.userset.length - 1; i >= 0; i--) {
      let chckUser = this.userset[i];
      if (chckUser.id === id) {
        this.userset.splice(i, 1);
        break;
      }
    }
  }

  checkSession(session: number, ipAddr: string): Nullable<string> {
    for (const chckUser of this.userset) {
      if (chckUser.id === session) {
        if (chckUser.ipAddrs.indexOf(ipAddr) !== -1) {
          return chckUser.user.name;
        } else {
          return null;
        }
      }
    }

    return null;
  }

  checkExpiry() {
    let now = new Date();
    for (var i = this.userset.length - 1; i >= 0; i--) {
      let chckUser = this.userset[i];
      if (now > chckUser.expiry) {
        this.userset.splice(1, i);
      }
    }
  }
}

export const global_usertable = new UserTable();
