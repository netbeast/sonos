/*
  This file is responsible of the communication with the end-device.
  We should read the received data and talk to the device.
*/

var express = require('express')
var router = express.Router()
var Sonos = require('sonos')
var sonos
var async = require('async')
var mqtt = require('mqtt')

// Require the discovery function
var loadResources = require('./resources')
var helper = require('./helpers')

// If you need to obtain more information from the resources you can use the callback
// Example. loadResources(function (err, devices, etc) {
//        ...
//  })
loadResources(function (err, devices) {
  if (err) throw err

  router.get('/sonos/:id', function (req, res, next) {
    sonos = new Sonos.Sonos(req.params.id, 1400)

    var queries = {
      volume: sonos.getVolume.bind(sonos),
      status: sonos.getCurrentState.bind(sonos),
      track: sonos.currentTrack.bind(sonos)
    }

    const actions = Object.keys(req.query).length ? req.query : queries

    for (var key in req.query) {
      if (!queries.hasOwnProperty(key)) delete actions[key]
      console.log(actions)
    }

    if (!Object.keys(req.query).length) return res.status(202).send('Values not available on this sonos speaker')

    const keys = Object.keys(actions) // serialize action keys

    async.map(keys, function (key, done) {
      queries[key](function (err, val) {
        if (err) return done(err)
        return done(null, val)
      })
    }, function (err, results) {
      // All queries have finished
      if (err) return res.status(500).send(err)
      var response = {}
      // now de-serielize keys
      keys.forEach(function (key, index) { response[key] = results[index] })
      return res.json(response)
    })
  })

  router.get('/discover', function (req, res, next) {
    loadResources(function (err, devices) {
      if (err) return res.status(500).send(err)
      return res.json(devices)
    })
  })

  /*
  On this route we should modify specified values of the device current status.
  */
  router.post('/sonos/:id', function (req, res, next) {
    sonos = new Sonos.Sonos(req.params.id, '1400')

    if (!Object.keys(req.body).length) return res.status(400).send('Incorrect set format')

    var response = {}

    async.series([function volume (done) {
      if (!req.body.volume) return done() // nothing to do here
      sonos.setVolume(req.body.volume, function (err, result) {
        if (err) return done(err)
        response.volume = req.body.volume
        return done(null, result)
      })
    },
    function status (done) {
      if (!req.body.status) return done() // nothing to do here
      helper.setCurrentState(sonos, req.body.status, function (err, result) {
        if (err) return done(err)
        response.status = req.body.status
        return done(null, result)
      })
    },
    function play (done) {
      if (!req.body.track) return done() // nothing to do here
      if (req.body.status === 'stop' || req.body.status === 'pause') return done()
      helper.playSong(sonos, req.body.track, function (err, result) {
        if (err) return done(err)
        response.track = req.body.track
        return done(null, result)
      })
    }], function (err, results) {
      // All queries have finished
      if (err) return res.status(500).send(err)
      var client = mqtt.connect()
      client.publish('music', JSON.stringify(response))
      return res.send(response)
    })
  })
})

// Used to serve the routes
module.exports = router
