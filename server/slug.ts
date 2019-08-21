/*
 * slug.ts
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

// a function to modify slugs to be better

// helper functions
const isUpperCase = (c: string): boolean => {
  let charcode = c.charCodeAt(0);
  return 65 <= charcode && charcode <= 90;
};

const isLowerCase = (c: string): boolean => {
  let charcode = c.charCodeAt(0);
  return 97 <= charcode && charcode <= 122;
};

const isNumber = (c: string): boolean => {
  let charcode = c.charCodeAt(0);
  return 48 <= charcode && charcode <= 57;
};

const allowed_chars = ['-', ':'];

export function slugify(slug: string): string {
  let newSlug = "";
  let ch;
  for (var i = 0; i < slug.length; i++) {
    ch = slug[i];
    if (isUpperCase(ch))
      newSlug += ch.toLowerCase();
    else if (isLowerCase(ch) || isNumber(ch) || allowed_chars.indexOf(ch) !== -1)
      newSlug += ch;
    else if (ch === '_') {
      if (i === 0)
        newSlug += '_';
      else
        newSlug += '-';
    } else
      newSlug += '-';
  }
  return newSlug;
};
