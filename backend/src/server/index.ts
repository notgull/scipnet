/*
 * server/index.ts
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

// server software - runs on top of https server
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";

import { promisify } from "util";
import * as querystring from "querystring";

import * as config from "app/config";
import { Nullable } from "app/utils";

// load ssl certifications
type SslCerts = {
  key: Buffer,
  cert: Buffer
};

const readFilePromise = promisify(fs.readFile);

// load SSL certifications
export async function getSslCerts(): Promise<SslCerts> { 
  return { key: await readFilePromise(config.get("ssl.keys.private")),
           cert: await readFilePromise(config.get("ssl.keys.public")) };
}

// helper function for parsing cookies
function parseCookies(req: http.ClientRequest) {
  let list = {};
  let rc = request.headers.cookie;

  if (rc) {
    rc.split(';').forEach(function(cookie) {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }

  return list;
}

// types for the required functions
export type ScipnetStringMap = { [key: string]: string };
export type ScipnetMap = { [key: string]: any };
export interface ScipnetRequest {
  body?: ScipnetMap, // POST request body
  cookies?: ScipnetStringMap, // cookies
//  query?: ScipnetStringMap, // GET request URL params, should not be used
  params?: ScipnetMap, // /url/params/like/this

  ip: string
};
export interface ScipnetResponse {
  currentHeader?: ScipnetStringMap,

  redirect(string),
  send(string | Buffer, number?),
  type(string)
};

export type SyncScipnetHandle = (req: ScipnetRequest, res: ScipnetResponse) => void;
export type AsyncScipnetHandle = async (req: ScipnetRequest, res: ScipnetResponse) => void;
export type ScipnetHandle = SyncScipnetHandle | AsyncScipnetHandle;

// some basic handles
const faviconHandle: ScipnetHandle = async function(req: ScipnetRequest, res: ScipnetResponse) {
  let faviconSource = await readFilePromise(config.get("files.images.favicon"));
  res.send(faviconSource);
};

export class ScipnetHttpsApp { 
  basicPageHandle: Nullable<ScipnetHandle>;
  faviconHandle: ScipnetHandle;
  fontHandles: Array<ScipnetHandle>;
  imageHandles: Array<ScipnetHandle>;
  pageHandle: Nullable<ScipnetHandle>;
  mainHandle: Nullable<ScipnetHandle>;

  constructor() {
    this.basicPageHandle = null;
    this.faviconHandle = faviconHandle;
    this.fontHandles = [];
    this.imageHandles = [];
    this.pageHandle = null;
    this.mainHandle = null;
  }

  // call a scipnet handle
  async executeHandle(handle: ScipnetHandle, req: ScipnetRequest, res: ScipnetResponse): Promise<void> {
    if (handle instanceof SyncScipnetHandle) {
      handle(req, res);
    } else {
      await handle(req, res);
    }
  }

  // make it callable
  async (req: http.ClientRequest, res: http.ServerResponse) => {
    // get the url
    let accessedUrl = req.url;
    if (acessedUrl[0] === "/") {
      accessedUrl = accessedUrl.substr(1);
    }

    let urlParts = accessedUrl.split("/");
    const accessedPage = urlParts[0];

    // determine if we are accessing a /sys/ page
    urlParts.splice(0, 1);
    let sysUrl;
    if (accessedPage === "sys") {
      sysUrl = urlParts[0];
      urlParts.splice(0, 1);
    }

    // define request and response objects
    let sReq: ScipnetRequest = { ip: req.getHeader("x-forwarded-for") || req.connection.remoteAddress };  
    let sRes: ScipnetResponse = {
      currentHeader: {
        "Content-Type": "text/html"
      },
      redirect: function(url: string) {
        currentHeader["Location"] = url;
        res.writeHead(302, currentHeader);
        res.end();
      },

      send: function(data: Buffer | string, code: number = 200) {
        if (data instanceof Buffer) {
          data = data.toString();
        }

        currentHeader["Content-Length"] = Buffer.byteLength(data);
        res.writeHead(code, currentHeader);
        res.end(data);
      },

      type: function(mimeType: string) {
        currentHeader["Content-Type"] = mimeType;
      }
    };

    // add cookies
    sReq.cookies = parseCookies(req);    

    // add params from url
    let params: ScipnetMap = {};
    let param: any;
    let unmodifiedParam: any;
    if (params.length > 1) {
      for (let i = 0; i < params.length; i += 2) { // iterate two at a time
        // determine value of param
        param = urlParts[i + 1];
        if (!param) { break; } // TODO: handle this edge case better
        unmodifiedParam = param;      

        // TODO: I feel like there's a more simple way of doing this
        param = parseInt(param);
        if (param === NaN) {
          if (param === "true") {
            param = true;
          } else if (param === "false") {
            param = false;
          } else {
            param = unmodifiedParam;
          }
        }

        params[urlParts[i]] = param;
      }
    }
    sReq.params = params;

    // at this point, we should be able to access the request's body
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      // body is likely to be encoded via url encoding; however, there is a chance for JSON encoding
      try {
        sReq.body = querystring.parse(body);
      } catch(e) {
        sReq.body = JSON.parse(body);
      }

      // TODO: now that all of the parameters are loaded we can see which handle we need to execute
    });
  };
}
