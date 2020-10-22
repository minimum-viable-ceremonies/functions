const { database } = require('firebase-admin')
const { parse } = require('accept-language-parser')
const i18n = require('i18next')
const phrase = require('random-words')
const cors = require('cors')
const fs = require('fs')

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

exports.setLanguage = req => {
  const langs = [... new Set(parse(req.headers['accept-language']).map(lng => lng.code))]
  return i18n.use(require('i18next-fs-backend')).init({
    lng: langs[0],
    fallbackLng: langs.slice(1).concat('en'),
    backend: { loadPath: 'locales/{{lng}}.yml' }
  })
}
