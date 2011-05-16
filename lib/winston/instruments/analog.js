


var extractObj = require('parser').extractObj;

//
// function Analog (options)
//   Constructor for the Analog instrument object.
//
var Analog = exports.Analog = function () {
};

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



//
// function updateCounts (timestamp, time_levels, properties)
//   increments counters at each level in time dimension and for each property
//   properties is a dict of property:value pairs {prop1:val1, prop2:val2} for which stats are to be kept
//
var TIME_LEVEL_MAP = {
	'year' : 'getYear',
	'month' : 'getMonth',
	'day' : 'getDate',
	'hour' : 'getHour',
	'minute' : 'getMinute'
}
var rc = require("redis").createClient();
Analog.prototype.updateCounts = function(timestamp, time_levels, properties) {
	properties = properties || [];
	time_levels = time_levels || ['year','month','day','hour','minute'];
	rc.incr("allprops||alltime");
	for (prop in properties)
	  rc.incr(prop + "::" + properties[prop] + "||alltime");
	for (prop in properties) {
  	for (time_level in time_levels) {
			var key =  prop + "::" + properties[prop] + "||" + timestamp[TIME_LEVEL_MAP[time_level]]();
			rc.incr(key);
		}
	}	
};
