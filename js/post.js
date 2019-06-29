
// refractored from other method
var create_post_form = function(url, params) {
  var form = document.createElement('form');
  form.method = 'post';
  form.action = url;

  // loop through params
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      var hidden_field = document.createElement('input');
      hidden_field.type = 'hidden';
      hidden_field.name = key;
      hidden_field.value = params[key];

      form.appendChild(hidden_field);
    }
  }

  form.classList.add('vanished');
  document.body.appendChild(form);
  return form;
};

// send POST data to a specified URL
// jerry rigged, maybe make better later?
// Taken from: https://stackoverflow.com/a/133997/11187995
var send_post_data = function(url, params) {
  var form = create_post_form(url, params);
  form.submit();
};
