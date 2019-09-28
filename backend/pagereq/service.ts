/*
 * pagereq/service.ts
 *
 * scipnet - SCP Hosting Platform
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

import * as pagereq from 'app/pagereq';
import { ServiceCallback, ServiceParams, Service } from 'app/service_wrapper';

// asynchronous pr
async function async_pr(name: string, username: string, args: pagereq.ArgsMapping): Promise<pagereq.PRSReturnVal> {
  return new Promise((resolve: (r: pagereq.PRSReturnVal) => any, reject: any) => {
    pagereq.request(name, username, args, resolve);
  });
}

// run pagereq as a service
function request(data: ServiceParams, callback: ServiceCallback): void {
  console.log(data);

  const input = data;
  let args: pagereq.ArgsMapping = input;
  let name = args["name"];

  /*

    IMPORTANT NOTE:

    When servicify is eventually put in, make sure "username" is put into the args.

  */
  let username = args["username"];

  pagereq.request(name, username, args, function(r: pagereq.PRSReturnVal) {
    callback(null, r);
  });
}

export function service(): Service {
  return { 'pagereq': request };
}
