const axios = require('axios')
const i18n = require('i18next')
const { config } = require('firebase-functions')

module.exports = (req, t) =>
  axios.post('https://slack.com/api/conversations.join', {
    channel: req.body.channel
  }, {
    headers: { 'Authorization': `Bearer ${config().slack.access_token}` }
  }).catch(error => [400, t('slack.errors.400', { errors: error })])
    .then(({ data: { ok, error, conversations } }) =>
      ok
        ? [200, { status: t('common.messages.200') }]
        : [400, { status: t('slack.errors.400', { errors: error }) }]
    )
