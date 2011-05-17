
var rc = require("redis").createClient(),
	  async = require("async");

var TIME_LEVEL_MAP = {
	'year' : 'getFullYear',
	'month' : 'getMonth',
	'day' : 'getDate',
	'hour' : 'getHours',
	'minute' : 'getMinutes'
};
DEFAULT_TIME_LEVELS = [];
for (tl in TIME_LEVEL_MAP)
  DEFAULT_TIME_LEVELS.push(tl);

var Redis = exports.Redis = function(options) {
	this.port = options.port || 6379;
	this.host = options.host || "127.0.0.1";
	this.redis_options = options.redis_options || {};
	this.password = options.password;
	this.properties = options.properties || {};
	this.time_levels = options.time_levels || DEFAULT_TIME_LEVELS;
};

//
// function increment (timestamp, time_levels, properties)
//   increments counters at each level in time dimension and for each property
//   properties is a dict of property:value pairs {prop1:val1, prop2:val2} for which stats are to be kept
//
Redis.prototype.increment = function(timestamp) {
	timestamp = timestamp || new Date();
	rc.incr("allprops||alltime");
	for (time_level in this.time_levels)
	  rc.incr("allprops||" + time_level + "::" + timestamp[TIME_LEVEL_MAP[this.time_levels[time_level]]]())
	for (prop in this.properties)
	  rc.incr(prop + "::" + this.properties[prop] + "||alltime");
	for (prop in this.properties) {
  	for (time_level in this.time_levels) {
			var key =  prop + "::" + this.properties[prop] + "||" + time_level + "::" + timestamp[TIME_LEVEL_MAP[time_level]]();
			rc.incr(key);
		}
	}	
};


//
// function count(start_time, end_time, precision, properties)
//   get counts between Date objects start_time and end_time with 
//   time precision an integer in milliseconds
//   for each property in properties
//
Redis.prototype.count = function(start_time, end_time, precision, properties) {
	properties = properties || this.properties;
	precision = precision || 36000000;
	end_time = end_time || new Date();
	start_time = new Date(year=end_time.getFullYear(), month=end_time.getMonth(), day=end_time.getDay());
	get_funcs = [];
	results = {};
	for (var t, t < end_time, t = t + precision) {
		//key = // figure out key
		reply_callback = function(reply) {
			results[]
		};
		get_func = function() {
			
		}
	}
};
