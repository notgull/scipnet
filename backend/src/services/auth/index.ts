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

import { config } from 'app/config';
import { pbkdf2, randomBytes } from 'app/crypto';
import { findOne, runQuery, DatabaseError } from 'app/sql';
import { PasswordModel } from 'app/sql/models';
import { timeout, Nullable } from 'app/utils'

const saltLength = config.get('auth.salt_length');
const iterations = config.get('auth.iterations');
const keySize = config.get('auth.key_length');
const digest = config.get('auth.digest');

// Represents a password as stored in the database, with utility methods.
// The actual plaintext is never stored anywhere.
export class Password {
  constructor(
    public userId: number,
    private hashed: Buffer,
    private salt: Buffer,
    private iterations: number,
    private keySize: number,
    private digest: string,
  ) {}

  static async create(userId: number, plaintextPassword: string): Promise<Password> {
    const salt = await randomBytes(saltLength);
    const password = new Password(
      userId,
      Buffer.from(''),
      salt,
      iterations,
      keySize,
      digest,
    );

    password.hashed = await password.hash(plaintextPassword);
    await password.insert();
    return password;
  }

  static async loadById(userId: number): Promise<Nullable<Password>> {
    const model = await findOne<PasswordModel>(`
        SELECT hash, salt, iterations, key_size, digest
        FROM passwords
        WHERE user_id = $1
      `,
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
      model.key_size,
      model.digest,
    );
  }

  async hash(password: string): Promise<Buffer> {
    return pbkdf2(password, this.salt, this.iterations, this.keySize, this.digest);
  }

  async validate(password: string): Promise<boolean> {
    const hashed = await this.hash(password);
    if (this.hashed === hashed) {
      return true;
    }

    // Purposely delay to make brute-forcing harder
    await timeout(2000);
    return false;
  }

  // Don't allow consumers to manipulate internals of the passwords table
  private async insert(): Promise<void> {
    await runQuery(`
        INSERT INTO passwords
          (user_id, hash, salt, iterations, key_size, digest)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        this.userId,
        this.hash,
        this.salt,
        this.iterations,
        this.keySize,
        this.digest,
      ],
    );
  }
}
