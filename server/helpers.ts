/*
 * helpers.ts
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

// helper functions

export type Nullable<T> = T | null;

// date formatting function
// from: https://stackoverflow.com/a/15764763/11187995
export function getFormattedDate(date: Date): string {
  let year = date.getFullYear();

  let month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;

  let day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;

  let hour = date.getHours().toString();
  hour = hour.length > 1 ? hour : '0' + hour;

  let minutes = date.getMinutes().toString();
  minutes = minutes.length > 1 ? minutes : '0' + minutes;

  let seconds = date.getSeconds().toString();
  seconds = seconds.length > 1 ? seconds : '0' + seconds;

  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
}

// function to send a json message to a port via JSON-rpc
import * as jayson from 'jayson/promise';
export async function send_jsonrpc_message(name: string, message: any, ip: string, port: number): Promise<any> {
  const client = jayson.Client.http({
    port: port,
    host: ip
  });

  console.log("JSON REQUEST: " + name + ", " + JSON.stringify(message));

  let response = await client.request(name, message);
  console.log("JSON RESPONSE: " + JSON.stringify(response));
  return response;
}
