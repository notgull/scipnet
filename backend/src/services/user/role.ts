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
import { Permset } from 'app/services/user/permissions';
import { queryPromise as query } from "app/sql";

// represents a role- e.g. moderator, admin, etc.
export class Role {
  roleId: number;

  permset: Permset;
  public static readonly defaultRoleName: string = "default";
  public static readonly systemRoleName: string = "system";
  public static readonly adminRoleName: string = "admin";
  
  constructor(public rolename: string, permset: Nullable<Permset | number> = null) {
    if (permset) {
      if (permset instanceof Permset) {
        this.permset = permset;
      } else {
        this.permset = Permset.fromNumber(permset);
      }
    } else {
      console.log("Generating default permset");
      this.permset = new Permset();
    }
    this.roleId = -1;
  }

  // tell if a role has permission to do something
  hasPermission(permname: string): boolean {
    return this.permset.hasPermission(permname);
  }

  // create a role from a role-like object (e.g. an sql row)
  static fromRow(row: any): Role {
    let role = new Role(row.role_name, row.permset);
    role.roleId = row.role_id;
    return role;
  }

  // load a role by its role id from the database
  static async loadById(role_id: number): Promise<Nullable<Role>> {
    let res = await query("SELECT * FROM Roles WHERE role_id=$1;", [role_id]);
    if (res.rowCount === 0) return null;
    return Role.fromRow(res.rows[0]);
  }

  // load a role by its role name
  static async loadByRoleName(rolename: string): Promise<Nullable<Role>> {
    let res = await query("SELECT * FROM Roles WHERE role_name=$1;", [rolename]);
    if (res.rowCount === 0) return null;
    return Role.fromRow(res.rows[0]);
  }

  // load the default role
  static async loadDefaultRole(): Promise<Role> {
    let role = await Role.loadByRoleName(Role.defaultRoleName);
    if (!role) throw new Error("Default role loaded to be null, please ensure autocreation occured sucessfully");
    return role;
  }

  // create a new role in the database
  static async createNewRole(rolename: string, 
                             permset: Nullable<Permset | number>, 
                             return_role: boolean): Promise<Role | ErrorCode> {
    // check if the role already exists first
    let rolecheck = await query("SELECT * FROM Roles WHERE role_name=$1;", [rolename]);
    if (rolecheck.rowCount > 0) {
      if (return_role) return Role.fromRow(rolecheck.rows[0]);
      else return ErrorCode.ROLE_EXISTS;
    }

    if (permset) {
      if (permset instanceof Permset) {
        permset = permset.getNumber();
      }
    } else {
      permset = new Permset();
      permset = permset.getNumber(); 
    }

    let res = await query("INSERT INTO Roles (role_name, permset) VALUES ($1, $2) RETURNING role_id",
                          [rolename, permset]);
    let role_id = res.rows[0].role_id;
    if (return_role) return Role.loadById(role_id);
    else return ErrorCode.SUCCESS;
  }

  // update role in database
  async updateRole(): Promise<void> {
    await query("UPDATE Roles SET role_name=$1, permset=$2;", [this.rolename, this.permset.getNumber()]);
  }
};
