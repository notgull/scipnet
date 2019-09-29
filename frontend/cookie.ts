/*
 * cookie.ts
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

// get cookie from cookie string
// from: https://www.w3schools.com/js/js_cookies.asp
export function getCookie(cname: string): string {
  const name = `${cname}=`;
  const decodedCookie = decodeURIComponent(document.cookie);

  const cookieParts = decodedCookie.split(';');
  for (let part of cookieParts) {
    while (part.charAt(0) === ' ') {
      part = part.substring(1);
    }

    if (part.indexOf(name) === 0) {
      return part.substring(name.length, part.length);
    }
  }

  return '';
}
