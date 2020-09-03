const firebase = require('firebase-admin')
const { https } = require('firebase-functions')
const generator = require('ical-generator')
const moment = require('moment')
const fs = require('fs')

const weeklyEvent = (event, ceremony, day, offset = 1) => {
  const { startTime, endTime, weekCount } = ceremony
  const m = moment().startOf('isoWeek').add(offset, 'week').day(day)

  event.start = m.add(startTime, 'minutes')
  event.end = m.add(endTime, 'minutes')
  event.repeating({ freq: 'WEEKLY', interval: weekCount, count: 12 / weekCount })

  return event
}

const eventPlacements = {
  'monday-1': (event, ceremony) => weeklyEvent(event, ceremony, 'monday'),
  'tuesday-1': (event, ceremony) => weeklyEvent(event, ceremony, 'tuesday'),
  'wednesday-1': (event, ceremony) => weeklyEvent(event, ceremony, 'wednesday'),
  'thursday-1': (event, ceremony) => weeklyEvent(event, ceremony, 'thursday'),
  'friday-1': (event, ceremony) => weeklyEvent(event, ceremony, 'friday'),
  'monday-2': (event, ceremony) => weeklyEvent(event, ceremony, 'monday', 2),
  'tuesday-2': (event, ceremony) => weeklyEvent(event, ceremony, 'tuesday', 2),
  'wednesday-2': (event, ceremony) => weeklyEvent(event, ceremony, 'wednesday', 2),
  'thursday-2': (event, ceremony) => weeklyEvent(event, ceremony, 'thursday', 2),
  'friday-2': (event, ceremony) => weeklyEvent(event, ceremony, 'friday', 2),
  'daily': (event, ceremony) => {
    const m = moment().startOf('isoWeek').add(1, 'week').day('monday')
    event.start = m.add(ceremony.startTime)
    event.end = m.add(ceremony.endTime)
    event.repeating({ freq: 'DAILY', count: 30 })

    return event
  }
}

exports.upload = https.onRequest((req, res) => {
  const { uuid, calendar = {} } = req.body
  const filename = `/tmp/${uuid}.ical`

  firebase.database().ref(`/rooms/${uuid}`).once('value').then(snapshot => {
    const room = snapshot.val()

    const ical = generator({
      domain: process.env.MVC_FIREBASE_DOMAIN,
      name: calendar.name || 'Calendar Name',
      timezone: calendar.timeZone || 'Europe/Berlin',
    })

    Object
      .values(room.ceremonies)
      .filter(({ placement }) => !!eventPlacements[placement])
      .forEach(ceremony => eventFromCeremony(ical, room, ceremony))

    fs.writeFile(filename, ical.toString(), console.log)
    firebase.storage().bucket().upload(filename)

    res.status(200).send({status: 'ok'})
  })
})

const eventFromCeremony = (ical, room, ceremony) => {
  const { uuid, placement, people = [] } = ceremony
  const event = eventPlacements[placement](ical.createEvent(), {
    ...ceremony,
    weekCount: room.weekCount
  })

  Object
    .values(people)
    .map(uuid => room.participants[ceremony.uuid])
    .filter(participant => participant)
    .forEach(participant => attendeeFromParticipant(event, participant))
}

const attendeeFromParticipant = (event, { email, username, optional }) => (
  event.createAttendee({
    name:  username,
    email: email,
    role:  optional ? 'opt-participant' : 'req-participant',
    type:  'individual',
  })
)

exports.download = https.onRequest((req, res) => {
  const filename = `/tmp/${req.query.uuid}.ical`

  firebase
    .storage()
    .bucket()
    .file(`${req.query.uuid}.ical`)
    .download(filename)
    .then(() => fs.createReadStream(filename).pipe(res))
})
