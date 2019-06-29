
// create the initial database
var config = require('./../../config.json');
var sqlite3 = require('sqlite3').verbose();

module.exports = function(next) {
  console.log("Creating new database at " + config.sql_db_location);
  var db = new sqlite3.Database(config.sql_db_location, (err) => {
    if (err) throw new Error(err);
    // create user and pwhash tables
    var user_table_sql = "CREATE TABLE Users (" +
		            "user_id INTEGER PRIMARY KEY," +
		            "username TEXT NOT NULL UNIQUE," +
		            "email TEXT NOT NULL UNIQUE," +
		            "karma INTEGER NOT NULL," +
		            "join_data INTEGER NOT NULL," +
		            "status INTEGER NOT NULL," +
		            "website TEXT," +
		            "about TEXT," +
		            "city TEXT," +
		            "gender TEXT" +
	                  ");";
    db.run(user_table_sql, (err) => {
      if (err) throw new Error(err);
      var pwHash_table_sql = "CREATE TABLE Passwords (" +
                               "user_id INTEGER PRIMARY KEY," +
			       "username TEXT NOT NULL UNIQUE," +
		               "salt TEXT NOT NULL UNIQUE," +
			       "pwhash TEXT NOT NULL" +
			     ");";
      db.run(pwHash_table_sql, (err) => {
        if (err) throw new Error(err);

	// tables are created, close the database
        db.close((err) => {
          if (err) throw new Error(err);
	  next();
	});
      });
    });
  });
};
