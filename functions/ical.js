const { https } = require('firebase-functions')
const firebase = require('firebase-admin')
const generator = require('ical-generator')
const moment = require('moment')
const fs = require('fs')

firebase.initializeApp({
  apiKey: process.env.MVC_FIREBASE_API_KEY,
  authDomain: `${process.env.MVC_FIREBASE_DOMAIN}.firebaseapp.com`,
  databaseURL: `https://${process.env.MVC_FIREBASE_DOMAIN}.firebaseio.com`,
  projectId: `${process.env.MVC_FIREBASE_DOMAIN}`,
  storageBucket: `${process.env.MVC_FIREBASE_DOMAIN}.appspot.com`,
})

exports.icalExport = https.onRequest((req, res) => {
  const { uuid, ceremonies = {}, calendar = {} } = req.body
  const filename = `/tmp/${uuid}.ical`
  // const ical = generator({
  //   domain: process.env.MVC_FIREBASE_DOMAIN,
  //   name: calendar.name || 'Calendar Name',
  //   timezone: calendar.timeZone || 'Europe/Berlin',
  // })
  //
  // Object.values(ceremonies).forEach(({
  //   uuid,
  //   startTime,
  //   endTime,
  //   notes,
  //   attendees = []
  // }) => {
  //   const event = ical.createEvent({
  //     start: moment(),
  //     end: moment().add(1, 'hour'),
  //     timestamp: moment(),
  //     summary: notes
  //   })
  //
  //   Object.values(attendees).forEach(({ email, name, optional }) => {
  //     event.createAttendee({
  //       name,
  //       email,
  //       role: optional ? 'opt-participant' : 'req-participant',
  //       type: 'individual',
  //     })
  //   })
  // })

  const ical = "hello world"
  fs.writeFile(filename, ical.toString(), console.log)
  firebase.storage().bucket().upload(filename)

  res.status(200).send({status: 'ok'})
})

exports.icalDownload = https.onRequest((req, res) => {
  const filename = `/tmp/${req.query.uuid}.ical`

  firebase
    .storage()
    .bucket()
    .file(`${req.query.uuid}.ical`)
    .download(filename)
    .then(() => fs.createReadStream(filename).pipe(res))
})
