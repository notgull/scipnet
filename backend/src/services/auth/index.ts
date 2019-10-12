/*
 * services/auth/index.ts
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

import { findOne, DatabaseError } from 'app/sql';
import { PasswordModel } from 'app/sql/models';
import { Nullable } from 'app/utils'

function getDigest(digestNo: number): string {
  // Not using string formatting so we can accomodate non-SHA digests.
  // Also no SHA1 since it's insecure.
  switch (digestNo) {
    case 224: return 'sha224';
    case 256: return 'sha256';
    case 384: return 'sha384';
    case 512: return 'sha512';
    default:
      throw new DatabaseError(`Passed digest number is not known: ${digestNo}`);
  }
}

// Represents a password as stored in the database, with utility methods.
// The actual plaintext is never stored anywhere.
export class Password {
  constructor(
    public userId: number,
    public hash: Buffer,
    public salt: Buffer,
    public iterations: number,
    public digest: string,
  ) {}

  static async loadById(userId: number): Promise<Nullable<Password>> {
    const model = await findOne<PasswordModel>(
      `SELECT hash, salt, iterations, digest FROM passwords WHERE user_id = $1`,
      [userId],
    );

    if (model === null) {
      return null;
    }

    return new Password(
      userId,
      model.hash,
      model.salt,
      model.iterations,
      getDigest(model.digest),
    );
  }
}
