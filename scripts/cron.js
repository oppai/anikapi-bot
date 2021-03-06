"use strict";
var Cron = require('cron').CronJob;
var Client = require('node-rest-client').Client;
var Exec = require('child_process').exec;

var USER = ""
var RSA_PATH = ""
var HOST = "192.168.11.200";
var SSH_CMD = "ssh -oConnectTimeout=5 -oStrictHostKeyChecking=no "+USER+"@"+HOST+" -A -i "+RSA_PATH;
var SCHEDULE_URL = "http://" + HOST + ":8000/api/reserves.json";
var MORNING_CRON_FORMAT = "0 30 6 * * *";
var NIGHT_CRON_FORMAT   = "0 50 21 * * *";
var password = '';
var ROOM = "#anime";

var DEBUG = false;

if(DEBUG){
    MORNING_CRON_FORMAT = "*/5 * * * * *";
    //NIGHT_CRON_FORMAT = "*/5 * * * *";
    ROOM = "#anime";
}

module.exports = function(robot){
    var wakeup = function(){
        wakeonlan(function(){
            robot.send({ room: ROOM }, "anikapiをつけたよ！");
        }, function(){
            robot.send({ room: ROOM }, "anikapiを付けられなかったよ…");
        });
    };
    var goodnight = function(){
        shutdown(function(){
            robot.send({ room: ROOM }, "anikapiを止めたよ！");
        }, function(){
            robot.send({ room: ROOM }, "anikapiを止められなかったよ…");
        });
    };
    var todaysAnime = function(be_stop){
        postAnimeList(function(text){
            robot.send({ room: ROOM }, "今晩の予約済みのアニメは\n"+text+"\nだよ！<!channel>");
            if(be_stop){
                goodnight();
            }
        });
    };
    var diskCheck = function(){
        diskUsed(function(){
            robot.send({ room: ROOM }, "ディスクの空き容量がやばいよ！！<!channel>");
        }, function(){
            robot.send({ room: ROOM }, "ディスクの空き容量は問題ないよ");
        });
    };

    var m_job = new Cron(MORNING_CRON_FORMAT, function(){
        diskCheck();
        todaysAnime(true);
    }, null, true, "Asia/Tokyo");

    var n_job = new Cron(NIGHT_CRON_FORMAT, function(){
        robot.send({ room: ROOM }, "アニメサーバをつけるよ！");
        wakeup();
    }, null, true, "Asia/Tokyo");

    robot.respond(/おはよう/i,function(msg){
        wakeup();
    });
    robot.respond(/おやすみ/i,function(msg){
        goodnight();
    });
    robot.respond(/今日のアニメ/i,function(msg){
        todaysAnime();
    });
    robot.respond(/容量チェック/i,function(msg){
        diskCheck();
    });
};

var postAnimeList = function(callback){
    var client = new Client();
    client.get(SCHEDULE_URL,function(data, response){
        var json = JSON.parse(data.toString());
        var today = Date.now();
        var oneDayAgo = today + (24 * 60 * 60 * 1000);
        var todayAnime = json.filter(function(e){
            return today < e.start && e.start < oneDayAgo;
        }).map(function(e){
            var time = new Date(e.start);
            return formatedDateString(time) + "\t" + e.fullTitle;
        }).join("\n");
        callback(todayAnime);
    });
};

var diskUsed = function(sc, ec) {
    Exec(SSH_CMD+' "df -H | grep \'/dev/\' | grep -v boot" | awk \'{print $5}\' | tr -d %', function (error, stdout, stderr) {
        var isLimited = stdout.split('\n').some(function(e){
            return e >= 85
        });
        if(!error && isLimited){
            sc();
        }else{
            console.log(error);
            ec();
        }
    });
}

var formatedDateString = function(date) {
    return  date.getDate() + "日 " + date.getHours() + "時" + date.getMinutes() + "分";
}

var shutdown = function(sc,ec){
    var child = Exec("echo '"+password+"' | "+SSH_CMD+" sudo -S shutdown -h now",function (error, stdout, stderr) {
        if(!error){
            sc();
        }else{
            console.log(error);
            ec();
        }
    });
};
var wakeonlan = function(sc,ec){
    var child = Exec("wakeonlan d0:50:99:2f:4b:de",function (error, stdout, stderr) {
        if(!error){
            sc();
        }else{
            console.log(error);
            ec();
        }
    });
};
