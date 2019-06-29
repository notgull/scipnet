// sending xmlhttprequests to the server and receiving data in return
// need to include: js/cookie.js
var prsRequest = function(name, args, next) {
  // set up a form data with everything needed
  //var fData = new FormData();
  //fData.append('name', name);
  //fData.append('sessionId', getCookie('sessionId'));
  //for (var key in args)
  //  fData.append(key, args[key]);
  args['name'] = name;
  args['sessionId'] = getCookie('sessionId');

  // create callback
  var xhrCallback = function() {
    console.log(this.responseText);
    var result = JSON.parse(this.responseText);
    next(result);
  };

  // create XMLHttpRequest
  console.log("Sending PRS Request...");
  var req = new XMLHttpRequest();
  req.onload = xhrCallback;
 
  req.open("POST", "/prs");
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  req.send(new URLSearchParams(args));
};
