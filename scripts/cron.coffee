cron = require('cron').CronJob

module.exports = (robot) ->
  new cron '0 30 6 * * *', () =>
    robot.send {room: "#kapibara"}, "test"
  , null, true, "Asia/Tokyo"
