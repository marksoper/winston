
var request = require('request'),
    path = require('path');


var request_options = {
	uri: 'http://127.0.0.1:8000',
	method: 'GET',
	headers: {
	  referer: 'theonion.com'
	}
}

request(request_options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
	  console.log(request_options["method"] + " " + request_options["uri"] + " :: " + body);
	}
});
