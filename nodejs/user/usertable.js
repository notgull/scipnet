
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
