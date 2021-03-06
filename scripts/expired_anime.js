"use strict";
var Cron = require('cron').CronJob;
var Client = require('node-rest-client').Client;
var Exec = require('child_process').exec;

var BASE_URL = "http://192.168.11.200:8000";
var RECORED_URL = BASE_URL + "/api/recorded.json";

var MORNING_CRON_FORMAT = "0 0 6 * * *";
var WEEKLY_CRON_FORMAT = "0 0 6 0 * *";
var ROOM = "#kapibara";
var password = 'aniKapi';

var DEBUG = false;

if(DEBUG){
    MORNING_CRON_FORMAT = "*/10 * * * * *";
}

module.exports = function(robot){
    var m_job = new Cron(MORNING_CRON_FORMAT, function(){
        getExpiredAnime(function(list){
            var animeList = list.map(function(e){ return ":x:"+e.title+"["+e.url+"]"; }).join("\n");
            robot.send({ room: ROOM }, "今週削除されるアニメは...\n" + animeList + "\nだよ！早く見てね！" );
        });
    }, null, true, "Asia/Tokyo");

    var w_job = new Cron(WEEKLY_CRON_FORMAT, function(){
        getExpiredAnime(function(list){
            deleteAnime(function(){
                robot.send({ room: ROOM }, "古いアニメを削除したよ！" );
            },function(){
                robot.send({ room: ROOM }, "古いアニメを削除に失敗したよ..." );
            });
        });
    }, null, true, "Asia/Tokyo");

};


var getExpiredAnime = function(callback){
    var client = new Client();
    function makeurl(recorded_id){
        var prefix = BASE_URL + "/api/recorded/" + recorded_id + "/";
        return prefix + "watch.xspf?prefix=" + prefix;
    }
    client.get(RECORED_URL,function(data, response){
        var json = JSON.parse(data.toString());
        var hundredDayAgo = Date.now() - (100 * 24 * 60 * 60 * 1000);
        var animes = json.filter(function(e,i,a){
            return e.start < hundredDayAgo;
        }).map(function(e,i,a){
            return {
                title: e.fullTitle,
                url: makeurl(e["id"])
            };
        });
        callback(animes);
    });
};

var deleteAnime = function(sc,ec){
    var child = Exec('ssh kapi "find ./chinachu/recorded -mtime +100 | xargs rm -f"',function (error, stdout, stderr) {
        if(!error){
            sc();
        }else{
            ec();
        }
    });
};

