
var rc = require("redis").createClient(),
	  async = require("async");

var LEVEL_MAP = {
	'year' : {method:'getFullYear',
		        parents:[]},
	'month' : {method:'getMonth',
		         parents:['year']},
	'day' : {method:'getDate',
	         parents:['month','year'],
				   interval:86400000},
	'hour' : {method:'getHours',
		  parents:['day','month','year'],
		        interval:3600000},
	'minute' : {method:'getMinutes',
		    parents:['hour','day','month','year'],
						  interval:60000}
};
DEFAULT_LEVELS = [];
for (tl in LEVEL_MAP)
  DEFAULT_LEVELS.push(tl);

var Redis = exports.Redis = function(options) {
	this.port = options.port || 6379;
	this.host = options.host || "127.0.0.1";
	this.redis_options = options.redis_options || {};
	this.password = options.password;
	this.properties = options.properties || {};
	this.levels = options.levels || DEFAULT_LEVELS;
};

//
// function increment (timestamp, levels, properties)
//   increments counters at each level in time dimension and for each property
//   properties is a dict of property:value pairs {prop1:val1, prop2:val2} for which stats are to be kept
//
Redis.prototype.increment = function(timestamp) {
	timestamp = timestamp || new Date();
	rc.incr("allprops||alltime");
	for (level in this.levels)
	  rc.incr("allprops||" + dateToTick(level,timestamp));
	for (prop in this.properties)
	  rc.incr(prop + "::" + this.properties[prop] + "||alltime");
	for (prop in this.properties) {
  	for (level in this.levels) {
			var key =  prop + "::" + this.properties[prop] + "||" + dateToTick(level,timestamp);
			rc.incr(key);
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

	properties = properties || this.properties;
	level = level || "hour";
	end_time = end_time || new Date();
	start_time = start_time || new Date(
		year=end_time[LEVEL_MAP['year']['method']](),
		month=end_time[LEVEL_MAP['month']['method']](),
		day=end_time[LEVEL_MAP['day']['method']](), hour=0
		);

	var ticks = buildTickSeries(start_time, end_time, level);

	console.log(ticks);

	get_funcs = {};
	
	for (ti in ticks) {
	  var key = "allprops||" + ticks[ti];
		reply_callback = function(err,reply) {
			results[key] = reply||0;
			console.log('reply_callback for ' + key);
		};
		get_func = function(reply_callback) {
			rc.get(key, reply_callback);
			console.log('get_func for ' + key);
		};
		get_funcs[key] = get_func;
		console.log("\nget_func - " + key + " :: " + get_func.valueOf() );
	}

	async.parallel(get_funcs, function(err,results) {
		    callback(results);
	});

};


dateToTick = function(timestamp,level) {

    	//console.log('dateToTick - timestamp: ' + timestamp + " | level: " + level);

	var time_vals = [timestamp[LEVEL_MAP[level]['method']]()];

	for (p in LEVEL_MAP[level]['parents']) {
	    var parent = LEVEL_MAP[level]['parents'][p];
	    //console.log('dateToTick - parent: ' + parent);
		time_vals.unshift(timestamp[LEVEL_MAP[parent]['method']]());
	}
  var tick_time = time_vals.join('-'); 
	var tick = level + "::" + tick_time;

	return tick;

};

determinePrecision = function(tick) {
	return tick.split('::')[0];
};

tickToDate = function(tick) {
	var tick_parts = tick.split("::");
	var level = tick_parts[0];
	var time_parts = tick_parts[1].split("-");
        for (var i=0; i<=5; i++) {
	    if (!time_parts[i])
	      time_parts[i] = 0;
	}
	//console.log('tickToDate - time_parts: ' + time_parts);

	// WTF - there's gotta be a better way than this ...
	var date = new Date(time_parts[0],
			time_parts[1],
			time_parts[2],
			time_parts[3],
			time_parts[4],
			time_parts[5]);

	//console.log('tickToDate - date: ' + date);

	return date;
};

nextTickAndTime = function(tick, level) {
	level = level || determinePrecision(tick);
	var result = {};	

	//console.log('nextTickandTime - tick: ' + tick);

	var current_time = tickToDate(tick);

	//console.log('nextTickandTime - current_time: ' + current_time);

	if (level == "year") {
		result['time'] = Date(current_time[LEVEL_MAP['year']['method']]() + 1);
	}
	else if (level == "month") {
		var current_month = current_time[LEVEL_MAP['month']['method']]();
		var current_year = current_time[LEVEL_MAP['year']['method']]();
		if (current_month == 12) {
			var next_month = 1;
			var next_year = current_year + 1;
		}
		else {
			var next_month = current_month + 1;
			var next_year = current_year;
		}
		result['time'] = Date(next_year, next_month);
	}
	else {
	    result['time'] = new Date(current_time.valueOf() + LEVEL_MAP[level]['interval']);
	}

	result['tick'] = dateToTick(result['time'], level);

	//console.log("nextTickandTime - tick: " + result['tick'] + "  result['time']: " + result['time']);

	return result;
};

buildTickSeries = function(start_time, end_time, level) {
	var tick = dateToTick(start_time, level);



  var ticks = [tick];
	var t = start_time;
	while (t < end_time) {

	    //console.log('buildTickSeries - tick: ' + tick);

		var next_tick_time = nextTickAndTime(tick, level);
		
		//console.log("buildTickSeries - next_tick: " + next_tick_time['tick']);

		ticks.push(next_tick_time['tick']);

		//console.log("buildTickSeries - next_tick: " + next_tick_time['tick'] + "    next_tick_time['time'] " + next_tick_time['time'] );

		t = next_tick_time['time'];
		tick = next_tick_time['tick'];
	}

	return ticks;
};
