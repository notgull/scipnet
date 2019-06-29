
// function to hash a password via the PBKDF2 algorithm

// convert an ascii string to a byte array
function str_to_bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; ++i)
        bytes.push(str.charCodeAt(i));
    return new Uint8Array(bytes);
}

// convert an array of bytes to a hex string
function bytes_to_hstring(bytes) {
    if (!bytes)
        return null;

    bytes = new Uint8Array(bytes);
    var hex_bytes = [];

    for (var i = 0; i < bytes.length; ++i) {
        var byte_string = bytes[i].toString(16);
        if (byte_string.length < 2)
            byte_string = "0" + byte_string;
        hex_bytes.push(byte_string);
    }

    return hex_bytes.join("");
}

function onErr(err) {
  alert("Unable to hash password: " + err);
}

var hash_password = function(pwd, salt, next) {
  console.log("Pwd is \"" + pwd + "\", salt is \"" + salt + "\"");
  try {
    const algorithm = "PBKDF2";
    crypto.subtle.importKey("raw", str_to_bytes(pwd), algorithm, false, ["deriveBits"])
      .then(function(key) {
        return crypto.subtle.deriveBits({name: algorithm, salt: str_to_bytes(salt), iterations: 100000, hash: "sha-256"}, key, 128);
      }, onErr).then(function(result) {
        next(bytes_to_hstring(result));
      }, onErr);
  } catch(err) { onErr(err); }
}
