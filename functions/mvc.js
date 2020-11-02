const { https, config } = require('firebase-functions')
const cors = require('cors')
const i18n = require('i18next')
const { createRoom, setLanguage } = require('./common')

exports.create = https.onRequest((req, res) => (
  setLanguage(req).then(t => (
    cors({origin: config().mvc.cors_origin})(req, res, () => (
      createRoom(JSON.parse(req.body), t).errors
        ? res.status(400).send({ status: t('common.errors.400') })
        : res.status(200).send({ status: t('common.messages.200') })
    ))
  ))
))

exports.translations = https.onRequest((req, res) => (
  setLanguage(req, 'client').then(t => (
    cors({origin: config().mvc.cors_origin})(req, res, () => (
      res.status(200).send(t('client', { returnObjects: true }))
    ))
  ))
))
