/*
 * htmlify.ts
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

// convert forum elements into HTML
import { Superboard } from './superboard';
import { Board } from './board';

export async function load_start_page(): Promise<string> {
  let endResult = ['<div class="forum-start-box">'];
  let superboards = await Superboard.load_all();
  let superboard: any;
  let board: any;
  let boards;
  let thread_num;
  let post_num;

  // htmlify superboards
  async function process_superboard(superboard: Superboard, index: number): Promise<void> {
    let result = [];
    result.push('<div class="forum-group" style="width: 98%">');
    result.push('<div class="head">');
    result.push('<div class="title">' + superboard.name + "</div>");
    result.push('<div class="description">' + superboard.description + "</div>");
    result.push('</div>');

    // describe boards
    result.push("<div><table>");
    result.push('<tr class="head"><td>Category Name</td><td>Threads</td><td>Posts</td><td>Last post</td></tr>');
  
    async function process_board(board: Board, index: number): Promise<void> {
      let bResult = [];
      bResult.push('<tr>');
      bResult.push('<td class="name">');
      bResult.push('<div class="title">' + board.name + '</div>');
      bResult.push('<div class="description">' + board.description + '</div>');
      bResult.push('</td>');

      // do both querying func upfront
      [thread_num, post_num] = await Promise.all([
        board.get_num_threads(),
	board.get_num_posts()
      ]);

      bResult.push('<td class="threads">' + thread_num + '</div>');
      bResult.push('<td class="posts">' + post_num + '</div>');
      bResult.push('<td class="last">' + "" + '</div>');
      result[index] = bResult.join('\n');
    };    

    boards = await Board.load_array_by_superboard(superboard);

    let boardPromises = [];
    let i;
    let result_len = result.length;
    for (i = 0; i < boards.length; i++) {
      boardPromises.push(process_board(boards[i], i + result_len));
    }
    
    await Promise.all(boardPromises);

    result.push("</table></div>");

    result.push('</div>');

    endResult[index] = result.join('\n');
  };

  let superboardPromises = [];
  let i;
  let endResult_len = endResult.length;
  for (i = 0; i < superboards.length; i++) {
    superboardPromises.push(process_superboard(superboards[i], i + endResult_len));
  }
 
  await Promise.all(superboardPromises);

  endResult.push("</div>");
  return endResult.join("\n");
}
