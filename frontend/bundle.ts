/*
 * bundle.ts
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

// browserify needs all of the methods in once place
const anyWindow: any = <any>window;

import { getCookie } from './cookie';
anyWindow.getCookie = getCookie;

import { createDialog, destroyDialog } from './dialog';
anyWindow.createDialog = createDialog;
anyWindow.destroyDialog = destroyDialog;

import { get_slug, prsRequest } from './pagereq';
anyWindow.get_slug = get_slug;
anyWindow.prsRequest = prsRequest;

import { toggle_404_param, savepage, canceleditpage, editpage, scpvote, showrater,
         showtagger, cleartags, tagpage, pagehistory, pagesource, hidePageUtilities } from './page_utils';
anyWindow.editpage = editpage;
anyWindow.toggle_404_param = toggle_404_param;
anyWindow.savepage = savepage;
anyWindow.canceleditpage = canceleditpage;
anyWindow.editpage = editpage;
anyWindow.scpvote = scpvote;
anyWindow.showrater = showrater;
anyWindow.showtagger = showtagger;
anyWindow.cleartags = cleartags;
anyWindow.tagpage = tagpage;
anyWindow.pagehistory = pagehistory;
anyWindow.pagesource = pagesource;
anyWindow.hidePageUtilities = hidePageUtilities;

import { getParameter } from './parameters';
anyWindow.getParameter = getParameter;

import { hash_password } from './pbkdf2';
anyWindow.hash_password = hash_password

import { create_post_form, send_post_data } from './post';
anyWindow.create_post_form = create_post_form;
anyWindow.send_post_data = send_post_data;
