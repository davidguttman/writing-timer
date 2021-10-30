const LS_KEY = 'userId'

module.exports = {
  getId,
  setId
}

function getId () {
  return window.localStorage[LS_KEY] || createId()
}

function createId () {
  const id = [
    Date.now().toString(36),
    Math.round(Math.random() * 10e4).toString(36)
  ].join('_')

  setId(id)

  return id
}

function setId (id) {
  window.localStorage[LS_KEY] = id
}
