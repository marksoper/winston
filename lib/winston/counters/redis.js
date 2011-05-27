
var redis = require('redis');
var helpers = require('./helpers');


var Redis = exports.Redis = function(options,redis_client) {

	this.port = options.port || 6379;
	this.host = options.host || "127.0.0.1";
	this.redis_options = options.redis_options || {};
	this.password = options.password;
	this.levels = options.levels || helpers.DEFAULT_LEVELS;

	this.redis_client = redis_client || redis.createClient();
};


Redis.prototype.quitClient = function() {
    this.redis_client.quit();
};


//
// function increment (timestamp, levels, properties)
//   increments counters at each level in time dimension and for each property
//   properties is a dict of property:value pairs {prop1:val1, prop2:val2} for which stats are to be kept
//
Redis.prototype.increment = function(timestamp,properties) {
	timestamp = timestamp || new Date();
	properties = properties || {};
	this.redis_client.incr("allprops||alltime");
	for (li in this.levels) {
  	  this.redis_client.incr("allprops||" + helpers.dateToTick(timestamp,this.levels[li]));
          //console.log("increment - allprops||" + helpers.dateToTick(timestamp,this.levels[li]));
	}
	for (prop in properties) {
	  this.redis_client.incr(prop + "::" + properties[prop] + "||alltime");
	  this.redis_client.sadd(prop,properties[prop]);
	  console.log("Increment adding to set: " + prop + " value: " + properties[prop]);
	}
	for (prop in properties) {
  	for (li in this.levels) {
	    var key =  prop + "::" + properties[prop] + "||" + helpers.dateToTick(timestamp,this.levels[li]);
			this.redis_client.incr(key);
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
		var vals = this.redis_client.smembers(properties[pi], function(err, reply));
		console.log("vals for set " + properties[pi] + " : " + vals);
		for (vi in vals) {
		    var valkey = properties[pi] + "::" + vals[vi] + "||" + ticks[ti];
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
