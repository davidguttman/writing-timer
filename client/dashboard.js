const _ = require('lodash')
const html = require('nanohtml')
// const jsonist = require('jsonist')
// const insertCSS = require('insert-css')
const calendarHeatmap = require('@dguttman/calendar-heatmap')

// const extraData = require('./extra.json')

// let maxDateTime = new Date(0).toISOString()

// insertCSS(`
//   .item.item-circle,
//   .item.item-block-rect,
//   .item.item-block {
//     opacity: 1 !important
//   }
// `)

const estFinalCount = 200

const style = {
  statRow: 'ph4 flex justify-between',
  stat: 'db dib-l w-auto-l lh-title',
  statLabel: 'f6 fw4 ml0',
  statValue: 'f2 f-subheadline-l fw6 ml0'
}

// reload()
// setInterval(reload, 60 * 1000)

module.exports = render

// function reload () {
//   // const url = `https://fs-node-tracker.thhis.com/data.json`
//   const url = 'http://localhost:5000/data.json'
//
//   jsonist.get(url, (err, data) => {
//     if (err) return console.error(err)
//
//     const mostRecent = _.maxBy(data, 'datetime') || { datetime: maxDateTime }
//     if (mostRecent.datetime > maxDateTime) {
//       maxDateTime = mostRecent.datetime
//       render(data.concat(extraData))
//     }
//   })
// }

function render (timerData) {
  console.log(timerData)
  const stats = processTimerData(timerData)
  const calendarData = processCalendarData(timerData)

  const elCal = html`<div style='width: 98%' id='cal'></div>`

  calendarHeatmap.init({
    data: calendarData,
    container: elCal,
    overview: 'month',
    color: '#357edd'
  })

  return html`
    ${elCal}
    ${renderAllTime(stats)}
    ${renderBarVis(stats)}
    ${renderStatsSection('Last 3 Days', stats.threeDays)}
    ${renderStatsSection('Last 7 Days', stats.week)}
    ${renderStatsSection('Last 14 Days', stats.twoWeeks)}
    ${renderStatsSection('Last 30 Days', stats.month)}
  `
}

function renderAllTime (stats) {
  const { count } = stats.all

  const blendedPerDay =
    0.30 * stats.threeDays.perDay +
    0.25 * stats.week.perDay +
    0.20 * stats.twoWeeks.perDay +
    0.15 * stats.month.perDay +
    0.10 * stats.all.perDay

  const remaining = estFinalCount - stats.all.count
  const estFinish = remaining / blendedPerDay

  return html`
    <article class="pa3" data-name="slab-stat-large">
      <h3 class="f6 ttu tracked">All Time</h3>
      <div class="${style.statRow}">
        ${renderStat('Hours', (count / 2).toFixed(1))}
        ${renderStat('Remaining', ((estFinalCount - count) / 2).toFixed(1))}
        ${renderStat('Est. Finish', daysToDate(estFinish))}
      </div>
    </article>
  `
}

function renderBarVis (stats) {
  const previous = 100 * (stats.all.count - stats.month.count) / estFinalCount
  const month = 100 * (stats.month.count - stats.twoWeeks.count) / estFinalCount
  const twoWeeks = 100 * (stats.twoWeeks.count - stats.week.count) / estFinalCount
  const week = 100 * (stats.week.count - stats.threeDays.count) / estFinalCount
  const threeDays = 100 * (stats.threeDays.count - stats.day.count) / estFinalCount
  // const day = 100 * stats.day.count / estFinalCount

  return html`
    <div class='w-100 bg-white-30 h1'>
      <div class='bg-navy h1' style='width: ${previous}%; float: left'></div>
      <div class='bg-dark-blue h1' style='width: ${month}%; float: left'></div>
      <div class='bg-blue h1' style='width: ${twoWeeks}%; float: left'></div>
      <div class='bg-light-blue h1' style='width: ${week}%; float: left'></div>
      <div class='bg-lightest-blue h1' style='width: ${threeDays}%; float: left'></div>
    </div>
  `
}

function renderStatsSection (label, { count, perDay, estFinish }) {
  return html`
    <article class="pa2" data-name="slab-stat-large">
      <h3 class="f6 ttu tracked">${label}</h3>
      <div class="${style.statRow}">
        ${renderStat('Per Day', (perDay / 2).toFixed(1))}
        ${renderStat('Hours', (count / 2).toFixed(1))}
        ${renderStat('Est. Finish', daysToDate(estFinish))}
      </div>
    </article>
  `
}

function processTimerData (timerData) {
  const msDay = 24 * 3600 * 1000
  const msWeek = 7 * msDay
  const msMonth = 30 * msDay

  const all = processSubset(timerData, '2018-10-30')

  const day = processSubset(timerData, Date.now() - msDay)
  const threeDays = processSubset(timerData, Date.now() - (3 * msDay))
  const week = processSubset(timerData, Date.now() - msWeek)
  const twoWeeks = processSubset(timerData, Date.now() - (2 * msWeek))
  const month = processSubset(timerData, Date.now() - msMonth)

  const remaining = estFinalCount - all.count

  day.estFinish = remaining / day.perDay
  threeDays.estFinish = remaining / threeDays.perDay
  week.estFinish = remaining / week.perDay
  twoWeeks.estFinish = remaining / twoWeeks.perDay
  month.estFinish = remaining / month.perDay
  all.estFinish = remaining / all.perDay

  return {
    all: { count: all.count, perDay: all.perDay, estFinish: all.estFinish },
    day,
    threeDays,
    week,
    twoWeeks,
    month
  }
}

function processSubset (timerData, timeStart, timeEnd) {
  timeStart = timeStart || '2018-10-30'
  timeStart = new Date(timeStart)

  const subset = timerData.filter(
    t => new Date(t.datetime) > new Date(timeStart)
  )
  const count = subset.length

  timeEnd = timeEnd || Date.now()
  const duration = timeEnd - timeStart

  const perDay = count / (duration / (24 * 3600 * 1000))

  return {
    count,
    perDay
  }
}

function renderStat (label, value) {
  return html`
    <dl class="${style.stat}">
      <dd class="${style.statLabel}">${label}</dd>
      <dd class="${style.statValue}">${value}</dd>
    </dl>
  `
}

function daysToDate (days) {
  if (!isFinite(days)) return '-'
  const msDay = 24 * 3600 * 1000
  const [year, month, day] = new Date(
    Date.now() + (days * msDay)
  ).toISOString().slice(0, 10).split('-').map(n => Number(n))
  const parts = [month, day]
  if (year !== new Date().getFullYear()) parts.push(year.toString().slice(2))
  return parts.join('/')
}

function processCalendarData (timerData) {
  return _.map(
    _.groupBy(timerData, t => t.datetime.slice(0, 10)),
    function (entries, date) {
      const total = _.sumBy(entries, 'duration') / 1000
      return {
        date,
        total,
        details: entries.map(e => ({
          name: '',
          date: e.datetime,
          value: e.duration / 1000
        }))
      }
    }
  )
}
