const axios = require('axios')
const { https, config } = require('firebase-functions')
const cors = require('cors')

exports.subscribe = https.onRequest((req, res) => (
  cors({origin: config().sendgrid.cors_origin})(req, res, () => (
    axios.put('https://api.sendgrid.com/v3/marketing/contacts', {
      list_ids: [config().sendgrid.list_id],
      contacts: [{ email: req.body.email }]
    }, {
      headers: {
        'Authorization': `Bearer ${config().sendgrid.api_key}`,
        'Content-Type': 'application/json'
      }
    }).then(() => res.status(200).send({status: 'ok'}))
      .catch(({ request, response: { status, data } }) => res.status(status).send(data))
  ))
))