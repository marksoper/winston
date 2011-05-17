
var redis = require("redis");
var rc = redis.createClient();

rc.get("allprops||alltime", function(err,reply) {
  console.log("Global Total:  " + reply); 
});
