/*
 * usertable.js
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

var random = require('../random');

// a table of user data
module.exports = function() {
  if (!(this instanceof module.exports)) return new module.exports();

  this.userset = [];
  this.prevId = 0;
};

// register a user and ip address into the user table
module.exports.prototype.register = function(user, ip_addr, expiry, change_ip) {
  // check if the user is already in here
  for (var i = 0; i < this.userset.length; i++) {
    var chckUser = this.userset[i];
    if (chckUser.user === user) {
      if (chckUser.ip_addrs.indexOf(ip_addr) === -1) {
	if (!change_ip)
          chckUser.ip_addrs.push(ip_addr);
	else
	  chckUser.ip_addrs = [ip_addr];
      }
      return chckUser.id;
    }
  }
	
  var id = this.prevId;
  id += random.randomInt(2, 9);
  if (id > 2999999) id -= prevId;
  this.prevId = id;

  var userObj = {id: id};
  userObj.user = user;
  userObj.expiry = expiry;
  userObj.ip_addrs = [ip_addr];
  this.userset.push(userObj);

  // console.log("Added id " + id + " to table");

  return id;
};

// check to make sure a session conforms to the ip address
module.exports.prototype.check_session = function(session, ip_addr) {
  //console.log("Checking for id " + session);
  for (var i = 0; i < this.userset.length; i++) {
    var chckUser = this.userset[i];
    //console.log("Comparing to id " + chckUser.id);
    if (chckUser.id === session) {
     if (chckUser.ip_addrs.indexOf(ip_addr) !== -1) {
       // console.log("Found user!");
       return chckUser.user;
     } else {
       // console.log("Found user, but IP address does not match");
       return false;
     }
    }
  }

  // console.log("Did not find user");
  return false;
};

// remove expired sessions from the database
module.exports.prototype.check_expiry = function() {
  var now = new Date();
  for (var i = this.userset.length - 1; i >= 0; i--) {
    var chckUser = this.userset[i];
    if (now > chckUser.expiry) {
      this.userset.splice(1, i);
    } 
  }
}

// debug function
module.exports.prototype._printUsers = function() {
  for (var i = 0; i < this.userset.length; i++) {
    console.log(JSON.stringify(this.userset[i]));
  }
}
