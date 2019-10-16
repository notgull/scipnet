=== ScipnetJsonApp SERVER API ===

scipnet is a JSON-RPC-2.0 server that will response to the following commands:

* /favicon.ico - returns the favicon, standard stuff for a web server
* /sys/login, /sys/register - returns either the login or register pages, in html
* /sys/process-login - takes the information in the Body section of the request in order to log the user in
* /sys/process-register - takes the information in the Body section of the request to create a new user object
* /sys/pagereq - pagereq, params should be in the Body section
* /sys/fonts/* - loads a font
* /sys/images/* - loads an image
* / - loads the main page
* /{slug} - loads a page by its slug

Params should contain the following:

* ip - IP Address of the client
* body - variables from the Body section, in the form of a dict
* params - URL params
* cookies - cookies

Return value will be:

* data - JSON object containing data from the procedure
* send - either null or a string containing HTML data to be displayed in the browser
* redirect - either null or a url to redirect to
* type - the MIME type for the "send" value's output
