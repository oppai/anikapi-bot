"use strict";
var ping = require("net-ping");

module.exports = function(robot){
    robot.respond(/チェック/i,function(msg){
        var session = ping.createSession();
        var target = "192.168.11.200";
        session.pingHost (target, function (error, target) {
            if (error) {
                msg.send("アニカピサーバは停止してるよ！");
            } else {
                msg.send("アニカピサーバは動作してるよ！");
            }
        });
    });
}
