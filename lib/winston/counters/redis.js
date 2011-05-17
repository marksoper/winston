
var rc = require("redis").createClient();

var TIME_LEVEL_MAP = {
	'year' : 'getYear',
	'month' : 'getMonth',
	'day' : 'getDate',
	'hour' : 'getHour',
	'minute' : 'getMinute'
};

var Redis = exports.Redis = function(redis_options, properties, time_levels) {
	this.port = redis_options.port || 6379;
	this.host = redis_options.host || "127.0.0.1";
	this.options = redis_options.options || {};
	this.password = redis_options.password;
	this.properties = properties || {};
	this.time_levels = time_levels || {};
};

//
// function increment (timestamp, time_levels, properties)
//   increments counters at each level in time dimension and for each property
//   properties is a dict of property:value pairs {prop1:val1, prop2:val2} for which stats are to be kept
//
Redis.prototype.increment = function(properties, timestamp, time_levels) {
	timestamp = timestamp || new Date();
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
