
var rc = require("redis").createClient();

var TIME_LEVEL_MAP = {
	'year' : 'getUTCYear',
	'month' : 'getUTCMonth',
	'day' : 'getUTCDate',
	'hour' : 'getUTCHour',
	'minute' : 'getUTCMinute'
};

var Redis = exports.Redis = function(options) {
	this.port = options.port || 6379;
	this.host = options.host || "127.0.0.1";
	this.redis_options = options.redis_options || {};
	this.password = options.password;
	this.properties = options.properties || {};
	this.time_levels = options.time_levels || {};
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
	for (time_level in time_levels)
	  rc.incr(allprops||time_level + "::" + timestamp[TIME_LEVEL_MAP[time_level]]())
	for (prop in properties)
	  rc.incr(prop + "::" + properties[prop] + "||alltime");
	for (prop in properties) {
  	for (time_level in time_levels) {
			var key =  prop + "::" + properties[prop] + "||" + time_level + "::" + timestamp[TIME_LEVEL_MAP[time_level]]();
			rc.incr(key);
		}
	}	
};
