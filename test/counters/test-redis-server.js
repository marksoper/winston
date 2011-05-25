
var http = require('http'),
    fs = require('fs'),
		sys = require('sys'),
    path = require('path'),
		helpers = require('./helpers');

// using development fork of winston for now
var winston = require('../../lib/winston');

// analog not yet on npm - obtain from https://github.com/marksoper/analog
var analog = require('../../../analog/lib/analog')


// construct winston transport(s) and counter(s)
var	configFile = path.join(__dirname, './config/', 'test-redis-config.json'),
    config = JSON.parse(fs.readFileSync(configFile).toString()),
		transports = helpers.getTransports(config),
		counters = helpers.getCounters(config);
		
var logger = new (winston.Logger)({
		transports: transports,
		counters: counters
		});
		
// use an instrument to build log metadata from request object
var analog = new (analog.Analog)();


exports.createServer = function (port) {

  var server = http.createServer(function (request, response) {

    var body = '';

    request.on('data', function (chunk) {
      body += chunk;
    });

    request.on('end', function () {
		  var response_body = "response body goes here";
			response.writeHead(200);
		  response.end(response_body);
			logger.log("info","log message payload",analog.transform(request, response, response_body));
    });

	});

  if (port) {
    server.listen(port);
  }

  return server;

};

exports.start = function(options, callback) {
  var server = exports.createServer(options.port);
  callback(null, server);
};

var config = {'port' : 8000};

exports.start(config, function (err, server) {
  if (err) {
    return sys.puts('Error starting analog example server: ' + err.message);
  }
  sys.puts('analog example server listening on http://127.0.0.1:' + config.port);
});

