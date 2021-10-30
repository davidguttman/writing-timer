const play = require('audio-play')
const load = require('audio-loader')
const AsyncCache = require('async-cache')

const cache = new AsyncCache({
  load: function (url, cb) {
    load(url).then(buf => cb(null, buf))
  }
})

cache.get('/tick.wav', function () {})
cache.get('/everquest.mp3', function () {})

module.exports = {
  tick,
  ding
}

function tick () {
  cache.get('/tick.wav', function (err, buf) {
    if (err) return console.error(err)
    play(buf)
  })
}


function ding () {
  cache.get('/everquest.mp3', function (err, buf) {
    if (err) return console.error(err)
    play(buf)
  })
}
