/*
 * editlock.ts
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

import * as path from 'path';
import * as uuidv4 from 'uuid/v4';

import { config } from 'app/config';
import { Nullable } from 'app/utils';

const EDIT_LOCK_TIMEOUT = config.get('ui.editor.lock_timeout');

export class EditLock {
  slug: string;
  username: string;
  locked_at: Date;
  editlock_id: string;

  constructor(slug: string, username: string, locked_at: Date) {
    this.slug = slug;
    this.username = username;
    this.locked_at = locked_at;
    this.editlock_id = uuidv4();
  }

  // check if the editlock is valid
  is_valid(): boolean {
    let now = new Date().getTime();
    const ms_per_sec = 1000;
    return (now - this.locked_at.getTime()) > (ms_per_sec * EDIT_LOCK_TIMEOUT);
  }
};

// editlocks are stored in memory
let editlock_table: Array<EditLock> = [];

// remove all invalid editlocks from the table
export function outdated_check() {
  for (var i = editlock_table.length - 1; i >= 0; i--) {
    if (!(editlock_table[i].is_valid()))
      editlock_table.splice(i, 1);
  }
}

// add an editlock to the table
export function add_editlock(slug: string, username: string): EditLock {
  let el = new EditLock(slug, username, new Date());
  editlock_table.push(el);
  return el;
}

// remove an editlock from the table
export function remove_editlock(slug: string) {
  for (let i = exports.editlock_table.length - 1; i >= 0; i--) {
    if (editlock_table[i].slug === slug) {
      editlock_table.splice(i, 1);
      break;
    }
  }
}

// check if a page is editlocked
export function check_editlock(slug: Nullable<string> = null, uuid: Nullable<string> = null): Nullable<EditLock> {
  outdated_check();
  for (var i = editlock_table.length - 1; i >= 0; i--) {
    if ((slug && editlock_table[i].slug === slug) ||
        (uuid && editlock_table[i].editlock_id === uuid))
      return editlock_table[i];
  }
  return null;
}
