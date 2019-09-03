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

// NOTE: THIS FILE IS OBSOLETE (for now)

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
  let rows;

  if (res.rowCount === 0) return [];
  else rows = res.rows;

  let row: any;
  let board;
  let boards = [];
  for (row in rows) {
    board = new Board(row.name, row.description, superboard);
    board.board_id = row.board_id;
    boards.push(board);
  }

  return boards;
}

const REALLY_HIGH_NUMBER = 1000000;

// load an array of threads by board, with optional argument to limit the start and end of threads
export async function get_threads_by_board(board_det: Board | string, 
                                           limit: number = REALLY_HIGH_NUMBER,
					   pagenum: number = 0): Promise<Array<Thread>> {
  let board_id;
  let board;
  if (board_det instanceof Board) {
    board_id = board_det.board_id;
    board = board_det;
  } else {
    board_id = board_det;
    board = await Board.load_by_id(board_id);
  }

  const offset = limit * pagenum;
  let res = await query("SELECT * FROM Threads WHERE board=$1 OFFSET $2 LIMIT $3;", [board_id, offset, limit]);
  let rows;

  if (res.rowCount === 0) return [];
  else rows = res.rows;

  let row: any;
  let thread;
  let threads = [];
  for (row in rows) {
    thread = new Thread(row.author, board, row.name, row.description, row.created_at);
    thread.thread_id = row.thread_id;
    threads.push(thread);
  }

  return threads;
}

// load an array of posts by thread, with optional argument to limit start and end of threads
export async function get_posts_by_thread(thread_det: Thread | string,
                                          limit: number = REALLY_HIGH_NUMBER,
					  pagenum: number = 0): Promise<Array<Post>> {
  let thread_id;
  let thread;
  if (thread_det instanceof Thread) {
    thread_id = thread_det.thread_id;
    thread = thread_det;
  } else {
    thread_id = thread_det;
    thread = await Thread.load_by_id(thread_id);
  }

  const offset = pagenum * limit;
  let res = await query("SELECT * FROM Posts WHERE thread=$1 OFFSET $2 LIMIT $3;", [thread_id, offset, limit]);
  let rows;

  if (res.rowCount === 0) return [];
  else rows = res.rows;

  let row: any;
  let post;
  let posts = [];
  for (row in rows) {
    post = new Post(row.author, row.thread, row.title, row.content, row.reply_to, row.created_at);
    post.post_id = row.post_id;
    posts.push(post);
  }

  return posts;
}
