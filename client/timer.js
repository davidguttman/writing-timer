const html = require('nanohtml')
const morph = require('nanomorph')
const prettyMs = require('pretty-ms')

const db = require('./db')
const sounds = require('./sounds')
const { getId, setId } = require('./user-id')

const SESSION_DURATION = 25 * 60 * 1000
// const SESSION_DURATION = 3 * 1000

const state = {
  mode: 'INACTIVE',
  timeStart: null,
  lastSound: null,
  userId: getId(),
  sessionDuration: SESSION_DURATION
}

const tree = module.exports = render()

function render () {
  const renderMode = {
    INACTIVE: renderStart,
    ACTIVE: renderTimer,
    FINISHED: renderClaim,
    OPTIONS: renderOptions
  }[state.mode]

  return html`
  <div>
    <div class='avenir white-90 vh-100 dt w-100'>
      <div class='dtc v-mid tc ph3 ph5-l'>
        ${renderMode()}
      </div>
    </div>
  </div>`
}

function renderStart () {
  return html`
  <div>
    <div>
      <span class='f-headline lh-solid border-box ph4 pv3 pointer grow tracked white bg-animate hover-bg-white hover-black' onclick=${activate}>
        Start
      </span>
    </div>
    <div
      class='white-20 hover-white-50 pa2 cursor pointer'
      onclick=${showOptions}
      style='position: absolute; top: 0; right: 0'>
      Options
    </div>
  </div>
  `
}

function renderOptions () {
  return html`
    <div>
      <div>
        <label class='white-90'>
          Project ID
          <input
            type='text'
            value=${state.userId}
            class='tc input-reset bg-dark-gray white-90 mw5 pa2 ba b--black-20 mh3'
            onchange=${onUserIdChange} />
        </label>
      </div>
      <div class='ma4 dim pointer' onclick=${reset}>
        Back
      </div>
    </div>
  `
}

function renderTimer () {
  return html`
    <span class='f-headline lh-solid border-box ph4 pv3 pointer grow code white bg-animate hover-bg-white hover-black' onclick=${reset}>
      ${prettyMs(state.timeLeft, {
        colonNotation: true,
        secondsDecimalDigits: 0
      })}
    </span>
  `
}

function renderClaim () {
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

function showOptions () {
  state.mode = 'OPTIONS'
  update()
}

function tickLoop () {
  if (state.mode !== 'ACTIVE') return

  state.elapsed = Date.now() - state.timeStart
  state.timeLeft = SESSION_DURATION - state.elapsed

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
  update()
}

function claim () {
  sounds.ding()
  db.saveSession(state.userId, {
    timeStart: state.timeStart,
    timeClaimed: Date.now(),
    duration: state.sessionDuration
  })
  reset()
}

function onUserIdChange (evt) {
  const userId = evt.target.value
  if (!userId) return
  setId(userId)
  state.userId = userId
}

function update () {
  morph(tree, render())
}

// function blank () {
//   return html`<span />`
// }
