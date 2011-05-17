
var rc = require("redis").createClient();

rc.get("allprop||alltime", redis.print);
