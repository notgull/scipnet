/*
 * post.ts
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

// refractored from other method
export function create_post_form(url: string, params: any) {
  let form = document.createElement('form');
  form.method = 'post';
  form.action = url;

  // loop through params
  for (let key in params) {
    if (params.hasOwnProperty(key)) {
      let hidden_field = document.createElement('input');
      hidden_field.type = 'hidden';
      hidden_field.name = key;
      hidden_field.value = params[key];

      form.appendChild(hidden_field);
    }
  }

  form.classList.add('vanished');
  document.body.appendChild(form);
  return form;
};

// send POST data to a specified URL
// jerry rigged, maybe make better later?
// Taken from: https://stackoverflow.com/a/133997/11187995
export function send_post_data(url: string, params: any) {
  let form = create_post_form(url, params);
  form.submit();
};
