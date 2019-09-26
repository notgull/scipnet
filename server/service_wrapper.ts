/*
 * service_wrapper.ts
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

import * as net from 'net';
import * as jayson from 'jayson';

export interface ServiceAddress {
  address: string;
  port: number;
  family?: string;
};

export interface ServiceConfig {
  hosts: Array<ServiceAddress>;
};

export type ServiceParams = { [key: string]: any };
export type ServiceCallback = (a: any, b: any) => any;
export type Service = { [key: string]: (params: ServiceParams, callback: ServiceCallback) => void};

// run a module as a service
function runservice(modname: string, serv_config: ServiceConfig) {
  let service = require(modname);
  let serv_addr = serv_config.hosts[0];
  let ip_addr = serv_addr.address;
  let port = serv_addr.port;

  let modified_service: Service = {};
  let service_method: any;
  let service_methods = service.service();

  // note: this is just in case we have to wrap any methods with something in the future
  for (service_method in service_methods)
    modified_service[service_method] = (data: ServiceParams, callback: ServiceCallback) => {
      (service_methods[service_method])(data, callback);
    };

  const server = new jayson.Server(modified_service);
  server.http().listen(port);
}

if (require.main === module)
  runservice(process.argv[2], JSON.parse(process.argv[3]));
