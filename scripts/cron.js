"use strict";
var Cron = require('cron').CronJob;
var Client = require('node-rest-client').Client;
var Exec = require('child_process').exec;

var SCHEDULE_URL = "http://192.168.11.200:8000/api/reserves.json";
var MORNING_CRON_FORMAT = "0 30 6 * * *";
var NIGHT_CRON_FORMAT   = "0 50 21 * * *";
var ROOM = "#kapibara";
var password = '';

var DEBUG = false;

if(DEBUG){
    CRON_FORMAT = "*/10 * * * * *";
    ROOM = "#memo";
}

module.exports = function(robot){
    var m_job = new Cron(MORNING_CRON_FORMAT, function(){
        postAtnimeList(function(text){
            robot.send({ room: ROOM }, "今晩の予約済みのアニメは");
            robot.send({ room: ROOM }, text);
            robot.send({ room: ROOM }, "だよ！ <!channel>");

            shutdown(function(){
                robot.send({ room: ROOM }, "anikapiを止めたよ！");
            }, function(){
                robot.send({ room: ROOM }, "anikapiを止められなかったよ…");
            });
        });
    }, null, true, "Asia/Tokyo");

    var n_job = new Cron(NIGHT_CRON_FORMAT, function(){
            robot.send({ room: ROOM }, "アニメサーバをつけるよ！");
            shutdown(function(){
                robot.send({ room: ROOM }, "anikapiをつけたよ！");
            }, function(){
                robot.send({ room: ROOM }, "anikapiを付けられなかったよ…");
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

var shutdown = function(sc,ec){
    var child = Exec("echo '"+password+"' | ssh -A kapi sudo -S shutdown -h now",function (error, stdout, stderr) {
        if(!error){
            sc();
        }else{
            ec();
        }
    });
};
var wakeonlan = function(sc,ec){
    var child = Exec("wakeonlan d0:50:99:2f:4b:de",function (error, stdout, stderr) {
        if(!error){
            sc();
        }else{
            ec();
        }
    });
};
