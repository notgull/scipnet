/*
 * dialog.ts
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

import { Nullable } from './utils';

// pops open dialog boxes
let dialog_container: Nullable<HTMLElement>;

export function createDialog(message: string) {
  // just run alert() for now
  alert(message);
  return;

  let body = document.getElementById("main-body");

  // create container
  dialog_container = document.createElement("div");
  dialog_container.id = "dialog-container";

  // create shader
  let dialog_shader = document.createElement("div");
  dialog_shader.id = "dialog-shader";
  dialog_container.appendChild(dialog_shader);

  // create dialog box
  let dialog_box = document.createElement("div");
  dialog_box.classList.add("dialog-window");
  
  let W_width = window.screen.width;
  let W_height = window.screen.height;
  
  let D_width = 50;
  
  let left_position = (W_width - D_width) / 2;
  let top_position = W_height / 2;

  dialog_box.setAttribute("style", `left: ${left_position}px; top: ${top_position}px;`);
  dialog_box.innerHTML = message; // TODO: better
  dialog_container.appendChild(dialog_box);

  body.appendChild(dialog_container);
}

export function destroyDialog() {}
