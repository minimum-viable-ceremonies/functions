const { database, storage } = require('firebase-admin')
const { https, config } = require('firebase-functions')
const generator = require('ical-generator')
const moment = require('moment')
const fs = require('fs')
const cors = require('cors')

const eventPlacements = {
  'monday-1':    ceremony => buildEvent(ceremony, 'weekly', 'monday'),
  'tuesday-1':   ceremony => buildEvent(ceremony, 'weekly', 'tuesday'),
  'wednesday-1': ceremony => buildEvent(ceremony, 'weekly', 'wednesday'),
  'thursday-1':  ceremony => buildEvent(ceremony, 'weekly', 'thursday'),
  'friday-1':    ceremony => buildEvent(ceremony, 'weekly', 'friday'),
  'monday-2':    ceremony => buildEvent(ceremony, 'weekly', 'monday', 2),
  'tuesday-2':   ceremony => buildEvent(ceremony, 'weekly', 'tuesday', 2),
  'wednesday-2': ceremony => buildEvent(ceremony, 'weekly', 'wednesday', 2),
  'thursday-2':  ceremony => buildEvent(ceremony, 'weekly', 'thursday', 2),
  'friday-2':    ceremony => buildEvent(ceremony, 'weekly', 'friday', 2),
  'daily':       ceremony => buildEvent(ceremony, 'daily')
}

const buildEvent = ({ startTime, endTime, weekCount }, freq, day, offset = 1) => {
  const m = moment().startOf('isoWeek').add(offset, 'week').day(day || 'monday')

  return {
    start: m.clone().add(startTime, 'minutes'),
    end: m.clone().add(endTime, 'minutes'),
    allDay: !startTime,
    repeating: {
      freq,
      until: m.clone().add(3, 'month'),
      interval: day ? weekCount : 1,
      byDay: day ? [day.slice(0,2)] : ['mo', 'tu', 'we', 'th', 'fr']
    }
  }
}

exports.upload = https.onRequest((req, res) => (
  cors({origin: config().sendgrid.cors_origin})(req, res, () => {
    const { uuid, calendar = {} } = req.body

    database().ref(`/rooms/${uuid}`).once('value').then(snapshot => {
      const { weekCount, ceremonies, participants = {} } = snapshot.val()
      const ical = generator()

      Object
        .values(ceremonies)
        .filter(({ placement }) => !!eventPlacements[placement])
        .forEach(ceremony => (
          ical.createEvent({
            ...eventPlacements[ceremony.placement]({ ...ceremony, weekCount }),
            summary: ceremony.title || ceremony.id,
            description: ceremony.notes,
            timezone: calendar.timeZone || 'Pacific/Auckland',
            attendees: Object
              .values(ceremony.people || [])
              .map(uuid => participants[uuid])
              .filter(participant => participant)
              .map(({ displayName, email, optional }) => ({
                email,
                name: displayName,
                role: optional ? 'opt-participant' : 'req-participant',
                type: 'individual'
              }))
          })
        ))

      ical.saveSync(`/tmp/${uuid}.ical`)
      storage().bucket().upload(`/tmp/${uuid}.ical`)
      res.status(200).send({status: 'ok'})
    })
  })
))

exports.download = https.onRequest(({ query: { uuid } }, res) => (
  storage()
    .bucket()
    .file(`${uuid}.ical`)
    .download(`/tmp/${uuid}.ical`)
    .then(() => fs.createReadStream(`/tmp/${uuid}.ical`).pipe(res))
))
