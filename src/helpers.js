var helper = module.exports = {}
var prevSong // Save song which is being reproduced.

helper.setCurrentState = function (sonos, status, callback) {
  if (!sonos) return callback(new Error('Sonos not specified'))

  // refactor hack ;)
  sonos.mute = sonos.setMuted.bind(sonos, true)
  sonos.unmute = sonos.setMuted.bind(sonos, false)
  sonos.info =  sonos.currentTrack

  if (typeof sonos[status] !== 'function') {
    return callback(new Error('Status method unprocessable'))
  }
  if (status === 'info') {
    sonos.currentTrack(function(err, info) {
      if (err) return callback(true, {info: 'Can not get info'})
        return callback(null, info)
    })
  } else if (status === 'play' && !prevSong) {
    return callback(null)
  } else {
    sonos[status](function (err, result) {
     if (err) return callback(new Error('Can not set state to ' + status))
     return callback(null, status)
   })
  }
}

helper.playSong = function (sonos, song, callback) {
 if(!prevSong)
  prevSong = song
 //I get the state, if it is paused, I unpause the song, if not I play the song from the begining.
 sonos.getCurrentState(function (error, state) {
  if(error) return callback(new Error('Can not play song'))
  if (state === 'playing' && prevSong === song) return callback(null, 'playing')
  prevSong = song
  console.log(song)
  sonos.play(song, function (err, playing) {
    if (err) return callback(new Error('Can not play song'))

    return callback(null, 'playing')
      // this past line is SETTING ERROR TO TRUE
  })
 })
}
