/*
 * scipnetincluder.rs
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

//extern crate ftml;
use ftml::include::{NotFoundIncluder, Includer};

//#[use_macro]
//extern crate lazy_static;

//extern crate serde_json;
use serde_json::Value;

use std::{
  borrow::Cow,
  collections::HashMap,
  io::Read,
  fs::File
};

//use std::result::Result;

lazy_static! {
  static ref CONTENT_LOCATION: String = {
    let mut file = match File::open("config.json") {
      Ok(f) => f,
      Err(_e) => panic!("Unable to locate configuration file"),
    };

    let mut file_contents = String::new();
    file.read_to_string(&mut file_contents).expect("Could not read from file");
    let contents : Value = serde_json::from_str(&file_contents).expect("Could not parse JSON");

    match &contents["scp_data_location"] {
      Value::String(s) => String::from(s),
      _ => panic!("Unable to resolve data location")
    }
  };

  static ref NULL_INCLUDER: NotFoundIncluder = {
    NotFoundIncluder {}
  };
}

#[derive(Clone)]
pub struct ScipnetIncluder;

impl Includer for ScipnetIncluder {
  fn get_resource(&self, name: &str, _args: &HashMap<&str, &str>) -> ftml::Result<Cow<'static, str>> {
    let mut file = match File::open(format!("{}{}", *CONTENT_LOCATION, name)) {
      Ok(f) => f,
      Err(_) => return (*NULL_INCLUDER).get_resource(name, _args),
    };

    let mut file_contents = String::new();
    file.read_to_string(&mut file_contents).expect("Could not read from file");
    Ok(Cow::Owned(file_contents.clone()))
  }
}
