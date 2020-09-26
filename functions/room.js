const axios = require('axios')
const { https, config } = require('firebase-functions')
const cors = require('cors')
const fs = require('fs')

exports.create = https.onRequest((req, res) => (
  cors({origin: config().sendgrid.cors_origin})(req, res, () => {
    const { name, features, uuid, weekCount = 1, template = 'default' } = req.body

    database().ref(`/rooms/${uuid}`).set({
      name,
      features,
      weekCount,
      ceremonies: fs.readFileSync(`templates/${template}`).filter(id => id.length > 0).map((id, index) => ({
        id,
        index,
        async: true,
        placement: 'undecided'
      }))
    })
    res.status(200).send({status: 'ok'})
  })
))
