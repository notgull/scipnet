/*
 * thread.ts
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

// a comment thread used for discussion
import { queryPromise } from './../sql';
const query = queryPromise;

import { Nullable } from './../utils';
import { Board } from './board';
import * as uuid from 'uuid/v4';

export class Thread {
  thread_id: string;
  author_id: number;
  board: Board;
  name: string;
  description: string;
  created_at: Date;

  constructor(author_id: number, board: Board, name: string, description: string,
              created_at: Nullable<Date> = null) {
    this.author_id = author_id;
    this.board = Board;
    this.name = name;
    this.description = description;
    this.created_at = created_at | new Date();
    this.thread_id = "";
  }

  // load a thread by its id
  static async load_by_id(thread_id: number): Promise<Nullable<Thread>> {
    let res = await query("SELECT * FROM Threads WHERE thread_id = $1;", [thread_id]);
    let row;
    if (res.rowCount === 0) return null;
    else row = res.rows[0];

    let board = await Board.load_by_id(row.board);
    if (!board) return null;

    let thread = new Thread(row.author, board, row.name, row.description, row.created_at);
    thread.thread_id = thread_id;
    return thread;
  }

  // load a list of threads by board
  static async load_by_board(board: Board | number): Promise<Array<Board>> {
    let board_id;
    if (board.board_id) board_id = board.board_id;
    else {
      board_id = board;
      board = Board.load_by_id(board_id);
    }

    let res = await query("SELECT * FROM Threads WHERE board = $1;", [board_id]);
    let rows;
    if (res.rowCount === 0) return [];
    else rows = res.rows;

    let threads = [];
    let row;
    let thread;
    for (row in rows) {
      thread = new Thread(row.author, board, row.name, row.description, row.created_at);
      thread.thread_id = row.thread_id;
      threads.push(thread);
    } 

    return threads;
  }

  // submit thread to database
  async submit(): Promsie<void> {
    if (this.thread_id === "") this.thread_id = uuid().replace('-', '');
    
    const upsert_query = "INSERT INTO Threads VALUES ($6, $1, $2, $3, $4, $5) " +
                         "ON CONFLICT (thread_id) DO UPDATE SET " +
			 "author=$1, board=$2, name=$3, description=$4, created_at=$5;";
    await query(upsert_query, [this.author_id, this.board.board_id, this.name, 
                               this.description, this.created_at, this.thread_id]);
  }
};
