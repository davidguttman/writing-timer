const html = require('nanohtml')
const morph = require('nanomorph')
const prettyMs = require('pretty-ms')

require('./style')
const db = require('./db')
const sounds = require('./sounds')

const SESSION_LENGTH = 25 * 60 * 1000
// const SESSION_LENGTH = 3 * 1000

const state = {
  mode: 'INACTIVE',
  timeStart: null,
  lastSound: null
}

const tree = render()
document.body.appendChild(tree)

function render () {
  return html`
  <div>
    <div class='avenir white-90 vh-100 dt w-100'>
      <div class='dtc v-mid tc ph3 ph5-l'>
        ${renderTimer()}
        ${renderStart()}
        ${renderClaim()}
      </div>
    </div>
  </div>`
}

function renderStart () {
  if (state.mode !== 'INACTIVE') return blank()

  return html`
    <span class='f-headline lh-solid border-box ph4 pv3 pointer grow tracked white bg-animate hover-bg-white hover-black' onclick=${activate}>
      Start
    </span>
  `
}

function renderTimer () {
  if (state.mode !== 'ACTIVE') return blank()

  return html`
    <span class='f-headline lh-solid border-box ph4 pv3 pointer grow code white bg-animate hover-bg-white hover-black' onclick=${reset}>
      ${prettyMs(state.timeLeft, {colonNotation: true, secondsDecimalDigits: 0})}
    </span>
  `
}

function renderClaim () {
  if (state.mode !== 'FINISHED') return blank()

  return html`
    <span class='f-headline lh-solid border-box ph4 pv3 pointer grow tracked white bg-animate hover-bg-white hover-black ba' onclick=${claim}>
      Claim
    </span>
  `
}

function activate () {
  state.mode = 'ACTIVE'
  state.timeStart = Date.now()
  tickLoop()
}

function tickLoop () {
  if (state.mode !== 'ACTIVE') return

  state.elapsed = Date.now() - state.timeStart
  state.timeLeft = SESSION_LENGTH - state.elapsed

  if (state.timeLeft <= 0) return finish()

  update()
  playTickSound()

  window.requestAnimationFrame(tickLoop)
}

function playTickSound () {
  state.lastSound = state.lastSound || Date.now() - 1000
  if (Date.now() - state.lastSound <= 1000) return
  state.lastSound = Date.now()
  sounds.tick()
}

function reset () {
  state.mode = 'INACTIVE'
  state.timeStart = null
  update()
}

function finish () {
  state.mode = 'FINISHED'
  state.timeStart = null
  update()
}

function claim () {
  sounds.ding()
  db.saveSession()
  reset()
}

function update () {
  morph(tree, render())
}

function blank () {
  return html`<span />`
}
