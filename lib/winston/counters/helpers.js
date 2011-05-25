

var LEVEL_MAP = exports.LEVEL_MAP = {
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
exports.DEFAULT_LEVELS = DEFAULT_LEVELS;


var dateToTick = exports.dateToTick = function(timestamp,level) {

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

var determinePrecision = exports.determinePrecision = function(tick) {
	return tick.split('::')[0];
};


var tickToDate = exports.tickToDate = function(tick) {
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


var nextTickAndTime = exports.nextTickAndTime = function(tick, level) {
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

	result['tick'] = dateToTick(result['time'], level, LEVEL_MAP);

	//console.log("nextTickandTime - tick: " + result['tick'] + "  result['time']: " + result['time']);

	return result;
};


var buildTickSeries = exports.buildTickSeries = function(start_time, end_time, level) {
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
