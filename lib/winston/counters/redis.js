
var rc = require("redis").createClient(),
	  async = require("async");

var TIME_LEVEL_MAP = {
	'year' : {method:'getFullYear',
		        parents:[]},
	'month' : {method:'getMonth',
		         parents:['year']},
	'day' : {method:'getDate',
	         parents:['year','month'],
				   interval:86400000},
	'hour' : {method:'getHours',
		        parents:['year','month','day'],
		        interval:3600000},
	'minute' : {method:'getMinutes',
		          parents:['year','month','day','hour'],
						  interval:60000}
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
	  rc.incr("allprops||" + makeTick(time_level,timestamp));
	for (prop in this.properties)
	  rc.incr(prop + "::" + this.properties[prop] + "||alltime");
	for (prop in this.properties) {
  	for (time_level in this.time_levels) {
			var key =  prop + "::" + this.properties[prop] + "||" + makeTick(time_level,timestamp);
			rc.incr(key);
		}
	}	
};


makeTick = function(time_level,timestamp) {
	var time_vals = [timestamp[TIME_LEVEL_MAP[time_level]['method']]()];
	for (p in TIME_LEVEL_MAP[time_level]['parents']) {
		time_vals.unshift(timestamp[TIME_LEVEL_MAP[p]['method']]());
	}
  var tick_time = time_vals.join('-'); 
	var tick = time_level + "::" + tick_time;
};

//
// function count(start_time, end_time, precision, properties)
//   get counts between Date objects start_time and end_time with 
//   time precision a value in ["year","month","day","hour","minute"]
//   for each property in properties
//
Redis.prototype.count = function(start_time, end_time, precision, properties) {
	properties = properties || this.properties;
	precision = precision || "hour";
	end_time = end_time || new Date();
	start_time = start_time || new Date(year=end_time.getFullYear(), month=end_time.getMonth(), day=end_time.getDay(), hour=0);
	get_funcs = {};
	
	var t = start_time;
	while (t <= end_time) {
		timekey = precision + "::" + t[TIME_LEVEL_MAP[precision]['method']]();
		key = "allprops||" + timekey;
		reply_callback = function(err,reply) {
			results[key] = reply;
		};
		get_func = function(reply_callback) {
			rc.get(key, reply_callback);
		};
		get_funcs[key] = get_func;
		
	}
	
	async.parallel(get_funcs, function(err,results) {
		for (tick in results) {
			console.log(tick + "::" + results[tick]);
		}
	});
};

determinePrecision = function(tick) {
	return tick.split('::')[0];
};

parseTick = function(tick) {
	var tick_parts = tick.split("::");
	var precision = tick_parts[0];
	var time_parts = tick_parts[1].split("-");
	for (i in time_parts) {
		TIME_LEVEL_MAP[DEFAULT_TIME_LEVELS[i]][''] = // start here
	}
};

nextTickAndTime = function(tick, precision) {
	precision = precision || determinePrecision(tick);
	var current_time = new Date()		
	if (precision == "year") {

	  return makeTick(new Date())
	}
};

buildTickSeries = function(start_time, end_time, precision) {
	var tick = makeTick(start_time, precision);
  var ticks = [tick];
	
	if (["day","hour","minute"].indexOf(precision) >= 0) {
		while (t <= end_time) {
			t = t + TIME_LEVELS_MAP[precision]['interval'];
			ticks.push(makeTick(t, precision));
		}
	}
	
	else {
		while (t <= end_time) {
			var next_tick_time = nextTickAndTime(tick, precision);
			ticks.push(next_tick_time['tick']);
			t = t + next_tick_time['time'];
		}
	}
	
	var tick = start_time[TIME_LEVEL_MAP[precision]['method']]();
	var ticks = [tick];
	while (t <= end_time) {
		var nextTickandTime = nextTick();
		tick = nextTick(tick);
		ticks.push(tick);
		
	}
};
