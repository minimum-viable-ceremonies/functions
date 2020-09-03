const axios = require('axios')
const { https } = require('firebase-functions')
const cors = require('cors')

exports.subscribe = https.onRequest((req, res) => (
  cors({origin: process.env.SENDGRID_CORS_ORIGIN})(req, res, () => (
    axios.put('https://api.sendgrid.com/v3/marketing/contacts', {
      list_ids: [process.env.SENDGRID_LIST_ID],
      contacts: [{ email: req.body.email }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }).then(() => res.status(200).send({status: 'ok'}))
      .catch(({ request, response: { status, data } }) => res.status(status).send(data))
  ))
))
