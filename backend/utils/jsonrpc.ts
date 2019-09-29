/*
 * utils/jsonrpc.ts
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

// Function to send a json message to a port via JSON-rpc
import * as jayson from 'jayson/promise';
export async function send_jsonrpc_message(
  name: string,
  message: any,
  host: string,
  port: number,
): Promise<any> {
  const client = jayson.Client.http({ host, port });

  // TODO: add proper app logging
  console.log("JSON REQUEST: " + name + ", " + JSON.stringify(message));

  let response = await client.request(name, message);
  console.log("JSON RESPONSE: " + JSON.stringify(response));
  return response;
}
