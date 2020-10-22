const axios = require('axios')
const { https, config } = require('firebase-functions')
const cors = require('cors')

const headers = {
  'Authorization': `Bearer ${config().sendgrid.api_key}`,
  'Content-Type': 'application/json'
}

const respond = (origin, promise) =>
  cors({ origin })(req, res, () =>
    promise()
      .then(() => res.status(200).send({status: 'ok'}))
      .catch(({ request, response: { status, data } }) => res.status(status).send(data))
  )

exports.subscribe = https.onRequest((req, res) =>
  respond(config().sendgrid.cors_origin, () =>
    axios.put('https://api.sendgrid.com/v3/marketing/contacts', {
      list_ids: [config().sendgrid.list_id],
      contacts: [{ email: req.body.email }]
    }, { headers }))
)

exports.share = https.onRequest((req, res) =>
  respond(config().mvc.cors_origin, () =>
    axios.post('https://api.sendgrid.com/v3/mail/send', {
      personalizations: [{
        to: req.body.emails.map(email => ({ email }))
      }],
      from: { email: 'share@minimal.cards' },
      content: [{
        type: 'text/html',
        value: '<div>Hello! Here is a minimum viable ceremony :)</div>'
      }]
    }, { headers }))
)
