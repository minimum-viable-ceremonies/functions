const firebase = require('firebase-admin')
const { https } = require('firebase-functions')
const generator = require('ical-generator')
const moment = require('moment')
const fs = require('fs')

const eventPlacements = {
  'monday-1': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'monday'),
  'tuesday-1': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'tuesday'),
  'wednesday-1': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'wednesday'),
  'thursday-1': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'thursday'),
  'friday-1': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'friday'),
  'monday-2': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'monday', 2),
  'tuesday-2': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'tuesday', 2),
  'wednesday-2': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'wednesday', 2),
  'thursday-2': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'thursday', 2),
  'friday-2': (event, ceremony) => buildEvent(event, ceremony, 'weekly', 'friday', 2),
  'daily': (event, ceremony) => buildEvent(event, ceremony, 'daily')
}

const buildEvent = (event, { startTime, endTime, weekCount }, freq, day = 'monday', offset = 1) => {
  const m = moment().startOf('isoWeek').add(offset, 'week').day(day)

  if (startTime && endTime) {
    event.start = m.add(startTime, 'minutes')
    event.end = m.add(endTime, 'minutes')
  }

  if (countFor(weekCount)) {
    event.repeating({
      freq,
      interval: weekCount,
      count: countFor(freq, weekCount)
    })
  }
}

const countFor = (freq, weekCount) => {
  switch(freq) {
    case 'daily': return 60
    case 'weekly': return 12 / weekCount
    case 'monthly': return 3
  }
}

exports.upload = https.onRequest(({ body: { uuid, calendar = {} } }, res) => {
  firebase.database().ref(`/rooms/${uuid}`).once('value').then(snapshot => {
    const { weekCount, ceremonies, participants = {} } = snapshot.val()

    const ical = generator({
      domain: process.env.MVC_FIREBASE_DOMAIN,
      name: calendar.name || 'Calendar Name',
      timezone: calendar.timeZone || 'Europe/Berlin',
    })

    Object
      .values(ceremonies)
      .filter(({ placement }) => !!eventPlacements[placement])
      .forEach(ceremony => {
        const event = ical.createEvent()
        eventPlacements[placement](event, ceremony)

        Object
          .values(people)
          .map(uuid => participants[uuid])
          .filter(participant => participant)
          .forEach(({ username, email, optional }) => {
            event.createAttendee({
              email,
              name: username,
              role: optional ? 'opt-participant' : 'req-participant',
              type: 'individual'
            })
          })
    })

    fs.writeFile(`/tmp/${uuid}.ical`, ical.toString(), console.log)
    firebase.storage().bucket().upload(`/tmp/${uuid}.ical`)

    res.status(200).send({status: 'ok'})
  })
})

exports.download = https.onRequest(({ query: { uuid } }, res) => (
  firebase
    .storage()
    .bucket()
    .file(`${uuid}.ical`)
    .download(`/tmp/${uuid}.ical`)
    .then(() => fs.createReadStream(`/tmp/${uuid}.ical`).pipe(res))
))
