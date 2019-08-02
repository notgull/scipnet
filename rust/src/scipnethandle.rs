/*
 * scipnethandle.rs
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

// scipnet handle - for pulling metadata from the metadata files
use ftml::MetadataObject;

//extern crate serde_json;
use serde_json::Value;

use std::io::prelude::*;
use std::fs::File;

use std::collections::HashSet;

//extern crate chrono;
//use chrono::prelude::*;
//use chrono::{DateTime, Utc};
//use std::time::Duration;

//use std::borrow::Cow;
use std::convert::TryFrom;

//use std::marker::Copy;
use std::clone::Clone;

//extern crate rusqlite;
//use rusqlite::types::{FromSql, ToSql};
//use rusqlite::{Connection, NO_PARAMS};

//use std::path::Path;

//#[macro_use]
//extern crate lazy_static;

// only valid for 5 seconds while loading
//#[derive(Clone)]
//pub struct MetadataFile {
//  url: String,
//  title: String,
//  rating: i32,
//  tags: HashSet<String>,
//  created: DateTime<Utc>,
//}

//pub struct ScipnetHandle {
//  page_metadata: Vec<MetadataFile>,
//}

//impl ScipnetHandle {
  //pub fn new() -> ScipnetHandle {
    //ScipnetHandle { page_metadata: Vec::new() }
  //}
//}

lazy_static! {
  static ref METADATA_FOLDER: String = {
    //println!("{}", std::env::current_dir().unwrap().to_str().unwrap());

    let mut file = match File::open("config.json") {
      Ok(f) => f,
      Err(_e) => panic!("Unable to locate configuration file"),
    };

    let mut file_contents = String::new();
    file.read_to_string(&mut file_contents).unwrap();
    let contents: Value = serde_json::from_str(&file_contents).unwrap();

    match &contents["scp_meta_location"] {
      Value::String(s) => String::from(s),
      _ => panic!("Invalid configuration"),
    }
  };
}

pub fn get_metadata_properties(url: &str) -> ftml::Result<MetadataObject> {
  let md_path = format!("{}{}", *METADATA_FOLDER, url); 
  println!("{}", md_path);
  let mut file = match File::open(md_path) {
    Ok(f) => f,
    Err(_) => return Err(ftml::Error::StaticMsg("Unable to open metadata file"))
  };

  let mut file_contents = String::new();
  file.read_to_string(&mut file_contents).unwrap();
  let contents : Value = match serde_json::from_str(&file_contents) {
    Ok(c) => c,
    Err(_) => return Err(ftml::Error::StaticMsg("Unable to process JSON"))
  };

  let rating = match &contents["rating"] {
    Value::Number(n) => i32::try_from(n.as_i64().unwrap()).expect("Int conversion failed"),
    _ => return Err(ftml::Error::StaticMsg("Unable to read rating"))
  };

  let title = match &contents["title"] {
    Value::String(s) => s,
    _ => return Err(ftml::Error::StaticMsg("Unable to get title")),
  };

  let mut taglist = HashSet::new();
  let tagsource = match &contents["tags"] {
    Value::Array(a) => a.clone(),
    _ => return Err(ftml::Error::StaticMsg("Unable to read tags")),
  };

  for tag in tagsource {
    match tag {
      Value::String(realtag) => taglist.insert(realtag),
      _ => return Err(ftml::Error::StaticMsg("Unable to read tag list")),
    };
  }

  let object = MetadataObject {
    url: String::from(url),
    title: String::from(title),
    rating: rating,
    tags: taglist.clone()
  };

  Ok(object)
}

/*
impl ScipnetHandle {
  // read the metadata into an object
  fn get_metadata_properties<'a>(&self, url: &str) -> ftml::Result<MetadataFile> {
    //if (metadata_folder == "") {
    //  set_metadata_folder();
   // }

    let mut file = match File::open(format!("{}{}", *metadata_folder, url)) {
      Ok(f) => f,
      Err(e) => return Err(ftml::Error::Io(e)),
    };
    let mut file_contents = String::new();

    file.read_to_string(&mut file_contents).expect(&format!("{}{}", "Unable to read from file ", url));
    let contents: Value = serde_json::from_str(&file_contents).unwrap();

    let mut taglist = HashSet::new();
    let mut tagsource = match &contents["tags"] {
      Value::Array(a) => a.clone(),
      _ => return Err(ftml::Error::StaticMsg("Unable to read tags")),
    };

    for tag in tagsource {
      match tag {
        Value::String(realtag) => taglist.insert(realtag),
        _ => return Err(ftml::Error::StaticMsg("Unable to read tag list")),
      };
    }

    let rating = match &contents["rating"] {
      Value::Number(n) => i32::try_from(n.as_i64().unwrap()).unwrap(),
      _ => return Err(ftml::Error::StaticMsg("Unable to get rating")),
    };
    let title = match &contents["title"] {
      Value::String(s) => s,
      _ => return Err(ftml::Error::StaticMsg("Unable to get title")),
    };
    let mut object = MetadataFile { url: url.to_string(),
                                    title: String::from(title), 
                                    rating: rating, 
                                    tags: taglist,
                                    created: Utc::now() };
    Ok(object)
  }

  // find an object in the scipnethandle's database
  fn load_metadata_object<'a>(&'a mut self, url: &str) -> ftml::Result<&'a MetadataFile> {
    let url_as_string = url.to_string();

    // ignore outdated metadata object (> 5s difference)
    let now = Utc::now();

    self.page_metadata = self.page_metadata.into_iter()
        .filter(|x| now.signed_duration_since(x.created).to_std().unwrap().as_secs() < 5)
        .collect::<Vec<MetadataFile>>();

    for metadata in self.page_metadata {
      let time_between = now.signed_duration_since(metadata.created).to_std().unwrap();
      if (metadata.url == url_as_string && time_between.as_secs() < 5) {
        return Ok(&metadata)
      }
    }

    // haven't found it, create it
    let metadata = self.get_metadata_properties(url)?;
    self.page_metadata.push(metadata);
    Ok(&self.page_metadata.last().expect("Impossible error"))
  }
}
*/
