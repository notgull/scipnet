/*
 * renderer.js
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
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// this file renders html from markdown stored in data files
//var markdown = require('./markdown/markdown');
var config = require('./../config.json');
var markdown = require('./ftml/markdown');
var metadata = require('./metadata/metadata');
//var nunjucks = require('nunjucks');
var fs = require('fs');
var path = require('path');
//nunjucks.configure('html', { autoescape: true });
var rating_mod_src = "[[module Rate]]";
exports.render_rating_module = function (metadata) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // render a rating module
            return [2 /*return*/, markdown.get_markdown("Rating Module", rating_mod_src, metadata)];
        });
    });
};
exports.render = function (modName, htmlFileName, title, loginInfo, metadata) {
    if (htmlFileName === void 0) { htmlFileName = ''; }
    if (title === void 0) { title = 'Testing Page'; }
    if (loginInfo === void 0) { loginInfo = false; }
    if (metadata === void 0) { metadata = null; }
    return __awaiter(this, void 0, void 0, function () {
        var template, replacement_string, username, loginBar, content, filepath, src, lb_replacement_string, mt_replacement_string, meta_title, t_replacement_string, u_replacement_string, ulv_replacement_string, r_replacement_string, rr_replacement_string, ulv_replacement, rating, rater, page;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    template = fs.readFileSync('html/template.html');
                    template = template + ''; // ensure template is a string
                    replacement_string = "[INSERT_CONTENT_HERE]";
                    if (loginInfo) {
                        username = loginInfo;
                        loginBar = fs.readFileSync('html/lbar_li.html');
                    }
                    else
                        loginBar = fs.readFileSync('html/lbar_nli.html');
                    if (!htmlFileName || htmlFileName.length === 0) {
                        //var markdown_tree = markdown(modName);
                        //content = markdown_tree.flatten(username);
                        if (!metadata)
                            throw new Error("Expected metadata");
                        filepath = path.join(config.scp_cont_location, modName);
                        if (!fs.existsSync(filepath))
                            return [2 /*return*/, exports.render("_404", '', "404", loginInfo)];
                        src = fs.readFileSync(filepath);
                        content = markdown.get_markdown(modName, src, metadata);
                    }
                    else {
                        content = '' + fs.readFileSync(htmlFileName);
                    }
                    lb_replacement_string = "[INSERT_LOGINBAR_HERE]";
                    mt_replacement_string = "[INSERT_META_TITLE_HERE]";
                    if (modName === "main") {
                        meta_title = '';
                        title = '';
                    }
                    else
                        meta_title = title + " - ";
                    t_replacement_string = "[INSERT_TITLE_HERE]";
                    u_replacement_string = "[INSERT_USERNAME_HERE]";
                    ulv_replacement_string = "[INSERT_UL_VANISHING_HERE]";
                    r_replacement_string = "[INSERT_RATING_HERE]";
                    rr_replacement_string = "[INSERT_RATER_HERE]";
                    ulv_replacement = "";
                    if (htmlFileName !== '' || modName === "_404")
                        ulv_replacement = "display: none;";
                    rating = 0;
                    rater = "";
                    if (!metadata) return [3 /*break*/, 2];
                    rating = metadata.get_rating();
                    return [4 /*yield*/, exports.render_rating_module(metadata)];
                case 1:
                    rater = _a.sent();
                    _a.label = 2;
                case 2:
                    page = template.split(replacement_string).join(content);
                    page = page.split(mt_replacement_string).join(meta_title);
                    page = page.split(t_replacement_string).join(title);
                    page = page.split(lb_replacement_string).join(loginBar);
                    page = page.split(u_replacement_string).join(username);
                    page = page.split(ulv_replacement_string).join(ulv_replacement);
                    page = page.split(r_replacement_string).join(rating);
                    page = page.split(rr_replacement_string).join(rater);
                    return [2 /*return*/, page];
            }
        });
    });
};
