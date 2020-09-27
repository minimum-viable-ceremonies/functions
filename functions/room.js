const { database } = require('firebase-admin')
const { https, config } = require('firebase-functions')
const cors = require('cors')
const fs = require('fs')

exports.create = https.onRequest((req, res) => (
  cors({origin: config().room.cors_origin})(req, res, () => {
    const { name, uuid, features = {}, weekCount = 1, template = 'default' } = req.body

    const ceremonies = fs.readFileSync(`templates/${template}`, 'utf-8')
      .split('\n')
      .filter(id => id.length > 0)
      .reduce((result, id, index) => {
        result[id] = { id, index, async: true, placement: 'undecided' }
        console.log(result)
        return result
      }, {})

    database().ref(`/rooms/${uuid}`).set({
      name,
      features,
      weekCount,
      ceremonies
    })
    res.status(200).send({status: 'ok'})
  })
))
