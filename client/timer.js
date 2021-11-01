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
      style='position: absolute; bottom: 0; right: 0'>
      Options
    </div>
    <a
      class='white-20 hover-white-50 pa2 cursor pointer no-underline'
      href='#/dashboard/${getId()}'
      target='_blank'
      style='position: absolute; bottom: 0; left: 0'>
      Dashboard
    </a>
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

  playTickSound()
  update()

  setTimeout(tickLoop, 50)
}

function playTickSound () {
  const now = Math.floor(Date.now() / 1000)
  state.lastSound = state.lastSound || now
  if (now === state.lastSound) return
  state.lastSound = now
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
