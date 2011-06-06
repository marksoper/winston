


var path = require("path"),
    fs = require("fs");



// using development fork of winston for now
var winston = require('../../lib/winston');

var	configFile = path.join(__dirname, './config/', 'test-redis-config.json'),
    config = JSON.parse(fs.readFileSync(configFile).toString()),
  counter = new (winston.counters.Redis)(config["counters"].redis),
    properties = config["counters"].redis["properties"];
		


//var counts = counter.count(false,false,false,properties, function(results) {
//	for (attr in results) {
//	    console.log("RESULTS: " + attr + " :: " + results[attr]);
//	}
	//counter.quitClient();
//	return;
//    });


counter.addListener('increment', function(propkey, propval, timekey, timeval) {
	console.log(propkey + "  :  " + propval + "    ;;    " + timekey + "  :  " + timeval);
});

