// sending xmlhttprequests to the server and receiving data in return
// need to include: js/cookie.js
var prsRequest = function(name, args, next) {
  // set up a form data with everything needed
  var fData = new FormData();
  fData.append('name', name);
  fData.append('sessionId', getCookie('sessionId'));
  for (var key in args)
    fData.append(key, args[key]);
  
  // create callback
  var xhrCallback = function() {
    console.log(this.responseText);
    next(JSON.parse(this.reponseText));
  };

  // create XMLHttpRequest
  var req = XMLHttpRequest();
  req.onload = xhrCallback;
  req.open("post", "/prs");
  req.send(fData);
};
