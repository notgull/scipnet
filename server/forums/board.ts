/*
 * board.ts
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

// a board, containing multiple threads
import { queryPromise } from './../sql';
const query = queryPromise;

import { Nullable } from './../helpers';
import { Superboard } from './superboard';
import * as uuid from 'uuid/v4';

export class Board {
  board_id: string;
  name: string;
  description: string;
  superboard: Superboard;

  constructor(name: string, description: string, superboard: Superboard) {
    this.name = name;
    this.description = description;
    this.superboard = superboard;
    this.board_id = "";
  }

  // get a board by its board id
  static async load_by_id(board_id: string): Promise<Nullable<Board>> {
    let res = await query("SELECT * FROM Boards WHERE board_id = $1;", [board_id]);
    let row;

    if (res.rowCount === 0) return null;
    else row = res.rows[0];

    let superboard = await Superboard.load_by_id(row.superboard);
    if (!superboard) return null;

    let board = new Board(row.name, row.description, superboard);
    board.board_id = board_id;
    return board;
  }

  // get a list of boards by a superboard
  static async load_by_superboard(superboard_det: Superboard | string): Promise<Array<Board>> {
    let superboard_id;
    let superboard;

    if (superboard_det.superboard_id) { 
      superboard = superboard_det;
      superboard_id = superboard.superboard_id;
    } else { 
      superboard_id = superboard;
      superboard = Superboard.load_by_id(superboard_id);
    }

    let res = await query("SELECT * FROM Boards WHERE superboard = $1;", [superboard_id]);
    let rows;
    if (res.rowCount === 0) return [];
    else rows = res.rows;

    let boards = [];
    let row;
    let board;
    for (row in rows) {
      board = new Board(row.name, row.description, superboard);
      board.board_id = row.board_id;
      boards.push(board);
    }

    return boards;
  }

  // submit board to database
  async submit(): Promise<void> {
    if (this.board_id === "") this.board_id = uuid().replace('-', '');

    const upsert_query = "INSERT INTO Boards VALUES ($1, $2, $3, $4) " +
                         "ON CONFLICT (board_id) DO UPDATE SET " + 
                         "name=$2, description=$3, superboard=$4;";
    await query(upset_query, [this.board_id, this.name, this.description, this.superboard.superboard_id]);
  }
};
