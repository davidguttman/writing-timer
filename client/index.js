require('./style')

const db = require('./db')
const timer = require('./timer')
const { getId } = require('./user-id')
const dashboard = require('./dashboard')

const container = document.createElement('div')
document.body.appendChild(container)

window.addEventListener('hashchange', loadRoute)
loadRoute()

function loadRoute () {
  const url = window.location.hash.replace(/^#\//, '')
  const urlParts = url.split('/')

  if (!urlParts[0]) return timerRoute()
  if (urlParts[0] === 'dashboard') return dashboardRoute(urlParts.slice(1))
  if (urlParts[0] === 'fake') return fakeDataRoute()

  return notFound()
}

async function timerRoute () {
  container.innerHTML = ''
  container.appendChild(timer)
}

async function dashboardRoute (id) {
  container.innerHTML = ''
  const sessions = await db.getSessions(id || getId())
  container.appendChild(dashboard(sessions))

  setInterval(async function () {
    container.innerHTML = ''
    const sessions = await db.getSessions(id || getId())
    container.appendChild(dashboard(sessions))
  }, 30 * 60 * 1000)
}

async function fakeDataRoute () {
  container.innerHTML = 'Fake Data Loading'

  const dateEnd = new Date().toISOString().slice(0, 10)

  const d = new Date()
  d.setDate(-60)

  const datetimes = []

  while (d.toISOString() < dateEnd) {
    if (Math.random() < 0.5) datetimes.push(d.toISOString())
    d.setHours(d.getHours() + 1)
    if (Math.random() < 0.4) datetimes.push(d.toISOString())
    d.setHours(d.getHours() + 1)
    if (Math.random() < 0.3) datetimes.push(d.toISOString())
    d.setHours(d.getHours() + 1)
    if (Math.random() < 0.2) datetimes.push(d.toISOString())

    d.setDate(d.getDate() + 1)
  }

  container.innerHTML = `${datetimes.length} times`
  datetimes.forEach(function (dt, i) {
    setTimeout(function () {
      db.saveSession(getId(), {
        datetime: dt,
        duration: 25 * 60 * 1000
      })
      container.innerHTML = `${i} / ${datetimes.length} times`
    }, i * 1000)
  })
}

function notFound () {
  container.innerHTML = 'Not Found'
}
