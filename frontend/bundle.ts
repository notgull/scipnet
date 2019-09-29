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
import { getCookie } from './cookie';
(<any>window).getCookie = getCookie;

import { createDialog, destroyDialog } from './dialog';
(<any>window).createDialog = createDialog;
(<any>window).destroyDialog = destroyDialog;

import { get_slug, prsRequest } from './pagereq';
(<any>window).get_slug = get_slug;
(<any>window).prsRequest = prsRequest;

import { toggle_404_param, savepage, canceleditpage, editpage, scpvote, showrater,
         showtagger, cleartags, tagpage, pagehistory } from './page_utils';
(<any>window).editpage = editpage;
(<any>window).toggle_404_param = toggle_404_param;
(<any>window).savepage = savepage;
(<any>window).canceleditpage = canceleditpage;
(<any>window).editpage = editpage;
(<any>window).scpvote = scpvote;
(<any>window).showrater = showrater;
(<any>window).showtagger = showtagger;
(<any>window).cleartags = cleartags;
(<any>window).tagpage = tagpage;
(<any>window).pagehistory = pagehistory;

import { getParameter } from './parameters';
(<any>window).getParameter = getParameter;

import { hash_password } from './pbkdf2';
(<any>window).hash_password = hash_password

import { create_post_form, send_post_data } from './post';
(<any>window).create_post_form = create_post_form;
(<any>window).send_post_data = send_post_data;
