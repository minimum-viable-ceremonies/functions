const { database } = require('firebase-admin')
const { https } = require('firebase-functions')
const Handlebars = require('handlebars')
const { readFileSync } = require('fs')
const phrase = require('random-words')
const setLanguage = require('./locales/node')
const cors = require('cors')
const fs = require('fs')

Handlebars.registerPartial('cadence', fs.readFileSync('./templates/cadence.hbs').toString())
Handlebars.registerPartial('shareStyles', fs.readFileSync('./templates/shareStyles.hbs').toString())

exports.endpoint = (origin, fn) =>
  https.onRequest((req, res) =>
    setLanguage(req).then(t =>
      cors({ origin })(req, res, () =>
        setResponse(req, res, fn, t))))

exports.createRoom = ({
  name,
  uuid = phrase({ exactly: 3, join: '-' }),
  features = {},
  weekCount = 1,
  template = 'default'
}, t) => {
  const errors = {}

  if (!name) { errors.name = [t('common.errors.name')] }
  if (!uuid) { errors.uuid = [t('common.errors.uuid')] }

  if (Object.values(errors).length) { return { errors } }

  const ceremonies = fs.readFileSync(`templates/${template}`, 'utf-8')
    .split('\n')
    .filter(id => id.length > 0)
    .reduce((result, id, index) => {
      result[id] = { id, index, async: true, placement: 'undecided' }
      return result
    }, {})

  database().ref(`/rooms/${uuid}`).set({ name, features, weekCount, ceremonies })

  return { uuid, name, features, weekCount, ceremonies }
}

exports.compileTemplate = (template, data) =>
  Handlebars.compile(readFileSync(`./templates/${template}.hbs`).toString())(data)

const setResponse = (req, res, fn, t) =>
  Promise.resolve(fn(req, t))
    .then(([status, body]) => status === 302
      ? res.header("Location", body).send(status)
      : res.status(status).send(body))
    .catch(console.log)
