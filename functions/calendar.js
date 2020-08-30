const firebase = require('firebase-admin')
const { https } = require('firebase-functions')
const generator = require('ical-generator')
const moment = require('moment')
const fs = require('fs')

const dayPlacement = (weekCount, day, odd) => (
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    .filter(week => weekCount === 1 || (week % 2 === odd ? 1 : 0))
    .map(week => moment().startOf('isoWeek').add(week, 'week').day(day))
)

const eventPlacements = {
  monday1: ({ weekCount }) => dayPlacement(weekCount, 'monday', true),
  monday2: ({ weekCount }) => dayPlacement(weekCount, 'monday', false),
  tuesday1: ({ weekCount }) => dayPlacement(weekCount, 'tuesday', true),
  tuesday2: ({ weekCount }) => dayPlacement(weekCount, 'tuesday', false),
  wednesday1: ({ weekCount }) => dayPlacement(weekCount, 'wednesday', true),
  wednesday2: ({ weekCount }) => dayPlacement(weekCount, 'wednesday', false),
  thursday1: ({ weekCount }) => dayPlacement(weekCount, 'thursday', true),
  thursday2: ({ weekCount }) => dayPlacement(weekCount, 'thursday', false),
  friday1: ({ weekCount }) => dayPlacement(weekCount, 'friday', true),
  friday2: ({ weekCount }) => dayPlacement(weekCount, 'friday', false),
  daily: () => (
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      .map(day => dayPlacement(1, day))
      .reduce((result, array) => result.concat(array), [])
  ),
  weekly: () => [], // TODO
  monthly: () => [], // TODO
  quarterly: () => [], // TODO
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

const eventFromCeremony = (ical, room, { placement, uuid, startTime, endTime, notes, people = [] }) => {
  console.log('wark', eventPlacements[placement](room), placement)
  eventPlacements[placement](room).forEach(instance => {
    console.log(instance)
    const event = ical.createEvent({
      start: instance.add(startTime, 'minutes'),
      end: instance.add(endTime, 'minutes'),
      timestamp: instance,
      summary: notes
    })

    Object
      .values(people)
      .map(uuid => room.participants[uuid])
      .filter(participant => participant)
      .forEach(participant => attendeeFromParticipant(event, participant))
  })
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
