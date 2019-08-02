/*
 * user.rs
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

extern crate ftml;
use ftml::User;

extern crate serde_json;
use serde_json::Value;

#[use_macro]
extern crate lazy_static;

extern crate rusqlite;
use rusqlite::types::ToSql;
use rusqlite::{Connection, Result, NO_PARAMS};

use std::path::Path;

use std::borrow::Cow;

use std::io::prelude::*;
use std::io::File;

lazy_static! {
  static ref USER_DATABASE: String = {
    let mut file = match File::open("../config.json") {
      Ok(f) => f,
      Err(e) => panic!("Unable to locate confiugration file"),
    };

    let mut file_contents = String::new();
    file.read_to_string(&mut file_contents)?;
    let contents = serde_json::from_str(file_contents);

    contents["sql_db_location"]
  };
}

pub fn get_user_info<'a>(name: &'a str) -> Result<Option<User<'a>>> {
  let connection = Connection::open(Path::new(USER_DATABASE + name));

  let read_user_sql = "SELECT user_id, username, avatar FROM Users WHERE username='" + name.to_string() +
                      "';";
  let mut stmt = connection.prepare(read_user_sql)?;
  let user_iter = stmt.query_map(NO_PARAMS, |row| User {
      name: Cow::Borrowed(row.get(1)?),
      id: row.get(0)?,
      avatar: row.get(2)?,
    });

  match user_iter.any(|x| true) {
    true: Ok<Some<user_iter.next()>>,
    false: Ok<None>
  }
}
