
var redis = require("redis"),
    path = require("path"),
    fs = require("fs");
var rc = redis.createClient();



rc.get("allprops||alltime", function(err,reply) {
  console.log("Global Total:  " + reply); 
});


// using development fork of winston for now
var winston = require('../../lib/winston');

var	configFile = path.join(__dirname, './config/', 'test-redis-config.json'),
    config = JSON.parse(fs.readFileSync(configFile).toString()),
    counter = new (winston.counters.Redis)(config["counters"].redis,rc);
		
var counts = counter.count(false,false,false,false, function(results) {
	for (attr in results) {
	    console.log("RESULTS: " + attr + " :: " + results[attr]);
	}
	counter.quitClient();
	return;
    });
