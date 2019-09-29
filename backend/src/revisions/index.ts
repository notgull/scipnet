/*
 * revisions/index.ts
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

import AwaitLock from 'await-lock';
import * as pg from 'pg';
import * as simpleGit from 'simple-git';
import { Git } from 'simple-git-types';

export class RevisionsService {
  private git: Git;
  private lock: AwaitLock;

  constructor(directory: string) {
    this.git = simpleGit(directory);
    this.lock = new AwaitLock();
  }
}
