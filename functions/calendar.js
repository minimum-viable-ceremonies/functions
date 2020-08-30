const firebase = require('firebase-admin')
const { https } = require('firebase-functions')
const generator = require('ical-generator')
const moment = require('moment')
const fs = require('fs')

exports.upload = https.onRequest((req, res) => {
  const { uuid, calendar = {} } = req.body
  const filename = `/tmp/${uuid}.ical`

  firebase.database().ref(`/rooms/${uuid}`).once('value').then(snapshot => {
    const room = snapshot.val()
    console.log(room)

    const ical = generator({
      domain: process.env.MVC_FIREBASE_DOMAIN,
      name: calendar.name || 'Calendar Name',
      timezone: calendar.timeZone || 'Europe/Berlin',
    })

    Object
      .values(room.ceremonies)
      .filter(({ placement }) => placement !== 'undecided')
      .forEach(ceremony => eventFromCeremony(ical, room, ceremony))

    fs.writeFile(filename, ical.toString(), console.log)
    firebase.storage().bucket().upload(filename)

    res.status(200).send({status: 'ok'})
  })
})

const eventFromCeremony = (ical, room, { uuid, startTime, endTime, notes, people = [] }) => {
  const event = ical.createEvent({
    start: moment(),
    end: moment().add(1, 'hour'),
    timestamp: moment(),
    summary: notes
  })

  Object
    .values(people)
    .map(uuid => room.participants[uuid])
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
