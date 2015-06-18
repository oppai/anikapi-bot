var Cron = require('cron').CronJob;
var Client = require('node-rest-client').Client;

var SCHEDULE_URL = "http://192.168.11.200:8000/api/reserves.json";

var DEBUG_CRON_FORMAT = "*/10 * * * * *";
var CRON_FORMAT = "0 30 6 * * *";

module.exports = function(robot){
    var job = new Cron(DEBUG_CRON_FORMAT, function(){
        postAtnimeList(function(text){
            robot.send({ room: "#kapibara" }, text.toString());
        });
    }, null, true, "Asia/Tokyo");
};

var postAtnimeList = function(callback){
    client = new Client();
    client.get(SCHEDULE_URL,function(data, response){
        console.log(data);
        var oneDayAgo = Date.now() + (24 * 60 * 60 * 1000);
        var todayAnime = data.filter(function(e){
            return e.start < oneDayAgo;
        }).map(function(e){
            var time = new Date(e.start);
            return {
                title: e.fullTitle,
                timestamp: time.getHours() + ':' + time.getMinutes()
            };
        });
        callback(todayAnime);
    });
};
