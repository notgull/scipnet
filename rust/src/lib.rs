/*
 * lib.rs
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
extern crate serde_json;
#[macro_use]
extern crate lazy_static;
extern crate rusqlite;

use ftml::prelude::*;
//use ftml::include::*;
//use ftml::Error;
use ftml::transform;
//use ftml::WikidotHandle;
use ftml::HtmlRender;
use ftml::MetadataObject;
//use serde::{Deserialize, Serialize};
//use serde_json::Value;

//use std::fs::File;
//use std::io::prelude::*;
//use std::borrow::Cow;
use std::ffi::CStr;
use std::ffi::CString;
use std::iter::FromIterator;
use std::collections::HashSet;
use std::convert::From;
use std::os::raw::c_char;
//use std::sync::Arc;

mod scipnetincluder;
//mod scipnethandle;

use self::scipnetincluder::ScipnetIncluder;
//use self::scipnethandle::get_metadata_properties;

// helper function to convert a *const c_char into a regular string
fn c_char_to_string(s: *const c_char) -> Result<String> {
  unsafe {
    if s.is_null() {
      return Err(ftml::Error::StaticMsg("String is null"));
    }

    let raw = CStr::from_ptr(s);
  
    let raw_as_string = String::from(raw.to_str().expect("Unable to convert CSTR to string slice"));

    Ok(raw_as_string)
  }
}

// function called from node.js
#[no_mangle]
pub extern fn scipnet_transform(url: *const c_char, src: *const c_char, rating: i32,
                                title: *const c_char, tags: *const c_char) -> *const c_char {
  //println!("{}", url);

  //let arc_string = c_char_to_string(arc).unwrap();
  //println!("Converting url");
  let url = c_char_to_string(url).unwrap();
  //println!("Converting src");
  let mut src = c_char_to_string(src).unwrap();

  //let mut article_json: Value = serde_json::from_str(arc_string).expect("Could not process;
  let metadata_object = MetadataObject {
    url: url.clone(),
    title: c_char_to_string(title).unwrap(),
    rating: rating,
    tags: HashSet::from_iter::<Vec<String>>(c_char_to_string(tags).unwrap().split(';').map(
      |s| String::from(s)).collect()),
  };

  let output = transform::<HtmlRender>(0, metadata_object, &mut src, &ScipnetIncluder, &url).expect("FTML failed");

  let output_cstr = CString::new(output.html).expect("Failed CString cast");
  let p = output_cstr.as_ptr();
  std::mem::forget(output_cstr);
  p
}
