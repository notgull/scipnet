/*
 * errors.ts
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

export class ClientError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
  ) {
    super(message);
  }
}

export enum ErrorCode {
  SUCCESS = 0,
  INTERNAL_ERROR = 3,
  USER_NOT_FOUND = 5,
  PASSWORD_INCORRECT = 7,
  SESSION_MISMATCH = 11,
  SESSION_EXPIRY = 13,
  EMAIL_NOT_FOUND = 17,
  USER_EXISTS = 19,
  EMAIL_EXISTS = 23,
}
