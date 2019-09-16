/*
 * tenant.ts
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

// tenant- the site name
import { queryPromise } from './../sql';
const query = queryPromise;

import { Nullable } from './../helpers';

export class Tenant {
  tenant_id: number;
  site_name: string;
  stylesheet: string;
  name: string;

  constructor(site_name: string, stylesheet: string, name: string) {
    this.site_name = site_name;
    this.stylesheet = stylesheet;
    this.name = name;
    this.tenant_id = -1;
  }

  static async from_row(row: any): Promise<Tenant> {
    let tenant = new Tenant(row.site_name, row.stylesheet, row.name);
    if (row.tenant_id)
      tenant.tenant_id = row.tenant_id;
    return tenant;
  }

  static async default_tenant(): Promise<Nullable<Tenant>> {
	  /*let res = await query("SELECT * FROM Tenants LIMIT 1;", []);
    if (res.rowCount === 0) return null;
    return Tenant.from_row(res.rows[0]);*/
    return null;
  }

  static async load_by_id(tenant_id: number): Promise<Nullable<Tenant>> {
    let res = await query("SELECT * FROM Tenants WHERE tenant_id=$1;", [tenant_id]);
    if (res.rowCount === 0) return Tenant.default_tenant();
    return Tenant.from_row(res.rows[0]);
  }

  static async load_by_site_name(site_name: string): Promise<Nullable<Tenant>> {
    let res = await query("SELECT * FROM Tenants WHERE site_name=$1;", [site_name]);
    if (res.rowCount === 0) return Tenant.default_tenant();
    return Tenant.from_row(res.rows[0]);
  }

  async submit(): Promise<void> {
    if (this.tenant_id === -1) {
      this.tenant_id = (await query("INSERT INTO Tenants (site_name, stylesheet, name) VALUES " +
                                    "($1, $2, $3) RETURNING tenant_id;", [this.site_name, this.stylesheet,
                                    this.name])).rows[0].tenant_id;
    } else {
      await query("UPDATE Tenants SET site_name=$1, stylesheet=$2, name=$3 WHERE tenant_id=$4;", 
                  [this.site_name, this.stylesheet, this.name, this.tenant_id]);
    }
  }
}
