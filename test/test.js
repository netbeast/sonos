 request = require('request')
/*
Volume: must be a number between 0-100

Status: can be
		play --> Play a song track or unpause a song that has been paused
		pause --> Pause a song
		stop --> Stop
		mute --> mute a song
		unmute --> unmute a song
		info --> Get info from sonos

Track: must be http://yourIP:portWherePlugingisrunning/File
*/


//PLAY a song

var args = {volume: '10', status: 'play' ,track: 'https://archive.org/download/testmp3testfile/mpthreetest.mp3'}
request.post({
  url: 'http://localhost:8000/i/sonos/sonos/172.27.65.70',
  json: args
}, function (err, resp, body) {
  if (err) console.log(err)
  console.log(body)
})

/*

STOP
Change status: 'play' to status: 'stop'

OTHERS
Try changing the status value, volume and track, and remove some of the keys. 

IMPROVE
If you want to improve the app and you have find out some erros, please put some issues on the Netbeast github URL

Thank you

Netbeast Team
*/