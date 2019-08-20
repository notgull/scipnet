/*
 * authdetails.ts
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

const specialChars = ['-', ' ', '_', '?', '!'];
const isSpecialChar = (c: string): boolean => { return specialChars.indexOf(c) !== -1; };

export function validate_password(test: string): boolean {
  let isValidChar = true;
  if (test.length === 0) return false;
  let ch;

  for (let i = 0; i < test.length; i++) {
    ch = test[i];
    isValidChar = isUpperCase(ch) || isLowerCase(ch) || isNumber(ch) || isSpecialChar(ch);
    //console.log("Ch is " + ch + ", isValidChar is " + isValidChar);
    if (!isValidChar) return false;
  }
  return true;
}
