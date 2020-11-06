const axios = require('axios')
const { config } = require('firebase-functions')

module.exports = (req, t) =>
  axios.put('https://api.sendgrid.com/v3/marketing/contacts', {
    list_ids: [config().sendgrid.list_id],
    contacts: [{ email: req.body.email }]
  }, {
    headers: {
      'Authorization': `Bearer ${config().sendgrid.api_key}`,
      'Content-Type': 'application/json'
    }
  }).then(() => [200, { status: t('common.messages.200') }])
    .catch(({ request, response: { status, data } }) => [status, data])
