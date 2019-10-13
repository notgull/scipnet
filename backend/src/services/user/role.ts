/*
 * services/user/role.ts
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

import { ErrorCode } from 'app/errors';
import { Nullable } from 'app/utils';
import { findOne, insertReturn, rawQuery } from "app/sql";

// helper functions for using perm sets
function getPermsetVal(permset: number, index: number): boolean {
  return (permset & (1 << index)) > 0;
}

function setPermsetVal(permset: number, index: number, value: boolean): number {
  if (value) {
    permset |= (1 << index);
  } else {
    permset &= ~(1 << index);
  }
  return permset;
}

// represents a role- e.g. moderator, admin, etc.
export class Role {
  roleId: number;
  // TODO: list permissions here
  createPages: boolean;

  constructor(public rolename: string) {
    this.createPages = true;
    this.roleId = -1;
  }

  // apply a set of permissions (in the form of a 64-bit number) to a role
  applyPermset(permset: number) {
    this.createPages = getPermsetVal(permset, 0);
  }

  // get the permset of the role
  getPermset(): number {
    let permset = setPermsetVal(0, 0, this.createPages);

    return permset;
  }

  // create a role from a name and a permset
  static fromPermset(rolename: string, permset: number): Role {
    let role = new Role(rolename);
    role.applyPermset(permset);
    return role;
  }

  // create a role from a role-like object (e.g. an sql row)
  static fromRow(row: any): Role {
    let role = Role.fromPermset(row.role_name, row.permset);
    role.roleId = row.role_id;
    return role;
  }

  // load a role by its role id from the database
  static async loadById(roleId: number): Promise<Nullable<Role>> {
    const result = await rawQuery(
      `SELECT * FROM Roles WHERE role_id = $1`,
      [roleId],
    );

    if (result.rowCount === 0) {
      return null;
    } else {
      return Role.fromRow(result.rows[0]);
    }
  }

  // create a new role in the database
  static async createNewRole(
    rolename: string,
    permset: number,
  ): Promise<number> {
    const result = await rawQuery(`
        INSERT INTO roles (role_name, permset)
        VALUES ($1, $2)
        RETURNING role_id
      `,
      [rolename, permset],
    );

    return result.rows[0].role_id;
  }

  // update role in database
  async updateRole(): Promise<void> {
    await rawQuery(
      `UPDATE roles SET role_name = $1, permset = $2`,
      [this.rolename, this.getPermset()],
    );
  }
};
