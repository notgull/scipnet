/*
 * utils.ts
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

// functions that I wanted to add to the actual models but I didn't want to create circular dependencies
import { queryPromise } from './../sql';
const query = queryPromise;

import { Superboard } from './superboard';
import { Board } from './board';
import { Thread } from './thread';
import { Post } from './post';
import { PostRevision } from './revision';

// load an array of boards by the superboard
export async function get_boards_by_superboard(superboard_det: Superboard | string): Promise<Array<Board>> {
  let superboard_id;
  let superboard;
  if (superboard_det instanceof Superboard) {
    superboard_id = superboard_det.superboard_id;
    superboard = superboard_det;
  } else {
    superboard_id = superboard_det;
    superboard = await Superboard.load_by_id(superboard_det);
  }

  let res = await query("SELECT * FROM Boards WHERE superboard=$1;", [superboard_id]);
  return [];
}
