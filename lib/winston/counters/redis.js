

var redis = require('redis');
var helpers = require('./helpers');
var events = require('events');
var util = require('util');

var Redis = exports.Redis = function(options, redis_client) {

	events.EventEmitter.call(this);

	this.port = options.port || 6379;
	this.host = options.host || "127.0.0.1";
	this.redis_options = options.redis_options || {};
	this.password = options.password;
	this.levels = options.levels || helpers.DEFAULT_LEVELS;
  this.levels.unshift('alltime'); // always include a global time level
	
	this.redis_client = redis_client || redis.createClient();
	
};

Redis.prototype.quitClient = function() {
    this.redis_client.quit();
};

// 
// function incrementAndEmit(propkey, propval, timekey, timeval)
//   encapsulates the specifics of mapping properties and timelevels to redis structures
//
Redis.prototype.commitToRedis = function(propkey, propval, timekey, timeval) {
	proptimeval = this.propval + helpers.PROP_TIME_DELIMITER + this.timekey + helpers.TIME_DELIMITER + timeval;
	this.redis_client.hincrby(propkey, proptimeval,1);
};

//
// function increment (timestamp, levels, properties)
//   increments counters at each level in time dimension and for each property
//   properties is a dict of property:value pairs {prop1:val1, prop2:val2} for which stats are to be kept
//
Redis.prototype.increment = function(timestamp,properties) {
	timestamp = timestamp || new Date();
	properties = properties || {};
	
	properties["allprops"] = "allprops";  // always include a global property level across all properties
	
  // increment and emit for each property for each time level - NOTE: Requires at most (T+1) * (P+1) units of storage
  // where T is # of time levels in the config options and P is the number of properties given
  // actual storage required depends heavily on the cardinality of the actual properties data
	for (li in this.levels) {
		for (prop in properties) {
			this.emit('increment', prop, properties[prop], this.levels[li], helpers.dateToTick(timestamp, this.levels[li], helpers.TIME_PARTS_DELIMITER));
			this.commitToRedis(prop, properties[prop], this.levels[li], helpers.dateToTick(timestamp, this.levels[li], helpers.TIME_PARTS_DELIMITER));
		}
	}
	
};

//
// function count(start_time, end_time, level, properties)
//   get counts between Date objects start_time and end_time with 
//   time level a value in ["year","month","day","hour","minute"]
//   for each property in properties
//
Redis.prototype.count = function(start_time, end_time, level, properties, callback) {

	properties = properties || [];
	level = level || "hour";
	end_time = end_time || new Date();
	start_time = start_time || new Date(
		year=end_time[helpers.LEVEL_MAP['year']['method']](),
		month=end_time[helpers.LEVEL_MAP['month']['method']](),
		day=end_time[helpers.LEVEL_MAP['day']['method']](), hour=0
		);

	var ticks = helpers.buildTickSeries(start_time, end_time, level);
	//console.log('ticks: ' + ticks);

	results = {};
	
	keys = [];
	for (ti in ticks) {
	  keys.push("allprops||" + ticks[ti]);
	}
	for (ti in ticks) {
	  console.log("props: " + properties);
	  for (pi in properties) {
		  var vals = this.redis_client.smembers(properties[pi], function(err, reply) {});
		  console.log("vals for set " + properties[pi] + " : " + vals);
		  for (vi in vals) {
		    var valkey = properties[pi] + helpers.PROP_DELIMITER + vals[vi] + helpers.PROP_TIME_DELIMITER + ticks[ti];
		    keys.push(valkey);
		    console.log("Adding key to checklist: " + valkey);
		}
	    }
	
	}
	var self = this;
	this.redis_client.mget(keys, function(err, reply) {
		//console.log(reply);
		self.redis_client.quit();
		callback(reply);
	    });
};
