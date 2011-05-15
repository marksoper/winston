


var extractObj = require('parser').extractObj;

//
// function Analog (options)
//   Constructor for the Analog instrument object.
//
var Analog = exports.Analog = function (options) {
	options = options || {};
	

//
// function parseRequest (request)
//   extracts data from request object
//
Analog.prototype.parseRequest = function(request) {
		var reqdata = extractObj(request,'request');
		return reqdata;
};


//
// function parseTransaction (request)
//   extracts data for transaction (request + response)
//
Analog.prototype.parseTransaction = function(request, response, response_body) {
	return analog.parseRequest(request);
};


