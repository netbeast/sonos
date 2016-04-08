var util = require('util')
var request = require('request')
// Sonos declaration
var Sonos = require('sonos')

var devices = []
module.exports = function (callback) {
  var objects = []
  // Request to the database
  request.get('http://' + process.env.NETBEAST + '/api/resources?app=sonos',
  function (err, resp, body) {
    if (err) return callback(err, null)
    if (!body) return callback()
    // Store the found devices in 'objects' array
    if (util.isArray(body)) {
      body.forEach(function (device) {
        if (objects.indexOf(device.hook) < 0) objects.push(device.hook)
      })
    }
  })

  // Implement the device discovery method
  Sonos.search(function (device) {
    devices.push(device)
    var indx = objects.indexOf('/sonos/' + device.host)
    if (indx >= 0) {
      objects.splice(indx, 1)
    } else {
      request.post({url: 'http://' + process.env.NETBEAST + '/api/resources',
      json: {
        app: 'sonos',
        location: 'none',
        topic: 'music',
        groupname: 'none',
        hook: '/sonos/' + device.host
      }},
      function (err, resp, body) {
        if (err) return callback(err, null)
        return callback(null, body)
      })
    }
  })

  setTimeout(function () {
    if (objects.length > 0) {
      objects.forEach(function (hooks) {
        //  Use this block to delete a device from the netbeast database
        request.del(process.env.NETBEAST + '/api/resources?hook=' + hooks,
        function (err, resp, body) {
          if (err) return callback(err) // this might produce unwanted results...
        })
      })
    }
    return callback(null, devices)
  }, 60000)
}
