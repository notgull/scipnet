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

import { config } from "app/config";
import { Nullable } from "app/utils";
import { Usertable } from "app/services/user/usertable";

// types for the required functions
export type ScipnetStringMap = { [key: string]: string };
export type ScipnetMap = { [key: string]: any };
export interface ScipnetRequest {
  body?: ScipnetMap, // POST request body
  cookies?: ScipnetStringMap, // cookies
//  query?: ScipnetStringMap, // GET request URL params, should not be used
  params?: ScipnetMap, // /url/params/like/this

  method: string,
  ip: string
};
export interface ScipnetResponse {
  currentHeader?: ScipnetStringMap,

  cookie(name: string, value: string, age: number): void,
  redirect(url: string): void,
  send(data: string | Buffer, code?: number): void,
  type(mimeType: string): void
};

export type SyncScipnetHandle = (req: ScipnetRequest, res: ScipnetResponse, ut?: Usertable) => void;
export type AsyncScipnetHandle = (req: ScipnetRequest, res: ScipnetResponse, ut?: Usertable) => Promise<void>;
export type ScipnetHandle = SyncScipnetHandle | AsyncScipnetHandle;

export type ScipnetFunctionMap = { [key: string]: ScipnetHandle };

// some basic handles
const faviconHandle: ScipnetHandle = async function(req: ScipnetRequest, res: ScipnetResponse) {
  let faviconSource = await readFilePromise(config.get("files.images.favicon"));
  res.send(faviconSource);
};

// helper function for parsing cookies
function parseCookies(req: http.ClientRequest): ScipnetStringMap {
  let list: ScipnetStringMap = {};
  let rc = req.getHeader("cookie");
  if (!(rc instanceof String)) { throw new Error("Need to handle cookie edge cases"); }

  if (rc) {
    rc.split(';').forEach(function(cookie: string) {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }

  return list;
}

export class ScipnetHttpsApp { 
  basicPageHandle: Nullable<ScipnetHandle>;
  faviconHandle: ScipnetHandle;
 
  fontHandles: ScipnetFunctionMap;
  imageHandles: ScipnetFunctionMap;

  pageHandle: Nullable<ScipnetHandle>;
  mainHandle: Nullable<ScipnetHandle>;

  bundleHandle: Nullable<ScipnetHandle>;
 
  loginHandle: Nullable<ScipnetHandle>;
  processLoginHandle: Nullable<ScipnetHandle>;
  registerHandle: Nullable<ScipnetHandle>;
  processRegisterHandle: Nullable<ScipnetHandle>;
  pagereqHandle: Nullable<ScipnetHandle>;

  usertable: Usertable;

  constructor() {
    this.basicPageHandle = null;
    this.faviconHandle = faviconHandle;
    this.fontHandles = {};
    this.imageHandles = {};
    this.pageHandle = null;
    this.mainHandle = null;
    this.bundleHandle = null;

    this.loginHandle = null;
    this.processLoginHandle = null;
    this.registerHandle = null;
    this.processRegisterHandle = null;
    this.pagereqHandle = null;

    this.usertable = new Usertable();
  }

  // call a scipnet handle
  async executeHandle(handle: ScipnetHandle, req: ScipnetRequest, res: ScipnetResponse): Promise<void> { 
    await handle(req, res, this.usertable); 
  }

  // make it callable
  getServer(): (req: any, res: any) => Promise<void> {
    const scoped_this = this;

    return async function(req: any, res: any): Promise<void> {
      // get the url
      let accessedUrl = req.url;
      if (accessedUrl[0] === "/") {
        accessedUrl = accessedUrl.substr(1);
      }

      let urlParts = accessedUrl.split("/");
      const accessedPage = urlParts[0];

      // determine if we are accessing a /sys/ page
      urlParts.splice(0, 1);
      let sysUrl = "";
      if (accessedPage === "sys") {
        sysUrl = urlParts[0];
        urlParts.splice(0, 1);
      }

      // define request and response objects
      let sReq: ScipnetRequest = { 
        method: req.method,
        ip: req.getHeader("x-forwarded-for") || req.connection.remoteAddress
      };  
      let sRes: ScipnetResponse = {
        currentHeader: {
          "Content-Type": "text/html"
        },

        cookie: function(cookieName: string, cookieValue: string, age: number) {
          // TODO: set cookie
        },
         
        redirect: function(url: string)  {
          sRes.currentHeader["Location"] = url;
          res.writeHead(302, sRes.currentHeader);
          res.end();
        },

        send: function(data: Buffer | string, code: number = 200) {
          if (data instanceof Buffer) {
            data = data.toString();
          }

          sRes.currentHeader["Content-Length"] = `${Buffer.byteLength(data)}`;
          res.writeHead(code, sRes.currentHeader);
          res.end(data);
        },

        type: function(mimeType: string) {
          sRes.currentHeader["Content-Type"] = mimeType;
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

      // may God forgive me for what I'm about to do
      const that: ScipnetHttpsApp = scoped_this;

      // at this point, we should be able to access the request's body
      let body = "";

      req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
      req.on("end", async () => {
        // body is likely to be encoded via url encoding; however, there is a chance for JSON encoding
        try {
          sReq.body = querystring.parse(body);
        } catch(e) {
          sReq.body = JSON.parse(body);
        }

        // now that all of the parameters are loaded we can see which handle we need to execute
        if (accessedPage === "sys") {
          if (sReq.method === "GET") {
            switch (sysUrl) {
              case "bundle.js":
                await that.executeHandle(that.bundleHandle, sReq, sRes);
                return;
              case "images":
                await that.executeHandle(that.imageHandles[urlParts[0]], sReq, sRes);
                return;
              case "fonts":
                await that.executeHandle(that.fontHandles[urlParts[0]], sReq, sRes);
                return;
              case "login":
                await that.executeHandle(that.loginHandle, sReq, sRes);
                return;
              case "register":
                await that.executeHandle(that.registerHandle, sReq, sRes);
                return;
              default:
                sRes.redirect("/");
                return;
            }
          } else if (sReq.method === "POST") {
            switch (sysUrl) {
              case "pagereq":
                await that.executeHandle(that.pagereqHandle, sReq, sRes);
                return;
              case "process-login":
                await that.executeHandle(that.processLoginHandle, sReq, sRes);
                return;
              case "process-register":
                await that.executeHandle(that.processRegisterHandle, sReq, sRes);
                return;
              default:
                sRes.send("Unable to find desired POST target", 404);
                return;
            } 
          } else {
            sRes.send(`Method ${sReq.method} is not supported`, 404);
          }
        } else if (accessedPage === "") {
          await that.executeHandle(that.mainHandle, sReq, sRes);
        } else {
          sReq.body.pageid = accessedPage;
          await that.executeHandle(that.pageHandle, sReq, sRes);
        }
      });
    };
  }
}
