const axios = require('axios')
const i18n = require('i18next')
const { config } = require('firebase-functions')

module.exports = (req, t) =>
  axios.post('https://slack.com/api/conversations.list', {}, {
    headers: { 'Authorization': `Bearer ${config().slack.access_token}` }
  }).catch(error => [400, t('slack.errors.400', { errors: error })])
    .then(({ data: { ok, error, channels } }) =>
      ok
        ? [200, { channels: transformChannels(channels) }]
        : [400, { status: t('slack.errors.400', { errors: error }) }])

const transformChannels = channels =>
  channels
    .filter(channel => !channel.is_archived)
    .map(channel => ({
      id: channel.id,
      name: channel.name,
    }))
