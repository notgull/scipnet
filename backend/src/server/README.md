=== ScipnetJsonApp SERVER API ===

scipnet is a JSON-RPC-2.0 server that will response to the following commands:

* favicon.ico - returns the favicon, standard stuff for a web server
* * No required parameters
* sys/login, sys/register - returns either the login or register pages, in html
* * Expected cookie: sessionId - ID of the current session
* * Expected url parameter: errorcode: Error code for the latest error (TODO: reinvent this)
* sys/process-login - takes the information in the Body section of the request in order to log the user in
* * Expected body parameters:
* * * username and pwHash - login credentials
* * * changeIp - whether or not the IP should be changed
* * * remember - whether to extend the expire date of the session
* sys/process-register - takes the information in the Body section of the request to create a new user object
* * Expected body parameters: username/pwHash/email - user information
* sys/pagereq - pagereq, params should be in the Body section
* * Expected body parameters (in addition to request-specific variables):
* * * sessionId - ID of the current session
* * * name - name of the desired function to request
* sys/fonts/* - loads a font
* * No required parameters
* sys/images/* - loads an image
* * No required parameters
* main - loads the main page
* * See below for variables
* page - loads a page by its slug (needs param pageid)
* * Expected body parameter: sessionId - ID of the current session

Params should contain the following:

* ip - IP Address of the client
* body - variables from the Body (POST) section, in the form of a dict
* params - URL params
* cookies - cookies

Return value will be:

* data - JSON object containing data from the procedure
* send - either null or a string containing HTML data to be displayed in the browser
* redirect - either null or a url to redirect to
* type - the MIME type for the "send" value's output
* cookie - an array on objects with values "name", "value", and "maxAge", representing cookies to be set
