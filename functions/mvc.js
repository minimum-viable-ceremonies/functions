const { https, config } = require('firebase-functions')
const cors = require('cors')
const { createRoom } = require('./common')

exports.create = https.onRequest((req, res) => (
  cors({origin: config().mvc.cors_origin})(req, res, () => (
    createRoom(req.body)
      ? res.status(200).send({ status: 'ok' })
      : res.status(400).send({ status: 'bad request' })
  ))
))
