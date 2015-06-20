var Cron = require('cron').CronJob;
var Client = require('node-rest-client').Client;

var SCHEDULE_URL = "http://192.168.11.200:8000/api/reserves.json";
var CRON_FORMAT = "0 30 6 * * *";
var ROOM = "#kapibara";

var DEBUG = false;

if(DEBUG){
    CRON_FORMAT = "*/10 * * * * *";
    ROOM = "#memo";
}

module.exports = function(robot){
    var job = new Cron(CRON_FORMAT, function(){
        postAtnimeList(function(text){
            robot.send({ room: ROOM }, "今晩の予約済みのアニメは");
            robot.send({ room: ROOM }, text);
            robot.send({ room: ROOM }, "だよ！ <!channel>");
        });
    }, null, true, "Asia/Tokyo");
};

var postAtnimeList = function(callback){
    client = new Client();
    client.get(SCHEDULE_URL,function(data, response){
        var json = JSON.parse(data.toString());
        var oneDayAgo = Date.now() + (24 * 60 * 60 * 1000);
        var todayAnime = json.filter(function(e){
            return e.start < oneDayAgo;
        }).map(function(e){
            var time = new Date(e.start);
            return formatedDateString(time) + "\t" + e.fullTitle;
        }).join("\n");
        callback(todayAnime);
    });
};

var formatedDateString = function(date) {
    return  date.getDate() + "日 " + date.getHours() + "時" + date.getMinutes() + "分";
}
